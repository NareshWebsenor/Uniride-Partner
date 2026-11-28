export type EarningsTab = "all" | "wallet";
export type EarningsRange = "day" | "week" | "month";

export interface EarningsPoint {
  label: string;
  amount: number;
}

/** Reference fixtures, not a wallet or earnings API contract. */
export interface EarningsPeriod {
  id: string;
  start: string;
  end: string;
  total: number;
  trips: number;
  onlineMinutes: number;
  points: readonly EarningsPoint[];
}
