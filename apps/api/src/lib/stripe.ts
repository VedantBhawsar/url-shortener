import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '../config/constant';

// Singleton Stripe client.
// TypeScript API version is locked to the SDK version for type safety.
export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2026-03-25.dahlia',
  typescript: true,
});
