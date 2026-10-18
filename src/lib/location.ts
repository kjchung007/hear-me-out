import { cities } from "./world";

export function nearbyCity(latitude: number, longitude: number, accuracy = 0) {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180 ||
    !Number.isFinite(accuracy) ||
    accuracy > 50000
  )
    return null;
  const rad = Math.PI / 180;
  const ranked = cities
    .map((city) => {
      const a =
        Math.sin(((city.lat - latitude) * rad) / 2) ** 2 +
        Math.cos(latitude * rad) *
          Math.cos(city.lat * rad) *
          Math.sin(((city.lon - longitude) * rad) / 2) ** 2;
      return {
        city,
        km: 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a))),
      };
    })
    .sort((a, b) => a.km - b.km);
  // Never assign a far-away supported city to someone outside this V1 coverage.
  return ranked[0].km <= 120 ? ranked[0].city : null;
}
export async function detectCity() {
  if (!window.isSecureContext)
    throw new Error(
      "Location needs HTTPS. On this computer, open localhost:3000; phone location needs an HTTPS preview.",
    );
  if (!navigator.geolocation)
    throw new Error("This browser doesn’t support location detection.");
  const position = await new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 0,
    }),
  ).catch((error: GeolocationPositionError) => {
    throw new Error(
      error.code === 1
        ? "Location permission is off. Allow location for this site, then try again."
        : error.code === 3
          ? "Finding your city timed out. Please try again."
          : "Your location isn’t available. Check your device’s location settings and retry.",
    );
  });
  // Resolve entirely on-device. Raw coordinates are never sent to a server or stored.
  const city = nearbyCity(
    position.coords.latitude,
    position.coords.longitude,
    position.coords.accuracy,
  );
  if (!city)
    throw new Error(
      "Location works, but this preview doesn’t support your nearby city yet.",
    );
  return city;
}
