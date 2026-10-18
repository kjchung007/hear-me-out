# Hear Me Out

**[Explore the live demo](https://hear-me-out-inky.vercel.app/)**

Hear Me Out is a cozy, interactive globe where people can share fleeting feelings, discover live radio and public cameras, and feel connected to moments happening around the world. The current prototype combines a globe-first social experience with optional accounts, city-level privacy, saved places, live weather and local time, radio, and public camera streams.

## Built with

Next.js, React, TypeScript, MapLibre GL, Supabase and HLS.js.

## Run locally

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

## Demo status

This is an experimental personal project. The live demo includes sample feelings; it is not a fully moderated public social platform. Availability of external radio stations and livestreams can vary.
