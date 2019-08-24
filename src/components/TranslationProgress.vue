<template>
    <b-progress :max="getMaximumTranslations" show-value>
        <b-progress-bar
          variant="success"
          :value="translated.length"
        />
        <b-progress-bar
          variant="warning"
          :value="getMaximumTranslations - translated.length - importantLoc.length"
        />
        <b-progress-bar
          variant="danger"
          :value="importantLoc.length"
        />
    </b-progress>
</template>
<script>
export default {
  name: "TranslationProgress",
  props: {
    getMaximumTranslations: { type: Number, required: true },
    importantLoc: { type: Array, required: true },
    translated: { type: Array, required: true },
  },
}
</script>
<style scoped>
  .bg-success {
    background-color: #42B3D5 !important
  }
  .bg-warning {
    background-color: #FFB508 !important;
  }
  .bg-danger {
    background-color: #D5011B !important;
  }
</style>
