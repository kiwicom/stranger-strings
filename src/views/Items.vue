<template>
  <div>
    <!-- SEARCH INPUT -->
    <div class="search-input">
      <b-input-group size="md">
        <b-input-group size="md" class="mx-1">
          <input
            type="search"
            placeholder="Search keys and translations..."
            class="textInput form-control"
            v-model.lazy="searchQuery"
            @change="search"
            @keyup.enter="search"
          >
        </b-input-group>
      </b-input-group>
    </div>

    <!-- SETTINGS BUTTON -->
    <div class="settings">
      <b-button-group>
        <b-dropdown down right variant="link" size="lg" no-caret>
          <template slot="button-content">
            <octicon name="gear"></octicon>
          </template>
          <b-dropdown-item-button
            @click="showUserConfig"
          >
            <octicon name="settings"></octicon>&nbsp; user config
          </b-dropdown-item-button>
          <b-dropdown-item-button
            @click="showDictsExpansion"
          >
            <octicon name="repo"></octicon>&nbsp; spellcheck dict
          </b-dropdown-item-button>
          <b-dropdown-item-button
            @click="showPlaceholderConfig"
          >
            <octicon name="mention"></octicon>&nbsp; placeholder config
          </b-dropdown-item-button>
          <b-dropdown-item-button
            @click="showWriteGoodConfig"
          >
            <octicon name="checklist"></octicon>&nbsp;write good config
          </b-dropdown-item-button>
          <b-dropdown-item-button
            @click="showInsensitivenessConfig"
          >
            <InsensitivenessIcon></InsensitivenessIcon> insensitiveness config
          </b-dropdown-item-button>
          <b-dropdown-item-button
            @click="showReportingConfig"
          >
            <octicon name="megaphone"></octicon>&nbsp;reporting config
          </b-dropdown-item-button>
          <b-dropdown-item-button
            @click="exportKeys"
          >
            <octicon name="desktop-download"></octicon>&nbsp; export
          </b-dropdown-item-button>
          <b-dropdown-item-button
            @click="triggerUpdate"
          >
            <octicon name="sync"></octicon>&nbsp; update
          </b-dropdown-item-button>
        </b-dropdown>
      </b-button-group>
    </div>

    <!-- KEYS - MAIN TABLE -->
    <div class="sticky-header-hack">
      <div class="ss-name">Stranger Strings</div>
    </div>
    <table class="table table-sm table-striped table-hover table-keys table-fixed">
      <thead>
        <tr>
          <th
            @click="changeSort('key')"
            class="sorting table-fixed"
            :class="{ 'sorting_asc' : sort[0] === 'key' && sort[1] === 'asc', 'sorting_desc' : sort[0] === 'key' && sort[1] === 'desc' }"
          >
            Key (showing {{ Object.keys(items).length }} / {{ Object.keys(allItems).length }})
          </th>
          <th
            @click="changeSort('count')"
            class="sorting"
            :class="{ 'sorting_asc' : sort[0] === 'count' && sort[1] === 'asc', 'sorting_desc' : sort[0] === 'count' && sort[1] === 'desc' }"
          >
            Progress
          </th>
          <th class="th-errors" v-for="(count, error) in errors" :key="error" v-if="allowedChecks && allowedChecks.includes(error)">
            <div>
              <span :class="errorsFilter === error ? 'selected-error' : ''" @click="toggleErrorsFilter(error)">
                {{ userifyInconsistency(error) }}
              </span>
            </div>
          </th>
          <th
            @click="changeSort('en-GB')"
            class="sorting locale"
            :class="{ 'sorting_asc' : sort[0] === 'en-GB' && sort[1] === 'en-GB', 'sorting_desc' : sort[0] === 'en-GB' && sort[1] === 'desc' }"
          >
            English
          </th>
        </tr>
      </thead>
      <tbody>
        <!-- TRANSLATION KEY ROW -->
        <tr v-for="(val, key) in items" :key="val.key" v-if="val.key">
          <td class="key" scope="row">
            <b-link @click="showKeyDetail(key)">
              {{ val.key }}
            </b-link>
          </td>

          <td class="translationProgress">
            <b-progress class="mt-2" :max="getMaximumTranslations" show-value>
              <b-progress-bar :value="val.translated.length" variant="success"></b-progress-bar>
              <b-progress-bar
                :value="getMaximumTranslations - val.translated.length - importantLoc
               .filter(l => !val.translated.includes(l)).length"
                variant="warning">
              </b-progress-bar>
              <b-progress-bar :value="importantLoc
             .filter(l => !val.translated.includes(l)).length" variant="danger"></b-progress-bar>
            </b-progress>
          </td>

          <td v-for="(c, e) in errors" :key="e" v-if="allowedChecks && allowedChecks.includes(e)" class="indicators">
            <PlaceholderIcon :size="30" v-if="getItemInconsistencies(val).includes(e) && e === '_inconsistencies_placeholders'"></PlaceholderIcon>
            <NoEnglishIcon :size="30" v-else-if="getItemInconsistencies(val).includes(e) && e === '_inconsistencies_noEnglish'"></NoEnglishIcon>
            <LengthIcon :size="30" v-else-if="getItemInconsistencies(val).includes(e) && e === '_inconsistencies_length'"></LengthIcon>
            <FirstIcon :size="30" v-else-if="getItemInconsistencies(val).includes(e) && e === '_inconsistencies_firstCharType'"></FirstIcon>
            <LastIcon :size="30" v-else-if="getItemInconsistencies(val).includes(e) && e === '_inconsistencies_lastCharType'"></LastIcon>
            <DynamicIcon :size="30" v-else-if="getItemInconsistencies(val).includes(e) && e === '_inconsistencies_dynamic'"></DynamicIcon>
            <WriteGoodIcon :size="30" v-else-if="getItemInconsistencies(val).includes(e) && e === '_inconsistencies_writeGood'"></WriteGoodIcon>
            <TyposIcon :size="30" v-else-if="getItemInconsistencies(val).includes(e) && e === '_inconsistencies_typos'"></TyposIcon>
            <TagIcon :size="30" v-else-if="getItemInconsistencies(val).includes(e) && e === '_inconsistencies_tags'"></TagIcon>
            <InsensitivenessIcon :size="30" v-else-if="getItemInconsistencies(val).includes(e) && e === '_inconsistencies_insensitiveness'"></InsensitivenessIcon>
            <WarningIcon :size="30" v-else-if="getItemInconsistencies(val).includes(e)"></WarningIcon>
          </td>

          <td v-bind:class="{ 'locale-hard-wrap': hardWrap, 'locale': !hardWrap }">
            {{ getTranslation(val, "en-GB") || '» not translated «' }}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- DICT EXPANSION MODIFIER -->
    <b-modal
      id="dictsExpansionModal"
      v-model="modalDictsExpansion"
      :title="'Custom spellchecking dictionary expansion'"
      size="lg"
      ok-title="Save"
      @ok="updateDictsExpansion"
      lazy
      no-fade
    >
      <div v-for="(dict, lang) in dictsExpansionData" :key="lang">
        <h5 class="mb-1" style="padding: 5px">{{ lang }}</h5>
        <textarea
          style="font-size: 12px; line-height: 14px;"
          v-model.lazy="dictsExpansionData[lang]"
          :rows=" typeof dictsExpansionData[lang] === 'string' ? dictsExpansionData[lang].split(/\r\n|\r|\n/).length : 1"
          class="form-control"
        >
        </textarea>
      </div>
    </b-modal>

    <!-- MODAL: USER CONFIG -->
    <b-modal
      id="writeGoodSettingsModal"
      v-model="modalChecksConfig"
      :title="'User configuration'"
      size="lg"
      @ok="saveUserConfig"
      ok-only
      no-fade
    >
      <div class="config-group">
        <h4>Checks</h4>
        <div class="setDefault"><b-button variant="link" @click="setDefaultChecksConfig">Reset to default</b-button></div>
        <b-form-checkbox-group v-model="allowedChecks" stacked style="width: fit-content">
          <b-form-checkbox v-for="error in Object.keys(errors)" :key="error" :value="error">
            <strong>{{ userifyInconsistency(error) }}</strong> ({{ getDescription(userifyInconsistency(error)) }})
          </b-form-checkbox>
        </b-form-checkbox-group>
      </div>
      <div class="config-group">
        <h4>Locales</h4>
        <div class="setDefault"><b-button variant="link" @click="setDefaultLocalesConfig">Reset to default</b-button></div>
        <b-form-group v-for="loc in locales" :key="loc" label-cols="4" label-cols-lg="2">
          <b-form-radio-group v-model="importantLocales[loc]">
            <div class="loc-label">{{ loc }}</div>
            <b-form-radio :value="true">Primary</b-form-radio>
            <b-form-radio :value="false">Secondary</b-form-radio>
          </b-form-radio-group>
        </b-form-group>
      </div>
      <div class="config-group">
        <h4>View</h4>
        <div class="setDefault"><b-button variant="link" @click="setDefaultViewConfig">Reset to default</b-button></div>
        <div>
          <b-form-checkbox switch v-model="hardWrap">
            <strong>hard wrap</strong> (show english preview in main table with line breaks)
          </b-form-checkbox>
        </div>
      </div>
    </b-modal>

    <!-- MODAL: WRITE GOOD CONFIG -->
    <b-modal
      id="writeGoodSettingsModal"
      v-model="modalWriteGoodSettings"
      :title="'Write good intentions settings'"
      size="lg"
      ok-title="Save"
      @ok="updateWriteGoodSettings"
      no-fade
    >
      <div class="setDefault"><b-button variant="link" @click="setDefaultWriteGoodConfig">Set default config</b-button></div>
      <div v-for="(settings, lang) in writeGoodSettings" :key="lang">
        <div class="wgLangHeader">{{ lang }}:</div>
        <b-form-checkbox
          v-for="(value, option) in settings"
          :key="option"
          :checked="value"
          @change="toggleWriteGoodSetting(lang, option)"
          style="display: block"
        >
          <strong>{{ option }}</strong> ({{ optionsDescription[option] }})
        </b-form-checkbox>
      </div>
    </b-modal>

    <!-- MODAL: PLACEHOLDER CONFIG -->
    <b-modal
      id="placeholderConfigModal"
      v-model="modalPlaceholderConfig"
      title="Placeholder configuration"
      size="lg"
      ok-title="Save"
      no-fade
      @ok="updatePlaceholderConfig"
      @shown="loadCurrentPlaceholder"
    >
      <div class="regexInput">
        <label for="regFormIn">Regex:</label>
        <b-form-input
          if="regFormIn"
          v-model="placeholderRegex"
          type="text"
          :placeholder="'e.g. ({{\\w+}})'"
        ></b-form-input>
      </div>
      <div class="regexPreview">
        <div class="previewText">
          <label>Preview:</label>
          <b-form-textarea id="textarea1"
                           v-model="regexPreviewText"
                           :rows="6"
                           :max-rows="6">
          </b-form-textarea>
        </div>
        <div class="matched-placeholders">
          <label>Matched placeholders:</label>
          <ul>
            <li v-for="mp in matchedPlaceholders" :key="mp">{{ mp }}</li>
          </ul>
        </div>
      </div>
    </b-modal>

    <!-- MODAL: INSENSITIVENESS CONFIG -->
    <b-modal
      id="insensitivenessConfigModal"
      v-model="modalInsensitivenessConfig"
      title="Insensitiveness configuration"
      size="lg"
      ok-title="Save"
      no-fade
      @ok="updateInsensitivenessConfig"
    >
      <div>
        <label for="range-1">Profanity sureness level: {{ insensitivenessConfig.profanitySureness }}</label>
        <b-form-input number id="range-1" v-model="insensitivenessConfig.profanitySureness" type="range" min="0" max="2"></b-form-input>
        <div class="mt-2">Detecting words that are <strong>{{ getProfanitySureness }}</strong></div>
      </div>
    </b-modal>

    <!--  MODAL: REPORTING CONFIG -->
    <b-modal
      id="reportingConfigModal"
      v-model="modalReportingConfig"
      title="Reporting configuration"
      size="lg"
      ok-title="Save"
      no-fade
      @ok="updateReportingConfig"
      @hidden="resetReportConf"
    >
      <div class="mx-auto" style="width: fit-content">
        <b-form-checkbox
          switch
          v-model="reportConfig.active"
        >
          Enable Reporting
        </b-form-checkbox>
      </div>
      <div v-if="reportConfig.active" class="mt-3">
        <label for="report-option"><strong>Select reporting option:</strong></label>
        <b-form-select if="report-option" v-model="reportConfig.option" :options="getReportingOptions()"></b-form-select>
      </div>
      <div v-if="reportConfig.active && reportConfig.option === 'Slack'" class="mt-3">
        <label for="webhook"><strong>Enter your <a href="https://api.slack.com/incoming-webhooks">Slack Incoming Webhook URL</a>:</strong></label>
        <b-form-input
          id="webhook"
          :value="reportConfig.webhook"
          @change.native="reportConfig.webhook = $event.target.value"
          placeholder="e.g. https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"
        >
        </b-form-input>
        <label for="slack-channel">Channel:</label>
        <b-input-group prepend="#">
          <!-- note: V-MODEL avoided due to performance issues -->
          <b-input
            id="slack-channel"
            placeholder="translation-bugs"
            :value="reportConfig.slackChannel"
            @change.native="reportConfig.slackChannel = $event.target.value"
          ></b-input>
        </b-input-group>
      </div>
    </b-modal>
    <KeyDetail
      v-if="activeKey"
      :user="user"
      :activeKey="activeKey"
      :items="items"
      :locales="locales"
      :importantLoc="importantLoc"
      @close="hideKeyDetail"
    />
  </div>
</template>

<script type="text/javascript">
import NProgress from "nprogress"
import "vue-octicon/icons"
import WarningIcon from "vue-material-design-icons/AlertOutline"
import InsensitivenessIcon from "vue-material-design-icons/EmoticonCryOutline"
import PlaceholderIcon from "vue-material-design-icons/CodeBraces"
import WriteGoodIcon from "vue-material-design-icons/FileWordBox"
import TyposIcon from "vue-material-design-icons/Spellcheck"
import DynamicIcon from "vue-material-design-icons/Resistor"
import NoEnglishIcon from "vue-material-design-icons/EarthOff"
import LengthIcon from "vue-material-design-icons/ArrowExpandHorizontal"
import FirstIcon from "vue-material-design-icons/PageFirst"
import LastIcon from "vue-material-design-icons/PageLast"
import TagIcon from "vue-material-design-icons/CodeTags"
import CountryFlag from "vue-country-flag"


import Multiselect from "vue-multiselect"
import _ from "lodash"
import Fuse from "fuse.js"
import { FbDb } from "../modules/firebase"
import saveJSON from "../modules/json"

import * as helpers from "../services/helpers"
import * as gcFunctions from "../modules/functionsApi"
import * as reporting from "../services/reporting"

import * as defaults from "../../common/config"
import ADMIN from "../consts/admin"

import KeyDetail from "../components/KeyDetail"

export default {
  props: {
    user: { type: Object, required: true },
  },
  components: {
    Multiselect,
    WarningIcon,
    InsensitivenessIcon,
    PlaceholderIcon,
    WriteGoodIcon,
    TyposIcon,
    DynamicIcon,
    NoEnglishIcon,
    LengthIcon,
    FirstIcon,
    LastIcon,
    TagIcon,
    CountryFlag,
    KeyDetail,
  },
  data() {
    return {
      // View
      items: {}, // filtered items with search query
      itemsLoaded: false,
      locales: [],


      // Searching, sorting, filtering
      searchQuery: "",
      sort: ["key", "asc"], // key/count asc/desc
      errorsFilter: "all",
      errors: {},

      // Checks configuration
      allowedChecks: [],

      // Locales configuration
      importantLocales: {},

      // View configuration
      hardWrap: false,

      // Active
      activeKey: this.$route.params.all ? this.$route.params.all : null,
      activeTranslations: null,

      // Custom dict expansion
      dictsExpansionData: {},

      // Placeholder config
      placeholderRegex: "",
      regexPreviewText: "Hi {{name}}, have a nice day!",

      // Write good config
      writeGoodSettings: {},
      optionsDescription: {
        passive: "Checks for passive voice.",
        illusion: "Checks for lexical illusions – cases where a word is repeated.",
        so: "Checks for \"so\" at the beginning of the sentence.",
        thereIs: "Checks for \"there is\" or \"there are\" at the beginning of the sentence.",
        weasel: "Checks for weasel words.",
        adverb: "Checks for adverbs that can weaken meaning: really, very, extremely, etc.",
        tooWordy: "Checks for wordy phrases and unnecessary words.",
        cliches: "Checks for common cliches.",
        eprime: "Checks for \"to-be\" verbs.",
      },

      // Insensitiveness config
      insensitivenessConfig: {
        profanitySureness: 2,
        allow: [],
      },

      // Modals
      modalKeyDetail: !!this.$route.params.all,
      modalDictsExpansion: false,
      modalWriteGoodSettings: false,
      modalReportingConfig: false,
      modalChecksConfig: false,
      modalPlaceholderConfig: false,
      modalInsensitivenessConfig: false,

      // Reporting
      reportConfig: {
        active: false,
        option: "",
        webhook: "",
        slackChannel: "",
      },
    }
  },
  firebase() {
    return {
      allItems: {
        source: FbDb.ref("items"),
        asObject: true,
        readyCallback: () => {
          this.items = this.sortKeys(this.allItems)
          this.itemsLoaded = true
          NProgress.done()
          this.errors = this.countErrors()
          this.allowedChecks = this.loadUserChecksConfig()
        },
      },
      localeList: {
        source: FbDb.ref("locales"),
        asObject: true,
        readyCallback: () => {
          this.locales = this.localeList.list
          this.importantLocales = this.loadUserLocalesConfig()
        },
      },
    }
  },
  created() {
    NProgress.start()
    this.itemsLoaded = false
    this.hardWrap = localStorage.getItem("hardWrap") ? JSON.parse(localStorage.getItem("hardWrap")) : false
    this.items = this.sortKeys(this.allItems) // sort always
    NProgress.start()
    if (this.searchQuery || this.errorsFilter !== "all") {
      this.search()
    }
    this.errors = this.countErrors()
    if (this.activeKey) {
      this.showKeyDetail(this.activeKey)
      NProgress.start()
    }
    this.allowedChecks = this.loadUserChecksConfig()
    FbDb.ref("dictsExpansion/").once("value", (dictsData) => {
      this.dictsExpansionData = dictsData.val()
    })
    window.addEventListener("scroll", this.toggleSSNameVisibility)
    if (this.itemsLoaded) {
      NProgress.done()
    }
  },
  computed: {
    getProfanitySureness() {
      const level = this.insensitivenessConfig.profanitySureness
      if (level === 2) {
        return "likely to be profanity"
      }
      if (level === 1) {
        return "maybe profanity"
      }
      return "unlikely to be profanity"
    },
    getMaximumTranslations() {
      return this.locales ? this.locales.length : 0
    },
    availableTags() {
      return helpers.getAvailableTags(this.allItems)
    },
    matchedPlaceholders() {
      if (this.placeholderRegex === "" || this.placeholderRegex === null) {
        return []
      }
      const matches = this.regexPreviewText.match(RegExp(this.placeholderRegex, "g"))
      if (Array.isArray(matches) && matches.length > 10) {
        return ["...too much matches..."]
      }
      return matches || []
    },
    importantLoc() {
      return _.reduce(this.importantLocales, (acc, val, key) => {
        if (val) {
          acc.push(key)
        }
        return acc
      }, [])
    },
  },
  methods: {
    sortKeys(translations) {
      NProgress.start()
      const res = helpers.sortTranslationKeys(translations, this.sort[0], this.sort[1])
      NProgress.done()
      return res
    },
    changeSort(type) {
      if (this.sort[0] === type) {
        this.sort[1] = this.sort[1] === "asc" ? "desc" : "asc"
      }
      this.sort[0] = type
      this.items = this.sortKeys(this.items)
    },
    countErrors() {
      const errs = {}
      _.forEach(this.allItems, (val) => {
        this.getItemInconsistencies(val).forEach((inconsistency) => {
          errs[inconsistency] = errs[inconsistency] ? errs[inconsistency] + 1 : 1
        })
      })
      return errs
    },
    showKeyDetail(key) {
      this.activeKey = key
      this.$router.push({ name: "items", params: { all: key } })
    },
    showDictsExpansion() {
      FbDb.ref("dictsExpansion").once("value", (snapshot) => {
        if (snapshot.val()) {
          this.dictsExpansionData = snapshot.val() // if this line is removed dicts expansion cannot be modified
          _.forEach(snapshot.val(), (arr, key) => {
            this.dictsExpansionData[key] = Array.isArray(arr) ? arr.join("\n") : arr
          })
        }
        this.modalDictsExpansion = true
      })
    },
    updateDictsExpansion() {
      _.forEach(this.dictsExpansionData, (str, key) => {
        this.dictsExpansionData[key] = str.split("\n")
      })
      FbDb.ref("dictsExpansion").update(this.dictsExpansionData)
      gcFunctions.inconsistenciesUpdate()
    },
    triggerUpdate() {
      gcFunctions.update()
    },
    showUserConfig() {
      this.modalChecksConfig = true
    },
    showWriteGoodConfig() {
      FbDb.ref("writeGood").once("value", (snapshot) => {
        if (snapshot.val()) {
          this.writeGoodSettings = snapshot.val() // if this line is removed dicts expansion cannot be modified
        } else {
          this.setDefaultWriteGoodConfig()
        }
        this.modalWriteGoodSettings = true
      })
    },
    toggleWriteGoodSetting(lang, option) {
      this.writeGoodSettings[lang][option] = !this.writeGoodSettings[lang][option]
    },
    updateWriteGoodSettings() {
      if (ADMIN.includes(this.user.email)) {
        FbDb.ref("writeGood").update(this.writeGoodSettings)
        gcFunctions.inconsistenciesUpdate()
      } else {
        // eslint-disable-next-line no-alert
        this.notifyUser("Action denied", "You don't have permission to modify this setting", "danger")
      }
    },
    showReportingConfig() {
      FbDb.ref("reportingConf/").once("value", (snapshot) => {
        if (snapshot.val()) {
          this.reportConfig = snapshot.val()
        }
        this.modalReportingConfig = true
      })
    },
    getReportingOptions() {
      return reporting.options
    },
    resetReportConf() {
      this.reportConfig = {
        active: false,
        option: "",
        webhook: "",
        slackChannel: "",
      }
    },
    updateReportingConfig() {
      if (ADMIN.includes(this.user.email)) {
        FbDb.ref("reportingConf").update(this.reportConfig)
      } else {
        // eslint-disable-next-line no-alert
        this.notifyUser("Action denied", "You don't have permission to modify this setting", "danger")
      }
    },
    showInsensitivenessConfig() {
      FbDb.ref("insensitivenessConfig/").once("value", (snapshot) => {
        if (snapshot.val()) {
          this.insensitivenessConfig = snapshot.val()
        }
        this.modalInsensitivenessConfig = true
      })
    },
    updateInsensitivenessConfig() {
      if (ADMIN.includes(this.user.email)) {
        FbDb.ref("insensitivenessConfig").update(this.insensitivenessConfig)
        gcFunctions.inconsistenciesUpdate()
      } else {
        // eslint-disable-next-line no-alert
        this.notifyUser("Action denied", "You don't have permission to modify this setting", "danger")
      }
    },
    showPlaceholderConfig() {
      this.modalPlaceholderConfig = true
    },
    updatePlaceholderConfig() {
      if (ADMIN.includes(this.user.email)) {
        FbDb.ref("placeholders").update({
          regex: this.placeholderRegex,
        })
        gcFunctions.inconsistenciesUpdate()
      } else {
        // eslint-disable-next-line no-alert
        this.notifyUser("Action denied", "You don't have permission to modify this setting", "danger")
      }
    },
    loadCurrentPlaceholder() {
      FbDb.ref("placeholders/regex").once("value", (snapshot) => {
        if (snapshot.val()) {
          this.placeholderRegex = snapshot.val()
        }
      })
    },
    search() { // event param if needed
      NProgress.start()
      this.items = _.reduce(this.allItems, (acc, val, key) => {
        if (this.errorsFilter === "all" || this.getItemInconsistencies(val).includes(this.errorsFilter)) {
          acc[key] = val
        }
        return acc
      }, {})
      if (this.searchQuery !== "") { // filter by string query
        const searchOptions = {
          shouldSort: true,
          threshold: 0.5,
          location: 0,
          distance: 100,
          maxPatternLength: 32,
          minMatchCharLength: 1,
          keys: ["en-GB", "key"],
        }
        // need to map to array and then back to object for fuse to work
        const fuse = new Fuse(Object.values(this.items), searchOptions)
        const result = fuse.search(this.searchQuery)
        const mappedResult = {}
        result.forEach((e) => {
          mappedResult[e.key.includes(".") ? e.key.split(".").join("-") : e.key] = e
        })
        this.items = mappedResult
      }
      NProgress.done()
    },
    exportKeys() {
      saveJSON(Object.keys(this.items).map(k => this.items[k].key), "export.json")
    },
    getTranslation(key, locale) {
      const translation = _.get(key, [locale], null)
      if (translation && translation.length >= 2000) {
        return `${translation.substring(0, 1997)}...`
      }
      return translation
    },
    hideKeyDetail() {
      this.activeKey = null
      this.$router.replace({ name: "items" })
    },
    setDefaultWriteGoodConfig() {
      this.writeGoodSettings = JSON.parse(JSON.stringify(defaults.DEFAULT_WRITE_GOOD_SETTINGS)) // deep copy to avoid modification of constant
    },
    getItemInconsistencies(key) {
      return helpers.getItemInconsistencies(key)
    },
    userifyInconsistency(inconsistency) {
      return helpers.userifyInconsistency(inconsistency)
    },
    loadUserChecksConfig() {
      if (localStorage.getItem("allowedChecks")) {
        return JSON.parse(localStorage.getItem("allowedChecks"))
      }
      return Object.keys(this.errors).filter(err => !defaults.DEFAULT_DISABLED_CHECKS.includes(err))
    },
    saveUserConfig() {
      localStorage.setItem("allowedChecks", JSON.stringify(this.allowedChecks))
      localStorage.setItem("importantLocales", JSON.stringify(this.importantLocales))
      localStorage.setItem("hardWrap", JSON.stringify(this.hardWrap))
    },
    loadUserLocalesConfig() {
      if (localStorage.getItem("importantLocales")) {
        return JSON.parse(localStorage.getItem("importantLocales"))
      }
      return this.locales.reduce((acc, loc) => {
        acc[loc] = defaults.IMPORTANT_LOCALES.includes(loc)
        return acc
      }, {})
    },
    setDefaultChecksConfig() {
      this.allowedChecks = Object.keys(this.errors).filter(err => !defaults.DEFAULT_DISABLED_CHECKS.includes(err))
    },
    setDefaultLocalesConfig() {
      this.importantLocales = this.locales.reduce((acc, loc) => {
        acc[loc] = defaults.IMPORTANT_LOCALES.includes(loc)
        return acc
      }, {})
    },
    setDefaultViewConfig() {
      this.hardWrap = defaults.DEFAULT_VIEW.hardWrap
    },
    getDescription(error) {
      return helpers.descriptions[error] || ""
    },
    toggleSSNameVisibility() {
      if (window.scrollY > 200) {
        document.getElementsByClassName("ss-name").item(0).setAttribute("style", "visibility: visible; opacity: 1;")
      } else {
        document.getElementsByClassName("ss-name").item(0).setAttribute("style", "visibility: hidden; opacity: 0;")
      }
    },
    toggleErrorsFilter(error) {
      this.errorsFilter = this.errorsFilter === error ? "all" : error
      this.search()
    },
    notifyUser(title, text, variant) {
      this.$bvToast.toast(text, {
        title,
        variant,
        solid: true,
      })
    },
  },
  destroyed() {
    window.removeEventListener("scroll", this.toggleSSNameVisibility)
  },
}
</script>

<style scoped>
  @import url('https://fonts.googleapis.com/css?family=Megrim');

  .table-fixed {
    width: 100%;
    margin-top: -25px;
  }

  .table-fixed thead {
    top: 0;
    z-index: 1;
  }

  .table-fixed thead tr {
    background-color: #f9fafc;
  }

  .table-fixed thead th {
    top: 63.5px;
    z-index: 1;
    position: sticky;
    position: -webkit-sticky;
    background-color: rgb(0,0,0,0);
    font-weight: 500;
    font-size: 14px;
  }
td {
  vertical-align: middle;
  padding: 5px;
}
th {
  font-size: 13px;
  background-color: white;
}
.th-errors {
  white-space: nowrap;
}
  th.th-errors div {
    transform:  translate(22px, -5px) rotate(-45deg);
    z-index: 3;
    width: 30px;
    cursor: pointer;
  }
  th.th-errors span {
    z-index: 1000;
    border-bottom: 1px solid #ccc;
    padding: 5px 10px;
    cursor: pointer;
  }
th a {
  cursor: pointer;
}
td.key {
  width: 30vw;
  max-width: 30vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
td.key a {
  color: #26539B;
}
td.translationProgress {
  width: 50px;
  border-right: 1px solid #ccc;
}
.locale {
  padding-left: 30px;
}
td.locale {
  max-height: 50px;
  width: 38vw;
  max-width: 38vw;
  min-width: 38vw;
  overflow: hidden;
  overflow-x: scroll;
  white-space: nowrap;
  -ms-overflow-style: none;
  overflow: -moz-scrollbars-none;
  padding-right: 10px;
}
  td.locale-hard-wrap {
    max-height: max-content;
    width: 38vw;
    max-width: 38vw;
    min-width: 38vw;
    overflow: hidden;
    padding-right: 10px;
  }
  td.locale::-webkit-scrollbar {
    display: none;
  }
.row-visited td {
  background-color: #DFE7F2;
}

.textInput {
  max-width: 100%;
  width: 500px;
  font-size: 14px;
}
.wgLangHeader {
  font-size: larger;
  font-weight: bold;
  margin-top: 10px;
}
.setDefault {
  display: inline-block;
}
h4 {
  vertical-align: bottom;
  width: fit-content;
  display: inline-block;
}
  .regexPreview {
    margin-top: 50px;
  }
  .regexPreview label {
    font-size: larger;
    padding-left: 5px;
  }
  .previewText {
    display: inline-block;
    width: 50%;
  }
  .matched-placeholders {
    width: 50%;
    display: inline-grid;
  }
  .sticky-header-hack {
    width: 100%;
    height: 95px;
    z-index: 1;
    position: sticky;
    top: 0;
    background-image: linear-gradient(rgba(255,255,255,0.95) 30%, #f9fafc 100%);
  }
  .ss-name {
    visibility: hidden;
    color: darkgrey;
    font-family: 'Megrim', cursive;
    font-weight: 900;
    font-size: 30px;
    letter-spacing: 1px;
    padding: 14px;
    opacity: 0;
    transition: visibility 0.5s, opacity 0.5s linear;
  }
  .indicators {
    text-align: center;
    border-right: 1px solid #ccc;
    font-size: 20px;
  }
  .settings {
    float: right;
    margin-top: 10px;
    top: 5px;
    z-index: 3;
    width: max-content;
    margin-right: 3px;
    position: sticky;
  }
  .config-group {
    margin-top: 20px;
  }
  .loc-label {
    float: left;
    width: 200px;
    font-weight: bolder;
  }
  .search-input {
    position: absolute;
    left: 475px;
    width: 300px;
    top: 15px;
  }
  .table-keys {
    font-size: 12px;
  }
  .bg-success {
    background-color: #42B3D5 !important
  }
  .bg-warning {
    background-color: #FFB508 !important;
  }
  .bg-danger {
    background-color: #D5011B !important;
  }
  .selected-error {
    font-weight: 900;
  }
</style>
