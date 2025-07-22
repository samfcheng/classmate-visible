import { json } from '@sveltejs/kit';
import { STRIPE_SECRET_KEY } from '$env/static/private';
import Stripe from 'stripe';

const stripe = new Stripe(STRIPE_SECRET_KEY);

export async function GET({ url }) {
  const sessionId = url.searchParams.get('session_id');  // Get the session_id from the frontend

  if (!sessionId) {
    return json({ success: false, message: 'No session_id provided' }, { status: 400 });
  }

  try {
    // Fetch the session details from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Check the payment status
    const isPaymentSuccessful = session.payment_status === 'paid';

    // Return the payment status
    return json({ success: isPaymentSuccessful });
  } catch (err) {
    console.error('Error retrieving payment session:', err);
    return json({ success: false, message: 'Error retrieving payment status' }, { status: 500 });
  }
}
