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
            @click="showUserConfig = true"
          >
            <octicon name="settings"></octicon>&nbsp; user config
          </b-dropdown-item-button>
          <b-dropdown-item-button
            @click="showAdminConfig = true"
          >
            <!-- TODO: icon  -->
            admin config
          </b-dropdown-item-button>
          <b-dropdown-item-button
            @click="showDictsExpansion"
          >
            <octicon name="repo"></octicon>&nbsp; spellcheck dict
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
          <th class="th-errors" v-for="check in sortedAllowedChecks" :key="check">
            <div>
              <span :class="errorsFilter === check ? 'selected-error' : ''" @click="toggleErrorsFilter(check)">
                {{ userifyInconsistency(check).title }}
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
            <TranslationProgress
              :get-maximum-translations="getMaximumTranslations"
              :important-loc="importantLoc.filter(l => !val.translated.includes(l))"
              :translated="val.translated"
            />
          </td>

          <td
            v-for="check in sortedAllowedChecks"
            :key="check"
            class="indicators"
          >
            <div v-if="val[check]" :is="userifyInconsistency(check).icon.default"></div>
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
    <UserConfig
      v-if="showUserConfig"
      :locales="locales"
      :errors="errors"

      :currentChecks="allowedChecks"
      :currentImportantLocales="importantLocales"
      :currentHardWrap="hardWrap"

      :setDefaultChecksConfig="setDefaultChecksConfig"
      :setDefaultLocalesConfig="setDefaultLocalesConfig"
      :setDefaultViewConfig="setDefaultViewConfig"
      :applyConfig="saveUserConfig"

      :notifyUser="notifyUser"
      @close="showUserConfig = false"
    />

    <AdminConfig
      v-if="showAdminConfig"
      :email="user.email"
      :notifyUser="notifyUser"
      @close="showAdminConfig = false"
    />

    <KeyDetail
      v-if="activeKey && localesLoaded && itemsLoaded"
      :user="user"
      :item="items[activeKey]"
      :locales="locales"
      :importantLoc="importantLoc"
      :notifyUser="notifyUser"
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
import _ from "lodash"
import Fuse from "fuse.js"
import { FbDb } from "../modules/firebase"
import saveJSON from "../modules/json"

import * as helpers from "../services/helpers"
import * as gcFunctions from "../modules/functionsApi"

import * as defaults from "../../common/config"


import KeyDetail from "../components/KeyDetail"
import TranslationProgress from "../components/TranslationProgress"
import UserConfig from "../components/UserConfig"
import AdminConfig from "../components/AdminConfig"

export default {
  props: {
    user: { type: Object, required: true },
  },
  components: {
    TranslationProgress,
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
    KeyDetail,
    UserConfig,
    AdminConfig,
  },
  data() {
    return {
      // View
      items: {}, // filtered items with search query
      itemsLoaded: false,
      localesLoaded: false,
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

      // TODO: Check what could be refactored

      // Configs
      showUserConfig: false,
      showAdminConfig: false,

      // Custom dict expansion
      dictsExpansionData: {},

      // Modals
      modalKeyDetail: !!this.$route.params.all,
      modalDictsExpansion: false,
      modalChecksConfig: false,
    }
  },
  firebase() {
    return {
      allItems: {
        source: FbDb.ref("items"),
        asObject: true,
        readyCallback: () => {
          this.items = this.sortKeys(this.allItems)
          NProgress.done()
          this.errors = this.countErrors()
          this.allowedChecks = this.loadUserChecksConfig()
          this.itemsLoaded = true
        },
      },
      localeList: {
        source: FbDb.ref("locales"),
        asObject: true,
        readyCallback: () => {
          this.locales = this.localeList.list
          this.importantLocales = this.loadUserLocalesConfig()
          this.localesLoaded = true
        },
      },
    }
  },
  created() {
    NProgress.start()
    this.itemsLoaded = false
    this.localesLoaded = false
    this.hardWrap = localStorage.getItem("hardWrap") ? JSON.parse(localStorage.getItem("hardWrap")) : false
    this.items = this.sortKeys(this.allItems) // sort always
    NProgress.start()
    if (this.searchQuery || this.errorsFilter !== "all") {
      this.search()
    }
    this.errors = this.countErrors()
    this.allowedChecks = this.loadUserChecksConfig()
    FbDb.ref("dictsExpansion/").once("value", (dictsData) => {
      this.dictsExpansionData = dictsData.val()
    })
    window.addEventListener("scroll", this.toggleSSNameVisibility)
  },
  computed: {
    sortedAllowedChecks() {
      return Object.keys(helpers.inconsistencies).filter(x => this.allowedChecks.includes(x))
    },
    getMaximumTranslations() {
      return this.locales ? this.locales.length : 0
    },
    availableTags() {
      return helpers.getAvailableTags(this.allItems)
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
      NProgress.start()
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
    getItemInconsistencies(key) {
      if (key === "items") {
        return [] // because vuefire
      }
      return helpers.getItemInconsistencies(key)
    },
    userifyInconsistency(inconsistency) { // TODO: Ref
      return helpers.inconsistencies[inconsistency]
    },

    loadUserChecksConfig() {
      if (localStorage.getItem("allowedChecks")) {
        return JSON.parse(localStorage.getItem("allowedChecks"))
      }
      return Object.keys(this.errors).filter(err => !defaults.DEFAULT_DISABLED_CHECKS.includes(err))
    },
    saveUserConfig(allowedChecks, importantLocales, hardWrap) {
      localStorage.setItem("allowedChecks", JSON.stringify(allowedChecks))
      localStorage.setItem("importantLocales", JSON.stringify(importantLocales))
      localStorage.setItem("hardWrap", JSON.stringify(hardWrap))

      this.allowedChecks = allowedChecks
      this.importantLocales = importantLocales
      this.hardWrap = hardWrap
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
  .sorting {
    cursor: pointer;
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
  .selected-error {
    font-weight: 900;
  }
</style>
