import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { findNearest, useChartScrub } from "@/hooks/useChartScrub";
import { useLocale } from "@/i18n/useLocale";
import type { PacePoint } from "@/utils/workoutAnalysis";
import { formatKm, formatPace } from "@/utils/workoutFormat";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";

const HEIGHT = 170;
const PAD_LEFT = 40;
const PAD_RIGHT = 8;
const PAD_TOP = 12;
const PAD_BOTTOM = 22;
const LINE_COLOR = "#FC4C02";
const LABEL_COLOR = "#8E8E93";

const MIN_PACE_RANGE = 2;

interface Props {
  series: PacePoint[][];
  avgPace: number;
}

function percentile(sorted: number[], p: number): number {
  const index = Math.round(p * (sorted.length - 1));
  return sorted[Math.min(sorted.length - 1, Math.max(0, index))];
}


export function PaceChart({ series, avgPace }: Props) {
  const { t, locale } = useLocale();
  const [width, setWidth] = useState(0);
  const { containerRef, measure, touchX, scrubProps } = useChartScrub();

  const allPoints = useMemo(() => series.flat(), [series]);

  const chart = useMemo(() => {
    if (allPoints.length < 2 || width === 0) return null;

    const maxDistance = allPoints[allPoints.length - 1].distanceKm;
    const paces = allPoints.map((p) => p.paceMinPerKm);

    const sortedPaces = [...paces].sort((a, b) => a - b);
    const rawFastest = percentile(sortedPaces, 0.05);
    const rawSlowest = percentile(sortedPaces, 0.95);
    const middle = (rawFastest + rawSlowest) / 2;
    const span = Math.max(rawSlowest - rawFastest, MIN_PACE_RANGE);
    const fastest = middle - span * 0.6;
    const slowest = middle + span * 0.6;
    const chartWidth = width - PAD_LEFT - PAD_RIGHT;
    const bottom = HEIGHT - PAD_BOTTOM;

    const x = (distanceKm: number) =>
      PAD_LEFT + (distanceKm / maxDistance) * chartWidth;
    const y = (pace: number) => {
      const clamped = Math.min(Math.max(pace, fastest), slowest);
      return (
        PAD_TOP +
        ((clamped - fastest) / (slowest - fastest)) * (bottom - PAD_TOP)
      );
    };

    const linePath = (line: PacePoint[]) =>
      line
        .map(
          (p, i) =>
            `${i === 0 ? "M" : "L"}${x(p.distanceKm).toFixed(1)},${y(p.paceMinPerKm).toFixed(1)}`,
        )
        .join(" ");

    const areaPath = (line: PacePoint[]) =>
      `${linePath(line)} ` +
      `L${x(line[line.length - 1].distanceKm).toFixed(1)},${bottom} ` +
      `L${x(line[0].distanceKm).toFixed(1)},${bottom} Z`;

    const lines = series.filter((line) => line.length >= 2);

    return {
      x,
      y,
      bottom,
      maxDistance,
      fastest,
      slowest,
      linePaths: lines.map(linePath),
      areaPaths: lines.map(areaPath),
    };
  }, [allPoints, series, width]);

  if (allPoints.length < 2) return null;

  const selected =
    chart && touchX !== null
      ? findNearest(allPoints, (p) => Math.abs(chart.x(p.distanceKm) - touchX))
      : null;

  const renderChart = () => {
    if (!chart) return <View style={{ height: HEIGHT }} />;

    const { x, y, bottom, maxDistance, fastest, slowest } = chart;
    const showAverage = avgPace >= fastest && avgPace <= slowest;
    const avgY = y(avgPace);

    return (
      <>
        <Svg width={width} height={HEIGHT}>
          <SvgText x={0} y={PAD_TOP + 4} fill={LABEL_COLOR} fontSize={11}>
            {formatPace(fastest)}
          </SvgText>
          <SvgText x={0} y={bottom} fill={LABEL_COLOR} fontSize={11}>
            {formatPace(slowest)}
          </SvgText>

          <Line
            x1={PAD_LEFT}
            y1={bottom}
            x2={width - PAD_RIGHT}
            y2={bottom}
            stroke="#2A2A2A"
            strokeWidth={1}
          />

          {chart.areaPaths.map((d, i) => (
            <Path key={`area-${i}`} d={d} fill={LINE_COLOR} fillOpacity={0.15} />
          ))}
          {chart.linePaths.map((d, i) => (
            <Path
              key={`line-${i}`}
              d={d}
              stroke={LINE_COLOR}
              strokeWidth={2}
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {showAverage && (
            <>
              <Line
                x1={PAD_LEFT}
                y1={avgY}
                x2={width - PAD_RIGHT}
                y2={avgY}
                stroke="#FFFFFF"
                strokeOpacity={0.6}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <SvgText
                x={width - PAD_RIGHT}
                y={avgY - 5}
                fill="#FFFFFF"
                fontSize={11}
                textAnchor="end"
              >
                {t("workoutDetail.avgShort", { pace: formatPace(avgPace) })}
              </SvgText>
            </>
          )}

          {selected && (
            <>
              <Line
                x1={x(selected.distanceKm)}
                y1={PAD_TOP}
                x2={x(selected.distanceKm)}
                y2={bottom}
                stroke="#FFFFFF"
                strokeOpacity={0.7}
                strokeWidth={1}
              />
              <Circle
                cx={x(selected.distanceKm)}
                cy={y(selected.paceMinPerKm)}
                r={5}
                fill={LINE_COLOR}
                stroke="#FFFFFF"
                strokeWidth={2}
              />
            </>
          )}

          <SvgText x={PAD_LEFT} y={HEIGHT - 4} fill={LABEL_COLOR} fontSize={11}>
            0 km
          </SvgText>
          <SvgText
            x={width - PAD_RIGHT}
            y={HEIGHT - 4}
            fill={LABEL_COLOR}
            fontSize={11}
            textAnchor="end"
          >
            {`${formatKm(maxDistance, locale, 1)} km`}
          </SvgText>
        </Svg>

        {selected && (
          <ChartTooltip
            x={x(selected.distanceKm)}
            containerWidth={width}
            value={`${formatPace(selected.paceMinPerKm)} /km`}
            caption={`${formatKm(selected.distanceKm, locale)} km`}
          />
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("workoutDetail.paceChart")}</Text>

      <View
        ref={containerRef}
        onLayout={(event) => {
          setWidth(event.nativeEvent.layout.width);
          measure();
        }}
        {...scrubProps}
      >
        {renderChart()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 28 },
  title: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 10,
  },
});
