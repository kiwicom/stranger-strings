<template>
  <div>
    <!-- SUBHEADER -->
    <b-navbar>
      <b-row>
        <b-button-toolbar>
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
            <div class="alignCenter">
              <b-form-checkbox :disabled="loading" @change="handleChangeSelect" v-model="strict">Strict</b-form-checkbox>
            </div>
            <b-form-select size="md" v-model="errorsFilter" @change="handleChangeSelect">
              <optgroup label="Errors:">
                <option value="all">Errors: All ({{ getErrorCount }})</option>
                <option v-for="(count, error) in errors" :key="error" :value="error" v-if="allowedChecks && allowedChecks.includes(error)">
                  {{ userifyInconsistency(error) }}: {{ count }}
                </option>
              </optgroup>
            </b-form-select>
          </b-input-group>
          <b-button-group>
            <b-button @click="exportKeys">Export</b-button>
          </b-button-group>
        </b-button-toolbar>
      </b-row>
      <b-button-group right>
        <b-dropdown right variant="info" size="md" no-caret>
          <template slot="button-content">
            <octicon name="gear"></octicon>
          </template>
          <b-dropdown-item-button
            @click="showChecksConfig"
          >
            <octicon name="settings"></octicon>&nbsp; checks config
          </b-dropdown-item-button>
          <b-dropdown-item-button
            @click="showDictsExpansion"
          >
            <octicon name="repo"></octicon>&nbsp; spellcheck dict
          </b-dropdown-item-button>
          <b-dropdown-item-button
            @click="showWriteGoodSettings"
          >
            <octicon name="checklist"></octicon>&nbsp;write good settings
          </b-dropdown-item-button>
          <b-dropdown-item-button
            @click="triggerUpdate"
          >
            <octicon name="sync"></octicon>&nbsp; update
          </b-dropdown-item-button>
        </b-dropdown>
      </b-button-group>
    </b-navbar>
    <!-- </SUBHEADER -->

    <!-- KEYS - MAIN TABLE -->
    <table class="table table-sm b-table table-striped table-hover table-keys">
      <thead>
        <tr>
          <th
            @click="changeSort('key')"
            class="sorting"
            :class="{ 'sorting_asc' : sort[0] === 'key' && sort[1] === 'asc', 'sorting_desc' : sort[0] === 'key' && sort[1] === 'desc' }"
          >
            Key (showing {{ Object.keys(items).length }} / {{ Object.keys(allItems).length }})
          </th>
          <th>Suspected errors</th>
          <th
            @click="changeSort('count')"
            class="sorting"
            :class="{ 'sorting_asc' : sort[0] === 'count' && sort[1] === 'asc', 'sorting_desc' : sort[0] === 'count' && sort[1] === 'desc' }"
          >
            Progress
          </th>
          <th
            @click="changeSort('en-GB')"
            class="sorting"
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
            <b-link @click="setActive(key); updateQuery()">
              {{ val.key }}
            </b-link>
            <a @click="setSearch(val.key)">
              <octicon class="transparentClickableIcon" name="search"/>
            </a>
          </td>

          <td class="errors">
            <div v-for="inconsistency in getItemInconsistencies(val)" :key="inconsistency" class="error">
              <!-- LANGUAGE SPECIFIC ERRORS -->
              <!-- eslint-disable-next-line vue/valid-v-for -->
              <b-badge
                v-if="Array.isArray(val[inconsistency]) && allowedChecks && allowedChecks.includes(inconsistency)"
                v-for="lang in val[inconsistency]"
                size="sm"
                style="margin-right: 2px"
                :variant="getInconsistencyCategory(inconsistency)"
              >
                {{ userifyInconsistency(inconsistency) }} ({{ lang }})
              </b-badge>
              <!-- KEY SPECIFIC ERRORS -->
              <b-badge
                v-if="!Array.isArray(val[inconsistency]) && allowedChecks && allowedChecks.includes(inconsistency)"
                size="sm"
                :variant="getInconsistencyCategory(inconsistency)"
              >
                {{ userifyInconsistency(inconsistency) }}
              </b-badge>
            </div>
          </td>

          <td class="translationProgress">
            <b-progress :max="getMaximumTranslations">
              <b-progress-bar
                :value="val.count"
                :label="val.count && val.count.toFixed(0)"
              >
              </b-progress-bar>
            </b-progress>
          </td>

          <td class="locale">
            {{ getTranslation(val, "en-GB") || '» not translated «' }}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 
    : DICT EXPANSION MODIFIER -->
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

    <!-- MODAL: CHECKS CONFIG -->
    <b-modal
      id="writeGoodSettingsModal"
      v-model="modalChecksConfig"
      :title="'Checks configuration'"
      size="lg"
      @ok="saveChecksConfig"
      ok-only
      no-fade
    >
      <div class="setDefault"><b-button variant="link" @click="setDefaultChecksConfig">Set default config</b-button></div>
      <b-form-checkbox-group v-model="allowedChecks" stacked style="width: fit-content">
        <b-form-checkbox v-for="error in Object.keys(errors)" :key="error" :value="error">{{ userifyInconsistency(error) }}</b-form-checkbox>
      </b-form-checkbox-group>
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

    <!-- MODAL: KEY DETAIL -->
    <b-modal
      id="keyDetailModal"
      v-model="modalKeyDetail"
      :title="activeKey && items[activeKey] && items[activeKey].key"
      variant="primary"
      size="lg"
      no-fade
      hide-footer
      lazy
      @hidden="hideKeyDetail"
    >
      <div class="keyOverview" v-if="items[activeKey]">
        <strong>Translations:</strong> {{ getTranslationsCount() }} / {{ getMaximumTranslations }}<br/>
        <div v-for="inconsistency in getItemInconsistencies(items[activeKey])" :key="inconsistency" class="error">
          <!-- LANGUAGE SPECIFIC ERRORS -->
          <!-- eslint-disable-next-line vue/valid-v-for -->
          <b-badge
            v-if="Array.isArray(items[activeKey][inconsistency]) && allowedChecks && allowedChecks.includes(inconsistency)"
            v-for="lang in items[activeKey][inconsistency]"
            style="margin-right: 2px"
            size="sm"
            :variant="getInconsistencyCategory(inconsistency)"
          >
            {{ userifyInconsistency(inconsistency) }} ({{ lang }})
          </b-badge>
          <!-- KEY SPECIFIC ERRORS -->
          <b-badge
            v-if="!Array.isArray(items[activeKey][inconsistency]) && allowedChecks && allowedChecks.includes(inconsistency)"
            size="sm"
            :variant="getInconsistencyCategory(inconsistency)"
          >
            {{ userifyInconsistency(inconsistency) }}
          </b-badge>
        </div>
      </div>

      <div class="translationsForm">
        <b-form inline>
          <b-form-checkbox
            v-b-tooltip.hover title="If enabled error highlighting in text will be turn off"
            v-model="showTagsChecked"
          >
            Show tags in translations
          </b-form-checkbox>
          <b-form-checkbox v-model="escapeTranslationsChecked">Escape translations</b-form-checkbox>
        </b-form>
      </div>

      <table v-if="items[activeKey]" class="table table-sm b-table table-striped detailTable">
        <thead>
          <th>Locale</th>
          <th>Placeholders</th>
          <th>First</th>
          <th>Last</th>
          <th>Tags</th>
          <th>Dynamic</th>
          <th>Typos</th>
          <th>Translation</th>
        </thead>

        <tbody>
          <tr :key="locale" v-for="locale in locales" v-if="activeTranslations[locale]">
            <td class="locale" scope="row">
              {{ locale }}
            </td>
            <td class="placeholdersTd">
              {{ getPlaceholders(activeTranslations[locale]) }}
            </td>
            <td class="firstTd">
              {{ activeTranslations[locale]._firstCharType }}
            </td>
            <td class="lastTd">
              {{ activeTranslations[locale]._lastCharType }}
            </td>
            <td class="tagsTd">
              {{ activeTranslations[locale]._tags }}
            </td>
            <td class="dynamicTd">
              <pre>{{ getDynamic(activeTranslations[locale]) }}</pre>
            </td>
            <td class="typosTd">
              <pre>{{ getTypos(activeTranslations[locale]) }}</pre>
            </td>
            <td class="translation">
              <div v-if="!showTagsChecked" style="display: inline-block;" v-html="lintContent(activeTranslations[locale])"></div>
              <div v-else style="display: inline-block;">{{ getTranslationContent(activeTranslations[locale]) || "» not translated «" }}</div>
              <div
                v-if="activeTranslations[locale]._writeGood"
                style="color: #ffbb00; display: inline-block; margin-left: 5px"
                v-b-popover.hover="getWriteGoodReasons(activeTranslations[locale]._writeGood)"
                title="write good"
              >
                <octicon name="question"></octicon>
              </div>
            </td>
          </tr>
          <tr v-else>
            <td class="locale" scope="row">
              {{ locale }}
            </td>
            <td colspan="5"></td>
            <td colspan="2" class="text-muted">Not translated</td>
          </tr>
        </tbody>
      </table>
    </b-modal>
  </div>
</template>

<script type="text/javascript">
import NProgress from "nprogress"
import "vue-octicon/icons"

import Multiselect from "vue-multiselect"
import _ from "lodash"
import Fuse from "fuse.js"
import { FbDb } from "../modules/firebase"
import saveJSON from "../modules/json"

import * as helpers from "../services/helpers"
import * as gcFunctions from "../modules/functionsApi"

import {
  IMPORTANT_LOCALES,
  DEFAULT_WRITE_GOOD_SETTINGS,
  DEFAULT_DISABLED_CHECKS,
} from "../../common/config"

export default {
  components: {
    Multiselect,
  },
  data() {
    return {
      // View
      items: {}, // filtered items with search query
      itemsLoaded: false,
      locales: [],


      // Searching, sorting, filtering
      searchQuery: "",
      strict: "false",
      sort: ["key", "asc"], // key/count asc/desc
      errorsFilter: "all",
      errors: {},

      // Checks configuration
      allowedChecks: [],

      // Active
      activeKey: this.$route.params.all ? this.$route.params.all : null,
      activeTranslations: null,
      escapeTranslationsChecked: false,
      showTagsChecked: false,
      loading: false,

      // Custom dict expansion
      dictsExpansionData: {},

      // Write good settings
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

      // Modals
      modalKeyDetail: !!this.$route.params.all,
      modalDictsExpansion: false,
      modalWriteGoodSettings: false,
      modalChecksConfig: false,

      // Constants
      IMPORTANT_LOCALES,
    }
  },
  firebase() {
    return {
      itemsMetaData: {
        source: FbDb.ref("itemsMetaData"),
        asObject: true,
      },
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
      lastUpdate: {
        source: FbDb.ref("lastUpdate"),
        asObject: true,
        readyCallback: () => {
          this.locales = this.lastUpdate.locales
        },
      },
    }
  },
  created() {
    NProgress.start()
    this.itemsLoaded = false
    this.items = this.sortKeys(this.allItems) // sort always
    if (this.searchQuery || this.errorsFilter !== "all") {
      this.search()
    }
    this.errors = this.countErrors()
    if (this.activeKey) {
      this.setActive(this.activeKey)
    }
    this.allowedChecks = this.loadUserChecksConfig()
    if (this.itemsLoaded) {
      NProgress.done()
    }
  },
  computed: {
    getMaximumTranslations() {
      return this.locales ? this.locales.length : 0
    },
    availableTags() {
      return helpers.getAvailableTags(this.allItems)
    },
    getErrorCount() {
      if (!this.allowedChecks) {
        return 0
      }
      return _.reduce(this.errors, (acc, val, err) => (this.allowedChecks.includes(err) ? acc + val : acc), 0)
    },
  },
  methods: {
    updateQuery() { // update query params
    },
    handleChangeSelect() {
      this.loading = true
      // need to wait for change of value
      setTimeout(() => {
        this.updateQuery()
        this.search()
        this.loading = false
      }, 50)
    },
    sortKeys(translations) {
      return helpers.sortTranslationKeys(translations, this.sort[0], this.sort[1])
    },
    changeSort(type) {
      if (this.sort[0] === type) {
        this.sort[1] = this.sort[1] === "asc" ? "desc" : "asc"
      }
      this.sort[0] = type
      this.updateQuery()
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
    setSearch(key) {
      this.searchQuery = key
      this.search()
    },
    setActive(key) {
      this.modalKeyDetail = true
      this.activeKey = key
      this.$router.push({ name: "items", params: { all: key } })
      this.activeTranslations = {}
      FbDb.ref(`translations/${key}`).once("value", (snapshot) => {
        if (snapshot.val()) {
          this.activeTranslations = snapshot.val()
        }
      })
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
    showChecksConfig() {
      this.modalChecksConfig = true
    },
    showWriteGoodSettings() {
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
      FbDb.ref("writeGood").update(this.writeGoodSettings)
      gcFunctions.inconsistenciesUpdate()
    },
    search() { // event param if needed
      this.updateQuery()
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
        if (this.strict) {
          console.log(this.searchQuery)
          this.items = helpers.strictSearch(this.items, this.searchQuery)
        } else {
          // need to map to array and then back to object for fuse to work
          const fuse = new Fuse(Object.values(this.items), searchOptions)
          const result = fuse.search(this.searchQuery)
          const mappedResult = {}
          result.forEach((e) => {
            mappedResult[e.key.includes(".") ? e.key.split(".").join("-") : e.key] = e
          })
          this.items = mappedResult
        }
      }
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
    getPlaceholders(translation) {
      if (!translation._placeholders) {
        return null
      }
      return helpers.getPlaceholders(translation._placeholders)
    },
    getTranslationContent(translation) {
      if (!translation) {
        return null
      }
      const { content } = translation
      if (this.escapeTranslationsChecked && content) {
        this.showTagsChecked = true // cause linting would mess
        return JSON.stringify(content)
      }
      return this.showTagsChecked ? content : this.stripHtml(content)
    },
    getTranslationsCount() {
      if (!this.activeKey || !this.activeTranslations) {
        return 0
      }
      return Object.keys(this.activeTranslations).length
    },
    getTypos(translation) {
      const typos = translation._typos
      return Array.isArray(typos) ? typos.join("\n") : ""
    },
    getDynamic(translation) {
      const dynamic = translation._dynamic
      return Array.isArray(dynamic) ? dynamic.join("\n") : ""
    },
    hideKeyDetail() {
      this.activeKey = null
      this.$router.replace({ name: "items" })
      this.updateQuery()
    },
    lintContent(translation) {
      let content = this.getTranslationContent(translation)
      if (!content) {
        return "» not translated «"
      }
      const highlightedParts = []
      if (Array.isArray(translation._writeGood)) {
        translation._writeGood.forEach((suggestion) => {
          highlightedParts.push(content.slice(suggestion.index, suggestion.index + suggestion.offset))
        })
      }
      highlightedParts.forEach((part) => {
        content = content.replace(new RegExp(part, "g"), match => `<span style="background: #ffe18e">${match}</span>`)
      })
      return content
    },
    getWriteGoodReasons(writeGood) {
      return `${writeGood.map(lint => lint.reason).join(",\n")}`
    },
    setDefaultWriteGoodConfig() {
      this.writeGoodSettings = JSON.parse(JSON.stringify(DEFAULT_WRITE_GOOD_SETTINGS)) // deep copy to avoid modification of constant
    },
    stripHtml(text) {
      const tmpHTML = document.createElement("div")
      tmpHTML.innerHTML = text
      return tmpHTML.textContent || tmpHTML.innerText || ""
    },
    getItemInconsistencies(key) {
      return helpers.getItemInconsistencies(key)
    },
    userifyInconsistency(inconsistency) {
      return helpers.userifyInconsistency(inconsistency)
    },
    getInconsistencyCategory(inconsistency) {
      return helpers.getInconsistencyCategory(inconsistency)
    },
    loadUserChecksConfig() {
      if (localStorage.getItem("allowedChecks")) {
        return JSON.parse(localStorage.getItem("allowedChecks"))
      }
      return Object.keys(this.errors).filter(err => !DEFAULT_DISABLED_CHECKS.includes(err))
    },
    saveChecksConfig() {
      localStorage.setItem("allowedChecks", JSON.stringify(this.allowedChecks))
    },
    setDefaultChecksConfig() {
      this.allowedChecks = Object.keys(this.errors).filter(err => !DEFAULT_DISABLED_CHECKS.includes(err))
      localStorage.setItem("allowedChecks", JSON.stringify(this.allowedChecks))
    },
  },
}
</script>

<style scoped>
td {
  vertical-align: middle;
  font-size: 12px;
}
th {
  font-size: 13px;
}
th a {
  cursor: pointer;
}
td.key {
  width: 500px;
  max-width: 500px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
td.translationProgress {
  width: 50px;
}
td.errors {
  max-width: 500px;
  width: 500px;
}
td.locale {
  max-height: 200px;
  max-width: 700px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.row-visited td {
  background-color: #DFE7F2;
}
.detailTable {
  td.locale {
    max-width: 80px;
    width: 80px;
    white-space: nowrap;
  }
  td.translation {
    max-width: 500px;
    width: 500px;
  }
}
.error {
  display: inline-block;
  margin: 1px;
  font-size: 16px;
  border: 1px;
}
.textInput {
  max-width: 100%;
  width: 500px;
  font-size: 14px;
}
.keyOverview {
  font-size: 14px;
}
.translationsForm {
  margin-bottom: 16px;
}
.alignCenter {
  align-self: center;
}
.transparentClickableIcon {
  opacity: .5;
  cursor: pointer;
}
.wgLangHeader {
  font-size: larger;
  font-weight: bold;
  margin-top: 10px;
}
.setDefault {
  float: right;
}
</style>
