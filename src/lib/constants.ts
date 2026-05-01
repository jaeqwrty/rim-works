export type VehicleType = "bajaj_re" | "minivan" | "pickup_truck";

export const VEHICLE_LABELS: Record<VehicleType, string> = {
  bajaj_re: "Bajaj RE",
  minivan: "Minivan",
  pickup_truck: "Pickup Truck",
};

export const VEHICLE_TAGLINES: Record<VehicleType, string> = {
  bajaj_re: "Tricycle / 3-wheeler",
  minivan: "Family van",
  pickup_truck: "Heavy-duty pickup",
};

export const formatPHP = (n: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(n);

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  ready_for_pickup: "Ready for Pickup",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_FLOW = [
  "pending",
  "confirmed",
  "in_progress",
  "ready_for_pickup",
  "completed",
] as const;
