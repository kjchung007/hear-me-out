"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import Globe from "./globe";
import OrbitTabs from "./orbit-tabs";
import Account from "./account";
import SavedPlaces, { usePins, type Pin } from "./saved-places";
import { detectCity } from "@/lib/location";
import KindnessInbox from "./kindness-inbox";
import RadioPlayer from "./radio-player";
import type { RadioStation } from "@/lib/radio";
import CameraViewer from "./camera-viewer";
import type { PublicCamera } from "@/lib/camera";
import { sampleSignals } from "@/lib/sample-signals";
import { useSignals } from "@/lib/use-signals";
import {
  X,
  Plus,
  Minus,
  ChatCircle,
  Info,
  GlobeHemisphereEast,
  ArrowRight,
  MapPin,
  Sun,
  Moon,
  Heart,
  PushPin,
  Bell,
  UserCircle,
} from "@phosphor-icons/react";
import { cities, moods, characterCount, type City } from "@/lib/world";

type Weather = {
  temperature: number;
  isDay: boolean;
  sunrise: string;
  sunset: string;
  updatedAt: string;
};
function WeatherPanel({ city }: { city: City }) {
  const [data, setData] = useState<Weather | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [clock, setClock] = useState<Date | null>(null);
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const r = await fetch(`/api/weather?city=${city.id}`, {
          signal: controller.signal,
        });
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        setData(d);
        setError("");
      } catch (e) {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : "Weather unavailable");
      }
    }
    load();
    const timer = setInterval(load, 600000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [city.id, retry]);
  return (
    <div className="weather">
      <div className="local-clock">
        <time>
          {clock
            ? new Intl.DateTimeFormat("en-GB", {
                timeZone: city.zone,
                hour: "2-digit",
                minute: "2-digit",
              }).format(clock)
            : "—:—"}
        </time>
        <span>Local time · {city.name}</span>
      </div>
      {error ? (
        <>
          <p role="status">{error}</p>
          <button onClick={() => setRetry((v) => v + 1)}>Retry weather</button>
        </>
      ) : data ? (
        <>
          <div className="weather-top">
            {data.isDay ? <Sun size={26} /> : <Moon size={26} />}
            <strong>{Math.round(data.temperature)}°C</strong>
            <span>{data.isDay ? "Daytime" : "Nighttime"}</span>
          </div>
          <small>
            Updated {data.updatedAt.slice(11, 16)} local ·{" "}
            <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
              Open-Meteo
            </a>
          </small>
        </>
      ) : (
        <p role="status">Checking the sky…</p>
      )}
    </div>
  );
}
export default function World() {
  const [city, setCity] = useState<City>(cities[0]);
  const [mood, setMood] = useState("😊");
  const [message, setMessage] = useState("");
  const {
    user,
    posts,
    loading,
    error,
    refresh,
    publish,
    react: sendReaction,
  } = useSignals();
  const [busy, setBusy] = useState(false);
  const [authNeeded, setAuthNeeded] = useState(false);
  const [now, setNow] = useState(0);
  const [notice, setNotice] = useState("");
  const [all, setAll] = useState(true);
  const [panel, setPanel] = useState<
    "compose" | "signals" | "about" | "pins" | "inbox" | "detail" | null
  >(null);
  const [showSamples, setShowSamples] = useState(true);
  const [anonymous, setAnonymous] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const { pins, savePins, pinError } = usePins();
  const [placingPin, setPlacingPin] = useState(false);
  const [mode, setMode] = useState<"People" | "Live" | "World">("People");
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [radio, setRadio] = useState<RadioStation | null>(null);
  const [radioPlaying, setRadioPlaying] = useState(false);
  const [radioError, setRadioError] = useState("");
  const [cameras, setCameras] = useState<PublicCamera[]>([]);
  const [camera, setCamera] = useState<PublicCamera | null>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const [orbit, setOrbit] = useState(1);
  const [travelling, setTravelling] = useState(false);
  const [destination, setDestination] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [locating, setLocating] = useState(false);
  const locationRequest = useRef(0);
  const pinRequest = useRef(0);
  async function placePin(lat: number, lon: number, level: number) {
    const request = ++pinRequest.current;
    setNotice("Naming your pin…");
    let label = "Pinned place";
    try {
      const response = await fetch(
        `/api/place?lat=${lat.toFixed(3)}&lon=${lon.toFixed(3)}&country=${level < 5 ? 1 : 0}`,
      );
      if (!response.ok) throw Error();
      const data = await response.json();
      label = data.name || label;
    } catch {
      /* Keep a renameable fallback if the place lookup is unavailable. */
    }
    if (request !== pinRequest.current) return;
    savePins([
      ...pins,
      {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        lat,
        lon,
        label,
      },
    ]);
    setPanel("pins");
    setNotice(
      label === "Pinned place" ? "Pin saved. You can give it a name." : "",
    );
  }
  function visitPin(pin: Pin) {
    locationRequest.current++;
    setLocating(false);
    setPlacingPin(false);
    composeArrival.current = false;
    signalArrival.current = false;
    setSelected(false);
    setDestination(pin);
    setPanel(null);
    setFocusRequest((v) => v + 1);
  }
  const composeArrival = useRef(false);
  const displayPosts = useMemo(() => [...posts, ...sampleSignals], [posts]);
  const [quickOpen, setQuickOpen] = useState(false);
  const [selected, setSelected] = useState(false);
  const signalArrival = useRef(false);
  const [focusRequest, setFocusRequest] = useState(0);
  const [homeRequest, setHomeRequest] = useState(0);
  const [zoom, setZoom] = useState(0);
  const drawer = useRef<HTMLElement>(null);
  useEffect(() => {
    if (mode !== "Live" || stations.length) return;
    const controller = new AbortController();
    fetch("/api/radio/stations", { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw Error(data.error || "Radio stations unavailable");
        setStations(data);
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setNotice(error instanceof Error ? error.message : "Radio stations unavailable");
      });
    return () => controller.abort();
  }, [mode, stations.length]);
  useEffect(() => {
    if (mode !== "Live" || cameras.length) return;
    const controller = new AbortController();
    fetch("/api/cameras", { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw Error(data.error || "Public cameras unavailable");
        setCameras(data);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setNotice(error instanceof Error ? error.message : "Public cameras unavailable");
      });
    return () => controller.abort();
  }, [mode, cameras.length]);

  function tune(station: RadioStation) {
    setCamera(null);
    setRadio(station);
    setRadioError("");
    const player = audio.current;
    if (!player) return;
    player.src = station.stream;
    player.volume = 0.7;
    player.play().then(() => setRadioPlaying(true)).catch(() => {
      setRadioPlaying(false);
      setRadioError("Tap play to start listening");
    });
    void fetch(`/api/radio/click/${station.id}`, { method: "POST" });
  }

  function toggleRadio() {
    const player = audio.current;
    if (!player) return;
    if (player.paused)
      player.play().then(() => { setRadioPlaying(true); setRadioError(""); }).catch(() => setRadioError("This station isn’t answering right now"));
    else {
      player.pause();
      setRadioPlaying(false);
    }
  }
  useEffect(() => {
    if (!panel) return;
    const previous = document.activeElement as HTMLElement;
    drawer.current?.focus();
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !authNeeded) {
        setPanel(null);
        setPlacingPin(false);
      }
    };
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("keydown", close);
      previous?.focus();
    };
  }, [panel, authNeeded]);
  useEffect(() => {
    const timer = setInterval(() => {
      const t = Date.now();
      setNow(t);
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const count = characterCount(message);
  const visible = displayPosts.filter(
    (p) => p.expiresAt > now && (all || p.city === city.id),
  );
  async function post(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!user) {
      setAuthNeeded(true);

      return;
    }
    if (count > 50) {
      setNotice("Keep your message within 50 characters.");
      return;
    }
    setBusy(true);
    try {
      const actualCity = await detectCity();
      setCity(actualCity);
      await publish(
        actualCity.id,
        mood,
        message,
        anonymous ? null : user.user_metadata?.display_name || null,
      );
      setMessage("");
      setNotice("Your feeling is up. It fades in one hour.");
      setPanel("signals");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Couldn’t send your feeling.");
    } finally {
      setBusy(false);
    }
  }
  async function react(id: string) {
    if (id.startsWith("sample-")) return;
    if (busy) return;
    if (!user) {
      setAuthNeeded(true);
      return;
    }
    setBusy(true);
    try {
      await sendReaction(id);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Couldn’t send kindness.");
    } finally {
      setBusy(false);
    }
  }
  async function beginPosting() {
    if (locating) return;
    const request = ++locationRequest.current;
    setLocating(true);
    setQuickOpen(false);
    setPlacingPin(false);
    setNotice("Finding your city…");
    try {
      const found = await detectCity();
      if (request !== locationRequest.current) return;
      chooseCity(found);
      composeArrival.current = true;
      setNotice("");
    } catch (e) {
      if (request === locationRequest.current)
        setNotice(e instanceof Error ? e.message : "Couldn’t find your city.");
    } finally {
      if (request === locationRequest.current) setLocating(false);
    }
  }
  function chooseCity(next: City) {
    setDestination(null);
    setPlacingPin(false);
    composeArrival.current = false;
    signalArrival.current = false;
    setQuickOpen(false);
    setCity(next);
    setSelected(true);
    setAll(false);
    setPanel(null);
    setFocusRequest((v) => v + 1);
  }
  function goHome() {
    locationRequest.current++;
    setLocating(false);
    setDestination(null);
    setPlacingPin(false);
    composeArrival.current = false;
    signalArrival.current = false;
    setQuickOpen(false);
    setSelected(false);
    setPanel(null);
    setHomeRequest((v) => v + 1);
  }
  return (
    <main className="space-home">
      <h1 className="sr-only">Hear Me Out — explore the world</h1>
      <div className="starfield" aria-hidden="true">
        {Array.from({ length: 145 }, (_, i) => (
          <i
            key={i}
            style={{
              left: `${((i * 73.79 + 11) % 100).toFixed(3)}%`,
              top: `${((i * i * 13.17 + 9) % 100).toFixed(3)}%`,
              width: i % 13 === 0 ? 3 : 1.5,
              height: i % 13 === 0 ? 3 : 1.5,
              opacity: 0.18 + (i % 7) * 0.1,
            }}
          />
        ))}
      </div>
      <section className="planet-stage" aria-label="Explore Earth">
        <Globe
          mode={mode}
          stations={stations}
          onStation={tune}
          cameras={cameras}
          onCamera={(next) => { audio.current?.pause(); setRadioPlaying(false); setRadio(null); setCamera(next); }}
          posts={showSamples && mode === "People" ? displayPosts : []}
          placingPin={placingPin}
          pins={pins}
          onPin={placePin}
          onSignal={(post) => {
            const target = cities.find((c) => c.id === post.city);
            if (target) {
              chooseCity(target);
              setActiveId(post.id);
              signalArrival.current = true;
            }
          }}
          city={destination ?? (selected ? city : undefined)}
          focusRequest={focusRequest}
          homeRequest={homeRequest}
          zoom={zoom}
          onCity={chooseCity}
          onOrbit={setOrbit}
          onArrive={() => {
            setTravelling(false);
            if (composeArrival.current) {
              composeArrival.current = false;
              setPanel("compose");
              return;
            }
            if (signalArrival.current) {
              setPanel("detail");
              signalArrival.current = false;
            }
          }}
          onTravel={() => {
            setPanel(null);
            setTravelling(true);
          }}
        />
      </section>
      <OrbitTabs
        mode={mode}
        visibility={orbit}
        onChange={(tab) => {
          setMode(tab);
          setPanel(null);
          setPlacingPin(false);
          setQuickOpen(false);
          setCamera(null);
          if (tab !== "Live") {
            audio.current?.pause();
            setRadioPlaying(false);
            setRadio(null);
          }
        }}
      />
      <div
        id="globe-layer"
        role="tabpanel"
        aria-label={mode}
        className="layer-caption"
        hidden={mode === "People" || orbit < 0.1}
      >
        {mode === "Live"
          ? `${stations.length || "…"} radio · ${cameras.length || "…"} cameras`
          : "World · explore a place"}
      </div>
      {mode === "Live" && (
        <div className="live-legend" aria-label="Live map legend">
          <span><i className="legend-radio" /> Radio</span>
          <span><i className="legend-camera" /> Public camera</span>
        </div>
      )}
      <audio ref={audio} onEnded={() => setRadioPlaying(false)} onError={() => { setRadioPlaying(false); setRadioError("This station isn’t answering right now"); }} />
      {mode === "Live" && radio && (
        <RadioPlayer
          station={radio}
          playing={radioPlaying}
          error={radioError}
          onToggle={toggleRadio}
          onClose={() => { audio.current?.pause(); setRadioPlaying(false); setRadio(null); }}
          onVolume={(volume) => { if (audio.current) audio.current.volume = volume; }}
        />
      )}
      {mode === "Live" && camera && <CameraViewer camera={camera} onClose={() => setCamera(null)} />}
      <div className="world-tools" aria-label="Your world">
        <button
          aria-label={placingPin ? "Close pins" : "Pins"}
          title="Place a pin"
          aria-pressed={placingPin}
          onClick={() => {
            setPlacingPin(!placingPin);
            setPanel(placingPin ? null : "pins");
            setQuickOpen(false);
          }}
        >
          <PushPin size={21} />
        </button>
        <button
          aria-label="Kindness inbox"
          title="Kindness inbox"
          onClick={() => setPanel(panel === "inbox" ? null : "inbox")}
        >
          <Bell size={21} />
        </button>
        <button
          aria-label={user ? "Your account" : "Log in or sign up"}
          title="Account"
          onClick={() => setAuthNeeded(true)}
        >
          <UserCircle size={22} />
        </button>
      </div>
      <div className="orbit-controls" aria-label="Map controls">
        <button
          aria-label="Zoom in"
          title="Zoom in"
          onClick={() => setZoom((v) => v + 1)}
        >
          <Plus />
        </button>
        <button
          aria-label="Zoom out"
          title="Zoom out"
          onClick={() => setZoom((v) => v - 1)}
        >
          <Minus />
        </button>
        <button
          aria-label="Return to Earth"
          title="Return to Earth"
          onClick={goHome}
        >
          <GlobeHemisphereEast size={20} />
        </button>
      </div>
      {selected && !panel && !travelling && orbit < 0.95 && (
        <section className="city-card" aria-label={`${city.name} details`}>
          <div className="city-card-title">
            <div>
              <h2>{city.name}</h2>
              <p>{city.country}</p>
            </div>
            <button
              className="close-button"
              aria-label="Hide city details"
              onClick={() => setSelected(false)}
            >
              <X size={18} />
            </button>
          </div>
          <WeatherPanel key={city.id} city={city} />
          <div className="city-card-actions">
            <button onClick={() => setPanel("signals")}>
              <ChatCircle size={17} />
              Signals
            </button>
            <button className="send-button" onClick={() => void beginPosting()}>
              <Plus size={16} />
              Leave a feeling
            </button>
            <button
              aria-label="About this preview"
              onClick={() => setPanel("about")}
            >
              <Info size={17} />
            </button>
          </div>
        </section>
      )}
      {!panel && !selected && mode === "People" && (
        <div
          className="quick-feeling"
          onKeyDown={(e) => {
            if (e.key === "Escape") setQuickOpen(false);
          }}
        >
          {quickOpen && (
            <div id="quick-moods" className="quick-moods">
              <span>How’s your little world?</span>
              <div>
                {moods.map((m) => (
                  <button
                    key={m.emoji}
                    aria-label={m.label}
                    onClick={() => {
                      setMood(m.emoji);
                      setQuickOpen(false);
                      void beginPosting();
                    }}
                  >
                    {m.emoji}
                  </button>
                ))}
              </div>
              <button
                className="quick-thought"
                onClick={() => {
                  setQuickOpen(false);
                  void beginPosting();
                }}
              >
                Add a little thought <ArrowRight size={16} />
              </button>
            </div>
          )}
          <button
            disabled={locating}
            className="quick-trigger"
            aria-expanded={quickOpen}
            aria-controls="quick-moods"
            onClick={() => setQuickOpen((v) => !v)}
          >
            {quickOpen ? <X size={19} /> : <ChatCircle size={20} />}
            <span>{quickOpen ? "Close" : "Leave a feeling"}</span>
          </button>
        </div>
      )}
      <div className="sample-note">
        <span>
          {showSamples ? "Includes sample feelings" : "Feelings hidden"}
        </span>
        <button
          aria-pressed={showSamples}
          onClick={() => setShowSamples((v) => !v)}
        >
          {showSamples ? "Hide" : "Show feelings"}
        </button>
      </div>
      {authNeeded && (
        <Account user={user} onClose={() => setAuthNeeded(false)} />
      )}
      {placingPin && (
        <div className="pin-hint" role="status">
          Tap the globe to pin a place{" "}
          <button
            onClick={() => {
              setPlacingPin(false);
              setPanel(null);
            }}
          >
            Cancel
          </button>
        </div>
      )}
      {pinError && (
        <div className="pin-hint" role="status">
          {pinError}
        </div>
      )}
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X />
          </button>
        </div>
      )}
      {panel && (
        <aside
          className="space-drawer"
          ref={drawer}
          tabIndex={-1}
          aria-labelledby="drawer-title"
        >
          <div className="drawer-top">
            <h2 id="drawer-title">
              {panel === "compose"
                ? "Leave a feeling"
                : panel === "signals"
                  ? "Little signals"
                  : panel === "pins"
                    ? "Your saved places"
                    : panel === "inbox"
                      ? "A little kindness"
                      : panel === "detail"
                        ? "A little signal"
                        : "About"}
            </h2>
            <button
              className="close-button"
              aria-label="Close panel"
              onClick={() => {
                setPanel(null);
                setPlacingPin(false);
              }}
            >
              <X size={20} />
            </button>
          </div>
          {panel === "compose" && (
            <section className="composer">
              <p className="detected-city">
                <MapPin size={16} /> {city.name}
              </p>
              <p className="fine">
                Your detected city. Exact coordinates stay on your device.
              </p>
              <form onSubmit={post}>
                <fieldset>
                  <legend>Pick a feeling</legend>
                  <div className="moods">
                    {moods.map((m) => (
                      <button
                        type="button"
                        key={m.emoji}
                        aria-label={m.label}
                        aria-pressed={mood === m.emoji}
                        onClick={() => setMood(m.emoji)}
                      >
                        {m.emoji}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <label htmlFor="message">Your message (optional)</label>
                <textarea
                  id="message"
                  rows={3}
                  placeholder="What’s on your mind?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  aria-describedby="message-count"
                  aria-invalid={count > 50}
                />
                <div className="composer-meta">
                  <span>Fades in 1 hour</span>
                  <span
                    id="message-count"
                    className={count > 50 ? "error" : ""}
                  >
                    {count}/50
                  </span>
                </div>
                {user?.user_metadata?.display_name && (
                  <label className="anonymous-choice">
                    <input
                      type="checkbox"
                      checked={anonymous}
                      onChange={(e) => setAnonymous(e.target.checked)}
                    />{" "}
                    Post anonymously
                  </label>
                )}
                <button
                  className="send-button full-width"
                  disabled={busy || count > 50}
                  type="submit"
                >
                  {busy ? "Sending…" : user ? "Send" : "Sign in to send"}
                  <ArrowRight />
                </button>
              </form>
            </section>
          )}
          {panel === "signals" && (
            <section>
              {error && (
                <p role="status">
                  {error} <button onClick={() => void refresh()}>Retry</button>
                </p>
              )}
              <div className="segmented">
                <button aria-pressed={all} onClick={() => setAll(true)}>
                  Everywhere
                </button>
                <button aria-pressed={!all} onClick={() => setAll(false)}>
                  {city.name}
                </button>
              </div>
              {loading ? (
                <p role="status">Finding little signals…</p>
              ) : visible.length ? (
                visible.map((p) => (
                  <article className="signal" key={p.id}>
                    <div className="signal-meta">
                      <span>{p.emoji}</span>
                      <div>
                        {p.displayName || "Anonymous"} ·{" "}
                        {cities.find((c) => c.id === p.city)?.name}
                        <small>
                          {p.sample
                            ? "Sample feeling"
                            : `${Math.max(1, Math.ceil((p.expiresAt - now) / 60000))} min left`}
                        </small>
                      </div>
                    </div>
                    <p>{p.text}</p>
                    <button
                      className="reaction"
                      disabled={busy || p.sample}
                      aria-pressed={p.reacted}
                      onClick={() => react(p.id)}
                    >
                      <Heart weight={p.reacted ? "fill" : "regular"} />
                      {p.reactions || "Send kindness"}
                    </button>
                  </article>
                ))
              ) : (
                <p className="empty">No signals here yet.</p>
              )}
            </section>
          )}
          {panel === "pins" && (
            <SavedPlaces
              pins={pins}
              onSave={savePins}
              onVisit={visitPin}
              onPlace={() => {
                setPlacingPin(true);
              }}
            />
          )}
          {panel === "inbox" && (
            <KindnessInbox user={user} onSignIn={() => setAuthNeeded(true)} />
          )}
          {panel === "detail" &&
            (() => {
              const p = displayPosts.find(
                (p) => p.id === activeId && p.expiresAt > now,
              );
              return p ? (
                <section>
                  <article className="signal signal-detail">
                    <div className="signal-meta">
                      <span>{p.emoji}</span>
                      <div>
                        {p.displayName || "Anonymous"}
                        <small>
                          {city.name} ·{" "}
                          {p.sample
                            ? "Sample feeling"
                            : "Fades in " +
                              Math.max(
                                1,
                                Math.ceil((p.expiresAt - now) / 60000),
                              ) +
                              " min"}
                        </small>
                      </div>
                    </div>
                    <p>
                      {p.text || "A little feeling, shared with the world."}
                    </p>
                    <button
                      className="reaction"
                      aria-pressed={p.reacted}
                      disabled={busy || p.sample}
                      onClick={() => react(p.id)}
                    >
                      <Heart weight={p.reacted ? "fill" : "regular"} />
                      {p.reacted ? "Kindness sent" : "Send kindness"}
                    </button>
                    <p className="fine">
                      {p.reactions} kindness received
                      {p.sample ? " · Preview only" : ""}
                    </p>
                  </article>
                  <WeatherPanel key={city.id} city={city} />
                </section>
              ) : (
                <p className="empty">This feeling has faded.</p>
              );
            })()}
          {panel === "about" && (
            <section className="about-copy">
              <p>
                A big world can feel a little lonely. This is a place to find a
                familiar feeling, leave a small thought, and remind someone
                they’re not alone.
              </p>
              <p>
                Explore a city. Share a mood and up to 50 characters. Send a
                little kindness. Each feeling fades after one hour.
              </p>
              <h3>Your city, your choice</h3>
              <p>
                Location permission is needed to post in your current city.
                Exact coordinates stay on your device. Feelings appear at
                decorative spots around the city. Your email and account ID are
                never shown with your feeling.
              </p>
              <a
                href="https://openfreemap.org/"
                target="_blank"
                rel="noreferrer"
              >
                Map data: OpenStreetMap / OpenFreeMap ↗
              </a>
            </section>
          )}
          {panel === "signals" && (
            <div className="city-weather">
              <h3>The sky in {city.name}</h3>
              <WeatherPanel key={city.id} city={city} />
            </div>
          )}
        </aside>
      )}
    </main>
  );
}
