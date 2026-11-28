import type { DemoTrip, TripTab } from "@/interface/trip.type";

const route = {
  commissionPercent: 10,
  distanceKm: 12.18,
  durationSeconds: 1619,
};

export const DEMO_TRIPS: readonly DemoTrip[] = [
  {
    ...route,
    id: "TRP-051126-01",
    status: "completed",
    hour: 9,
    minute: 44,
    period: "am",
    reverseRoute: false,
    fare: 300,
  },
  {
    ...route,
    id: "TRP-051126-02",
    status: "completed",
    hour: 8,
    minute: 15,
    period: "am",
    reverseRoute: true,
    fare: 300,
  },
  {
    ...route,
    id: "TRP-051126-03",
    status: "scheduled",
    hour: 10,
    minute: 30,
    period: "am",
    reverseRoute: false,
    fare: 300,
  },
  {
    ...route,
    id: "TRP-051126-04",
    status: "scheduled",
    hour: 2,
    minute: 0,
    period: "pm",
    reverseRoute: true,
    fare: 200,
  },
  {
    ...route,
    id: "TRP-051126-05",
    status: "cancelled",
    hour: 9,
    minute: 15,
    period: "am",
    reverseRoute: false,
    fare: 0,
  },
  {
    ...route,
    id: "TRP-051126-06",
    status: "missed",
    hour: 8,
    minute: 30,
    period: "am",
    reverseRoute: true,
    fare: 0,
  },
];

export function tripsForTab(tab: TripTab): readonly DemoTrip[] {
  return DEMO_TRIPS.filter((trip) =>
    tab === "completed"
      ? trip.status === "completed"
      : tab === "upcoming"
      ? trip.status === "scheduled"
      : trip.status === "cancelled" || trip.status === "missed"
  );
}
