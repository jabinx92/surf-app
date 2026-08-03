# Review reminder setup

The app reminder works from booking data immediately. To turn on the once-only email reminder:

1. Verify a sending domain with Resend.
2. Add these Supabase Edge Function secrets: `RESEND_API_KEY`, `REVIEW_REMINDER_FROM_EMAIL`, `REVIEW_REMINDER_CRON_SECRET`, and `PUBLIC_APP_URL`.
3. Deploy `send-review-reminders` without JWT verification; the function requires the private `x-cron-secret` header instead.
4. Schedule an hourly request with Supabase Cron and include that header.

The function only selects completed bookings older than 24 hours, skips bookings that already have a review, and records each delivery so it sends only once.
