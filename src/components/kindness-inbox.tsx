"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Heart } from "@phosphor-icons/react";
import { getSupabase } from "@/lib/supabase";
type Item = {
  signal_id: string;
  body: string;
  mood: string;
  total: number;
  received_at: string;
};
export default function KindnessInbox({
  user,
  onSignIn,
}: {
  user: User | null;
  onSignIn: () => void;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!user) return;
    let active = true;
    async function load() {
      const db = getSupabase();
      if (!db) return;
      const result = await db.rpc("kindness_inbox");
      if (!active) return;
      if (result.error) setError("Couldn’t check your kindness. Please retry.");
      else {
        setItems(result.data || []);
        setError("");
      }
      setLoading(false);
    }
    void load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 10000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [user, retry]);
  if (!user)
    return (
      <section className="inbox-empty">
        <Heart size={32} />
        <p>A little kindness, just for you.</p>
        <button className="send-button full-width" onClick={onSignIn}>
          Log in to see your kindness
        </button>
      </section>
    );
  return (
    <section>
      {error ? (
        <p role="status">
          {error}
          <button onClick={() => setRetry((v) => v + 1)}>Retry</button>
        </p>
      ) : loading ? (
        <p role="status">Checking for kindness…</p>
      ) : items.length ? (
        items.map((item) => (
          <article className="signal" key={item.signal_id}>
            <div className="signal-meta">
              <Heart weight="fill" />
              <div>
                {item.total}{" "}
                {Number(item.total) === 1 ? "person sent" : "people sent"}{" "}
                kindness
                <small>
                  {new Date(item.received_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </small>
              </div>
            </div>
            <p>
              {item.mood} {item.body}
            </p>
          </article>
        ))
      ) : (
        <div className="inbox-empty">
          <Heart size={32} />
          <p>No kindness yet. Your next little feeling could reach someone.</p>
        </div>
      )}
      <p className="fine">
        Kindness for your active feelings. Refreshes automatically.
      </p>
    </section>
  );
}
