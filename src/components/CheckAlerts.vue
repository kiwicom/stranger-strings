<template>
    <div class="container">
      <v-popover
        v-for="(alerts, type) in { 'suggestion': suggestions, 'warning': warnings, 'error': errors }"
        :key="type"
        v-if="alerts.length"
        trigger="hover"
        placement="top"
        :class="['icon', type]"
      >
        <AlertIcon :size="48"/>
        <template slot="popover">
          <div
            v-for="alert in alerts"
            :key="alert"
          >
            <CheckPopoverHeader :check="alert" />
            <div
              class="popover-content"
              v-if="alert === '_inconsistencies_length'"
            >
              This translation looks suspiciously long
            </div>
            <div
              class="popover-content"
              v-else
            >
              Following {{ getCheckData(alert).title }} are missing: <br/>
              <div
                v-for="(missing, idx) in (alert === '_inconsistencies_tags' ? missingTags : missingPlaceholders)"
                :key="missing + idx"
                class="list"
              >
                <span :class="alert">{{ missing }}</span>
              </div>
            </div>
          </div>
        </template>
      </v-popover>
    </div>
</template>

<script>
import { mapGetters } from "vuex"
import AlertIcon from "vue-material-design-icons/Alert"
import CheckPopoverHeader from "./CheckPopoverHeader"


export default {
  name: "CheckAlerts",
  components: { CheckPopoverHeader, AlertIcon },
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
  methods: {
    getIcon(checkKey) {
      return `${checkKey.replace(/.*_/g, "")}Icon`
    },
  },
}
</script>

<style scoped>
  .container {
    width: fit-content;
    padding: 0px;
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
  .popover-content {
    display: inline-block;
    text-align: left;
    min-width: 300px;
    font-weight: bold;
    padding: 8px;
    font-size: 15px;
    z-index: 5;
  }
  .list {
    width: max-content;
    display: list-item;
    font-weight: normal;
    list-style-position: inside;
    text-align: left;
  }
  ._inconsistencies_tags {
    color: #107f9b;
  }
  ._inconsistencies_placeholders {
    color: #26539B;
  }
</style>
