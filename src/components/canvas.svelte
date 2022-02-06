<script>
  export let canvas;
  export let buffer;
  export let video;

  let demo = false;
</script>

<div>
  <p class="d-inline me-1">Show demo</p>
  <input bind:checked={demo} type="checkbox" class="mt-2 d-inline" />
</div>
<div class="output-container">
  <canvas bind:this={canvas} id="canvasOutput" />
  {#if demo}
    <video
      bind:this={video}
      id="video"
      src="/images/1-480.mov"
      autoplay
      loop
      controls
      muted
    />
  {:else}
    <video bind:this={video} muted />
  {/if}
  <canvas bind:this={buffer} style="display:none" />
</div>

<style>
  video {
    /* visibility: hidden; */
  }
  #canvasOutput {
    position: absolute;
  }

  .output-container {
    position: relative;
    width: 100vw;
    display: flex;
    justify-content: center;
    margin-top: 1rem;
    overflow: hidden;
  }
</style>
