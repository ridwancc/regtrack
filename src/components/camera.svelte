<script>
  export let camera;
  export let video;

  let streaming = false;
  let devices = [];

  const setStreaming = (value) => {
    streaming = value;
  };

  const getDevices = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      console.log("enumerateDevices() not supported.");
    }
    try {
      const device = await navigator.mediaDevices.enumerateDevices();
      device.forEach((camera) => {
        if (camera.kind === "videoinput") {
          devices.push(camera);
        }
      });
    } catch (err) {
      console.log("failed to enumerate cameras");
    }
    return;
  };

  const stopStream = (stream) => {
    stream.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
    setStreaming(false);
  };

  const selectCamera = async () => {
    try {
      const stream = video.srcObject;
      if (stream) {
        stopStream(stream);
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: {
            exact: camera.value,
          },
        },
      });
      video.srcObject = newStream;
      video.play();
      setStreaming(true);
    } catch (err) {
      setStreaming(false);
      console.log("failed to select camera");
    }
  };

  let promise = getDevices();
</script>

<div class="container">
  <div class="row">
    <select
      bind:this={camera}
      class="select-css d-flex mx-auto mt-4 text-center text-capitalize"
      on:change={() => selectCamera()}
    >
      {#if !streaming}
        {#await promise}
          <option value="none">Loading available cameras</option>
        {:then promise}
          <option value="none">Select a camera</option>
          {#each devices as device}
            <option value={device.deviceId}>{device.label}</option>
          {/each}
        {/await}
      {:else}
        <option value="none">Select a camera</option>
        <option value="none">Stop</option>
      {/if}
    </select>
  </div>
</div>

<style>
  select {
    text-align-last: center;
    text-align: center;
  }

  option {
    text-align: center;
    text-align-last: center;
  }
</style>
