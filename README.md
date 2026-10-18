# Hear Me Out

Hear Me Out is a cozy, interactive globe where people can share fleeting feelings, discover live radio and public cameras, and feel connected to moments happening around the world. The current prototype combines a globe-first social experience with optional accounts, city-level privacy, saved places, live weather and local time, radio, and public camera streams.

## Run

From this folder:

    npm install
    npm run dev

Open http://localhost:3000.

## Current working prototype

- Immersive MapLibre globe with a cozy starfield, smooth city flights, city-focused labels, saved places, and responsive mobile controls.
- One-hour mood messages with emoji reactions, kindness notifications, optional Supabase accounts, and privacy-preserving city-level placement.
- Live weather, daylight, and local time for selected locations.
- A combined Live layer with worldwide radio stations, scenic public cameras, HLS playback, and optional embeddable YouTube livestream discovery.
- People, Live, and World modes arranged around the globe in a circular navigation system.

## Before a public launch

Review provider licensing before monetization, particularly public camera aggregation and YouTube playback. Add reporting, moderation, account deletion, stronger rate limits, and production email delivery before a public launch.

Copy `.env.example` to `.env.local` and add the Supabase public values. `YOUTUBE_API_KEY` is optional and must remain server-side.

## Checks

    npm run lint
    npm run build

## Data

Land geometry: Natural Earth 1:110m land, public domain, sourced from https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson. Weather: https://open-meteo.com/ . Only selected city centers are sent to the weather provider.

## Verification in the Codex session

TypeScript and ESLint passed. Boundary checks passed for one-hour duration, 50/51 characters, joined emoji and combining marks. The production bundle compiled successfully, but full build completion and the browser preview were blocked by the session's Windows child-process restriction (`spawn EPERM`). The updated map has since been checked in a desktop and mobile-size browser; see DESIGN.md. Run the commands above in a normal local terminal to complete that check. Dependencies were installed without lifecycle scripts because of the same restriction; npm reported zero known vulnerabilities at installation time.



