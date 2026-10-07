# WaveLens App Store privacy answers

Use this worksheet when completing **App Store Connect → App Privacy** for the WaveLens payment release. It reflects the Stripe integration prepared on October 6, 2026. Recheck it whenever data collection or third-party SDKs change.

## Opening question

**Do you or your third-party partners collect data from this app?** Yes.

For every data type below:

- Purpose: **App Functionality**
- Linked to the user's identity: **Yes**
- Used for tracking: **No**

## Data types to select

| Apple category | Data type | Why WaveLens collects it |
| --- | --- | --- |
| Contact Info | Email Address | Account registration, authentication, and support |
| Contact Info | Name | Creator display names and profiles |
| Contact Info | Phone Number | May be supplied by a customer in booking contact details |
| Contact Info | Other User Contact Info | A customer may provide another contact method in a booking request |
| User Content | Emails or Text Messages | Messages exchanged between booking participants |
| User Content | Photos or Videos | Creator delivery media associated with a booking |
| User Content | Other User Content | Booking notes, creator biographies, portfolio links, delivery notes, editing notes, reviews, and safety reports |
| Identifiers | User ID | Supabase account IDs connect users to their bookings, profiles, messages, and media |
| Financial Info | Payment Info | Stripe collects payment and payout details on WaveLens's behalf for payment processing and fraud prevention; WaveLens does not store full card or bank details |
| Purchases | Purchase History | Booking amount, payment status, and Stripe transaction identifiers support bookings, refunds, customer support, and accounting |

## Do not select for the current version

- **Precise Location / Coarse Location:** Foreground coordinates are used on the device to sort a bundled list of surf spots. The coordinates are not sent to WaveLens or stored in Supabase.
- **Device ID:** WaveLens does not use an advertising or device identifier.
- **Usage Data / Diagnostics:** No analytics, advertising, crash-reporting, or performance-monitoring SDK is currently integrated.
- **Tracking:** WaveLens does not combine app data with third-party data for advertising, share it with data brokers, or serve targeted ads.

## URLs

- Privacy Policy URL: `https://wavelens.expo.app/privacy`
- User Privacy Choices URL: `https://wavelens.expo.app/privacy` (optional; the page explains account deletion and contact options)
- Support URL: `https://wavelens.expo.app/support`

## Before publishing the answers

- Confirm the submitted build contains Stripe and still has no newly added analytics, advertising, or crash-reporting SDKs.
- If users can attach audio in a later version, add **Audio Data**.
- If WaveLens begins sending device coordinates to a server, add the applicable location type.
- If a support form is added inside the app, review whether **Customer Support** must also be selected.
