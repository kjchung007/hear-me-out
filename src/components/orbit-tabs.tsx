"use client";
const tabs = ["People", "Live", "World"] as const;
export type GlobeMode = (typeof tabs)[number];
const arc = "M 247.9 32 A 273 273 0 0 1 352.1 32";
export default function OrbitTabs({
  mode,
  visibility,
  onChange,
}: {
  mode: GlobeMode;
  visibility: number;
  onChange: (mode: GlobeMode) => void;
}) {
  return (
    <nav
      className="orbit-tabs"
      aria-label="Explore layers"
      style={{ opacity: visibility, transform: "translate(-50%,-50%)" }}
      inert={visibility < 0.1}
    >
      <svg
        className="orbit-track"
        viewBox="0 0 600 600"
        role="tablist"
        aria-label="Globe layers"
      >
        <defs>
          {tabs.map((tab, i) => (
            <path
              key={tab}
              id={`orbit-label-${i}`}
              d="M 238 40.3 A 267 267 0 0 1 362 40.3"
            />
          ))}
        </defs>
        <circle
          cx="300"
          cy="300"
          r="273"
          fill="none"
          stroke="#383a49"
          strokeOpacity=".48"
          strokeWidth="50"
          aria-hidden="true"
        />
        <circle
          cx="300"
          cy="300"
          r="298"
          fill="none"
          stroke="#e6dfd5"
          strokeOpacity=".26"
          aria-hidden="true"
        />
        <circle
          cx="300"
          cy="300"
          r="248"
          fill="none"
          stroke="#e6dfd5"
          strokeOpacity=".18"
          aria-hidden="true"
        />
        <g
          className="orbit-selection"
          style={{ transform: `rotate(${(tabs.indexOf(mode) - 1) * 38}deg)` }}
          aria-hidden="true"
        >
          <path
            d={arc}
            fill="none"
            stroke="white"
            strokeWidth="34"
            strokeLinecap="round"
          />
        </g>
        {tabs.map((tab, i) => (
          <g
            key={tab}
            className="orbit-segment"
            transform={`rotate(${(i - 1) * 38} 300 300)`}
            role="tab"
            aria-label={tab}
            aria-selected={mode === tab}
            aria-controls="globe-layer"
            tabIndex={mode === tab ? 0 : -1}
            onClick={() => onChange(tab)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onChange(tab);
              }
              if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) {
                e.preventDefault();
                const n =
                  e.key === "Home"
                    ? 0
                    : e.key === "End"
                      ? 2
                      : (i + (e.key === "ArrowRight" ? 1 : 2)) % 3;
                onChange(tabs[n]);
                e.currentTarget.parentElement
                  ?.querySelectorAll<SVGElement>('[role="tab"]')
                  [n]?.focus();
              }
            }}
          >
            <path
              className="orbit-hit"
              d={arc}
              fill="none"
              stroke="transparent"
              strokeWidth="60"
              strokeLinecap="round"
            />
            <path
              className="orbit-focus"
              d={arc}
              fill="none"
              strokeWidth="39"
              strokeLinecap="round"
            />
            <text textAnchor="middle" className="orbit-label">
              <textPath href={`#orbit-label-${i}`} startOffset="50%">
                {tab}
              </textPath>
            </text>
          </g>
        ))}
      </svg>
    </nav>
  );
}
