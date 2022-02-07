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
  let placement;

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
    <p>
      Enter anything you like in the box below and select a placement on the vehicle to visualise a personalised registration.
    </p>
    <Vrn bind:vrn bind:placement/>
    {#await promise}
      <Spinner />
    {:then promise}
      <Camera {video} />
      <Canvas bind:canvas bind:buffer bind:video />
      {#if canvas}
        <ImageProcessing {canvas} {buffer} {video} {vrn} {placement} />
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
