# Supabase marketplace setup

WaveLens stores private customer booking requests and creator applications.

1. Open the WaveLens Supabase project.
2. In **SQL Editor**, run the migration files in this order:
   - `supabase/migrations/202607160001_create_booking_requests.sql`
   - `supabase/migrations/202607160002_create_creator_applications.sql`
   - `supabase/migrations/202607160003_connect_creators_to_bookings.sql`
   - `supabase/migrations/202607160004_secure_booking_contact.sql`
   - `supabase/migrations/202607160005_add_creator_profile_details.sql`
   - `supabase/migrations/202607170006_add_booking_session_hours.sql`
   - `supabase/migrations/202607170007_add_booking_surf_spot.sql`
3. Confirm the three tables appear in the Table Editor.
4. Create a test customer account, submit a booking request, and verify a row is created with `status = pending`.
5. Create a separate test creator account, submit an application, and verify a row is created with `status = pending`.

The row-level security policies intentionally let customers read only their own requests, creators read only their own application, and creators view only requests sent to their own profile. A trusted WaveLens admin must review applications and approve creators before using them in the public directory.

## Approve a real creator

After reviewing a creator application, run this in the SQL Editor, replacing the UUID with that application's `id` from `creator_applications`:

```sql
with application as (
  select * from public.creator_applications
  where id = 'REPLACE-WITH-APPLICATION-UUID'
)
insert into public.creator_profiles (
  owner_id, application_id, display_name, city, services, portfolio_url, starting_rate, bio, travel_miles, is_listed
)
select applicant_id, id, display_name, city, services, portfolio_url, starting_rate, bio, travel_miles, true
from application;

update public.creator_applications
set status = 'approved'
where id = 'REPLACE-WITH-APPLICATION-UUID';
```

That person will immediately appear in WaveLens, can receive bookings, and can accept or decline them from **Creator dashboard**. Only list creators who consented to be displayed and who can reliably respond to customers.

The public Expo environment variables must contain the project's **URL** and **anon/publishable key** only. Do not put a Supabase service-role key in the app.

## Deploy account deletion

WaveLens includes a secure `delete-account` Edge Function for the Account screen. It runs with the signed-in user's JWT and uses Supabase's server-side admin context only inside the function; no service-role key belongs in the app.

After logging in and linking the Supabase CLI to the WaveLens project, deploy it:

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy delete-account
```

Then sign in on a test device, choose **Account** > **Delete account**, and confirm that the account and its booking data are removed. Deploy this function before the App Store build; otherwise the deletion control will correctly show an error instead of deleting data.
