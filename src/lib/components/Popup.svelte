<script>
  export let visible = false;

  let className = "";
  export { className as class };
</script>

<div class={visible ? "popup-component" : "popup-component hidden"}>
  <div class={`popup-component-content ${className}`}>
    <slot></slot>
  </div>
  <button class="popup-component-background" on:click={() => {visible = false}}></button>
</div>