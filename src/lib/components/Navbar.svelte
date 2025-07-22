<script>
  import { currentUser, pb } from '$lib/pocketbase';
  import { page } from '$app/stores';
  import { derived } from 'svelte/store';

  const pathname = derived(page, ($page) => $page.url.pathname);

  let menu_open = false;

  function logout() {
    pb.authStore.clear();
  }
</script>

<nav class="minimal-navbar">
  {#if $currentUser && $pathname !== "/docs"}
    <a class="logo" href="../docs">
      <img src="../logo.svg" alt="classmate logo"/>
    </a>
  {:else}
    <a class="logo" href="../">
      <img src="../logo.svg" alt="classmate logo"/>
    </a>
  {/if}
  <div class="nav-right">
    {#if $currentUser}
      <a href="/auth" class="user-avatar">
        <img src={$currentUser.avatar} alt="User Avatar"/>
      </a>
    {:else}
      <a href="/auth" class="button">Sign in</a>
    {/if}
    <button class={menu_open ? "menu-open-close open" : "menu-open-close closed"} on:click={() => {menu_open = !menu_open}}>
      <span></span>
      <span></span>
      <span></span>
    </button>
  </div>
</nav>

<nav class={menu_open ? "navbar-menu" : "navbar-menu closed"}>
  <div class="menu-top-spacer"></div>
  <div class="menu-links">
    {#if $pathname !== "/"}
      <a href="/">Home</a>
    {/if}

    {#if $currentUser}

      {#if $pathname !== "/docs"}
        <a href="/docs">Your Docs</a>
      {/if}
      {#if $pathname !== "/new"}
        <a href="/new">Get Feedback</a>
      {/if}

      {#if $pathname !== "/pro"}
        {#if $currentUser.plan == "pro"}
          <a href="/pro">Manage Subscription</a>
        {:else if $currentUser.plan == "free"}
          <a href="/pro">Classmate Pro</a>
        {/if}
      {/if}

      <a href="/auth" on:click={logout}>Log Out</a>
    {:else}
      {#if $pathname !== "/auth"}
        <a href="/auth">Sign in</a>
        <a href="/auth">Sign up</a>
      {/if}
    {/if}
  </div>
  <div class="menu-bottom-links">
    <a href="/privacy">Privacy</a>
    <a href="/terms">Terms</a>
    <a href="mailto:hi@classmate.app">Contact</a>
  </div>
</nav>

<button class={menu_open ? "menu-background" : "menu-background closed"} on:click={() => {menu_open = false}}></button>