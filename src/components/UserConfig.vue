<template>
  <b-modal
    id="writeGoodSettingsModal"
    v-model="modalUserConfig"
    :title="'User configuration'"
    size="lg"
    @ok="updateUserConfig"
    ok-only
    no-fade
    @hide="$emit('close')"
  >
    <div class="config-group">
      <h4>Checks</h4>
      <div class="setDefault">
        <b-button
          variant="link"
          @click="setDefaultChecksConfig"
        >
          Reset to default
        </b-button>
      </div>

      <b-row>
        <b-form-checkbox-group
          v-for="error in Object.keys(errors)" :key="error"
          v-model="allowedChecks"
          class="col-6"
          style="margin-bottom: 10px"
          switches
        >
            <div class="header">
              <b-form-checkbox
                inline
                :value="error"
              />
              <strong>{{ userifyInconsistency(error).title }}</strong>
              <component :is="userifyInconsistency(error).icon.default"></component>
            </div>
            <div class="body">
              <p>{{ userifyInconsistency(error).description }}</p>
            </div>
        </b-form-checkbox-group>
      </b-row>
    </div>

    <div class="config-group">
      <h4>Locales</h4>
      <div class="setDefault">
        <b-button
          variant="link"
          @click="setDefaultLocalesConfig"
        >
          Reset to default
        </b-button>
      </div>
      <b-form-group v-for="loc in locales" :key="loc" label-cols="4" label-cols-lg="2">
        <b-form-radio-group v-model="currentImportantLocales[loc]">
          <div class="loc-label">{{ loc }}</div>
          <b-form-radio :value="true">Primary</b-form-radio>
          <b-form-radio :value="false">Secondary</b-form-radio>
        </b-form-radio-group>
      </b-form-group>
    </div>
    <div class="config-group">
      <h4>View</h4>
      <div class="setDefault">
        <b-button
          variant="link"
          @click="setDefaultViewConfig"
        >
          Reset to default
        </b-button>
      </div>
      <div>
        <b-form-checkbox switch v-model="currentHardWrap">
          <strong>hard wrap</strong> (show english preview in main table with line breaks)
        </b-form-checkbox>
      </div>
    </div>
  </b-modal>
</template>

<script>

import * as defaults from "../../common/config"
import * as helpers from "../services/helpers"

export default {
  name: "UserSettings",
  props: {
    locales: { type: Array, required: true },
    errors: { type: Object, required: true },

    currentChecks: { type: Array, required: true },
    currentImportantLocales: { type: Object, required: true },
    currentHardWrap: { type: Boolean, required: true },

    setDefaultChecksConfig: { type: Function, required: true },
    setDefaultLocalesConfig: { type: Function, required: true },
    setDefaultViewConfig: { type: Function, required: true },
    applyConfig: { type: Function, required: true },

    notifyUser: { type: Function, required: true },
  },
  data() {
    return {
      modalUserConfig: false,

      // new config
      allowedChecks: this.currentChecks,
      important: this.currentImportantLocales,
      hardWrap: this.currentHardWrap,

    }
  },
  created() {
    this.modalUserConfig = true // TODO: Consider if needed
  },
  computed: {

  },
  methods: {
    updateUserConfig() {
      this.applyConfig(this.allowedChecks, this.important, this.hardWrap)
    },
    setDefaultChecks() {
      // this.writeGoodConfig = JSON.parse(JSON.stringify(defaults.DEFAULT_WRITE_GOOD_SETTINGS)) // deep copy to avoid modification of constant
    },
    userifyInconsistency(key) {
      return helpers.inconsistencies[key]
    },
  },
}
</script>

<style>
  #writeGoodSettingsModal .modal-dialog {
    max-width: 100%; margin-left: 10px; margin-right: 10px
  }
</style>

<style scoped>
  .config-group {
    margin-top: 20px;
  }

  .header {
    line-height: 24px;
    white-space: nowrap;
  }

  .header .custom-switch {
    display: inline-block;
    margin-right: 2px;
  }

  .header strong {
    font-size: 14px;
    vertical-align: middle;
  }

  .header .material-design-icon {
    margin-left: 10px;
    transform: scale(1.7);
    color: #2E5496
  }

  .body {
    color: hsl(0, 0%, 30%)
  }

  h4 {
    vertical-align: bottom;
    width: fit-content;
    display: inline-block;
  }

  .setDefault {
    display: inline-block;
  }

</style>
