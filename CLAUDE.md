@AGENTS.md

# CLAUDE.md — WaveLens UI rules

WaveLens is an Expo (SDK 57) + React Native app that also ships to the web at https://wavelens.expo.app. Supabase is the backend and Stripe handles payments. These rules cover how UI work is done.

## Always do first
- **Invoke the `frontend-design` skill** before writing any UI code, every session, no exceptions.
- Read the Expo 57 docs for any Expo library before using it (see AGENTS.md above).

## Reference images
- If a reference image is provided: match layout, spacing, typography, and color exactly. Use real assets from `assets/` where they exist; otherwise use `PhotoPlaceholder`. Do not improve or add to the design.
- If no reference image: design from scratch with high craft (see guardrails below).
- Screenshot the result, compare against the reference, fix mismatches, re-screenshot. Do at least 2 comparison rounds. Stop only when no visible differences remain or the user says so.

## Local preview
- Run the web build: `npx expo start --web --port 8081` in the background. Do **not** set `CI=1`; it turns off reloading, so edits won't show.
- If the server is already running on 8081, don't start a second one.
- Open `http://localhost:8081` in the built-in browser and check every changed screen at **phone (390×844)** and **wide (≥ 1000 px)**.

## Screenshots and checking
- Be specific when comparing: "heading is 34 px but the reference shows ~24 px", "card gap is 16 but should be 24".
- Check spacing, font size/weight/line height, colors (exact hex), alignment, corner radius, and image cropping.
- Browser screenshots can lag behind the page and can't capture playing video. Confirm with `get_page_text`, or measure in the page with JavaScript (element sizes, what part of a video or photo is visible).
- Pages opened directly by URL (for example `/creators?spot=…`) may not load data. Navigate through the app instead.

## Design system (use it, don't bypass it)
- **Navy is the only look.** All colors, corner radii, and heading styles come from `lib/app-theme.tsx` via `useAppTheme()` / `useThemedStyles()`. Never hard-code hex values in redesigned screens.
- Shared pieces live in `components/ui/`: `TopBar`, `AppButton`, `PhotoPlaceholder`, `HeroVideo`, `useFocusCrop`. Reuse them before writing new ones.
- Icons: `IconSymbol` (SF Symbols on iOS, Material Icons elsewhere). Add new names to the mapping in `components/ui/icon-symbol.tsx`.
- Brand assets: the logo is `assets/images/wavelens-icon.png`. Don't invent new brand colors; the accent is teal `#56d6c9`.

## Anti-generic guardrails
- **No AI-template tells:** no blurry glow circles, no pill "eyebrow" labels, no small ALL-CAPS tracked labels, no fake letter logos ("W" badges), no numbered "01 / 02 / 03" cards, no typed arrows like `->`. Use real icons and plain, sentence-case headings.
- **One accent color.** Teal is for the main action on a screen. Don't put two solid teal buttons side by side; make the second one `variant="secondary"`.
- **Real imagery over decoration.** WaveLens sells surf photos, so use photos and clips, not shapes.
- **Animation:** only animate `transform` and `opacity` (Reanimated). Respect reduced motion; `FeedbackPressable` and `HeroVideo` already do.
- **Interactive states:** every tappable element gives press feedback (and hover on web) and is at least 44 pt tall. Use `FeedbackPressable` or `AppButton`.
- **Depth:** surfaces layer `background` → `surface` → `surfaceAlt`. Don't put everything on the same plane.
- **Copy:** professional and plain. Say "photographer" or "videographer", not "shooter" or "get shot".

## Photos and video
- Only use media we have the rights to: our creators' work (with permission) or free-for-commercial-use stock like Pexels. Never use copyrighted music, YouTube rips, or another brand's look.
- Log every stock file in `assets/CREDITS.md`.
- Clips: 720p, no audio, about 8–12 seconds, under ~4 MB. Shrink with ffmpeg (`-an -vf scale=-2:720 -c:v libx264 -crf 27 -movflags +faststart`).
- Set a focus point in `constants/media.ts` for every hero photo and clip, and confirm the surfer stays in frame at phone (4:3) and wide (4:5) crops.

## Before committing
- `npx tsc --noEmit` and `npx expo lint` must both pass.

## Shipping
- **Web:** `npx expo export --platform web`, then `npx eas-cli@latest deploy --prod`.
- **Database:** add a new file in `supabase/migrations/`, check `npx supabase@latest migration list --linked`, then `npx supabase@latest db push --linked`, run from the project folder.
- **iPhone:** `npx eas-cli@latest build -p ios --profile production --auto-submit`. Adding a native package (like `expo-video`) needs a new build; a web deploy doesn't update the app.

## Hard rules
- Don't add sections, features, or content that weren't asked for or aren't in the reference.
- Don't "improve" a reference design. Match it.
- Don't stop after one screenshot pass.
- Don't hard-code colors in redesigned screens. Use the theme.
