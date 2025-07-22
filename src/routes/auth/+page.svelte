<script>
  import { currentUser, pb } from '$lib/pocketbase'
  import posthog from 'posthog-js';

  import "$lib/styles/auth.scss";

  import Navbar from '$lib/components/Navbar.svelte';
  import Metatags from '$lib/components/Metatags.svelte';

  import { KeyRound, LogOut } from 'lucide-svelte';
  
  import { goto } from '$app/navigation';
  import { demo_doc } from '$lib/demo_doc.js';

  async function googleAuth() {
    const authData = await pb.collection('users').authWithOAuth2({ provider: 'google' });

    if (authData.record.name) {
      await pb.collection('users').update(authData.record.id, {
        name: authData.meta.rawUser.name,
        avatar: authData.meta.rawUser.picture,
      });
    } else { // Account Setup
      await pb.collection('users').update(authData.record.id, {
        name: authData.meta.rawUser.name,
        avatar: authData.meta.rawUser.picture,
        plan: 'free'
      });
      await pb.collection('feedback').create({
        user: authData.record.id,
        ...demo_doc
      })
    }

    posthog.identify(
      $currentUser.id,
      { email: $currentUser.email, name: $currentUser.name }
    );
    posthog.capture('user_authenticated');

    let upgraded = false;

    if ($currentUser.plan == 'free') {
      try {
        let institution = await pb.collection('institutions').getFirstListItem(`email_match="${getEmailDomain(authData.record.email)}"`);
        if (institution) {
          await pb.collection('users').update($currentUser.id, {
            institution: institution.id,
            plan: 'edu' // Upgrade to EDU
          });

          upgraded = true; // Flag the user as having been upgraded, so that it shows the popup

          // Refresh the current user store
          const userInfo = await pb.collection('users').getOne($currentUser.id, {expand: 'institution'})
          currentUser.set(userInfo)

          goto(`/docs?edu_pro_upgrade=true`) // Redirect to docs page with upgrade flag/indicator
        }
      } catch (err) {
        // Expected to 404 if no institution found, so we can ignore this error
        console.warn("No institution found");
      }
    }

    if (!upgraded) {
      goto(`/docs`) // Redirect to docs page if user was not upgraded
    }
  }
  function getEmailDomain(email) {
    const atIndex = email.indexOf('@');
    if (atIndex === -1 || atIndex === email.length - 1) return null;

    return email.slice(atIndex + 1);
  }

  function logout() {
    pb.authStore.clear();
  }
</script>

<Metatags title="Sign in to Classmate"/>

<Navbar/>

<main class="auth-main">
  <div class="auth-content">
    {#if $currentUser}
      <h1>Thanks for Using Classmate!</h1>
      <button on:click={logout} class="button">
        <LogOut size="16"/>
        Log out
      </button>
      <p>You're signed in as {$currentUser.name}</p>
    {:else}
      <h1>Welcome to Classmate</h1>
      <button on:click={googleAuth} class="button">
        <img src="/logos/google_logo.svg" alt="google" width="16"/>
        Sign in or sign up with Google
      </button>
      <p>Classmate uses Google authentication. To continue, click the sign in/up with Google button.
      <small>By using Classmate, you agree to our <a href="./privacy">Privacy Policy</a> and <a href="./terms">Terms of Use</a>.</small>
      </p>
    {/if}
  </div>
  <aside>
    <img src="/images/mockup.png" alt="laptop mockup of classmate editor"/>
  </aside>
</main>