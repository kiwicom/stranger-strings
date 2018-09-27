<template>
  <div class="statusWrapper">
    <span class="statusText">{{ statusText }}</span>
  </div>
</template>

<script type="text/javascript">
export default {
  props: {
    statusText: {
      type: String,
      required: true,
    },
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .statusWrapper {
    position: fixed;
    z-index: 1000;
    top: 50%;
    margin-top: 40px;
    width: 100%;
    display: flex;
    justify-content: center;
    align-content: center;
  }
  .statusText {
    margin-right: 10px;
  }
</style>
