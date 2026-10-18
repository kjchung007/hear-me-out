import maplibregl from "maplibre-gl";
import { cities } from "./world";
import type { Signal } from "./use-signals";

// These positions are illustrations computed from a random post ID and a public
// city anchor. They never use a device location or claim to locate its author.
export function signalPosition(
  id: string,
  lat: number,
  lon: number,
): [number, number] {
  let hash = 2166136261;
  for (const c of id) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619) >>> 0;
  const angle = ((hash % 3600) * Math.PI) / 1800;
  const radius = 0.002 + (((hash >>> 12) % 1000) / 1000) * 0.005;
  return [
    lon + (Math.cos(angle) * radius) / Math.cos((lat * Math.PI) / 180),
    lat + Math.sin(angle) * radius,
  ];
}

export function mountSignalBubbles(
  map: maplibregl.Map,
  posts: Signal[],
  onSelect: (post: Signal) => void,
) {
  const counts = new Map<string, number>();
  posts.forEach((p) => counts.set(p.city, (counts.get(p.city) ?? 0) + 1));
  const entries = posts.slice(0, 80).flatMap((post) => {
    const city = cities.find((c) => c.id === post.city);
    if (!city) return [];
    const element = document.createElement("div");
    element.className = "signal-marker";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "globe-bubble";
    button.setAttribute(
      "aria-label",
      `${post.sample ? "Sample · " : ""}${post.emoji} ${post.text || "A feeling"} · ${city.name}. Approximate city placement.`,
    );
    button.title = `${post.sample ? "Sample · " : ""}${city.name} · Decorative city placement`;
    const mood = document.createElement("span");
    mood.className = "bubble-mood";
    mood.textContent = post.emoji;
    const words = document.createElement("span");
    words.className = "bubble-words";
    words.textContent = post.text || city.name;
    const count = document.createElement("span");
    count.className = "bubble-count";
    count.textContent = `+${(counts.get(post.city) ?? 1) - 1}`;
    button.append(words, mood, count);
    element.append(button);
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      onSelect(post);
    });
    const marker = new maplibregl.Marker({
      element,
      anchor: "bottom",
      offset: [0, -10],
      opacityWhenCovered: 0,
    })
      .setLngLat(signalPosition(post.id, city.lat, city.lon))
      .addTo(map);
    element.removeAttribute("role");
    element.removeAttribute("tabindex");
    return [{ post, marker, element, button, count }];
  });
  function layout() {
    const close = map.getZoom() >= 11;
    const placed: {
      left: number;
      top: number;
      right: number;
      bottom: number;
    }[] = [];
    const shownCities = new Set<string>();
    const rect = map.getContainer().getBoundingClientRect();
    for (const entry of entries) {
      const { element, button, post, count } = entry;
      element.classList.toggle("bubble-close", close);
      count.hidden = close || (counts.get(post.city) ?? 0) < 2;
      const covered = element.classList.contains("maplibregl-marker-covered");
      const box = button.getBoundingClientRect();
      const overlaps = placed.some(
        (r) =>
          box.left < r.right + 10 &&
          box.right > r.left - 10 &&
          box.top < r.bottom + 10 &&
          box.bottom > r.top - 10,
      );
      const visible =
        post.expiresAt > Date.now() &&
        !covered &&
        !overlaps &&
        (close || !shownCities.has(post.city)) &&
        box.right > rect.left + 12 &&
        box.left < rect.right - 12 &&
        box.top > rect.top + 8 &&
        box.bottom < rect.bottom - 70;
      button.style.visibility = visible ? "visible" : "hidden";
      button.tabIndex = visible ? 0 : -1;
      if (visible) {
        placed.push(box);
        shownCities.add(post.city);
      }
    }
  }
  map.on("render", layout);
  const timer = setInterval(layout, 1000);
  layout();
  return () => {
    map.off("render", layout);
    clearInterval(timer);
    entries.forEach((e) => e.marker.remove());
  };
}
