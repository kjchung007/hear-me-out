"use client";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { cities, type City } from "@/lib/world";
import { cozyMapStyle } from "@/lib/map-style";
import { mountSignalBubbles } from "@/lib/signal-bubbles";
import type { Signal } from "@/lib/use-signals";
import type { RadioStation } from "@/lib/radio";
import type { PublicCamera } from "@/lib/camera";

type Props = {
  posts: Signal[];
  onSignal: (post: Signal) => void;
  city?: { lat: number; lon: number };
  placingPin: boolean;
  pins: { id: string; label: string; lat: number; lon: number }[];
  onPin: (lat: number, lon: number, zoom: number) => void;
  focusRequest: number;
  homeRequest: number;
  zoom: number;
  onCity: (city: City) => void;
  onArrive: () => void;
  onTravel: () => void;
  onOrbit: (visibility: number) => void;
  mode: "People" | "Live" | "World";
  stations: RadioStation[];
  onStation: (station: RadioStation) => void;
  cameras: PublicCamera[];
  onCamera: (camera: PublicCamera) => void;
};
type Commands = {
  focus: (city: { lat: number; lon: number }) => void;
  home: () => void;
  zoom: (delta: number) => void;
};
const pinCursor = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="28" height="32" viewBox="0 0 24 28"><path d="M12 25s8-9 8-15a8 8 0 0 0-16 0c0 6 8 15 8 15Z" fill="#efc3a4" stroke="#30303d" stroke-width="2"/><circle cx="12" cy="10" r="3" fill="#30303d"/></svg>')}") 14 28, crosshair`;
const ease = (t: number) => t * t * (3 - 2 * t);
export default function Globe(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const commands = useRef<Commands | null>(null);
  const latest = useRef(props);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [ready, setReady] = useState(false);
  const priorZoom = useRef(props.zoom);
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    return mountSignalBubbles(
      map,
      props.placingPin ? [] : props.posts,
      (post) => latest.current.onSignal(post),
    );
  }, [ready, props.posts, props.placingPin, retry]);
  useEffect(() => {
    const map = mapRef.current;
    if (map)
      map.getCanvas().style.cursor = props.placingPin ? pinCursor : "grab";
  }, [props.placingPin, ready]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const markers = props.pins.map((pin) => {
      const el = document.createElement("div");
      el.className = "saved-map-pin";
      el.title = pin.label;
      el.innerHTML =
        '<svg viewBox="0 0 24 24" width="28" height="28"><path d="M12 22s8-8 8-14a8 8 0 0 0-16 0c0 6 8 14 8 14Z" fill="#efc3a4" stroke="#30303d" stroke-width="1.5"/><circle cx="12" cy="8" r="3" fill="#30303d"/></svg>';
      return new maplibregl.Marker({
        element: el,
        anchor: "bottom",
        opacityWhenCovered: 0,
      })
        .setLngLat([pin.lon, pin.lat])
        .addTo(map);
    });
    return () => markers.forEach((marker) => marker.remove());
  }, [props.pins, ready]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const source = map.getSource("radio-stations") as maplibregl.GeoJSONSource | undefined;
    source?.setData({
      type: "FeatureCollection",
      features: props.stations.map((station) => ({
        type: "Feature",
        properties: { id: station.id },
        geometry: { type: "Point", coordinates: [station.lon, station.lat] },
      })),
    });
    const showRadio = props.mode === "Live";
    map.setLayoutProperty("radio-halos", "visibility", showRadio ? "visible" : "none");
    map.setLayoutProperty("radio-dots", "visibility", showRadio ? "visible" : "none");
    map.setLayoutProperty("signal-halos", "visibility", props.mode === "People" ? "visible" : "none");
    map.setLayoutProperty("signal-dots", "visibility", props.mode === "People" ? "visible" : "none");
  }, [props.mode, props.stations, ready]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const source = map.getSource("public-cameras") as maplibregl.GeoJSONSource | undefined;
    source?.setData({ type: "FeatureCollection", features: props.cameras.map((camera) => ({
      type: "Feature", properties: { id: camera.id }, geometry: { type: "Point", coordinates: [camera.lon, camera.lat] },
    })) });
    const showCameras = props.mode === "Live";
    const showRadio = props.mode === "Live";
    map.setLayoutProperty("camera-halos", "visibility", showCameras ? "visible" : "none");
    map.setLayoutProperty("camera-dots", "visibility", showCameras ? "visible" : "none");
    map.setLayoutProperty("radio-halos", "visibility", showRadio ? "visible" : "none");
    map.setLayoutProperty("radio-dots", "visibility", showRadio ? "visible" : "none");
  }, [props.mode, props.cameras, ready]);
  useEffect(() => {
    latest.current = props;
  });
  useEffect(() => {
    if (props.city) commands.current?.focus(props.city);
  }, [props.city, props.focusRequest]);
  useEffect(() => {
    if (props.homeRequest) commands.current?.home();
  }, [props.homeRequest]);
  useEffect(() => {
    const delta = props.zoom - priorZoom.current;
    priorZoom.current = props.zoom;
    if (delta) commands.current?.zoom(delta);
  }, [props.zoom]);
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let disposed = false;
    let map: maplibregl.Map;
    let sequence = 0;
    let pending: (() => void) | null = null;
    let zoomTarget: number | null = null;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const orbitZoom = () =>
      Math.log2(
        Math.min(container.clientWidth * 0.84, container.clientHeight * 0.72) /
          150,
      );
    try {
      map = new maplibregl.Map({
        container,
        style: cozyMapStyle,
        center: [112, 15],
        zoom: orbitZoom(),
        minZoom: orbitZoom(),
        maxZoom: 19,
        maxPitch: 62,
        attributionControl: false,
        canvasContextAttributes: { antialias: true },
        fadeDuration: 300,
        pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
      });
    } catch {
      queueMicrotask(() => {
        if (!disposed)
          setError("The map couldn’t start. Try a browser with WebGL enabled.");
      });
      return () => {
        disposed = true;
      };
    }
    mapRef.current = map;
    let previousOrbit = -1;
    const reportOrbit = () => {
      const progress =
        Math.round(
          Math.max(0, Math.min(1, 1 - (map.getZoom() - orbitZoom()) / 0.18)) *
            100,
        ) / 100;
      if (progress !== previousOrbit) {
        previousOrbit = progress;
        latest.current.onOrbit(progress);
      }
    };
    map.on("zoom", reportOrbit);
    reportOrbit();
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right",
    );
    map
      .getCanvas()
      .setAttribute(
        "aria-label",
        "Earth map. Arrow keys move, plus and minus zoom. Use Saved places to visit a city, or select a speech bubble.",
      );
    const abort = new AbortController();
    const loadingTimer = setTimeout(() => {
      if (!disposed) {
        setError(
          "The map is taking too long to load. Check your connection and retry.",
        );
      }
    }, 15000);
    map.on("load", () => {
      clearTimeout(loadingTimer);
      if (!disposed) setReady(true);
    });
    function cancel() {
      sequence++;
      if (pending) {
        map.off("moveend", pending);
        pending = null;
      }
      map.stop();
      zoomTarget = null;
    }
    function travel(options: maplibregl.FlyToOptions, done?: () => void) {
      const id = sequence;
      const finish = () => {
        pending = null;
        if (!disposed && id === sequence) done?.();
      };
      pending = finish;
      map.once("moveend", finish);
      map.easeTo({ ...options, easing: ease, essential: false });
    }
    function focus(city: { lat: number; lon: number }) {
      cancel();
      latest.current.onTravel();
      const currentZoom = map.getZoom();
      const distance = map
        .getCenter()
        .distanceTo(new maplibregl.LngLat(city.lon, city.lat));
      const targetZoom = Math.min(19, Math.max(15.8, currentZoom + 0.65));
      const center: [number, number] = [city.lon, city.lat];
      const descend = () =>
        travel(
          {
            center,
            zoom: targetZoom,
            pitch: 48,
            bearing: map.getBearing(),
            duration: motion.matches
              ? 0
              : Math.min(2600, 750 + (targetZoom - currentZoom) * 140),
          },
          () => latest.current.onArrive(),
        );
      if (motion.matches) {
        map.jumpTo({ center, zoom: targetZoom, pitch: 48 });
        latest.current.onArrive();
        return;
      }
      // Face the destination at unchanged zoom, then descend after that motion ends.
      if (distance < 50) descend();
      else
        travel(
          {
            center,
            zoom: currentZoom,
            pitch: map.getPitch(),
            bearing: map.getBearing(),
            duration: Math.min(1800, 450 + distance / 8000),
          },
          descend,
        );
    }

    const api: Commands = {
      focus,
      home() {
        cancel();
        latest.current.onTravel();
        travel({
          zoom: orbitZoom(),
          pitch: 0,
          bearing: 0,
          duration: motion.matches ? 0 : 1900,
        });
      },
      zoom(delta) {
        const next = Math.min(
          19,
          Math.max(orbitZoom(), (zoomTarget ?? map.getZoom()) + delta * 0.85),
        );
        cancel();
        zoomTarget = next;
        map.easeTo({
          zoom: next,
          pitch: next < 8 ? 0 : map.getPitch(),
          duration: motion.matches ? 0 : 650,
          easing: ease,
        });
      },
    };
    map.on("style.load", () => {
      map.addSource("signals", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: cities.map((c) => ({
            type: "Feature",
            properties: { id: c.id, name: c.name },
            geometry: { type: "Point", coordinates: [c.lon, c.lat] },
          })),
        },
      });
      map.addLayer({
        id: "signal-halos",
        type: "circle",
        source: "signals",
        paint: {
          "circle-radius": 14,
          "circle-color": "#f3cda1",
          "circle-opacity": 0.18,
          "circle-blur": 0.7,
        },
      });
      map.addSource("radio-stations", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "radio-halos",
        type: "circle",
        source: "radio-stations",
        layout: { visibility: "none" },
        paint: { "circle-radius": 12, "circle-color": "#ffc985", "circle-opacity": 0.12, "circle-blur": 0.7 },
      });
      map.addLayer({
        id: "radio-dots",
        type: "circle",
        source: "radio-stations",
        layout: { visibility: "none" },
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 0, 3, 6, 5, 12, 7],
          "circle-color": "#ffd7a6",
          "circle-stroke-color": "#fff5e7",
          "circle-stroke-width": 1.2,
        },
      });
      map.addSource("public-cameras", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "camera-halos", type: "circle", source: "public-cameras", layout: { visibility: "none" }, paint: { "circle-radius": 14, "circle-color": "#7de8e1", "circle-opacity": .15, "circle-blur": .75 } });
      map.addLayer({ id: "camera-dots", type: "circle", source: "public-cameras", layout: { visibility: "none" }, paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 0, 3.5, 8, 6], "circle-color": "#7de8e1", "circle-stroke-color": "#e9fffa", "circle-stroke-width": 1.4 } });
      map.addLayer({
        id: "signal-dots",
        type: "circle",
        source: "signals",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            4.5,
            10,
            6,
            16,
            8,
          ],
          "circle-color": "#f5d6a9",
          "circle-stroke-color": "#fff0d5",
          "circle-stroke-width": 1.5,
        },
      });
      commands.current = api;
      if (latest.current.city) focus(latest.current.city);
    });
    map.on("click", (e) => {
      if (latest.current.placingPin) {
        const surface = map.project(e.lngLat);
        if (Math.hypot(surface.x - e.point.x, surface.y - e.point.y) < 5)
          latest.current.onPin(
            e.lngLat.lat,
            e.lngLat.wrap().lng,
            map.getZoom(),
          );
        return;
      }
      if (latest.current.mode === "Live" && map.getLayer("radio-dots")) {
        const cameraHits = map.queryRenderedFeatures([[e.point.x - 14, e.point.y - 14], [e.point.x + 14, e.point.y + 14]], { layers: ["camera-dots"] });
        const camera = cameraHits.length ? latest.current.cameras.find((item) => item.id === cameraHits[0].properties.id) : undefined;
        if (camera) { latest.current.onCamera(camera); return; }
        const hits = map.queryRenderedFeatures(
          [[e.point.x - 16, e.point.y - 16], [e.point.x + 16, e.point.y + 16]],
          { layers: ["radio-dots"] },
        );
        const station = hits.length
          ? latest.current.stations.find((item) => item.id === hits[0].properties.id)
          : undefined;
        if (station) {
          latest.current.onStation(station);
          return;
        }
      }
      if (latest.current.mode !== "People" || !map.getLayer("signal-dots")) return;
      const hits = map.queryRenderedFeatures(
        [
          [e.point.x - 18, e.point.y - 18],
          [e.point.x + 18, e.point.y + 18],
        ],
        { layers: ["signal-dots"] },
      );
      const candidates = cities.filter((c) =>
        hits.some((hit) => hit.properties.id === c.id),
      );
      const distance = (city: City) => {
        const point = map.project([city.lon, city.lat]);
        return Math.hypot(point.x - e.point.x, point.y - e.point.y);
      };
      const city = candidates.sort((a, b) => distance(a) - distance(b))[0];
      if (city) latest.current.onCity(city);
    });
    map.on("mouseenter", "signal-dots", () => {
      map.getCanvas().style.cursor = latest.current.placingPin
        ? pinCursor
        : "pointer";
    });
    map.on("mouseleave", "signal-dots", () => {
      map.getCanvas().style.cursor = latest.current.placingPin
        ? pinCursor
        : "grab";
    });
    map.on("mouseenter", "radio-dots", () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", "radio-dots", () => { map.getCanvas().style.cursor = "grab"; });
    map.on("mouseenter", "camera-dots", () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", "camera-dots", () => { map.getCanvas().style.cursor = "grab"; });
    // Native smooth wheel/pinch zoom remains interruptible. Cancel queued flight stages before manual input.
    const interrupt = () => {
      if (pending) cancel();
      zoomTarget = null;
    };
    map.getCanvas().addEventListener("wheel", interrupt, {
      passive: true,
      signal: abort.signal,
    });
    map.getCanvas().addEventListener("pointerdown", interrupt, {
      passive: true,
      signal: abort.signal,
    });
    map
      .getCanvas()
      .addEventListener("keydown", interrupt, { signal: abort.signal });
    map.on("moveend", () => {
      if (!pending) zoomTarget = null;
    });
    let errorTimer: ReturnType<typeof setTimeout> | undefined;
    map.on("error", () => {
      if (!errorTimer)
        errorTimer = setTimeout(() => {
          if (!disposed && !map.areTilesLoaded())
            setError(
              "Map detail is unavailable. Check your connection and retry.",
            );
          errorTimer = undefined;
        }, 5000);
    });
    map.on("idle", () => {
      if (!disposed) setError("");
    });
    const resize = new ResizeObserver(() => {
      const atOrbit = map.getZoom() <= map.getMinZoom() + 0.02;
      map.resize();
      map.setMinZoom(orbitZoom());
      if (atOrbit) map.jumpTo({ zoom: orbitZoom() });
      reportOrbit();
    });
    resize.observe(container);
    return () => {
      disposed = true;
      sequence++;
      abort.abort();
      clearTimeout(loadingTimer);
      if (errorTimer) clearTimeout(errorTimer);
      if (pending) map.off("moveend", pending);
      commands.current = null;
      resize.disconnect();
      mapRef.current = null;
      map.remove();
    };
  }, [retry]);
  return (
    <div className="globe-wrap">
      <div ref={host} className="globe-canvas" />
      {!ready && !error && (
        <div className="map-loading" role="status">
          Loading map…
        </div>
      )}
      {error && (
        <div className="map-error" role="status">
          {error}
          <button
            onClick={() => {
              setError("");
              setReady(false);
              setRetry((v) => v + 1);
            }}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
