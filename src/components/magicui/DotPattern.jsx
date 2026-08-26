// Pola titik-titik ala Magic UI untuk background.
// Pakai mask-image CSS untuk efek fade radial.
import React, { useId } from "react";

export function DotPattern({
  width = 20,
  height = 20,
  cx = 1,
  cy = 1,
  cr = 1,
  className = "",
}) {
  const id = useId();
  const cleanId = "dot-pattern-" + id.replace(/[^a-zA-Z0-9]/g, "");

  return (
    <svg
      aria-hidden="true"
      className={"pointer-events-none absolute inset-0 h-full w-full fill-white/30 " + className}
    >
      <defs>
        <pattern
          id={cleanId}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={cx} cy={cy} r={cr} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${cleanId})`} />
    </svg>
  );
}
