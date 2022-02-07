<script>
  import { drawStretched, calculateGeometry } from "./../services/stretch.js";
  export let canvas;
  export let buffer;
  export let video;
  export let vrn;
  import cv from "../services/cv.js";
  import { beforeUpdate } from "svelte";

  /**
   * Returns the image data of a number plate and its coordinates
   * @param imageData
   * @param vrn
   */
  const detectPlate = async (imageData, vrn) => {
    const response = await cv.detectPlate({ imageData, vrn });
    if (response.data.payload != null) {
      return response.data.payload;
    }
    return null;
  };

  const image = new Image();
  image.src = "/images/front-plate.jpg";

  beforeUpdate(() => {
    video.addEventListener("loadeddata", async () => {
      window.scrollTo(0, document.body.scrollHeight);
      const ctxBuffer = buffer.getContext("2d");
      const ctxOutput = canvas.getContext("2d");
      const width = (canvas.width = buffer.width = video.videoWidth);
      const height = (canvas.height = buffer.height = video.videoHeight);

      const draw = async () => {
        // draw the video to the buffer
        ctxBuffer.drawImage(video, 0, 0, width, height);
        // get the image data from the buffer
        const imageData = ctxBuffer.getImageData(0, 0, width, height);
        // send data to the worker thread
        const plate = await detectPlate(imageData, vrn);
        // clear the output canvas
        ctxOutput.clearRect(0, 0, width, height);

        if (plate && plate.points && plate.points.length > 3) {
          // ctxOutput.putImageData(plate.imageData, 0, 0, 0, 0, width, height);
          ctxOutput.drawImage(video, 0, 0, width, height);
          const geometry = calculateGeometry(
            image,
            { x: plate.points[3].x, y: plate.points[3].y },
            { x: plate.points[0].x, y: plate.points[0].y },
            { x: plate.points[1].x, y: plate.points[1].y },
            { x: plate.points[2].x, y: plate.points[2].y }
          );
          drawStretched(ctxOutput, image, geometry, false);
        }

        if (video.paused || video.ended) {
          console.log("video is paused");
          // stop the draw loop
          cancelAnimationFrame(frame);
        } else {
          // schedule the next frame
          frame = requestAnimationFrame(draw);
        }
      };

      // start the animation
      let frame = requestAnimationFrame(draw);
    });
  });
</script>
