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
      <ResetDefaults :cb="setDefaultCheckActiveness"/>
      <b-row>
        <Check
          v-for="(checkKey) in Object.keys(checks)" :key="checkKey"
          class="col-4"
          style="margin-bottom: 10px"
          :checkKey="checkKey"
        />
      </b-row>
    </div>

    <div class="config-group">
      <h4>Locales</h4>
      <ResetDefaults :cb="setDefaultLocaleImportance"/>

      <b-form-group v-for="(data, loc) in locales" :key="loc" style="margin-bottom: 5px;">
        <b-form-radio-group v-model="data.important" style="display: flex">
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
      <ResetDefaults :cb="setDefaultHardWrap"/>

      <div>
        <b-form-checkbox switch :checked="hardWrap" @change="toggleHardWrap">
          <strong>hard wrap</strong> (show english preview in main table with line breaks)
        </b-form-checkbox>
      </div>
    </div>
  </b-modal>
</template>

<script>

import { mapMutations, mapGetters, mapState } from "vuex"

import Check from "./Check"
import ResetDefaults from "./ResetDefaults"


export default {
  name: "UserConfig",
  props: {
    show: { type: Boolean, required: true },
    notifyUser: { type: Function, required: true },
  },
  components: {
    ResetDefaults,
    Check,
  },
  computed: {
    ...mapGetters([
      "hardWrap",
    ]),
    ...mapState([
      "checks",
      "locales",
    ]),
  },
  methods: {
    ...mapMutations([
      "setDefaultCheckActiveness",
      "setDefaultLocaleImportance",
      "setDefaultHardWrap",
      "toggleHardWrap",
    ]),
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
