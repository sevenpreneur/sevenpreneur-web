// Local sample data for the weekly trend chart — used ONLY as a fallback when
// the real query returns all-zero weeks (e.g. an empty/seed-less environment),
// so the dashboard doesn't look broken during demos. As soon as real
// submissions exist, the component uses the real data instead.
//
// Rising curve (hours saved + adoption %) over 12 weeks.
export type SampleTrendWeek = {
  label: string;
  hours_saved: number;
  adoption_percent: number;
};

export const SAMPLE_TREND: SampleTrendWeek[] = [
  { label: "Mgg 1", hours_saved: 2.1, adoption_percent: 8 },
  { label: "Mgg 2", hours_saved: 3.4, adoption_percent: 12 },
  { label: "Mgg 3", hours_saved: 5.2, adoption_percent: 17 },
  { label: "Mgg 4", hours_saved: 6.8, adoption_percent: 21 },
  { label: "Mgg 5", hours_saved: 9.5, adoption_percent: 28 },
  { label: "Mgg 6", hours_saved: 12.1, adoption_percent: 34 },
  { label: "Mgg 7", hours_saved: 15.3, adoption_percent: 42 },
  { label: "Mgg 8", hours_saved: 18.0, adoption_percent: 50 },
  { label: "Mgg 9", hours_saved: 22.4, adoption_percent: 58 },
  { label: "Mgg 10", hours_saved: 27.1, adoption_percent: 67 },
  { label: "Mgg 11", hours_saved: 33.5, adoption_percent: 75 },
  { label: "Mgg 12", hours_saved: 41.2, adoption_percent: 83 },
];
