<script>
  import { currentUser, pb } from '$lib/pocketbase'
  import { onMount } from 'svelte';

  let loaded = false;

  onMount(async () => {
    loaded = true;
  });
</script>

{#if !$currentUser && loaded}
  <div class="auth">
    <h1>Sign in to continue</h1>
    <a href="auth" class="button">Sign in -></a>
  </div>
{/if}
