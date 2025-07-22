import { STRIPE_SECRET_KEY } from '$env/static/private'
import Stripe from 'stripe';

const stripe = new Stripe(STRIPE_SECRET_KEY); 

export async function POST({ request }) {
  try {
    // Extract origin from request URL
    const url = new URL(request.url);
    const origin = url.origin;

    const data = await request.json();

    let session;

    if (data.customerId) {
      session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price: 'price_1QVRRfFjsU4OgRFqQX1WRfpQ', // The Price ID of the product
            quantity: 1,
          },
        ],
        mode: 'subscription',
        customer: data.customerId,
        success_url: `${origin}${data.path}?success=true`,
        cancel_url: `${origin}${data.path}?canceled=true`,
        allow_promotion_codes: true,
        metadata: {
          userId: data.userId,
        },
      });
    } else {
      session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price: 'price_1RLaasFjsU4OgRFqa2T8Y57u', // The Price ID of the product
            quantity: 1,
          },
        ],
        mode: 'subscription',
        customer_email: data.email,
        success_url: `${origin}${data.path}?success=true`,
        cancel_url: `${origin}${data.path}?canceled=true`,
        allow_promotion_codes: true,
        metadata: {
          userId: data.userId,
        },
      });
    }

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
    });
  } catch (err) {
    console.error('Stripe Checkout Session Error:', err);  // Log the actual error for debugging
    return new Response(err.message, {
      status: err.statusCode || 500,
    });
  }
}

