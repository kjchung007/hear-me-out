"use client";
import { Pause, Play, Radio, SpeakerHigh, X } from "@phosphor-icons/react";
import type { RadioStation } from "@/lib/radio";

export default function RadioPlayer({
  station,
  playing,
  error,
  onToggle,
  onClose,
  onVolume,
}: {
  station: RadioStation;
  playing: boolean;
  error: string;
  onToggle: () => void;
  onClose: () => void;
  onVolume: (volume: number) => void;
}) {
  return (
    <section className="radio-player" aria-label="Now playing">
      <button className="radio-play" onClick={onToggle} aria-label={playing ? "Pause" : "Play"}>
        {playing ? <Pause weight="fill" /> : <Play weight="fill" />}
      </button>
      <div className="radio-copy">
        <span><Radio size={14} /> LIVE FROM {station.country.toUpperCase()}</span>
        <strong>{station.name}</strong>
        <small>{error || station.tags || station.language || "Live public radio"}</small>
      </div>
      <label className="radio-volume">
        <SpeakerHigh size={17} />
        <input aria-label="Volume" type="range" min="0" max="1" step="0.05" defaultValue="0.7" onChange={(e) => onVolume(Number(e.target.value))} />
      </label>
      <button className="radio-close" onClick={onClose} aria-label="Close radio"><X /></button>
    </section>
  );
}
