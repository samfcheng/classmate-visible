<script>
  import { currentUser, pb } from '$lib/pocketbase';
  import { onMount } from 'svelte';
  
  import Navbar from '$lib/components/Navbar.svelte';
  import Metatags from '$lib/components/Metatags.svelte';
  import posthog from 'posthog-js';

  import { Sparkle, Mail } from 'lucide-svelte';

  import '$lib/styles/pro.scss';

  onMount(async () => {
    // Update user info

    const userInfo = await pb.collection('users').getOne($currentUser.id)
    currentUser.set(userInfo)

    if ($currentUser) {
      posthog.capture('user_viewed_pro_page');
    }
  });

  // Method to handle the form submission
  async function handleCheckout() {
    const currentPath = window.location.pathname;
    
    // Create the checkout session by sending a POST request to the backend
    const response = await fetch('/api/checkout_sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: $currentUser.email,
        path: currentPath,
        userId: $currentUser.id,
        customerId: $currentUser.stripe_customer_id
      })
    });
    
    if (response.ok) {
      const { url } = await response.json();
      // Redirect user to Stripe Checkout page
      window.location.href = url;
    } else {
      console.error('Failed to create checkout session');
    }
  }

  async function handlePortal() {
    const currentPath = window.location.pathname;
    
    // Create the checkout session by sending a POST request to the backend
    const response = await fetch('/api/create-customer-portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: $currentUser.email,
        path: currentPath,
        customerId: $currentUser.stripe_customer_id,
        userId: $currentUser.id
      })
    });
    
    if (response.ok) {
      const { url } = await response.json();

      posthog.capture('user_opened_payment_portal');

      // Redirect user to Stripe Checkout page
      window.location.href = url;
    } else {
      console.error('Failed to create checkout session');
    }
  }
</script>

<Metatags title="Classmate Pro" description="Upgrade to Classmate Pro, and get unlimited essay reviews, plus more, for only $5.99/mo"/>

<Navbar/>

<main class="pro-main">
  {#if $currentUser?.plan == 'free' || !$currentUser}
    <div class="pro-info">
      <h1>Upgrade to Pro for More</h1>
      <div class="pro-plans">
        <div class="plans-wrapper">
          <div class="plan-card">
            <div class="plan-content">
              <h2>Classmate Free</h2>
              <p class="plan-info">Everything that you need to get started with Classmate</p>
              <ul class="plan-features">
                <li>Unlimited basic writing reviews (~3 pages of writing)</li>
                <li>General & line-by-line writing feedback</li>
                <li>Built-in editor</li>
              </ul>
            </div>
            <a class="button button-secondary" href={$currentUser ? "/feedback" : "/auth"}>Get started for free -></a>
          </div>
          <div class="plan-card">
            <div class="plan-content">
              <h2>Classmate Pro</h2>
              <p class="plan-info">Upgrade to pro for unlimited access and more</p>
              <ul class="plan-features">
                <li>Extended character limits (~10+ pages of writing)</li>
                <li>Early access to new features</li>
                <li>Priority support</li>
                <li>Support Classmate's development</li>
              </ul>
            </div>
            {#if $currentUser}
              <button class="button" on:click={handleCheckout}><Sparkle size="16"/> Upgrade for $8/mo</button>
            {:else}
              <a href="/auth" class="button">Log in to upgrade for $8/mo -></a>
            {/if}
          </div>
          <div class="plan-card">
            <div class="plan-content">
              <h2>Classmate Institutional</h2>
              <p class="plan-info">Get Classmate for your school or institution at a discounted rate</p>
              <ul class="plan-features">
                <li>Everything in Classmate Pro</li>
                <li>10-1000+ users</li>
                <li>Credit-based or unlimited</li>
              </ul>
            </div>
            <a class="button button-secondary" href="mailto:sales@classmate.app"><Mail size="16"/> Contact Sales</a>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="has-pro">
      <h2>You're using Classmate Pro</h2>
      <p>Thank you for supporting Classmate. If you have any questions or need support, email support@classmate.app</p>
      <button on:click={handlePortal} class="button">Manage subscription</button>
    </div>
  {/if}
</main>