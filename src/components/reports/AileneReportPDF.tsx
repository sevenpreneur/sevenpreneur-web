"use client";

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import { useCallback, useState } from "react";
import {
  BarChartPDF,
  DonutChartPDF,
  TrendChartPDF,
} from "./report-charts";

// Structured PDF report for the Ailene (AILN) sponsor dashboards.
//
// This is a DOCUMENT, not a screenshot of the dashboard: typographic hierarchy
// + tables + lists, vector selectable text, multi-page. There are deliberately
// NO dashboard-style "cards" — KPIs are rendered as a clean metrics table, the
// way a printed business report would present them.

const BRAND_GREEN = "#1f5f4e";
const ACCENT = "#ee2333";
const INK = "#111827";
const SUBTLE = "#6b7280";
const LINE = "#d1d5db";
const HAIRLINE = "#e5e7eb";
const ZEBRA = "#f9fafb";

export type ReportSection =
  | {
      // Rendered as a metrics table (Indikator / Nilai / Keterangan).
      type: "kpi";
      title?: string;
      items: { label: string; value: string; unit?: string; footer?: string }[];
    }
  | {
      type: "table";
      title?: string;
      columns: string[];
      rows: (string | number)[][];
      align?: ("left" | "right" | "center")[];
    }
  | {
      type: "list";
      title?: string;
      items: { primary: string; secondary?: string; trailing?: string }[];
    }
  | {
      type: "bar";
      title?: string;
      items: { label: string; value: number; display?: string }[];
      max?: number;
      color?: string;
    }
  | {
      type: "trend";
      title?: string;
      points: { label: string; bar: number; line: number }[];
      barName: string;
      lineName: string;
    }
  | {
      type: "donut";
      title?: string;
      segments: { label: string; value: number; color: string }[];
      centerValue?: string;
      centerLabel?: string;
    }
  | { type: "note"; text: string };

export type ReportProps = {
  org?: string;
  program: string;
  title: string;
  subtitle?: string;
  generatedAt: string;
  sections: ReportSection[];
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 48,
    fontSize: 9.5,
    fontFamily: "Helvetica",
    color: INK,
    lineHeight: 1.45,
  },
  // Header (document masthead)
  eyebrow: {
    fontSize: 8,
    letterSpacing: 2,
    color: SUBTLE,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 21,
    fontFamily: "Helvetica-Bold",
    color: INK,
    lineHeight: 1.15,
    marginTop: 8,
  },
  subtitle: { fontSize: 10, color: SUBTLE, marginTop: 6 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  metaText: { fontSize: 8.5, color: SUBTLE },
  rule: {
    borderBottomWidth: 1.5,
    borderBottomColor: BRAND_GREEN,
    marginTop: 10,
    marginBottom: 22,
  },
  // Sections
  section: { marginBottom: 22 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: INK,
    marginBottom: 9,
  },
  // Generic table
  table: {
    borderTopWidth: 1,
    borderTopColor: BRAND_GREEN,
  },
  tHeadRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    paddingVertical: 6,
  },
  tHeadCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: SUBTLE,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 6,
  },
  tRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: HAIRLINE,
    paddingVertical: 6,
  },
  tRowZebra: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: HAIRLINE,
    backgroundColor: ZEBRA,
    paddingVertical: 6,
  },
  tCell: { fontSize: 9, paddingHorizontal: 6, color: INK },
  // Metrics table (KPI)
  mLabel: { fontSize: 9.5, color: INK, fontFamily: "Helvetica-Bold" },
  mValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: BRAND_GREEN,
    textAlign: "right",
  },
  mDetail: { fontSize: 8.5, color: SUBTLE },
  // List
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: HAIRLINE,
  },
  listDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: ACCENT,
    marginTop: 5,
    marginRight: 8,
  },
  listPrimary: { fontSize: 9.5, color: INK },
  listSecondary: { fontSize: 8.5, color: SUBTLE, marginTop: 2 },
  listTrailing: { fontSize: 8.5, color: SUBTLE, paddingLeft: 8 },
  note: { fontSize: 9, color: SUBTLE },
  // Footer
  footer: {
    position: "absolute",
    bottom: 22,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: HAIRLINE,
    paddingTop: 7,
    fontSize: 8,
    color: SUBTLE,
  },
});

function pct(count: number): string {
  return `${100 / count}%`;
}

// react-pdf's Helvetica uses WinAnsi encoding, which lacks common math/symbol
// glyphs (≈, ≥, →, …). Map them to ASCII so text doesn't render garbled.
const GLYPH_FIX: Record<string, string> = {
  "≈": "~",
  "≥": ">=",
  "≤": "<=",
  "→": "->",
  "←": "<-",
  "•": "-",
  "×": "x",
  "÷": "/",
  "≠": "!=",
  "™": "(TM)",
  "₂": "2",
};
function clean(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return "";
  return String(value).replace(/[≈≥≤→←•×÷≠™₂]/g, (m) => GLYPH_FIX[m] ?? "");
}

// KPIs as a clean metrics table — three columns: indicator, value, note.
function KpiSection({ title, items }: Extract<ReportSection, { type: "kpi" }>) {
  return (
    <View style={styles.section} wrap={false}>
      {title ? <Text style={styles.sectionTitle}>{clean(title)}</Text> : null}
      <View style={styles.table}>
        <View style={styles.tHeadRow}>
          <Text style={[styles.tHeadCell, { width: "40%" }]}>Indikator</Text>
          <Text style={[styles.tHeadCell, { width: "20%", textAlign: "right" }]}>
            Nilai
          </Text>
          <Text style={[styles.tHeadCell, { width: "40%" }]}>Keterangan</Text>
        </View>
        {items.map((it, i) => (
          <View key={i} style={i % 2 ? styles.tRowZebra : styles.tRow}>
            <Text style={[styles.mLabel, { width: "40%", paddingHorizontal: 6 }]}>
              {clean(it.label)}
            </Text>
            <Text style={[styles.mValue, { width: "20%", paddingHorizontal: 6 }]}>
              {clean(it.unit ? `${it.value} ${it.unit}` : it.value)}
            </Text>
            <Text style={[styles.mDetail, { width: "40%", paddingHorizontal: 6 }]}>
              {clean(it.footer)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function TableSection({
  title,
  columns,
  rows,
  align,
}: Extract<ReportSection, { type: "table" }>) {
  const w = pct(columns.length);
  const cellAlign = (i: number) =>
    (align?.[i] ?? (i === 0 ? "left" : "right")) as
      | "left"
      | "right"
      | "center";
  return (
    <View style={styles.section} wrap={false}>
      {title ? <Text style={styles.sectionTitle}>{clean(title)}</Text> : null}
      <View style={styles.table}>
        <View style={styles.tHeadRow}>
          {columns.map((c, i) => (
            <Text
              key={i}
              style={[styles.tHeadCell, { width: w, textAlign: cellAlign(i) }]}
            >
              {clean(c)}
            </Text>
          ))}
        </View>
        {rows.map((r, ri) => (
          <View key={ri} style={ri % 2 ? styles.tRowZebra : styles.tRow}>
            {r.map((cell, ci) => (
              <Text
                key={ci}
                style={[styles.tCell, { width: w, textAlign: cellAlign(ci) }]}
              >
                {clean(cell)}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

function ListSection({
  title,
  items,
}: Extract<ReportSection, { type: "list" }>) {
  return (
    <View style={styles.section}>
      {title ? <Text style={styles.sectionTitle}>{clean(title)}</Text> : null}
      {items.map((it, i) => (
        <View key={i} style={styles.listItem}>
          <View style={styles.listDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.listPrimary}>{clean(it.primary)}</Text>
            {it.secondary ? (
              <Text style={styles.listSecondary}>{clean(it.secondary)}</Text>
            ) : null}
          </View>
          {it.trailing ? (
            <Text style={styles.listTrailing}>{clean(it.trailing)}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

export function AileneReportPDF({
  org,
  program,
  title,
  subtitle,
  generatedAt,
  sections,
}: ReportProps) {
  return (
    <Document title={title} author={org ?? program}>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View fixed>
          <Text style={styles.eyebrow}>
            {clean((org ? `${org} · ` : "") + program)}
          </Text>
          <Text style={styles.title}>{clean(title)}</Text>
          {subtitle ? (
            <Text style={styles.subtitle}>{clean(subtitle)}</Text>
          ) : null}
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              Laporan dibuat {clean(generatedAt)}
            </Text>
            <Text style={styles.metaText}>Ailene · AI Learn</Text>
          </View>
          <View style={styles.rule} />
        </View>

        {sections.map((s, i) => {
          if (s.type === "kpi") return <KpiSection key={i} {...s} />;
          if (s.type === "table") return <TableSection key={i} {...s} />;
          if (s.type === "list") return <ListSection key={i} {...s} />;
          if (s.type === "bar")
            return (
              <View key={i} style={styles.section} wrap={false}>
                {s.title ? (
                  <Text style={styles.sectionTitle}>{clean(s.title)}</Text>
                ) : null}
                <BarChartPDF items={s.items} max={s.max} color={s.color} />
              </View>
            );
          if (s.type === "trend")
            return (
              <View key={i} style={styles.section} wrap={false}>
                {s.title ? (
                  <Text style={styles.sectionTitle}>{clean(s.title)}</Text>
                ) : null}
                <TrendChartPDF
                  points={s.points}
                  barName={s.barName}
                  lineName={s.lineName}
                />
              </View>
            );
          if (s.type === "donut")
            return (
              <View key={i} style={styles.section} wrap={false}>
                {s.title ? (
                  <Text style={styles.sectionTitle}>{clean(s.title)}</Text>
                ) : null}
                <DonutChartPDF
                  segments={s.segments}
                  centerValue={s.centerValue}
                  centerLabel={s.centerLabel}
                />
              </View>
            );
          return (
            <View key={i} style={styles.section}>
              <Text style={styles.note}>{clean(s.text)}</Text>
            </View>
          );
        })}

        <View style={styles.footer} fixed>
          <Text>{clean((org ? `${org} · ` : "") + program)}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Halaman ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

export async function downloadAileneReport(
  props: ReportProps,
  filename: string
): Promise<void> {
  const blob = await pdf(<AileneReportPDF {...props} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Hook giving an `exporting` flag + `generate(props, filename)` action.
export function usePdfReport() {
  const [exporting, setExporting] = useState(false);
  const generate = useCallback(
    async (props: ReportProps, filename: string) => {
      if (exporting) return;
      setExporting(true);
      try {
        await downloadAileneReport(props, filename);
      } finally {
        setExporting(false);
      }
    },
    [exporting]
  );
  return { exporting, generate };
}
