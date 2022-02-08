<script>
  export let vrn = "";
  export let placement = "front";

  let form;

  $: if (form) {
    form.addEventListener('focusout', e => {
      vrn = e.target.value.toUpperCase();
    })
  }

  const handleSelect = (e) => {
      placement = e.target.value;
  }
</script>

<div class="container mt-4">
  <div class="row">
    <input
      bind:this={form}
      maxLength="7"
      type="text"
      placeholder="Enter your VRN"
      class="text-center text-uppercase pt-2 active"
      value={vrn}
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
