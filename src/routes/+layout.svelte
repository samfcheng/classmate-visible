<script>
  import '$lib/styles/global.scss';
  import { dev } from '$app/environment';
  import { inject } from '@vercel/analytics';
  
  inject({ mode: dev ? 'development' : 'production' });

  import posthog from 'posthog-js'
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';

  onMount(() => {
    if (browser) {
      posthog.init(
        'phc_',
        { 
          api_host: 'https://us.i.posthog.com',
          person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
        }
      )
    }
    return
  });
</script>

<slot></slot>