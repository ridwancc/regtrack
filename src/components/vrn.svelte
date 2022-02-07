<script>
  export let vrn = "";
  export let placement = "front";

  const handleSelect = (e) => {
      placement = e.target.value;
  }

  const handleChange = (e) => {
    vrn = e.target.value.toUpperCase();
  };
</script>

<div class="container mt-4">
  <div class="row">
    <input
      maxLength="7"
      type="text"
      placeholder="Enter your VRN"
      class="text-center text-uppercase pt-2 active"
      value={vrn}
      on:change={e => handleChange(e)}
    />
    <div class="placement-row mt-2">
      <label>
        Front:
        <input type="radio" group={placement} name="placement" value="front" on:change={e => handleSelect(e)} checked/>
      </label>
      <label>
        Back:
        <input type="radio" group={placement} name="placement" value="back" on:change={e => handleSelect(e)} />
      </label>
    </div>
  </div>
</div>

<style>
  .active {
    font-size: larger;
    background: #eed85b;
    font-weight: 600;
    letter-spacing: 0.3rem;
  }
</style>
