<template>
  <b-modal
    id="writeGoodSettingsModal"
    v-model="show"
    :title="'User configuration'"
    size="lg"
    hide-footer
    ok-only
    no-fade
    @hide="$emit('close')"
  >
    <div class="config-group">
      <h4>Checks</h4>
      <ResetDefaults :cb="setDefaultChecks"/>

      <b-row>
        <Check
          v-for="(check, checkKey) in checks" :key="checkKey"
          class="col-4"
          style="margin-bottom: 10px"
          :checkKey="checkKey"
          :check="check"
          :checked="isCheckAllowed(checkKey)"
          @change="val => setCheck(checkKey, val)"
        />
      </b-row>
    </div>

    <div class="config-group">
      <h4>Locales</h4>
      <ResetDefaults :cb="setDefaultLocales"/>

      <b-form-group v-for="loc in locales" :key="loc" style="margin-bottom: 5px;">
        <b-form-radio-group v-model="importantLocales[loc]" style="display: flex">
          <strong class="loc-label" style="margin-right: 10px; display: inline-block; min-width: 100px">{{ loc }}</strong>
          <b-form-radio :value="true">Primary</b-form-radio>
          <b-form-radio :value="false">Secondary</b-form-radio>
        </b-form-radio-group>
      </b-form-group>
      <div v-if="locales.length === 0">
        Loading…
      </div>
    </div>

    <div class="config-group">
      <h4>View</h4>
      <ResetDefaults :cb="setDefaultView"/>

      <div>
        <b-form-checkbox switch v-model="view.hardWrap">
          <strong>hard wrap</strong> (show english preview in main table with line breaks)
        </b-form-checkbox>
      </div>
    </div>
  </b-modal>
</template>

<script>

import * as helpers from "../services/helpers"

import Check from "./Check"
import ResetDefaults from "./ResetDefaults"


export default {
  name: "UserConfig",
  props: {
    show: { type: Boolean, required: true },
    locales: { type: Array, required: true },

    allowedChecks: { type: Array, required: true },
    importantLocales: { type: Object, required: true },
    view: { type: Object, required: true },

    setDefaultChecks: { type: Function, required: true },
    setDefaultLocales: { type: Function, required: true },
    setDefaultView: { type: Function, required: true },

    setCheck: { type: Function, required: true },
    setLocale: { type: Function, required: true },
    setView: { type: Function, required: true },

    notifyUser: { type: Function, required: true },
  },
  components: {
    ResetDefaults,
    Check,
  },
  data() {
    return {
      checks: helpers.checks,
    }
  },
  methods: {
    isCheckAllowed(checkKey) {
      return this.allowedChecks.includes(checkKey)
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

  h4 {
    vertical-align: bottom;
    width: fit-content;
    display: inline-block;
  }
</style>
