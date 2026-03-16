"use client";

/**
 * SVG-based underwater caustic light pattern and noise texture overlay.
 * Uses SVG filters to generate organic caustic and grain effects.
 */
export default function CausticOverlay() {
  return (
    <>
      {/* Caustic filter definition */}
      <svg aria-hidden="true" className="hidden">
        <defs>
          <filter id="caustic-filter">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015"
              numOctaves={3}
              seed={2}
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncR type="linear" slope={3} intercept={-1} />
              <feFuncG type="linear" slope={3} intercept={-1} />
              <feFuncB type="linear" slope={3} intercept={-1} />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>

      {/* Caustic overlay */}
      <div
        className="caustic-overlay"
        style={{ filter: "url(#caustic-filter)" }}
      />

      {/* Noise overlay */}
      <svg aria-hidden="true" className="noise-overlay">
        <filter id="noise-filter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves={4}
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise-filter)" />
      </svg>
    </>
  );
}
