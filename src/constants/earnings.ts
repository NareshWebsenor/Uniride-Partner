import type { EarningsPeriod, EarningsRange } from "@/interface/earnings.type";

const isoDay = (date: Date) => date.toISOString().slice(0, 10);
const amounts = [150, 85, 158, 368, 471, 589, 256];

// Newest reference period first. These illustration amounts are not accounting data.
function period(range: EarningsRange, offset: number): EarningsPeriod {
  const start =
    range === "month"
      ? new Date(Date.UTC(2026, 10 - offset, 1))
      : new Date(
          Date.UTC(2026, 10, range === "week" ? -5 - offset * 7 : 1 - offset)
        );
  const end =
    range === "month"
      ? new Date(Date.UTC(2026, 11 - offset, 0))
      : new Date(start.getTime() + (range === "week" ? 6 : 0) * 86400000);
  const labels =
    range === "day"
      ? ["06:00", "09:00", "12:00", "15:00", "18:00", "21:00"]
      : range === "month"
      ? ["1", "8", "15", "22", "29"]
      : Array.from({ length: 7 }, (_, index) =>
          String(new Date(start.getTime() + index * 86400000).getUTCDate())
        );
  return {
    id: `${range}-${offset}`,
    start: isoDay(start),
    end: isoDay(end),
    total: (range === "month" ? 1240 : 120) - offset * 25,
    trips: (range === "month" ? 42 : 5) + offset,
    onlineMinutes: (range === "month" ? 2540 : 320) + offset * 15,
    points: labels.map((label, index) => ({
      label,
      amount: amounts[index] - offset * 5,
    })),
  };
}

export const EARNINGS_PERIODS: Record<
  EarningsRange,
  readonly EarningsPeriod[]
> = {
  day: [period("day", 0), period("day", 1), period("day", 2)],
  week: [period("week", 0), period("week", 1), period("week", 2)],
  month: [period("month", 0), period("month", 1), period("month", 2)],
};
export const DEMO_WALLET = { balance: 1000, cashLimit: 450 } as const;
