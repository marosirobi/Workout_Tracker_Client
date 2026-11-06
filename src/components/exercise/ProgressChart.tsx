import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";

export interface ProgressPoint {
  time: number;
  value: number;
}

const HEIGHT = 220;
const PAD_LEFT = 44;
const PAD_RIGHT = 12;
const PAD_TOP = 22;
const PAD_BOTTOM = 24;
const TARGET_TICKS = 4;
const LINE_COLOR = "#FC4C02";
const LABEL_COLOR = "#8E8E93";
const GRID_COLOR = "#2A2A2A";

function niceStep(rawStep: number): number {
  const exponent = Math.floor(Math.log10(rawStep));
  const base = 10 ** exponent;
  const fraction = rawStep / base;

  let nice: number;
  if (fraction <= 1) nice = 1;
  else if (fraction <= 2) nice = 2;
  else if (fraction <= 2.5) nice = 2.5;
  else if (fraction <= 5) nice = 5;
  else nice = 10;

  return nice * base;
}

function buildAxis(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const rawStep = range > 0 ? range / TARGET_TICKS : Math.max(max * 0.1, 1);
  const step = niceStep(rawStep);

  const axisMin = Math.floor(min / step) * step - (range > 0 ? 0 : step);
  const axisMax = Math.ceil(max / step) * step + (range > 0 ? 0 : step);

  const ticks: number[] = [];
  for (let v = axisMin; v <= axisMax + step / 2; v += step) {
    ticks.push(v);
  }
  return { axisMin: Math.max(0, axisMin), axisMax, ticks };
}

function formatAxisDate(time: number): string {
  return new Date(time).toLocaleDateString("hu-HU", {
    month: "short",
    day: "numeric",
  });
}

interface ProgressChartProps {
  points: ProgressPoint[];
  unit: string;
  formatTick: (value: number) => string;
}

export function ProgressChart({
  points,
  unit,
  formatTick,
}: ProgressChartProps) {
  const [width, setWidth] = useState(0);

  const renderChart = () => {
    const values = points.map((p) => p.value);
    const { axisMin, axisMax, ticks } = buildAxis(values);

    const firstTime = points[0].time;
    const lastTime = points[points.length - 1].time;
    const timeSpan = lastTime - firstTime;

    const chartWidth = width - PAD_LEFT - PAD_RIGHT;
    const bottom = HEIGHT - PAD_BOTTOM;

    const x = (time: number) =>
      timeSpan > 0
        ? PAD_LEFT + ((time - firstTime) / timeSpan) * chartWidth
        : PAD_LEFT + chartWidth / 2;

    const y = (value: number) =>
      bottom - ((value - axisMin) / (axisMax - axisMin)) * (bottom - PAD_TOP);

    const linePath = points
      .map(
        (p, i) =>
          `${i === 0 ? "M" : "L"}${x(p.time).toFixed(1)},${y(p.value).toFixed(1)}`,
      )
      .join(" ");

    const areaPath =
      `${linePath} ` +
      `L${x(lastTime).toFixed(1)},${bottom} ` +
      `L${x(firstTime).toFixed(1)},${bottom} Z`;

    const lastPoint = points[points.length - 1];

    return (
      <Svg width={width} height={HEIGHT}>
        <SvgText x={0} y={12} fill={LABEL_COLOR} fontSize={11}>
          {unit}
        </SvgText>

        {ticks.map((tick) => (
          <Line
            key={`grid-${tick}`}
            x1={PAD_LEFT}
            y1={y(tick)}
            x2={width - PAD_RIGHT}
            y2={y(tick)}
            stroke={GRID_COLOR}
            strokeWidth={1}
          />
        ))}
        {ticks.map((tick) => (
          <SvgText
            key={`label-${tick}`}
            x={PAD_LEFT - 8}
            y={y(tick) + 4}
            fill={LABEL_COLOR}
            fontSize={11}
            textAnchor="end"
          >
            {formatTick(tick)}
          </SvgText>
        ))}

        {points.length >= 2 && (
          <>
            <Path d={areaPath} fill={LINE_COLOR} fillOpacity={0.12} />
            <Path
              d={linePath}
              stroke={LINE_COLOR}
              strokeWidth={2}
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </>
        )}

        {points.map((p, i) => (
          <Circle
            key={`dot-${i}`}
            cx={x(p.time)}
            cy={y(p.value)}
            r={3}
            fill={LINE_COLOR}
          />
        ))}
        <Circle
          cx={x(lastPoint.time)}
          cy={y(lastPoint.value)}
          r={5.5}
          fill={LINE_COLOR}
          stroke="#FFFFFF"
          strokeWidth={2}
        />

        {timeSpan > 0 ? (
          <>
            <SvgText
              x={PAD_LEFT}
              y={HEIGHT - 6}
              fill={LABEL_COLOR}
              fontSize={11}
            >
              {formatAxisDate(firstTime)}
            </SvgText>
            <SvgText
              x={width - PAD_RIGHT}
              y={HEIGHT - 6}
              fill={LABEL_COLOR}
              fontSize={11}
              textAnchor="end"
            >
              {formatAxisDate(lastTime)}
            </SvgText>
          </>
        ) : (
          <SvgText
            x={PAD_LEFT + chartWidth / 2}
            y={HEIGHT - 6}
            fill={LABEL_COLOR}
            fontSize={11}
            textAnchor="middle"
          >
            {formatAxisDate(firstTime)}
          </SvgText>
        )}
      </Svg>
    );
  };

  return (
    <View style={styles.card}>
      <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        {width > 0 && points.length > 0 ? (
          renderChart()
        ) : (
          <View style={{ height: HEIGHT }} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
});
