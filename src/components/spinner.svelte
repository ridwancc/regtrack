<script>
    let content = '';

    const typewriter = (str) => {
        let count = 0;

        // every second add a letter to the content variable reset once it reaches the end of the string
        setInterval(() => {
            content += str[count];
            count++;
            if (count === str.length +1) {
                content = '';
                count = 0;
            }
        }, 500);
    };

    typewriter('...');

</script>

  <svg class="spinner" viewBox="0 0 50 50">
      <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
  </svg>
  <p class="desc">Loading{content}</p>

<style>

.desc {
    margin-top: 1rem;
    font-size: 0.8rem;
    font-weight: 400;
    color: steelblue;
    width: 30px;
    display: flex;
    margin-right: 20px;
}
.spinner {
  animation: rotate 2s linear infinite;
  z-index: 2;
  margin-top: 1.5rem;
  width: 50px;
  height: 50px;
}
.spinner .path {
  stroke: #93bfec;
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}
@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}
@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

</style>