<template>
  <b-button
    variant="link"
    @click="this.cb"
  >
    Reset to default
  </b-button>
</template>

<script>
export default {
  name: "ResetDefaults",
  props: {
    cb: { type: Function, required: true },
  },
}
</script>
