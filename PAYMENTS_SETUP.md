# WaveLens Stripe payments

The code uses Stripe PaymentSheet and Stripe Connect Express. A surfer pays only after a creator accepts a booking. The server calculates the price from the creator's starting hourly rate and the requested session length. The default WaveLens platform fee is 10%.

## Required Stripe setup

1. Create or open the WaveLens Stripe account and enable Connect with Express accounts.
2. Copy the test-mode publishable key into the local Expo environment:

   ```text
   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

3. Add the same public key to the EAS development, preview, and production environments. Use a test key until the entire payment and refund flow has been verified.
4. Add these Supabase Edge Function secrets:

   ```powershell
   npx supabase secrets set STRIPE_SECRET_KEY=sk_test_...
   npx supabase secrets set STRIPE_PLATFORM_FEE_BPS=1000
   npx supabase secrets set PUBLIC_SITE_URL=https://wavelens.expo.app
   ```

5. Apply `supabase/migrations/202610060025_stripe_marketplace_payments.sql` and deploy:

   ```powershell
   npx supabase db push
   npx supabase functions deploy create-stripe-connect-account
   npx supabase functions deploy create-booking-payment
   npx supabase functions deploy stripe-webhook --no-verify-jwt
   ```

6. In Stripe Workbench, create a webhook endpoint for:

   ```text
   https://khonpdgapfpkirqwixgp.supabase.co/functions/v1/stripe-webhook
   ```

   Subscribe to `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`, and `charge.refunded`. Save its signing secret as `STRIPE_WEBHOOK_SECRET`:

   ```powershell
   npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```

7. Create a new development or TestFlight build. Adding the Stripe native package changes the native app, so an over-the-air update cannot add it to an existing binary.

## Test before using live money

1. Sign in as an approved creator and open **Account → Payouts**.
2. Complete Stripe's test Connect onboarding.
3. Submit a booking as a different user and accept it as the creator.
4. Open the accepted booking as the surfer and pay with Stripe's test card `4242 4242 4242 4242`, any future expiry date, and any CVC.
5. Confirm the webhook changes the booking from `processing` to `paid`.
6. Confirm the destination payment and 10% application fee appear in Stripe.
7. Issue a full test refund in Stripe and confirm the booking becomes `refunded`.

Do not switch to live keys until Connect onboarding, payment failure, successful payment, duplicate taps, cancellation, and refund behavior have all been verified with separate customer and creator accounts.
