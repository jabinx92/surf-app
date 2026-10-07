# WaveLens

WaveLens is a mobile-first marketplace for surfers to find local photographers, videographers, and drone creators for a chosen surf break.

## What the launch version does

- Lets a surfer select a Bay Area surf spot or use foreground location to sort nearby breaks
- Shows approved creator profiles with portfolio, services, travel range, and hourly rate
- Sends a booking request with surf spot, date, session length, notes, and contact details
- Lets customers track request status and creators accept or decline requests
- Lets prospective creators submit a profile for review

WaveLens uses Stripe PaymentSheet and Stripe Connect for accepted-session payments. Creators connect a payout account before accepting paid bookings, and WaveLens records payment state from signed Stripe webhooks.

## Run locally

```powershell
npm install
npx expo start
```

For the web preview:

```powershell
npx expo start --web --port 8081
```

## Backend setup

Create a Supabase project, then supply only its client-safe URL and anon/publishable key as `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY` in `.env.local`.

Run the migrations in order and approve real creators using [SUPABASE_SETUP.md](SUPABASE_SETUP.md). Do not put a Supabase service-role key in the app.

## Release

The exact App Store preparation steps are in [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md), and the listing copy is in [APP_STORE_METADATA.md](APP_STORE_METADATA.md).
