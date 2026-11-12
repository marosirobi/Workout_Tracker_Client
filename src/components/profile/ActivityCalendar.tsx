import { workoutService } from "@/api/workoutService";
import { IconButton } from "@/components/IconButton";
import {
  buildMonthCells,
  buildMonthList,
  countByDay,
  formatMonthTitle,
  getMonthRange,
  monthKey,
  weekdayLabels,
  type CalendarMonth,
} from "@/utils/calendar";
import { useLocale } from "@/i18n/useLocale";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from "react-native";

const MONTH_COUNT = 24;
const GAP = 6;
const LEVEL_COLORS = ["#2C2C2E", "rgba(252, 76, 2, 0.45)", "#FC4C02"];

function levelFor(count: number): number {
  if (count >= 2) return 2;
  return count;
}

interface MonthGridProps {
  month: CalendarMonth;
  counts: Record<number, number> | undefined;
  width: number;
  weekdays: string[];
}

const MonthGrid = memo(function MonthGrid({
  month,
  counts,
  width,
  weekdays,
}: MonthGridProps) {
  const cells = buildMonthCells(month);
  const cellSize = (width - GAP * 6) / 7;

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === month.year && today.getMonth() === month.month;
  const isFutureMonth =
    month.year > today.getFullYear() ||
    (month.year === today.getFullYear() && month.month > today.getMonth());

  return (
    <View style={{ width }}>
      <View style={styles.weekdays}>
        {weekdays.map((label, index) => (
          <Text key={index} style={[styles.weekday, { width: cellSize }]}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, index) => {
          if (day === null) {
            return (
              <View
                key={index}
                style={{ width: cellSize, height: cellSize * 0.8 }}
              />
            );
          }

          const level = levelFor(counts?.[day] ?? 0);
          const isToday = isCurrentMonth && day === today.getDate();
          const isFuture =
            isFutureMonth || (isCurrentMonth && day > today.getDate());

          return (
            <View
              key={index}
              style={[
                styles.cell,
                {
                  width: cellSize,
                  height: cellSize * 0.8,
                  backgroundColor: LEVEL_COLORS[level],
                },
                isToday && styles.today,
                isFuture && styles.future,
              ]}
            >
              <Text
                style={[styles.dayText, level > 0 && styles.dayTextActive]}
              >
                {day}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
});

export function ActivityCalendar({ refreshSignal }: { refreshSignal: number }) {
  const { locale } = useLocale();
  const weekdays = useMemo(() => weekdayLabels(locale), [locale]);
  const months = useMemo(() => buildMonthList(MONTH_COUNT), []);
  const [width, setWidth] = useState(0);
  const [visibleIndex, setVisibleIndex] = useState(MONTH_COUNT - 1);
  const [countsByMonth, setCountsByMonth] = useState<
    Record<string, Record<number, number>>
  >({});

  const listRef = useRef<FlatList<CalendarMonth>>(null);
  const requestedRef = useRef(new Set<string>());

  const loadMonth = useCallback(async (month: CalendarMonth) => {
    const key = monthKey(month);
    if (requestedRef.current.has(key)) return;
    requestedRef.current.add(key);

    try {
      const { from, to } = getMonthRange(month);
      const workouts = await workoutService.getWorkoutsInRange(from, to);
      setCountsByMonth((previous) => ({
        ...previous,
        [key]: countByDay(workouts),
      }));
    } catch (error: any) {
      requestedRef.current.delete(key);
      console.error(
        "Hiba az aktivitás betöltésekor",
        error.response?.data || error.message,
      );
    }
  }, []);

  useEffect(() => {
    requestedRef.current.clear();
  }, [refreshSignal]);

  useEffect(() => {
    loadMonth(months[visibleIndex]);
  }, [visibleIndex, months, loadMonth, refreshSignal]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      if (first?.index != null) {
        setVisibleIndex(first.index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const goTo = (index: number) => {
    listRef.current?.scrollToIndex({ index, animated: true });
  };

  return (
    <View>
      <View style={styles.header}>
        <IconButton
          name="chevron-back"
          onPress={() => goTo(visibleIndex - 1)}
          disabled={visibleIndex === 0}
        />
        <Text style={styles.title}>
          {formatMonthTitle(months[visibleIndex], locale)}
        </Text>
        <IconButton
          name="chevron-forward"
          onPress={() => goTo(visibleIndex + 1)}
          disabled={visibleIndex === MONTH_COUNT - 1}
        />
      </View>

      <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        {width > 0 && (
          <FlatList
            ref={listRef}
            data={months}
            keyExtractor={monthKey}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={MONTH_COUNT - 1}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            extraData={[countsByMonth, locale]}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            renderItem={({ item }) => (
              <MonthGrid
                month={item}
                counts={countsByMonth[monthKey(item)]}
                width={width}
                weekdays={weekdays}
              />
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: { color: "#FFF", fontSize: 17, fontWeight: "700" },
  weekdays: { flexDirection: "row", gap: GAP, marginBottom: 6 },
  weekday: {
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
  cell: { borderRadius: 8, alignItems: "center", justifyContent: "center" },
  today: { borderWidth: 2, borderColor: "#FFF" },
  future: { opacity: 0.35 },
  dayText: { color: "#AEAEB2", fontSize: 13, fontWeight: "600" },
  dayTextActive: { color: "#FFF" },
});
