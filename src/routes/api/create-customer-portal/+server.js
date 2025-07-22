import { STRIPE_SECRET_KEY } from '$env/static/private'
import Stripe from 'stripe';

const stripe = new Stripe(STRIPE_SECRET_KEY); 

export async function POST({ request }) {
  const url = new URL(request.url);
  const origin = url.origin;

  const data = await request.json();

  const session = await stripe.billingPortal.sessions.create({
    customer: data.customerId,
    return_url: `${origin}${data.path}`
  });

  return new Response(JSON.stringify({ url: session.url }), {
    status: 200,
  });
}