# WaveLens one-week App Store sprint

## Phase 3: launch polish

- [x] Add password recovery screens and strong-password guidance.
- [x] Add profile photos, fallback avatar colors, and photo removal.
- [x] Apply and verify the avatar-color migration in the live Supabase project.
- [x] Add public privacy, support, and social-preview pages.
- [x] Prepare correctly sized iPhone and iPad App Store screenshots.
- [x] Configure the App Store Connect app ID for production submission.
- [x] Make lint, TypeScript, Expo Doctor, Supabase smoke checks, and static web export pass.
- [x] Complete a password-reset email from a real inbox on the TestFlight build (Phase 4 device test).

Phase 3 is code-complete. The final password-reset link check requires the Phase 4 TestFlight build because it must prove that an email link opens the installed iPhone app.

## Before the first cloud build

- [x] Join the Apple Developer Program and create the `WaveLens Surf` App Store Connect record (`6797146342`).
- [x] Set the permanent iOS bundle identifier to `com.johnnywon.wavelens` and initial build number to `1` in `app.json`.
- [x] Link WaveLens to the `jabinx92` Expo account and EAS project (`a1457ce5-680d-4586-b306-b4b23a3f780b`).
- [x] Configure the Supabase URL and publishable key in the EAS development, preview, and production environments.
- [x] Confirm all 13 SQL migrations in `supabase/migrations/` are represented in the live schema and pass the anonymous-access smoke checks.
- [x] Test a signed-in booking request and creator application with separate disposable accounts.
- [x] Deploy the `delete-account` Supabase Edge Function and verify anonymous calls are rejected.
- [x] Verify account deletion with disposable signed-in customer and creator accounts, including booking/profile cleanup and rejected sign-in afterward.
- [x] Verify all creator records shown to customers are real people who consented to be listed.

## TestFlight acceptance checklist

- [x] Test sign up, sign in, sign out, and email confirmation on a physical iPhone.
- [x] Test account deletion from Account and verify the user can no longer sign in.
- [x] Test both manual surf-spot selection and foreground location permission flows.
- [x] Submit a request and confirm it appears only in the signed-in customer’s request history.
- [x] Approve at least one real creator with the SQL in `SUPABASE_SETUP.md`; test that their customer request appears in Creator dashboard and that accept/decline changes the customer's status.
- [x] Host `/privacy` and `/support` at public HTTPS URLs and add them to App Store Connect (both verified HTTP 200 on August 8, 2026).
- [x] Prepare 6.7-inch iPhone screenshots, app subtitle, description, keywords, and support contact for the submitted version 1.0.
- [x] Copy reviewed listing content from `APP_STORE_METADATA.md` into App Store Connect and replace its public URL placeholders.

## Phase 4.5: launch readiness

- [x] Preserve the build 11 code and document its TestFlight release notes.
- [x] Reconcile TestFlight acceptance and App Store listing status with this checklist.
- [x] Prepare tester instructions, launch announcements, creator outreach, and first-booking support procedures.
- [x] Verify build 11 on a physical iPhone.
- [ ] Recruit 3-5 consented creators who can reliably respond to requests.
- [ ] Invite the first 10 surfers and personally support their first booking attempts.
- [ ] Record the first completed, paid session and the user's feedback.

## Build and submit

```powershell
npx eas-cli@latest build -p ios --profile preview
npx eas-cli@latest build -p ios --profile production
```

Version 1.0 is currently with Apple. Build 11 is the verified follow-up TestFlight build. Do not replace or withdraw the submitted version while review is pending unless Apple identifies a blocking issue.
