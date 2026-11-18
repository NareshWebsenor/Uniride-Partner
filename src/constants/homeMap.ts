// Preview-only positions; replace with backend trip/GPS data when connected.
export const HOME_PICKUP = { latitude: 12.9345, longitude: 77.611 };
export const HOME_DRIVER = { latitude: 12.9296, longitude: 77.6056 };
export const HOME_PREVIEW_ROUTE = [
  HOME_DRIVER,
  { latitude: 12.9311, longitude: 77.6066 },
  { latitude: 12.9338, longitude: 77.6077 },
  { latitude: 12.9329, longitude: 77.6095 },
  { latitude: 12.9338, longitude: 77.6102 },
  { latitude: 12.9331, longitude: 77.611 },
  HOME_PICKUP,
];
export const HOME_MAP_REGION = {
  latitude: 12.9323,
  longitude: 77.6083,
  latitudeDelta: 0.014,
  longitudeDelta: 0.014,
};
