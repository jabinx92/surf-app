import { StripeProvider as NativeStripeProvider } from "@stripe/stripe-react-native";
import type { ReactNode } from "react";

export function StripeProvider({ children }: { children: ReactNode }) {
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) return children;
  return <NativeStripeProvider publishableKey={publishableKey}><>{children}</></NativeStripeProvider>;
}

