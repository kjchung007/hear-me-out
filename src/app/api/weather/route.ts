import { cities } from "@/lib/world";
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("city");
  const city = cities.find((c) => c.id === id);
  if (!city)
    return Response.json(
      { error: "Choose a supported city." },
      { status: 400 },
    );
  try {
    const params = new URLSearchParams({
      latitude: String(city.lat),
      longitude: String(city.lon),
      current: "temperature_2m,is_day,weather_code",
      daily: "sunrise,sunset",
      timezone: city.zone,
      forecast_days: "1",
    });
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params}`,
      { next: { revalidate: 600 }, signal: AbortSignal.timeout(10000) },
    );
    if (!response.ok) throw new Error("Weather service unavailable");
    const data = await response.json();
    if (
      !Number.isFinite(data.current?.temperature_2m) ||
      ![0, 1].includes(data.current?.is_day) ||
      ![
        data.current?.time,
        data.daily?.sunrise?.[0],
        data.daily?.sunset?.[0],
      ].every(
        (v) =>
          typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v),
      )
    )
      throw new Error("Incomplete weather");
    return Response.json({
      temperature: data.current.temperature_2m,
      isDay: data.current.is_day === 1,
      sunrise: data.daily.sunrise[0],
      sunset: data.daily.sunset[0],
      updatedAt: data.current.time,
    });
  } catch {
    return Response.json(
      { error: "Weather is taking a little break. Try again shortly." },
      { status: 503 },
    );
  }
}
