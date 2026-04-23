import Svg, { Path, Rect, Circle } from "react-native-svg";

interface LogoProps {
  size?: number;
  color?: string;
}

/**
 * UTEC Gym logo — a barbell whose left and right plates curve inward
 * to form the letter U. Bold single-weight strokes, no fill.
 */
export function Logo({ size = 64, color = "#00C9D8" }: LogoProps) {
  const w = size;
  const h = size;

  // We draw on a 100×100 viewBox then scale to `size`
  const vb = 100;

  // Stroke width proportional to size
  const sw = 8;

  return (
    <Svg
      width={w}
      height={h}
      viewBox={`0 0 ${vb} ${vb}`}
      fill="none"
    >
      {/* ── Left plate (vertical rectangle) ── */}
      <Rect
        x={5}
        y={18}
        width={14}
        height={46}
        rx={4}
        fill={color}
      />

      {/* ── Right plate ── */}
      <Rect
        x={81}
        y={18}
        width={14}
        height={46}
        rx={4}
        fill={color}
      />

      {/* ── Bar left segment: horizontal bar from left plate to where U starts ── */}
      <Rect
        x={19}
        y={43}
        width={16}
        height={sw}
        rx={sw / 2}
        fill={color}
      />

      {/* ── Bar right segment ── */}
      <Rect
        x={65}
        y={43}
        width={16}
        height={sw}
        rx={sw / 2}
        fill={color}
      />

      {/* ── U curve: a thick arc from left bar end to right bar end ──
          Drawn as a path: move to left end, line down the left arm,
          arc across the bottom, line up the right arm.
          Arms start at y=47 (bar center), go down to y=62, arc r=13 to mirror. */}
      <Path
        d={`
          M 35 47
          L 35 62
          Q 35 78 50 78
          Q 65 78 65 62
          L 65 47
        `}
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
