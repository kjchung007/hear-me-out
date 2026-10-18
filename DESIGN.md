# Hear Me Out — current design

## Experience

The full viewport is the globe/map canvas. No headline, marketing sections, permanent feed, welcome card or dock. A small city-picker icon provides a keyboard alternative to dots. Zoom and return-to-Earth controls sit at the edge. A compact city card appears only after selection; composer and signals open on request.

## Map and motion

MapLibre GL JS 5 renders a continuous globe-to-street map with OpenFreeMap/OpenStreetMap vectors. Warm ivory signals, sage land, muted blue water and simple warm building extrusions. Only city/town labels remain. No country, neighborhood or street-name labels.

City selection first faces that city from orbit, then descends to neighborhood scale at a gentle angle. Gestures interrupt camera travel. Manual zoom is eased; reduced-motion preferences are respected. Markers use nearest-hit selection when their touch targets overlap. Full viewport sizing removes the old inner-canvas clipping frame.

## Mobile

Globe is a directly imported client component rather than a separate Next dynamic-loading placeholder. Initial Earth size adapts to viewport dimensions. Pixel ratio is capped at 1.5, viewport height has a 100vh fallback, and map load has a visible timeout/retry state. City controls remain compact and panels become bottom sheets.

## Location privacy

No browser geolocation API is called. Every post uses a selected city ID. Coordinates in the static city list are public shared map anchors, not user/device coordinates. Detailed map navigation does not change post placement to a street or building.

## Verification

Browser checked at 390x844 and desktop 1280x720: globe loads, map fills viewport, dot selection opens city details, camera descends to map detail, weather loads. TypeScript and ESLint pass. This is viewport testing, not a physical iOS/Android device test. Supabase connection remains deferred by the user.

## Globe speech bubbles
Live signals render as cream speech bubbles with small tails. At orbital zoom, one bubble per city summarizes additional feelings; close zoom reveals more scattered signals, with overlap suppression. Decorative positions are stable hashes of post IDs around public city anchors (roughly 200–800m), never device coordinates. Only city IDs are stored. Expandable bottom action opens mood choices, then city selection and an optional message. No automatic location permission request.


Orbit navigation update: globe minimum/home zoom fits 84vw or 72dvh, whichever is smaller. A fine warm circular track carries People, Live, World tabs and fades according to proximity to minimum zoom. People shows feelings; World offers the uncluttered map; Live is explicitly a phase-2 placeholder. Bubble navigation first centers at unchanged zoom, then descends; both stages remain interruptible. A single Pins control toggles the saved-place drawer and placement cursor together.
`nCircular navigation refinement: a filled annular container replaces the thin orbital line. Active tab is white with near-black text; inactive labels sit directly on the band. The band fades within the first 0.18 zoom levels above home, before the enlarging globe reaches tab labels. Mobile home zoom leaves room for the band.


Curved tab refinement: translucent annular SVG band, curved text paths, and one inset white arc that rotates between the three positions in 480ms. Reduced motion removes that transition. Mobile ring spans 118vw and shares the globe center at 58dvh; the larger Earth is no longer reduced to fit the whole ring. Offscreen portions of the ring are intentional.
