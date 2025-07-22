<script>
	import { page } from '$app/stores';
    import { ArrowLeft } from 'lucide-svelte';
</script>

<main class="error-page">
  <div class="note" style={`--rotation: ${Math.random() > 0.5 ? 1 + Math.random() * 2 : -1 + Math.random() * -2}deg`}>
    <h1>{$page.status}</h1>
    <p>
      {$page.error?.message}
      <a href="../../">
        <ArrowLeft size="16"/>
        Back to Home
      </a>
    </p>
  </div>
</main>