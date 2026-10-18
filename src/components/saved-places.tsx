"use client";
import { useEffect, useState } from "react";
import {
  PushPin,
  ArrowRight,
  PencilSimple,
  X,
  Check,
} from "@phosphor-icons/react";
import { cities } from "@/lib/world";
export type Pin = { id: string; label: string; lat: number; lon: number };
const KEY = "hear-me-out:places:v2";
export function usePins() {
  const [pins, setPins] = useState<Pin[]>([]);
  const [pinError, setError] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem(KEY);
        let raw = JSON.parse(stored || "[]");
        if (!stored) {
          const old = JSON.parse(
            localStorage.getItem("hear-me-out:places:v1") || "[]",
          );
          raw = Array.isArray(old)
            ? old.flatMap((p) => {
                const c = cities.find((c) => c.id === p.city);
                return c
                  ? [{ id: c.id, label: p.label, lat: c.lat, lon: c.lon }]
                  : [];
              })
            : [];
        }
        if (Array.isArray(raw))
          setPins(
            raw
              .filter(
                (p) =>
                  p &&
                  typeof p.id === "string" &&
                  typeof p.label === "string" &&
                  p.label.length <= 80 &&
                  Number.isFinite(p.lat) &&
                  Math.abs(p.lat) <= 90 &&
                  Number.isFinite(p.lon) &&
                  Math.abs(p.lon) <= 180,
              )
              .slice(0, 100),
          );
      } catch {
        setError("Saved places couldn’t be loaded.");
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  function savePins(next: Pin[]) {
    setPins(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      setError("");
    } catch {
      setError("Pins couldn’t be saved for next time.");
    }
  }
  return { pins, savePins, pinError };
}
export default function SavedPlaces({
  pins,
  onSave,
  onVisit,
  onPlace,
}: {
  pins: Pin[];
  onSave: (pins: Pin[]) => void;
  onVisit: (pin: Pin) => void;
  onPlace: () => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  return (
    <section className="saved-places">
      <button className="send-button full-width" onClick={onPlace}>
        <PushPin />
        Place a pin
      </button>
      <p className="fine">Saved on this device.</p>
      {!pins.length && (
        <p className="empty">Your favourite corners of the world, all here.</p>
      )}
      {pins.map((pin) => (
        <div className="pin-row" key={pin.id}>
          {editing === pin.id ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!label.trim()) return;
                onSave(
                  pins.map((p) =>
                    p.id === pin.id ? { ...p, label: label.trim() } : p,
                  ),
                );
                setEditing(null);
              }}
            >
              <input
                aria-label="Place name"
                maxLength={80}
                required
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                autoFocus
              />
              <button aria-label="Save place name">
                <Check />
              </button>
              <button
                type="button"
                aria-label="Cancel rename"
                onClick={() => setEditing(null)}
              >
                <X />
              </button>
            </form>
          ) : (
            <>
              <button className="pin-visit" onClick={() => onVisit(pin)}>
                <span>{pin.label}</span>
                <ArrowRight />
              </button>
              <button
                aria-label={`Rename ${pin.label}`}
                onClick={() => {
                  setEditing(pin.id);
                  setLabel(pin.label);
                }}
              >
                <PencilSimple />
              </button>
              <button
                aria-label={`Unpin ${pin.label}`}
                onClick={() => onSave(pins.filter((p) => p.id !== pin.id))}
              >
                <X />
              </button>
            </>
          )}
        </div>
      ))}
    </section>
  );
}
