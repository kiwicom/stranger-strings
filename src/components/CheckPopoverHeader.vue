<template>
  <div
    :class="['popover-header' , getCheckData(check).level + '-header']"
  >
    <div class="check-icon">
      <component
        :is="getIcon(check)"
      />
    </div>
    <div class="check-title">
      {{ getCheckData(check).title }} {{ getCheckData(check).level || getEntity(check) }}
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex"

export default {
  name: "CheckPopoverHeader",
  props: {
    check: { type: String, required: true },
  },
  computed: {
    ...mapGetters([
      "getCheckData",
    ]),
  },
  methods: {
    getIcon(checkKey) {
      return `${checkKey.replace(/.*_/g, "")}Icon`
    },
    getEntity(type) {
      switch (type) {
      case "_entity_placeholders":
        return "Placeholder"
      case "_entity_tags":
        return "HTML tag"
      default:
        return ""
      }
    },
  },
}
</script>

<style scoped>
  .check-icon {
    margin-right: 15px;
    display: inline-block;
    border-radius: 5px 0px 0px;
    width: 40px;
    height: 40px;
    background-color: #2E5496;
    text-align: center;
  }
  .check-icon .material-design-icon {
    color: white;
    font-size: 30px;
  }
  .check-title {
    display: inline-block;
    font-size: larger;
    vertical-align: text-bottom;
    color: #1f3a68;
  }
  .popover-header {
    padding-top: 0px;
    padding-left: 0px;
    border-right: 5px;
    height: 40px;
  }
  .error-header {
    background-color: rgba(239, 0, 0, 0.32);
  }
  .warning-header {
    background-color: rgba(255, 180, 9, 0.62);
  }
  .suggestion-header {
    background-color: rgba(0, 123, 255, 0.16);
  }
</style>
