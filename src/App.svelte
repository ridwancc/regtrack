<script>
  import cv from "./services/cv.js";
  import Vrn from "./components/vrn.svelte";
  import Camera from "./components/camera.svelte";
  import ImageProcessing from "./components/imageProcessing.svelte";
  import Canvas from "./components/canvas.svelte";
  import Spinner from "./components/spinner.svelte";

  let canvas;
  let buffer;
  let video;
  let vrn;

  const init = async () => {
    await cv.load();
    cv.loadClassifier();
  };

  let promise = init();
</script>

<main>
  <div class="text-center mt-4 d-flex align-items-center flex-column">
    <h1 class="text">RegTrack</h1>
    <p>
      This is a Svelte project that utilises the MediaStream API, Web Workers API, and OpenCV, to detect and track vehicle number plates in a video stream.
    </p>
    <!-- <Vrn bind:vrn /> -->
    {#await promise}
      <Spinner />
    {:then promise}
      <Camera {video} />
      <Canvas bind:canvas bind:buffer bind:video />
      {#if canvas}
        <ImageProcessing {canvas} {buffer} {video} {vrn} />
      {/if}
    {/await}
  </div>
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    margin: 0 auto;
  }

  h1 {
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 400;
    color: steelblue;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
