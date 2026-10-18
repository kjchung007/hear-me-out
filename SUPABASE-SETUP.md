# Supabase connection

Project: Hear Me Out (`oqmijnhayvsngogperhl`), Tokyo.

The app uses @supabase/supabase-js 2.116.0 and a browser-safe publishable key in .env.local. No service-role key is used.

Implemented:
- Public browsing of the latest 200 live signals, refreshed every 10 seconds while visible.
- Email magic-link sign-in; an account is required to post and react.
- City ID only; no GPS or personal coordinates.
- Optional message, maximum 50 Unicode code points, enforced in the browser and database.
- Database-controlled creation and one-hour expiry. Expired signals are excluded by RLS and hidden by the UI.
- Heart reactions, one per account per signal; users can undo their own reaction.
- Public column grants exclude owner_id on both tables. A private, authenticated lookup returns only your own reacted signal IDs.

Schema snapshot: supabase/schema.sql. Applied via the signed-in Supabase dashboard because this task's connector returns Unknown tool. Do not rerun the schema against an initialized database.

Verified: API public reads succeed; guest writes and owner-column reads are denied. Transactional database tests covered authenticated posting, reacting, undo, expiry and private ownership, then rolled back all test data. TypeScript and lint checks run separately.

Auth Site URL: http://localhost:3000. Network redirect: http://192.168.0.148:3000/.
Email delivery and clicking a real sign-in link still require a user test. Supabase's default email service is for testing and may restrict recipients; configure custom SMTP before inviting the public.

Pending: automatic permanent deletion of expired records was blocked by automatic approval review. One-hour visibility expiry is active, but database rows are retained until cleanup is approved and configured. Proposed cleanup: once per minute, delete only signals with expires_at <= now(); related reactions cascade.

Bubble UI verification: temporary local fixtures confirmed anchored orbital bubbles and seven non-overlapping decorative Kuching placements at close zoom. Fixtures were not inserted into Supabase and the temporary route was removed. Mobile quick action and composer were inspected at 390px. Real email delivery remains untested by the agent.

Supabase Security Advisor was inspected after setup: zero errors, zero warnings. Scheduled physical deletion remains unapplied; supabase/cleanup-proposal.sql contains the exact proposal for approval.

## September 9 preview update
- Eleven illustrative speech bubbles are now shown by default, marked Sample feelings with a Hide action. They are local fixtures, never Supabase records; their reactions are disabled.
- Posting now requests browser geolocation only after a mood/post action. Coordinates resolve on-device to a supported city and are neither transmitted nor stored. The globe flies to the shared city anchor before showing the composer. Manual city selection remains for exploration only.
- Coverage: the nine current city anchors, within 35km and with reported accuracy <=20km. Unsupported/poor matches produce an error rather than silently choosing a distant city. Broader city coverage remains future work.
- Geolocation requires a secure browser context: localhost works on the host computer; phone/LAN posting requires HTTPS. The HTTP network preview still supports browsing.
- Default Supabase SMTP confirmed in dashboard. Its email quota blocks reliable sign-up testing; user elected to defer custom SMTP and continue previewing. UI now explains rate limiting and delays resend for 60 seconds; this does not raise the provider quota.


## September 9: accounts, saved places and kindness
Email/password sign-up and login now use a dedicated native dialog. Confirm email is disabled in the project for this preview. Site URL is http://192.168.0.148:3000 with both LAN and localhost root URLs allowlisted. This avoids email-link redirects for password login. Existing magic-link accounts do not automatically acquire a password.

Posting uses the currently viewed supported city; no device-location permission is requested. The previous detection was limited to nine city anchors and failed outside their matching radius; insecure LAN HTTP also cannot use browser geolocation. This preview still supports nine cities, rather than worldwide automatic city lookup. Saved places use localStorage on each browser/origin and have editable labels; they are not synced between devices/accounts.

The persistent Show/Hide control affects all globe speech bubbles. Samples remain labeled and cannot receive real kindness. Clicking a bubble opens that specific feeling with its public display-name snapshot (or Anonymous), message, kindness and local weather/time. Signed-in authors with a display name can choose anonymous posting. Names are self-chosen, not verified identities.

Apply schema.sql followed by social-update.sql on a fresh database. social-update.sql is applied on the existing project. The authenticated kindness_inbox RPC only returns reactions from other users to the caller's unexpired signals, without exposing sender or recipient account IDs. It polls every ten seconds while the inbox is visible. Notifications currently last for the signal's active hour; no push notifications or read/unread history. Existing public one-hour expiry remains unchanged; permanent cleanup is still unapplied.


Latest interaction update: bubble navigation uses direct easing, never an automatic zoom-out arc. Distant targets keep current zoom; nearby ones move closer. Clocks show hours/minutes. Country labels at zoom <5 switch to cities/towns at >=5.
Pins can be placed at a clicked/tapped globe point and renamed. They persist in localStorage v2 (v1 city pins migrate). Manually chosen pin coordinates are rounded to .001 degree for server-side Nominatim city/country naming; they are not device geolocation. Lookup is cached and rate-limited for this single-server local preview; configure PLACE_LOOKUP_URL for another provider before scaling to multiple servers. Attribution is shown on the map.
Posting now requires fresh browser geolocation at composer entry and again at submission, and uses the detected supported city regardless of the viewed city/pin. Raw GPS remains on-device. Nine-city coverage and HTTPS requirement still apply. This is a normal-client location restriction, not tamper-proof proof of physical presence: browser GPS can be spoofed, and existing authenticated database insert grants still accept supported city IDs.
Display-name posting is now the default; anonymous posting is opt-in. Old anonymous signals remain anonymous.
