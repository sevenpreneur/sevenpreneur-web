"use client";

import {
  Circle,
  G,
  Polyline,
  Rect,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";

// Vector charts for the Ailene PDF reports — drawn natively with react-pdf's
// SVG primitives (crisp/selectable, part of the document), NOT rasterized.

const BRAND_GREEN = "#1f5f4e";
const ACCENT = "#ee2333";
const SUBTLE = "#6b7280";
const AXIS = "#9ca3af";
const TRACK = "#eef2f1";

// ---------- Horizontal bar chart (label · bar · value) ----------

export function BarChartPDF({
  items,
  max,
  color = BRAND_GREEN,
}: {
  items: { label: string; value: number; display?: string }[];
  max?: number;
  color?: string;
}) {
  const peak = Math.max(max ?? 0, ...items.map((d) => d.value), 1);
  return (
    <View>
      {items.map((d, i) => (
        <View
          key={i}
          style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}
        >
          <TextLabel text={d.label} />
          <View
            style={{
              flex: 1,
              height: 12,
              backgroundColor: TRACK,
              borderRadius: 2,
            }}
          >
            <View
              style={{
                width: `${Math.max(1, (d.value / peak) * 100)}%`,
                height: 12,
                backgroundColor: color,
                borderRadius: 2,
              }}
            />
          </View>
          <View style={{ width: 54, paddingLeft: 6 }}>
            <SvgValue text={d.display ?? String(d.value)} />
          </View>
        </View>
      ))}
    </View>
  );
}

function TextLabel({ text }: { text: string }) {
  return (
    <Text
      style={{ width: 96, fontSize: 8.5, color: "#111827", paddingRight: 6 }}
    >
      {text}
    </Text>
  );
}
function SvgValue({ text }: { text: string }) {
  return (
    <Text
      style={{
        fontSize: 8.5,
        fontFamily: "Helvetica-Bold",
        color: "#111827",
        textAlign: "right",
      }}
    >
      {text}
    </Text>
  );
}

// ---------- Combo trend chart (bars = primary, line = secondary %) ----------

export function TrendChartPDF({
  points,
  barName,
  lineName,
}: {
  points: { label: string; bar: number; line: number }[];
  barName: string;
  lineName: string;
}) {
  const W = 740;
  const H = 150;
  const padL = 6;
  const padR = 6;
  const padT = 10;
  const padB = 16;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const n = Math.max(points.length, 1);
  const step = plotW / n;
  const barW = step * 0.5;

  const barMax = Math.max(...points.map((p) => p.bar), 1);
  const lineMax = Math.max(...points.map((p) => p.line), 100);

  const baseY = padT + plotH;
  const linePts = points
    .map((p, i) => {
      const x = padL + i * step + step / 2;
      const y = baseY - (p.line / lineMax) * plotH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const labelEvery = Math.ceil(n / 8);

  return (
    <View>
      <View style={{ flexDirection: "row", gap: 14, marginBottom: 4 }}>
        <Legend color={BRAND_GREEN} text={barName} square />
        <Legend color={ACCENT} text={lineName} />
      </View>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* baseline */}
        <Polyline
          points={`${padL},${baseY} ${padL + plotW},${baseY}`}
          stroke={AXIS}
          strokeWidth={0.75}
        />
        {/* bars */}
        {points.map((p, i) => {
          const h = (p.bar / barMax) * plotH;
          const x = padL + i * step + (step - barW) / 2;
          const y = baseY - h;
          return (
            <Rect
              key={i}
              x={x}
              y={y}
              width={barW}
              height={Math.max(h, 0.5)}
              fill={BRAND_GREEN}
              opacity={0.85}
            />
          );
        })}
        {/* line */}
        <Polyline
          points={linePts}
          fill="none"
          stroke={ACCENT}
          strokeWidth={1.5}
        />
        {points.map((p, i) => {
          const x = padL + i * step + step / 2;
          const y = baseY - (p.line / lineMax) * plotH;
          return <Circle key={i} cx={x} cy={y} r={1.8} fill={ACCENT} />;
        })}
        {/* x labels */}
        {points.map((p, i) =>
          i % labelEvery === 0 ? (
            <Text
              key={i}
              x={padL + i * step + step / 2}
              y={H - 4}
              style={{ fontSize: 6.5 }}
              fill={SUBTLE}
              textAnchor="middle"
            >
              {p.label}
            </Text>
          ) : null
        )}
      </Svg>
    </View>
  );
}

// ---------- Donut chart (segments) with center label + legend ----------

export function DonutChartPDF({
  segments,
  centerValue,
  centerLabel,
}: {
  segments: { label: string; value: number; color: string }[];
  centerValue?: string;
  centerLabel?: string;
}) {
  const size = 120;
  const stroke = 20;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;

  let offset = 0;
  const arcs = segments.map((seg, i) => {
    const len = (seg.value / total) * circ;
    // Position each arc with a leading 0-dash + gap of `offset` (CircleProps has
    // no strokeDashoffset), then the visible dash of length `len`.
    const el = (
      <Circle
        key={i}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={seg.color}
        strokeWidth={stroke}
        strokeDasharray={`0 ${offset} ${len} ${circ}`}
      />
    );
    offset += len;
    return el;
  });

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G transform={`rotate(-90 ${cx} ${cy})`}>{arcs}</G>
        {centerValue ? (
          <Text
            x={cx}
            y={cy + 1}
            style={{ fontSize: 18, fontFamily: "Helvetica-Bold" }}
            fill="#111827"
            textAnchor="middle"
          >
            {centerValue}
          </Text>
        ) : null}
        {centerLabel ? (
          <Text
            x={cx}
            y={cy + 14}
            style={{ fontSize: 7.5 }}
            fill={SUBTLE}
            textAnchor="middle"
          >
            {centerLabel}
          </Text>
        ) : null}
      </Svg>
      <View style={{ gap: 6 }}>
        {segments.map((seg, i) => (
          <View
            key={i}
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                backgroundColor: seg.color,
              }}
            />
            <Text style={{ fontSize: 9, color: "#111827" }}>
              {seg.label}
            </Text>
            <Text
              style={{
                fontSize: 9,
                fontFamily: "Helvetica-Bold",
                color: "#111827",
              }}
            >
              {seg.value.toLocaleString("id-ID")}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Legend({
  color,
  text,
  square,
}: {
  color: string;
  text: string;
  square?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <View
        style={{
          width: square ? 9 : 12,
          height: square ? 9 : 3,
          borderRadius: square ? 1 : 2,
          backgroundColor: color,
        }}
      />
      <Text style={{ fontSize: 8, color: SUBTLE }}>{text}</Text>
    </View>
  );
}
