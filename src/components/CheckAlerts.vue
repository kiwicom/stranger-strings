<template>
    <div class="container">
      <div
        class="icon suggestion"
        v-if="suggestions"
      >
        <AlertIcon :size="48"/>
      </div>
      <div
        class="icon warning"
        v-if="warnings"
      >
         <AlertIcon :size="48"/>
      </div>
      <div
        class="icon error"
        v-if="errors"
      >
         <AlertIcon :size="48"/>
      </div>
    </div>
</template>

<script>
import { mapGetters } from "vuex"
import AlertIcon from "vue-material-design-icons/Alert"


export default {
  name: "CheckAlerts",
  components: { AlertIcon },
  props: {
    missingPlaceholders: { type: Array },
    missingTags: { type: Array },
    length: { type: Boolean },
    onlyActive: { type: Boolean },
  },
  data() {
    return {
      errors: [],
      warnings: [],
      suggestions: [],
    }
  },
  computed: {
    ...mapGetters([
      "isActive",
      "getCheckData",
    ]),
  },
  created() {
    const inconsistencies = []
    if (this.missingPlaceholders && this.missingPlaceholders.length) {
      inconsistencies.push("_inconsistencies_placeholders")
    }
    if (this.missingTags && this.missingTags.length) {
      inconsistencies.push("_inconsistencies_tags")
    }
    if (this.length) {
      inconsistencies.push("_inconsistencies_length")
    }
    inconsistencies.forEach((i) => {
      if (!this.onlyActive || this.isActive(i)) {
        if (this.getCheckData(i).level === "error") {
          this.errors.push(i)
        }
        if (this.getCheckData(i).level === "warning") {
          this.warnings.push(i)
        }
        if (this.getCheckData(i).level === "suggestion") {
          this.suggestions.push(i)
        }
      }
    })
  },
}
</script>

<style scoped>
  .container {
    width: fit-content;
  }
  .suggestion {
    color: dodgerblue;
  }
  .warning {
    color: orange;
  }
  .error {
    color: red;
  }
  .icon {
    font-size: 17px;
    display: inline-block;
  }

</style>
