import { useAppTranslation } from "@/hooks/useAppTranslation";
import type { EarningsPeriod, EarningsRange } from "@/interface/earnings.type";

export function useEarningsLabels() {
  const { t, i18n } = useAppTranslation();
  const locale = i18n.language === "en" ? "en-GB" : i18n.language;
  const label = (period: EarningsPeriod, range: EarningsRange) => {
    const start = new Date(`${period.start}T12:00:00Z`);
    const end = new Date(`${period.end}T12:00:00Z`);
    const formatter = new Intl.DateTimeFormat(locale, {
      ...(range !== "month" ? { day: "2-digit" as const } : {}),
      month: "short",
      timeZone: "UTC",
    });
    const date =
      range === "week"
        ? t("earnings.periodRange", {
            start: formatter.format(start),
            end: formatter.format(end),
          })
        : formatter.format(start);
    return {
      short: date,
      full: t("earnings.dateWithYear", {
        range: date,
        year: end.getUTCFullYear(),
      }),
    };
  };
  return { label, money: (value: number) => t("earnings.amount", { value }) };
}
