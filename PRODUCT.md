# Hear Me Out

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated by the user: Next.js App Router + TypeScript. One application serves the marketing website and interactive world. MapLibre renders the globe and continuous city map.

## Users

People who feel lonely and want a small moment of connection around the world.

## Product Purpose

Explore city-level moods and share a brief feeling without the pressure of a permanent feed.

## Capabilities and Constraints

V1: playful 3D globe, moods, 50-character messages, emoji reactions, city selection, live weather/daylight, one-hour expiry. Browsing requires no account. Interactions require an optional account; public identity can remain anonymous. Exact location is never collected. No private messages, study rooms, radio, webcams or music integration in V1.

## Brand Commitments

Hear Me Out. Cozy, globe-first space experience with warm stars and a smooth Earth. No pixel aesthetic or dashboard layout. Warm and welcoming language.

## Evidence on Hand

Empty project at start. No real users or activity data. Any demo content must be marked.

## Open Decisions

Production authentication, database provider, moderation and hosting are not connected. The first build is a local prototype, not a public social network.



## Connected backend update
Supabase project oqmijnhayvsngogperhl now supplies live signals, email sign-in, and heart reactions. Accounts are private; no demo identity or seeded example signals. Posts use chosen city IDs and expire from public access after one hour. Permanent cleanup awaits approval. See SUPABASE-SETUP.md for verification and email-delivery limitations.

## Latest location and preview decision
Posting detects a nearby supported city using consented browser geolocation, processes coordinates only on-device, flies to the public city anchor, then opens the composer. Exact coordinates are not saved or sent to Supabase. Manual city search remains exploration-only. Eleven clearly labeled sample feelings temporarily illustrate the globe; they do not represent users and cannot receive reactions. Custom SMTP is deferred by the user.


## September 9: accounts, saved places and kindness
Email/password sign-up and login now use a dedicated native dialog. Confirm email is disabled in the project for this preview. Site URL is http://192.168.0.148:3000 with both LAN and localhost root URLs allowlisted. This avoids email-link redirects for password login. Existing magic-link accounts do not automatically acquire a password.

Posting uses the currently viewed supported city; no device-location permission is requested. The previous detection was limited to nine city anchors and failed outside their matching radius; insecure LAN HTTP also cannot use browser geolocation. This preview still supports nine cities, rather than worldwide automatic city lookup. Saved places use localStorage on each browser/origin and have editable labels; they are not synced between devices/accounts.

The persistent Show/Hide control affects all globe speech bubbles. Samples remain labeled and cannot receive real kindness. Clicking a bubble opens that specific feeling with its public display-name snapshot (or Anonymous), message, kindness and local weather/time. Signed-in authors with a display name can choose anonymous posting. Names are self-chosen, not verified identities.

Apply schema.sql followed by social-update.sql on a fresh database. social-update.sql is applied on the existing project. The authenticated kindness_inbox RPC only returns reactions from other users to the caller's unexpired signals, without exposing sender or recipient account IDs. It polls every ten seconds while the inbox is visible. Notifications currently last for the signal's active hour; no push notifications or read/unread history. Existing public one-hour expiry remains unchanged; permanent cleanup is still unapplied.


Latest interaction update: bubble navigation uses direct easing, never an automatic zoom-out arc. Distant targets keep current zoom; nearby ones move closer. Clocks show hours/minutes. Country labels at zoom <5 switch to cities/towns at >=5.
Pins can be placed at a clicked/tapped globe point and renamed. They persist in localStorage v2 (v1 city pins migrate). Manually chosen pin coordinates are rounded to .001 degree for server-side Nominatim city/country naming; they are not device geolocation. Lookup is cached and rate-limited for this single-server local preview; configure PLACE_LOOKUP_URL for another provider before scaling to multiple servers. Attribution is shown on the map.
Posting now requires fresh browser geolocation at composer entry and again at submission, and uses the detected supported city regardless of the viewed city/pin. Raw GPS remains on-device. Nine-city coverage and HTTPS requirement still apply. This is a normal-client location restriction, not tamper-proof proof of physical presence: browser GPS can be spoofed, and existing authenticated database insert grants still accept supported city IDs.
Display-name posting is now the default; anonymous posting is opt-in. Old anonymous signals remain anonymous.


Orbit navigation update: globe minimum/home zoom fits 84vw or 72dvh, whichever is smaller. A fine warm circular track carries People, Live, World tabs and fades according to proximity to minimum zoom. People shows feelings; World offers the uncluttered map; Live is explicitly a phase-2 placeholder. Bubble navigation first centers at unchanged zoom, then descends; both stages remain interruptible. A single Pins control toggles the saved-place drawer and placement cursor together.
