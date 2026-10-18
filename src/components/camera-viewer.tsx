"use client";
import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { ArrowSquareOut, Camera, X } from "@phosphor-icons/react";
import type { PublicCamera } from "@/lib/camera";

export default function CameraViewer({ camera, onClose }: { camera: PublicCamera; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [imageVersion, setImageVersion] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    if (camera.kind !== "video" || !video.current) return;
    const element = video.current;
    if (element.canPlayType("application/vnd.apple.mpegurl")) {
      element.src = camera.player;
      element.play().catch(() => undefined);
      return;
    }
    if (!Hls.isSupported()) {
      queueMicrotask(() =>
        setError("Live video is not supported in this browser."),
      );
      return;
    }
    const hls = new Hls({ liveSyncDurationCount: 2, enableWorker: true });
    hls.loadSource(camera.player);
    hls.attachMedia(element);
    hls.on(Hls.Events.MANIFEST_PARSED, () => element.play().catch(() => undefined));
    hls.on(Hls.Events.ERROR, (_event, data) => { if (data.fatal) setError("This camera is temporarily unavailable."); });
    return () => hls.destroy();
  }, [camera]);
  useEffect(() => {
    if (camera.kind !== "image") return;
    const timer = setInterval(
      () => setImageVersion((value) => value + 1),
      Math.max(30000, camera.refreshMs),
    );
    return () => clearInterval(timer);
  }, [camera]);
  return (
    <section className="camera-viewer" aria-label={`${camera.title} public camera`}>
      <div className="camera-head">
        <div>
          <span><Camera size={14} /> {camera.kind === "image" ? "LIVE IMAGE" : "LIVE VIDEO"}</span>
          <strong>{camera.title}</strong>
          <small>{camera.city}{camera.country ? ` · ${camera.country}` : ""} · {camera.refresh}</small>
        </div>
        <button onClick={onClose} aria-label="Close camera"><X /></button>
      </div>
      {camera.kind === "youtube" ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${camera.player}?autoplay=1&mute=1&playsinline=1`}
          title={`${camera.title} live stream`}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      ) : camera.kind === "video" ? (
        <video ref={video} controls playsInline muted autoPlay aria-label={`${camera.title} live view`} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`${camera.player}${camera.player.includes("?") ? "&" : "?"}v=${imageVersion}`} alt={`Current view from ${camera.title}`} />
      )}
      {error && <p className="camera-error" role="status">{error}</p>}
      <div className="camera-credit">
        <span>Public camera feed</span>
        <a href={camera.detail} target="_blank" rel="noreferrer">Open view <ArrowSquareOut /></a>
      </div>
    </section>
  );
}
