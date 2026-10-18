import { NextResponse } from "next/server";

type DirectoryStation = {
  stationuuid?: string;
  name?: string;
  url_resolved?: string;
  country?: string;
  language?: string;
  tags?: string;
  geo_lat?: number | string | null;
  geo_long?: number | string | null;
  bitrate?: number;
  lastcheckok?: number;
};

export const revalidate = 3600;

export async function GET() {
  try {
    const response = await fetch(
      "https://all.api.radio-browser.info/json/stations/topclick/500?hidebroken=true&order=clickcount&reverse=true",
      {
        headers: { "User-Agent": "HearMeOut/0.1 (public radio globe)" },
        next: { revalidate: 3600 },
      },
    );
    if (!response.ok) throw new Error("directory unavailable");
    const rows = (await response.json()) as DirectoryStation[];
    const stations = rows
      .map((station) => ({
        id: station.stationuuid || "",
        name: (station.name || "Local radio").trim().slice(0, 90),
        stream: station.url_resolved || "",
        country: (station.country || "Somewhere").trim(),
        language: (station.language || "").split(",")[0].trim(),
        tags: (station.tags || "").split(",").slice(0, 2).join(" · "),
        lat: Number(station.geo_lat),
        lon: Number(station.geo_long),
        bitrate: Number(station.bitrate) || 0,
      }))
      .filter(
        (station) =>
          station.id &&
          station.stream.startsWith("https://") &&
          Number.isFinite(station.lat) &&
          Number.isFinite(station.lon) &&
          Math.abs(station.lat) <= 90 &&
          Math.abs(station.lon) <= 180 &&
          !(station.lat === 0 && station.lon === 0),
      )
      .slice(0, 260);
    return NextResponse.json(stations, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch {
    return NextResponse.json(
      { error: "The radio sky is quiet right now. Try again shortly." },
      { status: 503 },
    );
  }
}
