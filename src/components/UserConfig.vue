<template>
  <b-modal
    id="writeGoodSettingsModal"
    :visible="show"
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
          v-for="(checkKey) in Object.keys(checks)" :key="checkKey"
          class="col-4 check"
          :checkKey="checkKey"
        />
      </b-row>
    </div>

    <div class="config-group">
      <h4>Locales</h4>
      <ResetDefaults :cb="setDefaultLocaleImportance"/>
      <div class="description">
        Select languages that are important for you (missing translations in important languages will be indicated by red color in progress bar).
      </div>
      <div
        class="lang"
        v-for="(data, loc) in locales"
        :key="loc"
      >
        <div class="star" @click="setLocaleImportance({ locale: loc, important: !data.important })">
          <StarIcon v-if="data.important" class="starred"/>
          <StarOutlineIcon v-else class="unstarred"/>
        </div>
        <div class="flag-icon">
          <CountryFlag :country="loc.slice(3, 5).toLowerCase()" size="normal"/>
        </div>
        <strong class="loc-label">{{ loc }}</strong>
      </div>
      <div v-if="locales.length === 0">
        Loading…
      </div>
    </div>

    <div class="config-group no-line">
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
import StarIcon from "vue-material-design-icons/Star"
import StarOutlineIcon from "vue-material-design-icons/StarOutline"
import CountryFlag from "vue-country-flag"

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
    StarIcon,
    StarOutlineIcon,
    CountryFlag,
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
      "setDefaultCheckLevels",
      "setLocaleImportance",
      "setDefaultHardWrap",
      "toggleHardWrap",
    ]),
    setDefaultChecks() {
      this.setDefaultCheckLevels()
      this.setDefaultCheckActiveness()
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
    border-bottom: 1px solid #bcbcbc;
  }
  .no-line {
    border-bottom: none;
  }

  h4 {
    vertical-align: bottom;
    width: fit-content;
    display: inline-block;
  }

  .description {
    margin: 10px 0 30px 0;
  }

  .lang {
    display: inline-block;
    width: 220px;
    margin: 0 25px 0 25px;
  }
  .lang strong {
    padding: 10px;
  }

  .check {
    margin: 20px 0 10px 0;
  }

  .star {
    display: inline-block;
    text-align: center;
    font-size: 20px;
    width: 60px;
  }

  .flag-icon {
    text-align: center;
    font-size: 20px;
    width: 40px;
    vertical-align: middle;
    display: inline-block;
  }

  .starred {
    color: #d5d500;
    font-size: 25px;
  }
  .unstarred {
    color: rgba(32, 32, 0, 0.48);
  }
</style>
