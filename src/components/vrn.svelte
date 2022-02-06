<script>
    export let vrn = '';
    
    const handleChange = (e) => {
        vrn = e.target.value.toUpperCase();
    }
</script>

<div class="container mt-4">
    <div class="row">
        <div class="col-md-6 offset-md-3">
            <div class="card">
                <input maxLength="7" type="text" placeholder="Enter your VRN" class="text-center text-uppercase pt-2 active" value={vrn} on:change={(e) => handleChange(e)}>
            </div>
        </div>
    </div>
</div>

<style>
    .active {
        font-size: larger;
        background:#eed85b;
        font-weight: 600;
        letter-spacing: 0.3rem;
    }
</style>