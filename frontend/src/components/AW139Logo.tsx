import React from "react";
import Svg, { Path, Rect, Circle, Ellipse, G } from "react-native-svg";

/**
 * Stylised AW139 side-profile silhouette (nose pointing left).
 * Twin-engine medium helicopter: raked pointed nose, twin-engine deck hump,
 * sponson-housed tricycle wheels, tapered up-swept tail boom, swept vertical
 * fin and tail-rotor disc.
 */
export function AW139Logo({ size = 30, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size * (60 / 104)} viewBox="0 0 104 60">
      <G fill={color}>
        {/* main rotor + hub + mast */}
        <Rect x="13" y="6.4" width="74" height="2.6" rx="1.3" />
        <Circle cx="49" cy="8" r="2.6" />
        <Rect x="47.3" y="9" width="3.4" height="7.5" rx="1.2" />

        {/* fuselage: raked nose -> engine-deck hump -> tapered boom -> swept fin */}
        <Path d="M8 36
                 Q7 31 12 29
                 L22 22
                 L40 20
                 Q52 15.5 64 20
                 L70 23
                 L92 22
                 L97.5 8
                 Q100.5 7.5 99 11
                 L93 24
                 L91 25.6
                 L70 28
                 L64 35
                 L24 37
                 L12 36 Z" />

        {/* horizontal stabiliser */}
        <Rect x="79" y="23.6" width="12" height="2.3" rx="1.1" transform="rotate(-3 85 24.7)" />

        {/* sponson (gear housing) */}
        <Path d="M27 34.5 Q24.5 34.5 24.5 38 L24.5 39.5 Q24.5 41.5 27.5 41.5
                 L45 41.5 Q47.5 41.5 47.5 38.5 L47.5 35.5 Q43 34.5 27 34.5 Z" />

        {/* tricycle wheels: nose + 2 main */}
        <Circle cx="16" cy="40" r="2.2" />
        <Circle cx="31" cy="42.6" r="2.9" />
        <Circle cx="44" cy="42.6" r="2.9" />

        {/* tail rotor disc */}
        <Ellipse cx="96.5" cy="13.5" rx="1.7" ry="6.5" />
      </G>
    </Svg>
  );
}
