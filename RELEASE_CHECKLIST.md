# WaveLens one-week App Store sprint

## Before the first cloud build

- [ ] Join the Apple Developer Program and create an App Store Connect app record.
- [ ] Choose a unique iOS bundle identifier (for example, a reverse-domain identifier you own). Add it under `expo.ios.bundleIdentifier` in `app.json`.
- [ ] Log in to Expo with the account that should own WaveLens, then run `npx eas-cli@latest init`.
- [ ] Run all seven SQL migrations in `supabase/migrations/` and test a signed-in booking request plus a creator application.
- [ ] Deploy the `delete-account` Supabase Edge Function and verify in-app account deletion on a test account.
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
