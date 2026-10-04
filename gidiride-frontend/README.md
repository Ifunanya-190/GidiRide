# GidiRide Frontend — Phase 1

React + TypeScript frontend for the GidiRide ride-hailing platform.

## Built in this phase

- GidiRide splash screen using the supplied logo.
- Role-based route namespaces: `/admin/*`, `/driver/*`, `/rider/*`.
- Auth context with JWT storage.
- Protected routes that block role mixing.
- Admin layout with handcrafted dark Lagos/control-room styling.
- Admin dashboard stats cards and activity panel.
- Manage Riders table with search + ban/unban.
- Manage Drivers table with search + KYC/vehicle columns + ban/unban.
- Axios API client with JWT interceptor.
- Vite dev proxy from `/api` to Spring Boot `http://localhost:8080`.
- Local workshop fallback data if the backend is not reachable.

## Run

```bash
cd gidiride-frontend
npm install
npm run dev
```

## Backend connection

By default the browser calls `/api`, and Vite proxies it to `http://localhost:8080`.

If your backend is elsewhere:

```bash
VITE_BACKEND_TARGET=http://localhost:8081 npm run dev
```

Or for deployed builds:

```bash
VITE_API_BASE_URL=https://your-api.com/api npm run build
```

## Demo fallback login

If Spring Boot is not running, the app falls back to local workshop data so the UI can still be reviewed:

- Admin: `admin@gidiride.ng`
- Password: `GidiRide@123`

Set `VITE_DISABLE_DEMO_FALLBACK=true` if you want hard backend-only behavior.

## Phase 2 added

- Driver app shell with its own sidebar and protected `/driver/*` namespace.
- Driver dashboard with KYC-aware online/offline toggle.
- Driver KYC profile page with license, NIN, car paper upload fields and vehicle details.
- Driver ride request page with accept/decline cards.
- Driver earnings dashboard with wallet, trip payout table, and withdrawal-ready structure.
- Admin KYC Review screen at `/admin/kyc` for approving/rejecting driver documents.

Extra demo driver login when backend is not running:

- Approved driver: `kunle@gidiride.ng` / `password123`
- Pending driver: `blessing@gidiride.ng` / `password123`

## Phase 3 added

- Rider app shell with protected `/rider/*` namespace.
- Rider home with booking entry points and Lagos map-style preview.
- Book Ride flow at `/rider/book` with pickup/dropoff, quick Lagos locations, ride type, payment method, female driver preference, fare estimate, and ride request.
- Stylised Lagos map placeholder component ready to swap for Google Maps later.
- Live Tracking screen at `/rider/tracking` with driver details, ETA, route, SOS/share-trip flags, and mock ride status progression.
- Ride History screen at `/rider/history` with receipt-ready trip table.
- Rider Profile screen at `/rider/profile` with emergency contacts, default payment, female driver preference, auto-share, and live audio safety placeholder.

Extra demo rider logins when backend is not running:

- `ada@gidiride.ng` / `password123`
- `musa@gidiride.ng` / `password123`

## Phase 4 added

- Frontend matching queue shared between rider requests and driver request cards.
- Rider booking now creates a live `MATCHING` ride instead of instantly pretending it is done.
- Driver Ride Requests polls the live queue and can accept/decline rider-created requests.
- Driver acceptance updates the rider's active trip and removes it from the matching queue.
- Rider Live Tracking now uses a reusable mock realtime hook (`useRideRealtime`) that behaves like a STOMP/WebSocket feed until the Spring Boot WebSocket endpoint is connected.
- Ride event feed for matching, driver accepted, driver arriving, and status changes.
- Mock realtime status flow: `MATCHING → MATCHED → DRIVER_ARRIVING → IN_PROGRESS → COMPLETED`.
- Driver Active Trip page at `/driver/trip` with route map, navigation-ready panel, status controls, and Google Maps hook placeholder.
- Shared realtime storage layer at `src/api/realtimeStore.ts` for queue, event feed, and cross-role ride updates.

## Phase 5 added

- Payment/wallet type system at `src/types/payment.ts`.
- Payment API layer at `src/api/payments.ts` with backend-ready Paystack, wallet, pricing, and withdrawal endpoints.
- Admin Pricing Rules screen at `/admin/pricing` replacing the placeholder.
- Pricing controls for Bike, Economy, Premium: base fare, per-km, service fee, surge multiplier, fuel adjustment, enabled/disabled.
- Lagos hot-zone multipliers for Lekki Phase 1, Victoria Island, and Airport.
- Rider fare estimates now read admin pricing settings from the shared pricing store.
- Rider Wallet page at `/rider/wallet` with wallet balance, Paystack-ready top-up, and transaction ledger.
- Rider Payments page at `/rider/payments` with saved wallet/card methods and mock Paystack card token entry.
- Driver Earnings upgraded with payout/withdrawal request form and withdrawal queue.

## Tailwind added before Phase 6

- Tailwind CSS is now installed and configured with `tailwind.config.js` and `postcss.config.js`.
- Existing GidiRide handcrafted CSS remains so earlier screens do not break.
- New Phase 6 screens/components use Tailwind utilities alongside the GidiRide design tokens.
- Tailwind theme includes GidiRide colors: `gidi.ink`, `gidi.asphalt`, `gidi.road`, `gidi.chalk`, `gidi.yellow`, `gidi.green`, `gidi.red`.

## Phase 6 added

- Support/review type system at `src/types/support.ts`.
- Support API layer at `src/api/support.ts` for reviews, receipts, disputes, SOS alerts, and admin resolution.
- Rider Live Tracking now has a real SOS action that creates an admin-visible SOS alert and ride event.
- Rider Ride History now supports receipt preview/download, driver rating/review, and dispute creation.
- Admin Disputes page at `/admin/disputes` now replaces the placeholder with live dispute and SOS queues.
- Admin can resolve disputes and SOS alerts with resolution notes.
- Driver Ride History page at `/driver/history` added for completed trip/payout history.

## Phase 7 added

- Lagos feature type system at `src/types/lagos.ts`.
- Lagos feature API layer at `src/api/lagosFeatures.ts`.
- Rider Bid Fare + Barter page at `/rider/bid-fare`.
- Driver Fare Bids page at `/driver/bids`.
- Rider can accept a driver bid.
- Female Driver Only is included in bid fare and normal booking flows.
- Fuel Split page at `/rider/fuel-split` to split mid-day fuel price increases 50/50.
- Tip Jar + Skill Badge support added to Rider Ride History.
- Driver Badges page at `/driver/badges` showing tip totals and badge counts.
- New Phase 7 pages were built with Tailwind utility classes plus existing GidiRide design tokens.

## Styling migration note

- Phases 1-5 were originally built with the custom CSS design system requested in the first prompt.
- Tailwind was added before Phase 6 and is now the styling direction going forward.
- A future cleanup pass should migrate legacy custom classes into Tailwind/utilities without changing the UI.

## Phase 8 added

- Phase 8 type system at `src/types/phase8.ts`.
- Phase 8 API layer at `src/api/phase8.ts`.
- Scheduled Group Ride / Danfo Mode at `/rider/group-rides`.
- Ride Now, Pay Later at `/rider/pay-later` with credit limit, score, salary-day activation, and Pay Later ledger.
- Verified Destination QR at `/rider/verified-destination` with simulated rider/driver QR-code confirmation.
- Share Trip + Live Audio at `/rider/share-trip` with 3 contacts, live audio toggle, safe words, and keyword alert simulation.
- New Phase 8 pages continue using Tailwind utilities with GidiRide theme colors.

## Phase 9 added

- Analytics type system at `src/types/analytics.ts`.
- Analytics/referral/notification API layer at `src/api/analytics.ts`.
- Admin Analytics page at `/admin/analytics` replacing the placeholder.
- Admin analytics includes KPI cards, revenue trend, ride volume, peak hours, payment mix, feature usage, and Lagos demand heat map.
- PWA service worker at `public/sw.js` with app shell caching and push notification handler.
- Service worker registration at `src/pwa.ts`, imported in `src/main.tsx`.
- Rider and Driver Notification Settings pages at `/rider/notifications` and `/driver/notifications`.
- Rider and Driver Referral pages at `/rider/referrals` and `/driver/referrals`.
- Referral codes, invite history, reward-ready balances, and role-specific invites.
- Phase 9 screens use Tailwind utility classes and GidiRide Tailwind theme colors.

## Cross-phase consistency note

All phases share the same route tree, auth context, API client, local mock store, role guards, logo asset, and GidiRide color tokens. New features reuse the same ride, user, wallet, support, and safety data instead of creating separate apps.

## Tailwind migration pass after Phase 9

- Phase 10 was intentionally paused because deployment/PWA polish is less urgent than making the existing product consistent.
- `src/index.css` has been migrated from mostly raw custom CSS into Tailwind layers: `@layer base`, `@layer components`, and `@layer utilities`.
- Existing class names remain so components do not break, but the styling now uses Tailwind `@apply` and the GidiRide Tailwind theme tokens.
- Limited raw CSS remains only where Tailwind is not the right tool: generated map graphics, pseudo-elements, animations, gradients, transforms, and keyframes.
- Build was verified after migration.

## Professional polish pass after user review

- Hid backend/demo fallback banner by default so the app no longer reminds users that backend is offline. Use `VITE_SHOW_DEMO_BANNER=true` only when debugging.
- Added tab-isolated sessions using `sessionStorage` first, so Admin/Rider/Driver can be tested in separate tabs without one role overwriting another on refresh.
- Added password show/hide controls on Login and Register.
- Added an in-app toast notification system that listens to GidiRide app events and ride events.
- Generated and wired a transparent-logo asset: `public/gidiride-logo-transparent.png`.
- Upgraded the splash screen with a premium loading card, orbit, and progress animation.
- Reduced oversized typography and improved sidebar scrolling to reduce overlap on dense Rider/Driver/Admin navigation.
- Kept the GidiRide black/yellow/green identity aligned across pages.

## UX polish pass after first visual review

- Removed visible demo/backend-warning text by default.
- Added tab-isolated sessions so Admin/Rider/Driver tabs stop overwriting one another on refresh.
- Added password show/hide.
- Added global toast notifications.
- Added command palette with Ctrl/Cmd + K.
- Added modern profile dropdowns.
- Added notification center.
- Added mobile bottom nav for Rider and Driver.
- Added premium skeleton loaders.
- Added empty-state illustration treatment.
- Improved the splash with transparent logo, orbit animation, and loading progress.
- Added transparent logo asset.
- Reduced oversized typography.
- Improved sidebar scrolling and spacing rhythm.
- Improved the Lagos map placeholder with grid, labels, extra roads, and a route info card.
- Added production env examples and backend endpoint integration checklist.

## Icon polish pass

- Added an internal SVG icon system at `src/shared/components/Icon.tsx` so the app does not depend on an external icon CDN/package.
- Added icons to Admin sidebar navigation.
- Added icons to Rider and Driver sidebar navigation.
- Added icons to mobile bottom navigation.
- Added icons to dashboard stat cards.
- Added icons to profile dropdown, notification trigger, command palette, and password visibility controls.
- Kept icon style aligned with GidiRide: thin-line, clean, yellow/green accents, not too flashy.

## Layout correction pass after screenshot review

- Removed visible `Ctrl K` buttons from topbars to keep the UI professional. Keyboard command palette can still exist silently.
- Hid sidebar marketing/helper text cards such as "SOS ready" because they were adding clutter.
- Fixed role notification scoping so Rider/Driver/Admin do not all show the same global notification count.
- Disabled fake auto-matching to Kunle; rider-created requests now stay in matching until an actual logged-in driver accepts from `/driver/requests`.
- Tightened app shell widths and overflow handling to reduce horizontal scroll/overlap.
- Reduced more oversized text across Rider/Admin/Driver pages.
- Converted checkbox controls into modern switch-style toggles.
- Fixed status pills stretching vertically inside cards.
- Reduced oversized headings in Phase 7/8 cards that caused cramped layouts.

## Professional copy + safety matching correction

- Removed unprofessional auth-page copy such as phase labels, backend/demo notes, planned destination, and route namespace text.
- Login page now uses clean customer-facing GidiRide copy only.
- Driver registration now asks for driver gender so Female Driver Only matching can work correctly.
- Mock matching now filters Female Driver Only requests so only female drivers see/accept those rides.
- The old fake auto-match to Kunle is disabled; a logged-in driver must accept the request.
- Cleaned visible page copy that mentioned backend/workshop implementation details.
- SOS currently creates in-app/admin safety alerts; real emergency delivery needs backend SMS/push/audio services.
#   G i d i R i d e  
 