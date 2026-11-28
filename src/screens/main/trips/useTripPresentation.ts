import { useAppTranslation } from "@/hooks/useAppTranslation";
import type { DemoTrip } from "@/interface/trip.type";

export function useTripPresentation(trip: DemoTrip) {
  const { t } = useAppTranslation();
  const incomplete = trip.status === "cancelled" || trip.status === "missed";
  const commission = (trip.fare * trip.commissionPercent) / 100;
  return {
    incomplete,
    time: t("trips.time", {
      hour: trip.hour,
      minute: String(trip.minute).padStart(2, "0"),
      period: t(`trips.${trip.period}`),
    }),
    earnings: t("trips.money", { amount: trip.fare - commission }),
    fare: t("trips.money", { amount: trip.fare }),
    commission: t("trips.negativeMoney", { amount: commission }),
    distance: t("trips.kilometers", { value: trip.distanceKm }),
    duration: t("trips.elapsed", {
      minutes: Math.floor(trip.durationSeconds / 60),
      seconds: trip.durationSeconds % 60,
    }),
    pickup: t(trip.reverseRoute ? "trips.locationB" : "trips.locationA"),
    dropoff: t(trip.reverseRoute ? "trips.locationA" : "trips.locationB"),
    pickupRegion: t(trip.reverseRoute ? "trips.regionB" : "trips.regionA"),
    dropoffRegion: t(trip.reverseRoute ? "trips.regionA" : "trips.regionB"),
    reason: t(
      trip.status === "missed"
        ? "trips.riderDidNotArrive"
        : "trips.riderChangedPlans"
    ),
  };
}
