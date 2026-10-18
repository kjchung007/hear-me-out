import { NextRequest, NextResponse } from "next/server";
// One outstanding request per preview server, spaced at least one second apart.
let nextRequest = 0;
const cache = new Map<string, string>();
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  if (!q.has("lat") || !q.has("lon"))
    return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
  const lat = Number(q.get("lat")),
    lon = Number(q.get("lon"));
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    Math.abs(lat) > 90 ||
    Math.abs(lon) > 180
  )
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  const zoom = q.get("country") === "1" ? 3 : 10;
  const key = `${lat.toFixed(3)},${lon.toFixed(3)},${zoom}`;
  if (cache.has(key)) return NextResponse.json({ name: cache.get(key) });
  if (Date.now() < nextRequest)
    return NextResponse.json({ error: "Try again shortly" }, { status: 429 });
  nextRequest = Date.now() + 1000;
  try {
    const url = new URL(
      process.env.PLACE_LOOKUP_URL ||
        "https://nominatim.openstreetmap.org/reverse",
    );
    url.search = new URLSearchParams({
      lat: lat.toFixed(3),
      lon: lon.toFixed(3),
      zoom: String(zoom),
      format: "jsonv2",
      "accept-language": "en",
    }).toString();
    const response = await fetch(url, {
      headers: { "User-Agent": "HearMeOut-local-preview/1.0" },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 86400 },
    });
    if (!response.ok) throw Error();
    const data = await response.json();
    const a = data.address || {};
    const name =
      zoom === 3
        ? a.country
        : a.city ||
          a.town ||
          a.village ||
          a.municipality ||
          a.county ||
          a.state ||
          a.country;
    const label = typeof name === "string" ? name.slice(0, 80) : "Pinned place";
    if (cache.size >= 500) cache.clear();
    cache.set(key, label);
    return NextResponse.json({ name: label });
  } catch {
    return NextResponse.json(
      { error: "Place name unavailable" },
      { status: 503 },
    );
  }
}
