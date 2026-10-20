import { cn, useTheme } from 'ferry-ui'
import { PixelField as PixelFieldShader } from 'ferry-shaders'

/** The edge where the field is dense. It thins out toward the other edge. */
export type PixelFieldOrigin = 'top' | 'bottom'

export interface PixelFieldProps {
  /**
   * The edge the field starts from: `top` (default) is dense at the top and thins out downward,
   * `bottom` is dense at the bottom and thins out upward.
   */
  from?: PixelFieldOrigin
  /**
   * How fast the field thins out: the power applied to the fade. Default 2.6. A higher value keeps
   * the dense band short and leaves a long tail of scattered pixels (use it for a tall field that
   * passes behind text).
   */
  falloff?: number
  /** Position and size of the field: it fills this box (for example `absolute inset-x-0 top-0 h-96`). */
  className?: string
}

/**
 * A decorative background: a dense field of small pixels that thins out into the page, drawn by a
 * WebGPU shader and moving slowly. It is the pixel field of ferry-shaders, with ferry-ui tokens for
 * its colors (`foreground` and `primary-bright`), so the field follows the theme. Use it at an edge
 * of the page: the top of the hero, the bottom of the footer.
 *
 * Every field of a page shares one GPU device. A browser with no WebGPU gets a still pixel pattern
 * in CSS (`.pixel-fallback`). A reader who asks for reduced motion gets one still frame. A field
 * stops when it is out of view.
 */
export function PixelField({ from = 'top', falloff = 2.6, className }: PixelFieldProps) {
  const dark = useTheme().resolvedTheme === 'dark'
  return (
    <PixelFieldShader
      data-from={from}
      origin={from}
      falloff={falloff}
      color="var(--foreground)"
      accent="var(--primary-bright)"
      // Light pixels on a dark canvas read stronger than dark pixels on white: lower them.
      opacity={dark ? 0.1 : 0.13}
      accentOpacity={dark ? 0.42 : 0.5}
      className={cn('pixel-field', className)}
      fallback={<div className="pixel-fallback absolute inset-0" />}
    />
  )
}
