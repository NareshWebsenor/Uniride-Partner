export type TripStatus = "completed" | "scheduled" | "cancelled" | "missed";
export type TripTab = "completed" | "upcoming" | "incomplete";

/** Local reference data only; this is not a backend response contract. */
export interface DemoTrip {
  id: string;
  status: TripStatus;
  hour: number;
  minute: number;
  period: "am" | "pm";
  reverseRoute: boolean;
  fare: number;
  commissionPercent: number;
  distanceKm: number;
  durationSeconds: number;
}
