import Stripe from 'stripe'
const globalForStripe = global as unknown as { stripe: Stripe }
export const stripe = globalForStripe.stripe || new Stripe(
  process.env.STRIPE_SECRET_KEY!,
  {
    apiVersion: '2023-10-16',
    typescript: true,
  }
)
if (process.env.NODE_ENV !== 'production') globalForStripe.stripe = stripe
