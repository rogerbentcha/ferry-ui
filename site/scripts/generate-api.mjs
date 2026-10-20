// API reference data (`npm run site:api`): reads the props of every public component from the
// TypeScript sources and writes one JSON file per component in site/src/generated/api/.
// `<PropsTable of="Button" />` shows that file, so the tables of the documentation cannot drift
// from the code.
//
// For each component (an exported function with a capital name), the TypeScript checker gives the
// type of its props. For each prop the script keeps:
//   - the name, and if the prop is required,
//   - the type as a developer writes it (the values of a union, the name of an alias),
//   - the default: the initializer in the destructured parameters (`size = 'md'`), else the
//     `defaultVariants` of the cva call of the same file, else a JSDoc `@default` tag,
//   - the JSDoc of the prop (the one of the Radix UI primitive for a prop that comes from it).
//
// Props that come from React or from the DOM (`className`, `onClick`, `aria-*`…) are left out:
// every component accepts the attributes of the element it renders. Props of the Radix UI
// primitive under a component are kept, because they are the component's own API.
import fs from 'node:fs'
import path from 'node:path'

import ts from 'typescript'

import { API_DIR, REPO_ROOT } from '../lib/content.mjs'

const SOURCE_FOLDERS = ['components/primitives', 'components/patterns', 'components/layout', 'components/charts', 'theme', 'lib']
const SRC = path.join(REPO_ROOT, 'src')

/** Declarations of React and of the DOM: their props are not listed. */
const isPlatformFile = (fileName) => /node_modules\/(@types\/react|csstype|typescript)\//.test(fileName)
const isLibraryFile = (fileName) => fileName.startsWith(SRC + path.sep)

const configFile = path.join(REPO_ROOT, 'tsconfig.json')
const config = ts.parseJsonConfigFileContent(ts.readConfigFile(configFile, ts.sys.readFile).config, ts.sys, REPO_ROOT)
// The entry points of the package: `ferry-ui` and `ferry-ui/charts`.
const entries = ['index.ts', 'charts.ts'].map((file) => path.join(SRC, file))
const program = ts.createProgram(entries, { ...config.options, noEmit: true })
const checker = program.getTypeChecker()

/** JSDoc as plain Markdown: `{@link Name}` becomes `Name` in code style, wrapped lines are joined. */
const cleanDoc = (text) =>
  (text ?? '')
    .replace(/\{@link\s+([^}\s]+)(?:\s+[^}]*)?\}/g, '`$1`')
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.replace(/\s*\r?\n\s*(?!- )/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n')

const docOf = (symbol) => cleanDoc(ts.displayPartsToString(symbol.getDocumentationComment(checker)))

/**
 * The text of a default value: a string without its quotes, the value of a constant that the code
 * names (`storageKey = DEFAULT_THEME_STORAGE_KEY`), anything else as written.
 */
function literalText(node) {
  if (ts.isStringLiteralLike(node)) return node.text
  if (ts.isIdentifier(node)) {
    let symbol = checker.getSymbolAtLocation(node)
    if (symbol && symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol)
    const value = symbol?.valueDeclaration
    if (value && ts.isVariableDeclaration(value) && value.initializer && ts.isStringLiteralLike(value.initializer)) {
      return value.initializer.text
    }
  }
  return node.getText()
}

/** `defaultVariants` of each `cva()` call of a file: prop name → default. */
function cvaDefaults(sourceFile) {
  const defaults = new Map()
  const visit = (node) => {
    if (ts.isCallExpression(node) && node.expression.getText() === 'cva') {
      const options = node.arguments[1]
      if (options && ts.isObjectLiteralExpression(options)) {
        const variants = options.properties.find((p) => ts.isPropertyAssignment(p) && p.name.getText() === 'variants')
        const chosen = options.properties.find((p) => ts.isPropertyAssignment(p) && p.name.getText() === 'defaultVariants')
        if (variants && chosen && ts.isObjectLiteralExpression(chosen.initializer)) {
          for (const property of chosen.initializer.properties) {
            if (ts.isPropertyAssignment(property)) defaults.set(property.name.getText(), literalText(property.initializer))
          }
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return defaults
}

/** Defaults written in the destructured props of a component: `{ size = 'md', ...props }`. */
function parameterDefaults(declaration) {
  const defaults = new Map()
  const pattern = declaration.parameters?.[0]?.name
  if (pattern && ts.isObjectBindingPattern(pattern)) {
    for (const element of pattern.elements) {
      if (!element.initializer || element.dotDotDotToken) continue
      const name = (element.propertyName ?? element.name).getText()
      defaults.set(name, literalText(element.initializer))
    }
  }
  return defaults
}

/** The type of a prop as a developer writes it. */
function typeText(type) {
  const flags = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope
  const members = type.isUnion() ? type.types : [type]
  const defined = members.filter((member) => !(member.flags & ts.TypeFlags.Undefined))
  const real = defined.filter((member) => !(member.flags & ts.TypeFlags.Null))
  const literal = ts.TypeFlags.StringLiteral | ts.TypeFlags.NumberLiteral | ts.TypeFlags.BooleanLiteral

  // A union of values (`"sm" | "md"`, also behind a name such as `CalloutTone`): list the values.
  // `null` in such a union comes from cva's own types: it is not a value to pass.
  if (real.length > 0 && real.every((member) => member.flags & literal)) {
    const values = real.filter((member) => !(member.flags & ts.TypeFlags.BooleanLiteral))
    const booleans = real.length - values.length
    const parts = values.map((member) => checker.typeToString(member, undefined, flags))
    if (booleans === 2) parts.push('boolean')
    else if (booleans === 1) parts.push(checker.typeToString(real.find((member) => member.flags & ts.TypeFlags.BooleanLiteral)))
    return parts.join(' | ')
  }
  // Any other type: as TypeScript prints it (it keeps names such as ReactNode), minus `undefined`,
  // which only says that the prop is optional.
  return checker
    .typeToString(type, undefined, flags)
    .replace(/ \| undefined\b|\bundefined \| /g, '')
    .replace(/ReactElement<unknown, string \| JSXElementConstructor<any>>/g, 'ReactElement')
}

/** The function declaration behind an exported name, when the export is a component. */
function componentDeclaration(symbol) {
  const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol
  for (const declaration of target.declarations ?? []) {
    if (ts.isFunctionDeclaration(declaration)) return { target, declaration }
    if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
      const value = declaration.initializer
      if (ts.isArrowFunction(value) || ts.isFunctionExpression(value)) return { target, declaration: value }
    }
  }
  return null
}

const exports = entries.flatMap((entry) => {
  const moduleSymbol = checker.getSymbolAtLocation(program.getSourceFile(entry))
  if (!moduleSymbol) throw new Error(`${path.relative(REPO_ROOT, entry)} is not a module`)
  return checker.getExportsOfModule(moduleSymbol)
})

fs.rmSync(API_DIR, { recursive: true, force: true })
fs.mkdirSync(API_DIR, { recursive: true })

let count = 0
for (const exported of exports) {
  const name = exported.getName()
  // Components only: hooks, helpers and constants (`useTheme`, `toast`, `STATUS_TONES`) have no props.
  if (!/^[A-Z][a-z]/.test(name)) continue
  const component = componentDeclaration(exported)
  if (!component) continue
  const { target, declaration } = component
  const sourceFile = declaration.getSourceFile()
  const relative = path.relative(SRC, sourceFile.fileName).split(path.sep).join('/')
  if (!SOURCE_FOLDERS.some((folder) => relative.startsWith(`${folder}/`))) continue

  const signature = checker.getSignatureFromDeclaration(declaration)
  const parameter = signature?.parameters[0]
  const propsType = parameter ? checker.getTypeOfSymbolAtLocation(parameter, declaration) : undefined
  const fromParameters = parameterDefaults(declaration)
  const fromVariants = cvaDefaults(sourceFile)

  const props = []
  for (const prop of propsType ? checker.getPropertiesOfType(checker.getApparentType(propsType)) : []) {
    const declarations = prop.declarations ?? []
    if (declarations.length > 0 && declarations.every((d) => isPlatformFile(d.getSourceFile().fileName))) continue
    const propName = prop.getName()
    if (propName.startsWith('data-') || propName === 'key' || propName === 'ref') continue
    const own = declarations.some((d) => isLibraryFile(d.getSourceFile().fileName))
    const type = checker.getTypeOfSymbolAtLocation(prop, declaration)
    const tags = prop.getJsDocTags(checker)
    const tagDefault = tags.find((tag) => tag.name === 'default' || tag.name === 'defaultValue')
    const variantDefault = fromVariants.get(propName)
    // A type that TypeScript expands into a very long text reads better as the source wrote it.
    const written = declarations.find((d) => isLibraryFile(d.getSourceFile().fileName) && d.type)?.type.getText()
    const printed = typeText(type)
    props.push({
      name: propName,
      type: printed.length > 160 && written ? written.replace(/\bReact\./g, '') : printed,
      required: !(prop.flags & ts.SymbolFlags.Optional),
      default:
        fromParameters.get(propName) ??
        variantDefault ??
        (tagDefault ? ts.displayPartsToString(tagDefault.text).replace(/^["'`]|["'`]$/g, '') : null),
      description: docOf(prop),
      deprecated: tags.some((tag) => tag.name === 'deprecated'),
      // Sort keys, removed below: the props ferry-ui declares come before the ones of the primitive.
      own,
      position: declarations[0] ? declarations[0].getStart() : 0,
    })
  }
  props.sort((a, b) => Number(b.required) - Number(a.required) || Number(b.own) - Number(a.own) || (a.own && b.own ? a.position - b.position : 0))

  const data = {
    name,
    file: `src/${relative}`,
    description: docOf(target),
    props: props.map(({ own: _own, position: _position, ...prop }) => prop),
  }
  fs.writeFileSync(path.join(API_DIR, `${name}.json`), JSON.stringify(data, null, 2) + '\n')
  count += 1
}

console.log(`site:api: ${count} components documented in ${path.relative(REPO_ROOT, API_DIR)}`)
