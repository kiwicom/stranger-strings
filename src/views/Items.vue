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
            @click="showWriteGoodSettings"
          >
            <octicon name="checklist"></octicon>&nbsp;write good settings
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
    <table class="table table-sm b-table table-striped table-hover table-keys table-fixed">
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
            <div><span @click="toggleErrorsFilter(error)">{{ userifyInconsistency(error) }}</span></div>
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
            <b-link @click="setActive(key)">
              {{ val.key }}
            </b-link>
          </td>

          <td class="translationProgress">
            <b-progress class="mt-2" :max="getMaximumTranslations" show-value>
              <b-progress-bar :value="val.translated.length" variant="success"></b-progress-bar>
              <b-progress-bar
                :value="getMaximumTranslations - val.translated.length - imporantLoc.filter(l => !val.translated.includes(l)).length"
                variant="warning">
              </b-progress-bar>
              <b-progress-bar :value="imporantLoc.filter(l => !val.translated.includes(l)).length" variant="danger"></b-progress-bar>
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
        <b-form-checkbox-group v-model="hardWrap" stacked style="width: fit-content">
          <b-form-checkbox :value="!hardWrap">
            <strong>hard wrap</strong> (show english preview in main table with line breaks)
          </b-form-checkbox>
        </b-form-checkbox-group>
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
        <div class="errors-overview" v-if="getItemInconsistencies(items[activeKey]).length > 0">
          <strong>Errors:</strong><br/>
          <div v-for="inconsistency in getItemInconsistencies(items[activeKey])" :key="inconsistency" class="error">
            <div v-if="allowedChecks && allowedChecks.includes(inconsistency) && inconsistency === '_inconsistencies_placeholders'">
              <div class="inline-error"><PlaceholderIcon :size="30"></PlaceholderIcon></div> - missing placeholders
            </div>
            <div v-else-if="allowedChecks && allowedChecks.includes(inconsistency) && inconsistency === '_inconsistencies_noEnglish'">
              <div class="inline-error"><NoEnglishIcon :size="30"></NoEnglishIcon></div> - missing english localisation
            </div>
            <div v-else-if="allowedChecks && allowedChecks.includes(inconsistency) && inconsistency === '_inconsistencies_length'">
              <div  class="inline-warning"><LengthIcon :size="30"></LengthIcon></div> - big differences in length
            </div>
            <div v-else-if="allowedChecks && allowedChecks.includes(inconsistency) && inconsistency === '_inconsistencies_firstCharType'">
              <div class="inline-warning"><FirstIcon :size="30"></FirstIcon></div> - inconsistent first characters
            </div>
            <div v-else-if="allowedChecks && allowedChecks.includes(inconsistency) && inconsistency === '_inconsistencies_lastCharType'">
              <div class="inline-warning"><LastIcon :size="30"></LastIcon></div> - inconsistent last characters
            </div>
            <div v-else-if="allowedChecks && allowedChecks.includes(inconsistency) && inconsistency === '_inconsistencies_dynamic'">
              <div class="inline-error-dynamic"><DynamicIcon :size="30"></DynamicIcon></div> - contains dynamic values
            </div>
            <div v-else-if="allowedChecks && allowedChecks.includes(inconsistency) && inconsistency === '_inconsistencies_writeGood'">
              <div class="inline-warning">
                <WriteGoodIcon :size="30"></WriteGoodIcon>
              </div> - write-good suggestions (in locales: {{ items[activeKey][inconsistency].join(", ") }})
            </div>
            <div v-else-if="allowedChecks && allowedChecks.includes(inconsistency) && inconsistency === '_inconsistencies_typos'">
              <div class="inline-error">
                <TyposIcon :size="30"></TyposIcon>
              </div> - typos (in locales: {{ items[activeKey][inconsistency].join(", ") }})
            </div>
            <div v-else-if="allowedChecks && allowedChecks.includes(inconsistency) && inconsistency === '_inconsistencies_tags'">
              <div class="inline-warning"><TagIcon :size="30"></TagIcon></div> - blacklisted HTML tags
            </div>
            <div v-else-if="allowedChecks && allowedChecks.includes(inconsistency)">
              <div class="inline-warning"><WarningIcon :size="30"></WarningIcon></div> - {{ userifyInconsistency(inconsistency) }}
            </div>
          </div>
        </div>
        <div class="progress-chart">
          <LocalizationProgressChart
            :translated="items[activeKey].translated.length"
            :missingPrimary="imporantLoc.filter(l => !items[activeKey].translated.includes(l)).length"
            :missingSecondary="
            getMaximumTranslations
            - items[activeKey].translated.length
            - imporantLoc.filter(l => !items[activeKey].translated.includes(l)).length"
          ></LocalizationProgressChart>
        </div>
        <div class="progress-legend">
          <div v-if="imporantLoc.filter(l => !items[activeKey].translated.includes(l)).length > 0">
            <strong class="missing-important">Missing primary locales: </strong>
            <strong>{{ imporantLoc.filter(l => !items[activeKey].translated.includes(l)).join(", ") }}</strong>
          </div>
          <div v-if="locales.filter(l => !items[activeKey].translated.includes(l) && !imporantLoc.includes(l)).length > 0">
            <strong class="missing-normal">Missing secondary locales: </strong>
            {{ locales.filter(l => !items[activeKey].translated.includes(l) && !imporantLoc.includes(l)).join(", ") }}
          </div>
          <div v-if="getMaximumTranslations > items[activeKey].translated.length">
            <strong class="translated">Translated: </strong><div class="unimportant">{{ items[activeKey].translated.join(", ") }}</div>
          </div>
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
          <th>Translation</th>
          <th>Errors</th>
        </thead>

        <tbody>
          <tr :key="locale" v-for="locale in locales" v-if="activeTranslations[locale]">
            <td class="locale-id" scope="row">
              {{ locale }}
            </td>
            <td class="translation">
              <div v-if="!showTagsChecked" style="display: inline-block;" v-html="highlightContent(activeTranslations[locale])"></div>
              <div v-else style="display: inline-block;">{{ getTranslationContent(activeTranslations[locale]) }}</div>
            </td>
            <td class="errors-col">
              <div
                v-if="activeTranslations[locale]._writeGood && allowedChecks.includes('_inconsistencies_writeGood')"
                class="inline-warning"
                v-b-popover.hover="getWriteGoodReasons(activeTranslations[locale]._writeGood)"
                title="write good"
              >
                <WriteGoodIcon></WriteGoodIcon>
              </div>
              <div
                v-if="hasInconsistentLength(locale, activeTranslations) && allowedChecks.includes('_inconsistencies_length')"
                class="inline-warning"
                v-b-popover.hover="'suspiciously long translation'"
                title="length"
              >
                <LengthIcon></LengthIcon>
              </div>
              <div
                v-if="getMissingPlaceholders(locale, activeTranslations).length && allowedChecks.includes('_inconsistencies_placeholders')"
                class="inline-error"
                v-b-popover.hover="getMissingPlaceholders(locale, activeTranslations).join('\n')"
                title="Missing placeholders"
              >
                <PlaceholderIcon fill-color="#ef0000"></PlaceholderIcon>
              </div>
              <div
                v-if="activeTranslations[locale]._typos
                && activeTranslations[locale]._typos !== 'unsupported language'
                && allowedChecks.includes('_inconsistencies_typos')"
                class="inline-error"
                v-b-popover.hover="removeDuplicates(activeTranslations[locale]._typos).join('\n')"
                title="Typos"
              >
                <TyposIcon fill-color="#ef0000"></TyposIcon>
              </div>
              <div
                v-if="activeTranslations[locale]._dynamic && allowedChecks.includes('_inconsistencies_dynamic')"
                class="inline-error-dynamic"
                v-b-popover.hover="removeDuplicates(activeTranslations[locale]._dynamic).join('\n')"
                title="Dynamic values"
              >
                <DynamicIcon fill-color="#800080"></DynamicIcon>
              </div>
              <div
                v-if="allowedChecks.includes('_inconsistencies_firstCharType')
                && activeTranslations[locale]._firstCharType !== getExpectedFirstCharType(activeTranslations)"
                class="inline-warning"
                v-b-popover.hover="
                'First character is ' + activeTranslations[locale]._firstCharType + ' but expected ' + getExpectedFirstCharType(activeTranslations)"
                title="First character inconsistency"
              >
                <FirstIcon></FirstIcon>
              </div>
              <div
                v-if="allowedChecks.includes('_inconsistencies_lastCharType')
                && activeTranslations[locale]._lastCharType !== getExpectedLastCharType(activeTranslations)"
                class="inline-warning"
                v-b-popover.hover="
                'Last character is ' + activeTranslations[locale]._lastCharType + ' but expected ' + getExpectedLastCharType(activeTranslations)"
                title="Last character inconsistency"
              >
                <LastIcon></LastIcon>
              </div>
            </td>
          </tr>
          <tr v-else>
            <td :class="imporantLoc.includes(locale) ? 'locale-id not-translated-primary' : 'locale-id not-translated-secondary'" scope="row">
              {{ locale }}
            </td>
            <td colspan="2" :class="imporantLoc.includes(locale) ?'locale-id not-translated-primary' : 'locale-id not-translated-secondary'">
              Not translated
            </td>
          </tr>
        </tbody>
      </table>
    </b-modal>
  </div>
</template>

<script type="text/javascript">
import NProgress from "nprogress"
import "vue-octicon/icons"
import WarningIcon from "vue-material-design-icons/AlertOutline"
import PlaceholderIcon from "vue-material-design-icons/CodeBraces"
import WriteGoodIcon from "vue-material-design-icons/FileWordBox"
import TyposIcon from "vue-material-design-icons/Spellcheck"
import DynamicIcon from "vue-material-design-icons/Resistor"
import NoEnglishIcon from "vue-material-design-icons/EarthOff"
import LengthIcon from "vue-material-design-icons/ArrowExpandHorizontal"
import FirstIcon from "vue-material-design-icons/PageFirst"
import LastIcon from "vue-material-design-icons/PageLast"
import TagIcon from "vue-material-design-icons/CodeTags"


import Multiselect from "vue-multiselect"
import _ from "lodash"
import Fuse from "fuse.js"
import { FbDb } from "../modules/firebase"
import saveJSON from "../modules/json"

import * as helpers from "../services/helpers"
import * as gcFunctions from "../modules/functionsApi"
import maxExpansionRatio from "../../common/maxExpansionRatio"

import * as defaults from "../../common/config"
import ADMIN from "../consts/admin"

import LocalizationProgressChart from "../components/LocalizationProgressChart"

export default {
  props: {
    user: { type: Object, required: true },
  },
  components: {
    Multiselect,
    WarningIcon,
    PlaceholderIcon,
    WriteGoodIcon,
    TyposIcon,
    DynamicIcon,
    NoEnglishIcon,
    LengthIcon,
    FirstIcon,
    LastIcon,
    TagIcon,
    LocalizationProgressChart,
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
      escapeTranslationsChecked: false,
      showTagsChecked: false,

      // Custom dict expansion
      dictsExpansionData: {},

      // Placeholder config
      placeholderRegex: "",
      regexPreviewText: "Hi {{name}}, have a nice day!",

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
      modalPlaceholderConfig: false,
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
      lastUpdate: {
        source: FbDb.ref("lastUpdate"),
        asObject: true,
        readyCallback: () => {
          this.locales = this.lastUpdate.locales
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
      this.setActive(this.activeKey)
    }
    this.allowedChecks = this.loadUserChecksConfig()
    window.addEventListener("scroll", this.toggleSSNameVisibility)
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
    imporantLoc() {
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
    showUserConfig() {
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
      if (ADMIN.includes(this.user.email)) {
        FbDb.ref("writeGood").update(this.writeGoodSettings)
        gcFunctions.inconsistenciesUpdate()
      } else {
        // eslint-disable-next-line no-alert
        alert("You don't have permission to modify this setting") // TODO: friendlier
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
        alert("You don't have permission to modify this setting") // TODO: friendlier
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
        this.showTagsChecked = true // cause highlighting would be mess
        return JSON.stringify(content)
      }
      return this.showTagsChecked ? content : this.stripHtml(content)
    },
    hideKeyDetail() {
      this.activeKey = null
      this.$router.replace({ name: "items" })
    },
    highlightContent(translation) {
      let content = this.getTranslationContent(translation)
      if (!content) {
        return "» not translated «"
      }
      if (this.allowedChecks.includes("_inconsistencies_writeGood")) {
        const highlightedParts = []
        if (Array.isArray(translation._writeGood)) {
          translation._writeGood.forEach((suggestion) => {
            highlightedParts.push(suggestion.reason.match(/"[\w]+(?=")/m) && suggestion.reason.match(/"[\w]+(?=")/m)[0].slice(1))
          })
        }
        highlightedParts.forEach((part) => {
          content = content.replace(new RegExp(part, "g"), match => `<span class="inline-highlight-wg">${match}</span>`)
        })
      }
      if (this.allowedChecks.includes("_inconsistencies_dynamic")) {
        if (Array.isArray(translation._dynamic)) {
          const dynamics = JSON.parse(JSON.stringify(translation._dynamic))
          dynamics.sort((a, b) => b.length - a.length) // sort by string length to highlight all numbers
          dynamics.forEach((dynamic) => {
            content = content.replace(
              new RegExp(dynamic, "gm"),
              match => `<span class="inline-highlight-dynamic">${match}</span>`,
            )
          })
        }
      }
      if (this.allowedChecks.includes("_inconsistencies_typos")) {
        if (Array.isArray(translation._typos)) {
          translation._typos.forEach((typo) => {
            content = content.replace(
              new RegExp(`[^\\w]${_.escapeRegExp(typo)}(?=[^\\w]|$)`, "g"),
              match => `${match.slice(0,1)}<span class="inline-highlight-typos">${match.slice(1)}</span>`,
            )
          })
        }
      }
      return content
    },
    getWriteGoodReasons(writeGood) {
      return this.removeDuplicates(writeGood.map(lint => lint.reason)).join(",\n")
    },
    setDefaultWriteGoodConfig() {
      this.writeGoodSettings = JSON.parse(JSON.stringify(defaults.DEFAULT_WRITE_GOOD_SETTINGS)) // deep copy to avoid modification of constant
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
    hasInconsistentLength(lang, translations) {
      if (translations[lang] && translations["en-GB"] && translations["en-GB"].content.length > 0) {
        const baseLength = translations["en-GB"].content.length
        return (translations[lang].content.length / baseLength) > maxExpansionRatio(baseLength)
      }
      return false
    },
    getMissingPlaceholders(lang, translations) {
      /*
      e.g. for placehorlder
      en -> ph1, ph1, ph1, ph,2
      de -> ph1, ph1, ph2
      cz -> ph1, ph1, ph3

      allPlaceholders -> ph1, ph1. ph1, ph2, ph3
       */
      const allPlaceholders = _.reduce(translations, (acc, translation) => {
        (translation._placeholders || []).forEach((placeholder) => {
          const placeholderAppearance = translation._placeholders.filter(i => i === placeholder).length
          if (acc.filter(i => i === placeholder).length < placeholderAppearance) {
            // eslint-disable-next-line no-param-reassign
            acc = _.without(acc, placeholder).concat(_.fill(Array(placeholderAppearance), placeholder))
          }
        })
        return acc
      }, [])

      return allPlaceholders.reduce((acc, placeholder) => {
        const totalPlaceholderAppearance = allPlaceholders.filter(i => i === placeholder).length
        const translationPlaceholderAppearance = (
          translations[lang] && translations[lang]._placeholders
          && translations[lang]._placeholders.filter(i => i === placeholder).length
        ) || 0
        return _.without(acc, placeholder).concat(_.fill(Array(totalPlaceholderAppearance - translationPlaceholderAppearance), placeholder))
      }, allPlaceholders)
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
    getExpectedFirstCharType(activeTranslations) {
      return _.uniq(Object.values(activeTranslations).map(t => t._firstCharType))[0]
    },
    getExpectedLastCharType(activeTranslations) {
      return _.uniq(Object.values(activeTranslations).map(t => t._lastCharType))[0]
    },
    toggleErrorsFilter(error) {
      this.errorsFilter = this.errorsFilter === error ? "all" : error
      this.search()
    },
    removeDuplicates(array) {
      return [...new Set(array)]
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
    background-color: #ffff;
  }

  .table-fixed thead th {
    top: 67px;
    z-index: 1;
    position: sticky;
    position: -webkit-sticky;
    background-color: rgb(0,0,0,0)
  }
td {
  vertical-align: middle;
  font-size: 12px;
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
  td.errors-col {
    width: 9vw;
  }
}
  .locale-id {
    font-weight: bolder;
    width: 150px;
  }
.not-translated-primary {
  color: rgba(255, 0, 0, 0.65);
}
.not-translated-secondary {
  color: #FFC107;
}
.error {
  display: list-item;
  margin: 1px;
  font-size: 16px;
  border: 1px;
  list-style: none;
}
.textInput {
  max-width: 100%;
  width: 500px;
  font-size: 14px;
}
.keyOverview {
  font-size: 14px;
  margin-bottom: 15px;
  margin-top: 15px;
  width: 100%;
  display: flex;
}
.translationsForm {
  margin-bottom: 16px;
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
.inline-warning {
  color: orange;
  font-size: 12px;
  border-radius: 25px;
  padding-left: 3px;
  padding-right: 3px;
  border: solid 1px orange;
  display: inline-block;
  margin-left: 5px;
}
.inline-error {
  color: #ef0000;
  font-size: 12px;
  border-radius: 25px;
  padding-left: 3px;
  padding-right: 3px;
  border: solid 1px #ef0000;
  display: inline-block;
  margin-left: 5px;
}
  .inline-error-dynamic {
    color: purple;
    font-size: 12px;
    border-radius: 25px;
    padding-left: 3px;
    padding-right: 3px;
    border: solid 1px purple;
    display: inline-block;
    margin-left: 5px;
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
    background-image: linear-gradient(rgba(255,255,255,0.95) 30%, rgba(255,255,255,1) 100%);
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
  .missing-important {
    color: #DC3545;
  }
  .missing-normal {
    color: #FFC107;
  }
  .translated {
    color: #28A745;
  }
  .unimportant {
    color: gray;
    display: contents;
  }
  .progress-chart {
    width: 33%;
  }
  .progress-legend {
    font-size: 14px;
    display: inline-block;
    width: 33%;
    float: right;
  }
  .errors-overview {
    width: 33%;
  }
  .search-input {
    position: absolute;
    left: 475px;
    width: 300px;
    top: 15px;
  }
</style>
