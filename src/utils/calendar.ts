import type { ActivityWorkout } from "@/api/workoutService";

export interface CalendarMonth {
  year: number;
  month: number;
}

const A_MONDAY = new Date(2024, 0, 1);

export function weekdayLabels(locale: string): string[] {
  return Array.from({ length: 7 }, (_, index) =>
    new Date(
      A_MONDAY.getFullYear(),
      A_MONDAY.getMonth(),
      A_MONDAY.getDate() + index,
    ).toLocaleDateString(locale, { weekday: "short" }),
  );
}

const CELLS_PER_MONTH = 42;

export function monthKey(month: CalendarMonth): string {
  return `${month.year}-${month.month}`;
}

export function buildMonthList(count: number, now = new Date()): CalendarMonth[] {
  const months: CalendarMonth[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: date.getFullYear(), month: date.getMonth() });
  }
  return months;
}

export function getMonthRange(month: CalendarMonth): { from: Date; to: Date } {
  const from = new Date(month.year, month.month, 1);
  const nextMonth = new Date(month.year, month.month + 1, 1);
  const to = new Date(nextMonth.getTime() - 1);
  return { from, to };
}

export function buildMonthCells(month: CalendarMonth): (number | null)[] {
  const firstDay = new Date(month.year, month.month, 1);
  const daysInMonth = new Date(month.year, month.month + 1, 0).getDate();
  const leadingBlanks = (firstDay.getDay() + 6) % 7;

  const cells: (number | null)[] = Array(leadingBlanks).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(day);
  }
  while (cells.length < CELLS_PER_MONTH) {
    cells.push(null);
  }
  return cells;
}

export function countByDay(workouts: ActivityWorkout[]): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const workout of workouts) {
    const day = new Date(workout.startTime).getDate();
    counts[day] = (counts[day] ?? 0) + 1;
  }
  return counts;
}

export function formatMonthTitle(month: CalendarMonth, locale: string): string {
  return new Date(month.year, month.month, 1).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
  });
}
