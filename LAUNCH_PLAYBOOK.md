# WaveLens launch playbook

## Current release state

- App Store version 1.0: with Apple for review.
- TestFlight build 11: installed and verified on a physical iPhone.
- Privacy: https://wavelens.expo.app/privacy
- Support: https://wavelens.expo.app/support
- Goal: complete the first real, paid surf-media session before expanding the feature set.

Do not withdraw or replace version 1.0 during review unless Apple reports a blocking issue. Build 11 is the candidate for the first follow-up release.

## First-launch targets

1. Recruit 3-5 consented creators who agree to respond within 12 hours.
2. Invite 10 surfers near the creators' supported breaks.
3. Help at least three surfers submit a booking request.
4. Get one creator to accept and complete a paid session.
5. Interview both sides and record the main friction point.

Downloads alone are not the success metric. A completed session is.

## Creator readiness checklist

- Explicit consent to the public profile and portfolio links.
- Accurate photo, location, services, rate, travel range, and portfolio.
- Current availability and preferred surf spots.
- Successful Creator dashboard test request.
- Agreement to respond within 12 hours, even when declining.
- Understanding that WaveLens does not process payment in version 1.0.

## Creator outreach message

> Hey! I just launched WaveLens, an app that helps surfers find and request local photo, video, and drone coverage. I am inviting a small first group of creators near Bay Area breaks. There is no platform fee in version 1.0, and you control whether you accept each request. Would you be open to a short walkthrough and explicitly consenting to a public creator profile?

Do not list anyone who has not clearly agreed.

## Surfer invitation

> I am testing WaveLens, a new app for booking surf photographers and videographers near local breaks. Would you try finding a creator and submitting a real or practice request? I will personally help if anything is confusing. TestFlight link: [ADD TEST LINK]

Replace the bracketed link before sending.

## Launch announcement

> WaveLens is launching soon. Find local surf photographers and videographers, review their work, and request coverage for your next session. We are starting small around Bay Area breaks so every early booking gets personal support. Learn more: https://wavelens.expo.app

## First-booking support procedure

1. Confirm the request reached the correct creator.
2. If there is no response within 12 hours, contact the creator once.
3. Help both sides clarify the time, meeting point, deliverables, turnaround, and payment.
4. Never handle payment credentials or promise a creator's availability.
5. After delivery, confirm the gallery or delivery link works.
6. Ask both participants what was confusing and record one concrete improvement.

## Support templates

### Request still pending

> Your request is still pending, which means the creator has not accepted or declined it yet. I am checking that they received it. Please do not send payment until you and the creator agree on the session details.

### Creator unavailable

> That creator cannot take this session. I can help you try another listed creator near the same break. No payment was processed by WaveLens.

### Technical problem

> Please send the screen name, what you tapped, what you expected, what happened instead, your iPhone model, and a screenshot if possible. Do not include your password or payment information.

## Issue priorities

- P0: account exposure, unauthorized booking access, broken deletion, or a security/payment claim. Stop promotion and investigate.
- P1: sign-in, booking submission, Accept/Decline, or an App Review flow is broken. Prepare a focused patch.
- P2: layout, copy, keyboard, or non-blocking navigation issue. Record it for the next verified build.
- P3: feature idea. Do not build it until real users demonstrate the need.

## Outreach tracker

Keep personal contact details outside Git. Track only consent and operational status here or in a private tool.

| Person | Role | Break/area | Consented | Test completed | Responds within 12h | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Creator |  |  |  |  |  |
| 2 | Creator |  |  |  |  |  |
| 3 | Creator |  |  |  |  |  |

## Apple-review responses

- Approved: release version 1.0 according to the selected release option, monitor support, and keep build 11 ready as the follow-up.
- Metadata rejected: correct only the requested listing field; do not rebuild unless required.
- Binary rejected: reproduce the review steps, fix only the blocker, verify on TestFlight, and submit a higher build number.
- Payment question: WaveLens does not process payments; customers and creators arrange them independently after acceptance.
- Creator question: public creators are reviewed, real, and consented to being listed.
