"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";
export type Signal = {
  sample?: boolean;
  displayName?: string | null;
  id: string;
  city: string;
  emoji: string;
  text: string;
  expiresAt: number;
  reactions: number;
  reacted: boolean;
};
export function useSignals() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const revision = useRef(0);
  const refresh = useCallback(async () => {
    const version = ++revision.current;
    const db = getSupabase();
    if (!db) {
      setLoading(false);
      setError("Shared signals are being connected. Please try again shortly.");
      return;
    }
    try {
      const [{ data, error: readError }, counts, mine] = await Promise.all([
        db
          .from("signals")
          .select("id,city_id,mood,body,expires_at,display_name")
          .order("created_at", { ascending: false })
          .limit(200),
        db.rpc("reaction_counts"),
        user
          ? db.rpc("my_reactions")
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (readError || counts.error || mine.error)
        throw new Error("Couldn’t load signals. Please retry.");
      if (version !== revision.current) return;
      const totals = new Map<string, number>(
        (counts.data ?? []).map((r: { signal_id: string; total: number }) => [
          r.signal_id,
          Number(r.total),
        ]),
      );
      const reacted = new Set(
        (mine.data ?? []).map((r: { signal_id: string }) => r.signal_id),
      );
      setPosts(
        (data ?? []).map((r) => ({
          id: r.id,
          displayName: r.display_name,
          city: r.city_id,
          emoji: r.mood,
          text: r.body,
          expiresAt: Date.parse(r.expires_at),
          reactions: totals.get(r.id) ?? 0,
          reacted: reacted.has(r.id),
        })),
      );
      setError("");
    } catch (e) {
      if (version === revision.current)
        setError(e instanceof Error ? e.message : "Couldn’t load signals.");
    } finally {
      if (version === revision.current) setLoading(false);
    }
  }, [user]);
  useEffect(() => {
    const db = getSupabase();
    if (!db) return;
    const {
      data: { subscription },
    } = db.auth.onAuthStateChange((_event, session) =>
      setUser(session?.user ?? null),
    );
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    const initial = setTimeout(() => void refresh(), 0);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 10000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
      // Invalidate the latest request, including requests started after this effect.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      revision.current++;
    };
  }, [refresh]);
  async function publish(
    city: string,
    mood: string,
    body: string,
    displayName: string | null,
  ) {
    const db = getSupabase();
    if (!db || !user) throw new Error("Sign in to send a feeling.");
    const { error } = await db
      .from("signals")
      .insert({
        city_id: city,
        mood,
        body: body.trim(),
        display_name: displayName?.trim().slice(0, 30) || null,
      });
    if (error) throw new Error("Couldn’t send your feeling. Please try again.");
    await refresh();
  }
  async function react(id: string) {
    const db = getSupabase();
    if (!db || !user) throw new Error("Sign in to send kindness.");
    const post = posts.find((p) => p.id === id);
    if (!post || post.expiresAt <= Date.now())
      throw new Error("This feeling has faded.");
    const result = post.reacted
      ? await db.from("reactions").delete().eq("signal_id", id)
      : await db.from("reactions").insert({ signal_id: id });
    if (result.error && result.error.code !== "23505")
      throw new Error("Couldn’t update your reaction. Please retry.");
    await refresh();
  }
  return { user, posts, loading, error, refresh, publish, react };
}
