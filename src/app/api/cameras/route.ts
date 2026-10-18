import { NextResponse } from "next/server";

type OpenCctvCamera = {
  id?: string; camera_code?: number; name?: string; city?: string; country?: string;
  lat?: number; lng?: number; feed_url?: string; feed_type?: string;
  update_rate?: number; category?: string;
};

type YouTubeSearchItem = {
  id?: { videoId?: string };
  snippet?: { title?: string; channelTitle?: string };
};

const liveTargets = [
  ["Kuala Lumpur", "Malaysia", 3.139, 101.6869],
  ["George Town", "Malaysia", 5.4141, 100.3288],
  ["Langkawi", "Malaysia", 6.3500, 99.8000],
  ["Melaka", "Malaysia", 2.1896, 102.2501],
  ["Kota Kinabalu", "Malaysia", 5.9804, 116.0735],
  ["Kuching", "Malaysia", 1.5533, 110.3592],
  ["Singapore", "Singapore", 1.2903, 103.8519],
  ["Tokyo", "Japan", 35.6762, 139.6503],
  ["Seoul", "South Korea", 37.5665, 126.9780],
  ["Bangkok", "Thailand", 13.7563, 100.5018],
  ["Sydney Harbour", "Australia", -33.8523, 151.2108],
  ["London", "United Kingdom", 51.5072, -0.1276],
  ["Paris", "France", 48.8566, 2.3522],
  ["Venice", "Italy", 45.4408, 12.3155],
  ["Amsterdam", "Netherlands", 52.3676, 4.9041],
  ["Reykjavik", "Iceland", 64.1466, -21.9426],
  ["New York Times Square", "United States", 40.7580, -73.9855],
  ["Honolulu Waikiki", "United States", 21.2793, -157.8293],
  ["Rio de Janeiro", "Brazil", -22.9068, -43.1729],
  ["Cape Town", "South Africa", -33.9249, 18.4241],
] as const;

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

// Reviewed direct feeds only. Each source is tested for reachability and browser use.
const curatedCameras = [
  { id: "369710", title: "Charles Mill Marina", city: "Mansfield", country: "United States", lat: 40.7584, lon: -82.5154, kind: "video", refresh: "Continuous", refreshMs: 0, feed: "https://s125.ipcamlive.com/streams/7dhuf4f8daijezjqb/stream.m3u8", path: "united-states/ohio/mansfield/charles-mill-marina-369710" },
  { id: "365885", title: "Arnside Pier", city: "Arnside", country: "United Kingdom", lat: 54.2024, lon: -2.8372, kind: "video", refresh: "Continuous", refreshMs: 0, feed: "https://camsecure.co/HLS/arnside.m3u8", path: "united-kingdom/arnside-pier-live-webcam-365885" },
  { id: "104911", title: "Mjøsbrua E6", city: "Moelv", country: "Norway", lat: 60.9282, lon: 10.6702, kind: "image", refresh: "About 5 min", refreshMs: 300000, feed: "https://kamera.atlas.vegvesen.no/api/images/0429003_1", path: "norway/moelv/mjosbrua-e6-104911" },
  { id: "304365", title: "Bukit Klangon", city: "Yogyakarta", country: "Indonesia", lat: -7.5913, lon: 110.427, kind: "image", refresh: "About 3 min", refreshMs: 180000, feed: "https://imgproxy.windy.com/_/full/plain/current/1652053243/original.jpg", path: "indonesia/special-region-of-yogyakarta/hargo-binangun/hargo-binangun-bukit-klangon-304365" },
  { id: "309862", title: "Jagorawi Toll Road", city: "Depok", country: "Indonesia", lat: -6.3895, lon: 106.8952, kind: "image", refresh: "About 3 min", refreshMs: 180000, feed: "https://imgproxy.windy.com/_/full/plain/current/1734282626/original.jpg", path: "indonesia/west-java/depok/depok-jagorawi-toll-road-jalan-nasional-2-309862" },
  { id: "117484", title: "Mount Coot-Tha Road", city: "Toowong", country: "Australia", lat: -27.4783, lon: 152.9848, kind: "image", refresh: "About 1 min", refreshMs: 60000, feed: "https://cameras.qldtraffic.qld.gov.au/Metropolitan/Toowong_MtCootha_West.jpg", path: "australia/queensland/toowong/toowong-mount-coot-tha-road-and-miskin-street-west-117484" },
  { id: "117456", title: "Ipswich Motorway", city: "Archerfield", country: "Australia", lat: -27.5552, lon: 153.0087, kind: "image", refresh: "About 1 min", refreshMs: 60000, feed: "https://cameras.qldtraffic.qld.gov.au/Metropolitan/Archerfield_Ipswich_Mwy_sth.jpg", path: "australia/queensland/archerfield/archerfield-ipswich-motorway-and-granard-rd-north-117456" },
  { id: "117459", title: "Western Freeway", city: "Indooroopilly", country: "Australia", lat: -27.5007, lon: 152.9627, kind: "image", refresh: "About 1 min", refreshMs: 60000, feed: "https://cameras.qldtraffic.qld.gov.au/Metropolitan/Indooroopilly_Western_Fwy_Sth.jpg", path: "australia/queensland/indooroopilly/indooroopilly-western-freeway-and-moggill-road-south-117459" },
  { id: "85495", title: "Komoku · Hitachi-Ota", city: "Hitachi", country: "Japan", lat: 36.5196, lon: 140.569, kind: "image", refresh: "About 10 min", refreshMs: 600000, feed: "https://cam.river.go.jp/cam/now/102049004.jpg", path: "japan/hitachi/komoku-hitachi-ota-85495" },
].map(({ path, feed, ...camera }) => ({
  ...camera,
  image: "",
  player: feed,
  detail: `https://opencctv.org/cameras/${path}`,
}));

function mapOpenCctvCamera(camera: OpenCctvCamera) {
  const player = camera.feed_url ?? "";
  const isHls = camera.feed_type === "video" && /\.m3u8(?:$|\?)/i.test(player);
  if (!camera.id || !/^https:\/\//i.test(player) || !Number.isFinite(camera.lat) || !Number.isFinite(camera.lng)) return null;
  return {
    id: `ocv-${camera.id}`,
    title: camera.name || "Live public camera",
    city: camera.city || "Nearby",
    country: camera.country?.length === 2 ? regionNames.of(camera.country) || camera.country : camera.country || "",
    lat: camera.lat as number,
    lon: camera.lng as number,
    kind: isHls ? "video" as const : "image" as const,
    refresh: isHls ? "Continuous" : "Frequent refresh",
    refreshMs: isHls ? 0 : Math.max(30000, camera.update_rate || 60000),
    image: "",
    player,
    detail: camera.camera_code
      ? `https://opencctv.org/api/camera/code/${camera.camera_code}`
      : "https://opencctv.org/open-cameras",
  };
}

async function getScenicWorldCameras() {
  try {
    const searches = ["beach", "nature", "port", "airport", "water", "weather"]
      .flatMap((category) => [1, 20, 50].map((page) => ({ category, page })));
    const requests = searches.map(async ({ category, page }) => {
      const url = new URL("https://opencctv.org/api/cameras/list");
      Object.entries({ category, page: String(page), limit: "100", status: "active", sortBy: "name", sortDir: "asc" })
        .forEach(([key, value]) => url.searchParams.set(key, value));
      const response = await fetch(url, { next: { revalidate: 3600 } });
      if (!response.ok) return [];
      const data = await response.json() as { cameras?: OpenCctvCamera[] };
      return data.cameras ?? [];
    });
    const malaysiaRequest = fetch("https://opencctv.org/api/cameras/list?country=MY&page=1&limit=100&status=active&sortBy=name&sortDir=asc", {
      next: { revalidate: 3600 },
    }).then(async (response) => response.ok ? ((await response.json()) as { cameras?: OpenCctvCamera[] }).cameras ?? [] : []);

    const raw = [...(await Promise.all(requests)).flat(), ...(await malaysiaRequest)];
    const seen = new Set<string>();
    const countryCounts = new Map<string, number>();
    return raw.flatMap((item) => {
      if (!item.id || seen.has(item.id)) return [];
      seen.add(item.id);
      const country = item.country || "";
      const limit = country === "MY" ? 12 : 5;
      const count = countryCounts.get(country) ?? 0;
      if (count >= limit) return [];
      const mapped = mapOpenCctvCamera(item);
      if (!mapped) return [];
      countryCounts.set(country, count + 1);
      return [mapped];
    });
  } catch {
    return [];
  }
}

async function getYouTubeLiveCameras() {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return [];
  try {
    const results = await Promise.all(liveTargets.map(async ([city, country, lat, lon]) => {
      const url = new URL("https://www.googleapis.com/youtube/v3/search");
      Object.entries({
        part: "snippet", type: "video", eventType: "live", videoEmbeddable: "true",
        videoSyndicated: "true", safeSearch: "strict", maxResults: "2",
        order: "viewCount", q: `${city} live webcam`, key,
      }).forEach(([name, value]) => url.searchParams.set(name, value));
      const response = await fetch(url, { next: { revalidate: 43200 } });
      if (!response.ok) return [];
      const data = await response.json() as { items?: YouTubeSearchItem[] };
      return (data.items ?? []).flatMap((item, index) => {
        const videoId = item.id?.videoId;
        if (!videoId) return [];
        const offset = index ? 0.055 : -0.035;
        return [{
          id: `youtube-${videoId}`,
          title: item.snippet?.title || `${city} live`,
          city, country,
          lat: lat + offset,
          lon: lon - offset,
          kind: "youtube" as const,
          refresh: "Continuous",
          refreshMs: 0,
          image: "",
          player: videoId,
          detail: `https://www.youtube.com/watch?v=${videoId}`,
        }];
      });
    }));
    const seen = new Set<string>();
    return results.flat().filter((camera) => !seen.has(camera.id) && Boolean(seen.add(camera.id)));
  } catch {
    return [];
  }
}

export async function GET() {
  const [scenicCameras, youtubeCameras] = await Promise.all([
    getScenicWorldCameras(),
    getYouTubeLiveCameras(),
  ]);
  return NextResponse.json([...youtubeCameras, ...curatedCameras, ...scenicCameras], {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
