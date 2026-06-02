// Shared color language for the Sponsor / Executive dashboard charts.
//
// The dashboard tells one story: AI adoption growing over time. We use a single
// green "growth" ramp for every data viz so the charts read as one system
// instead of disconnected grayscale wireframes. Brand red (#ee2333) stays
// reserved for KPI accent strips and the activity timeline — it's the identity
// mark, not a data color.

// Sequential green ramp, light → deep. Used for the level-distribution segments
// (L0 beginner = light, L4 advanced = deep) and as the bar fill scale.
export const GROWTH_RAMP = [
  "#dce9e2", // L0 — lightest sage
  "#a7cdb9",
  "#6daf8f",
  "#3d8c6b",
  "#1f5f4e", // L4 — deepest emerald
];

// Single bars: muted green for context periods, deep green for the highlighted
// (most recent) period so the latest result pops without a second legend.
export const BAR_SOFT = "#a7cdb9";
export const BAR_DEEP = "#1f5f4e";

// Secondary overlay line (adoption %) — a darker neutral-green so it sits above
// the bars with enough contrast.
export const LINE_ADOPTION = "#0f5132";
