<script>
  import { onMount } from "svelte";

  export let visible = true;
  export let text = "Tooltip Text";
  export let wrapper = true;
  export let x_offset = "0px";
  export let y_offset = "0px";
  export let indicator_position = "50%";

  let className = "";
  export { className as class };

  let height = 52;
  let tooltip_element;

  onMount(() => {
    height = tooltip_element.offsetHeight;
  })
</script>

{#if wrapper}
  <div class={`tooltip-wrapper ${className}`}>
    <slot></slot>
    <div class={visible ? "tooltip" : "tooltip hidden"} style={`--height: ${height}px; transform: translateY(${y_offset}) translateX(calc(-50% + ${x_offset}));`} bind:this={tooltip_element}>
      {text}
    </div>
  </div>
{:else}
  <div class={`tooltip tooltip-floating ${visible ? "" : "hidden"} ${className}`} style={`--indicator-position: ${indicator_position}; --height: ${height}px; transform: translateY(${y_offset}) translateX(calc(-50% + ${x_offset}));`} bind:this={tooltip_element}>
    {text}
  </div>
{/if}