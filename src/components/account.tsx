"use client";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { X } from "@phosphor-icons/react";
import { getSupabase } from "@/lib/supabase";
export default function Account({
  user,
  onClose,
}: {
  user: User | null;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  useEffect(() => {
    const el = dialog.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setStatus("");
    try {
      const db = getSupabase();
      if (!db) throw Error("Sign-in is unavailable. Please retry.");
      const result = signup
        ? await db.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: { display_name: name.trim().slice(0, 30) },
              emailRedirectTo: window.location.origin + "/",
            },
          })
        : await db.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error) throw result.error;
      if (result.data.session) onClose();
      else
        setStatus(
          "This account still needs email confirmation. Check your inbox or try signing in if you already have an account.",
        );
    } catch (e) {
      setStatus(
        e instanceof Error ? e.message : "Couldn’t sign in. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    setBusy(true);
    const result = await getSupabase()?.auth.signOut();
    setBusy(false);
    if (result?.error) setStatus(result.error.message);
    else onClose();
  }
  return (
    <dialog
      ref={dialog}
      className="auth-modal"
      aria-labelledby="auth-title"
      onCancel={onClose}
      onKeyDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="drawer-top">
        <h2 id="auth-title">
          {user
            ? "Your little account"
            : signup
              ? "Make yourself at home"
              : "Welcome back"}
        </h2>
        <button
          className="close-button"
          aria-label="Close account"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      <div className="account">
        {user ? (
          <>
            <p>{user.user_metadata?.display_name || "Anonymous"}</p>
            <p className="fine">Your email stays private.</p>
            <button
              className="send-button full-width"
              disabled={busy}
              onClick={signOut}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <div className="segmented">
              <button
                aria-pressed={!signup}
                onClick={() => {
                  setSignup(false);
                  setStatus("");
                }}
              >
                Log in
              </button>
              <button
                aria-pressed={signup}
                onClick={() => {
                  setSignup(true);
                  setStatus("");
                }}
              >
                Sign up
              </button>
            </div>
            <form onSubmit={submit}>
              {signup && (
                <>
                  <label htmlFor="account-name">Display name (optional)</label>
                  <input
                    id="account-name"
                    autoComplete="nickname"
                    maxLength={30}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Anonymous"
                  />
                </>
              )}
              <label htmlFor="account-email">Email</label>
              <input
                id="account-email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label htmlFor="account-password">Password</label>
              <input
                id="account-password"
                type="password"
                autoComplete={signup ? "new-password" : "current-password"}
                required
                minLength={signup ? 8 : 1}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {signup && (
                <p className="fine">
                  At least 8 characters. You can post anonymously.
                </p>
              )}
              <button className="send-button full-width" disabled={busy}>
                {busy ? "One moment…" : signup ? "Create account" : "Log in"}
              </button>
            </form>
          </>
        )}
        {status && <p role="status">{status}</p>}
      </div>
    </dialog>
  );
}
