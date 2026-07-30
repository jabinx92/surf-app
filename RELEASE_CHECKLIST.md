# WaveLens one-week App Store sprint

## Before the first cloud build

- [ ] Join the Apple Developer Program and create an App Store Connect app record.
- [x] Set the permanent iOS bundle identifier to `com.johnnywon.wavelens` and initial build number to `1` in `app.json`.
- [x] Link WaveLens to the `jabinx92` Expo account and EAS project (`a1457ce5-680d-4586-b306-b4b23a3f780b`).
- [x] Configure the Supabase URL and publishable key in the EAS development, preview, and production environments.
- [x] Confirm all 13 SQL migrations in `supabase/migrations/` are represented in the live schema and pass the anonymous-access smoke checks.
- [x] Test a signed-in booking request and creator application with separate disposable accounts.
- [x] Deploy the `delete-account` Supabase Edge Function and verify anonymous calls are rejected.
- [x] Verify account deletion with disposable signed-in customer and creator accounts, including booking/profile cleanup and rejected sign-in afterward.
- [ ] Verify all creator records shown to customers are real people who consented to be listed.

## TestFlight acceptance checklist

- [ ] Test sign up, sign in, sign out, and email confirmation on a physical iPhone.
- [ ] Test account deletion from Account and verify the user can no longer sign in.
- [ ] Test both manual surf-spot selection and foreground location permission flows.
- [ ] Submit a request and confirm it appears only in the signed-in customer’s request history.
- [ ] Approve at least one real creator with the SQL in `SUPABASE_SETUP.md`; test that their customer request appears in Creator dashboard and that accept/decline changes the customer's status.
- [ ] Host the built-in `/privacy` page at a public HTTPS URL, then add that Privacy Policy URL and a real Support URL to App Store Connect.
- [ ] Prepare 6.7-inch iPhone screenshots, app subtitle, description, keywords, and support contact.
- [ ] Copy reviewed listing content from `APP_STORE_METADATA.md` into App Store Connect and replace its public URL placeholders.

## Build and submit

```powershell
npx eas-cli@latest build -p ios --profile preview
npx eas-cli@latest build -p ios --profile production
```

Use App Store Connect or `eas submit` only after the production build is reviewed and the listing metadata is complete. Do not submit a service that cannot reliably deliver booking requests to creators.
