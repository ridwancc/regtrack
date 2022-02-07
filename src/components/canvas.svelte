<script>
  export let canvas;
  export let buffer;
  export let video;
  export let streaming;
  export let demo = false;
</script>

{#if (streaming == false)}
  <div>
    <p class="d-inline mt-2">Show demo</p>
    <input bind:checked={demo} type="checkbox" class="mt-2 d-inline" />
  </div>
{/if}
<div class="output-container">
  <canvas bind:this={canvas} id="canvasOutput" />
  {#if demo}
    <video
      bind:this={video}
      id="video"
      src="/images/1.mp4"
      autoplay
      loop
      muted
    />
  {:else}
    <video bind:this={video} muted />
  {/if}
  <canvas bind:this={buffer} style="display:none" />
</div>

<style>
  video {
    pointer-events: none;
  }

  video::-webkit-media-controls-start-playback-button {
    display: none;
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
