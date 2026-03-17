declare module 'stripe' {
  interface StripeConstructor {
    new (apiKey: string): any;
  }
  const Stripe: StripeConstructor;
  export default Stripe;
}
