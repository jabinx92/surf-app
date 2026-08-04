# Morning booking push setup

Deploy this function with JWT verification disabled, set a strong `BOOKING_PUSH_CRON_SECRET`, and schedule it hourly with Supabase Cron. The scheduled request must include that value in the `x-cron-secret` header. The function sends only at 7 AM in each device's saved timezone and records each delivery to prevent duplicates.
