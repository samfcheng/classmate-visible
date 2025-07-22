<script>
  import { onMount } from "svelte";

  export let visible = false;
  export let text = "Tooltip Text";
  export let offset = 0;
  export let max_width = "8.5rem";

  let className = "";
  export { className as class };

  let height = 52;
  let tooltip_element;

  onMount(() => {
    height = tooltip_element.offsetHeight;
  })
</script>

<div role="tooltip" tabindex="1" class={`tooltip-wrapper ${className}`} on:mouseenter={() => visible = true} on:mouseleave={() => visible = false} on:focusin={() => visible = true} on:focusout={() => visible = false}>
  <slot></slot>
  <div class={visible ? "tooltip" : "tooltip hidden"} style={`--height: ${height + offset}px; max-width: ${max_width}`} bind:this={tooltip_element}>
    {text}
  </div>
</div>