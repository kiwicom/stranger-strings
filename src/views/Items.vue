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

      <b-button-group>
        <b-dropdown down right variant="link" size="lg" no-caret>
          <template slot="button-content">
            <octicon name="gear" style="color: white; vertical-align: initial;"></octicon>
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
          <th
            v-for="(check, checkKey) in checks" :key="checkKey"
            :class="{
              'th-errors': true,
              'disabled': !isActive(checkKey),
            }"
          >
            <v-popover
              trigger="hover"
              :class="{
                'check-filter': isActive(checkKey) && checkFilter === checkKey,
              }"
            >
              <keep-alive>
                <component
                  :class="{
                    'icon': true,
                    'selected-check': checkFilter === checkKey,
                  }"
                  @click="isActive(checkKey) && toggleCheckFilter(checkKey)"
                  :is="getIcon(checkKey)"
                  style="font-size: 18px;"
                />
              </keep-alive>
              <template slot="popover">
                <Check
                  :checkKey="checkKey"
                />
              </template>
            </v-popover>
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
              :get-maximum-translations="getLocalesCount"
              :important-loc="getImportantLocales.filter(l => !val.translated.includes(l))"
              :translated="val.translated"
            />
          </td>

          <td
            v-for="(check, checkKey) in checks" :key="checkKey"
            :class="{
              'indicators': true,
              'disabled': !isActive(checkKey),
            }"
          >
            <keep-alive>
              <component v-if="isActive(checkKey) && val[checkKey]" :is="getIcon(checkKey)" />
            </keep-alive>
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
      :show="showUserConfig"
      @close="showUserConfig = false"
      :notifyUser="notifyUser"
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
      :notifyUser="notifyUser"
      @close="hideKeyDetail"
    />
  </div>
</template>

<script type="text/javascript">
import NProgress from "nprogress"
import "vue-octicon/icons"
import _ from "lodash"
import Fuse from "fuse.js"
import { mapMutations, mapGetters, mapState } from "vuex"
import { FbDb } from "../modules/firebase"
import saveJSON from "../modules/json"

import * as helpers from "../services/helpers"
import * as gcFunctions from "../modules/functionsApi"

import Check from "../components/Check"
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
    Check,
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

      // Searching, sorting, filtering
      searchQuery: "",
      sort: ["key", "asc"], // key/count asc/desc
      checkFilter: "all",
      errors: {},

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
          this.itemsLoaded = true
        },
      },
      localeList: {
        source: FbDb.ref("locales"),
        asObject: true,
        readyCallback: () => {
          this.localeList.list.forEach(loc => this.addLocale(loc))
          this.localesLoaded = true
        },
      },
    }
  },
  created() {
    NProgress.start()
    this.itemsLoaded = false
    this.localesLoaded = false
    this.items = this.sortKeys(this.allItems) // sort always
    NProgress.start()
    if (this.searchQuery || this.checkFilter !== "all") {
      this.search()
    }
    this.errors = this.countErrors()
    FbDb.ref("dictsExpansion/").once("value", (dictsData) => {
      this.dictsExpansionData = dictsData.val()
    })
  },
  computed: {
    ...mapGetters([
      "isActive",
      "getImportantLocales",
      "getLocalesCount",
      "hardWrap",
    ]),
    ...mapState([
      "checks",
    ]),
    availableTags() {
      return helpers.getAvailableTags(this.allItems)
    },
  },
  methods: {
    ...mapMutations([
      "addLocale",
    ]),
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
        if (this.checkFilter === "all" || this.getItemInconsistencies(val).includes(this.checkFilter)) {
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
    toggleCheckFilter(error) {
      this.checkFilter = this.checkFilter === error ? "all" : error
      this.search()
    },
    notifyUser(title, text, variant) {
      this.$bvToast.toast(text, {
        title,
        variant,
        solid: true,
      })
    },
    getIcon(checkKey) {
      return `${checkKey.replace(/.*_/g, "")}Icon`
    },
  },
}
</script>

<style scoped>
  @import url('https://fonts.googleapis.com/css?family=Megrim');

  .table-fixed {
    width: 100%;
  }

  .table-fixed thead {
    top: 0;
    z-index: 1;
  }

  .table-fixed thead th {
    top: -1px;
    z-index: 1;
    position: sticky;
    position: -webkit-sticky;
    background-color: #f9fafc;
    font-weight: 500;
    font-size: 14px;
  }
  .sorting {
    cursor: pointer;
  }

  th {
    font-size: 13px;
    background-color: white;
    cursor: pointer;
    padding: 5px 8px;
  }

  th.th-errors, td.indicators {
    width: 1px; /* fit the width of the content */
    text-align: center;
    font-size: 18px;
    vertical-align: bottom;
  }

  td.indicators {
    border-right: 1px solid #ccc;
  }

  th.th-errors.disabled .material-design-icon {
    opacity: .3;
  }

  th.th-errors.disabled {
    padding-left: 3px;
    padding-right: 3px;
  }

  td.indicators.disabled {
    padding-left: 3px;
    padding-right: 3px;
    background-image: repeating-linear-gradient(-45deg, #E6E7E9, #cfd8e2 1px, white 2px, white 5px)
  }

  td {
    vertical-align: middle;
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

  .check-filter {
    border-bottom: solid 1px black;
  }

  .loc-label {
    float: left;
    width: 200px;
    font-weight: bolder;
  }

  .search-input {
    position: absolute;
    left: 455px;
    top: 12px;
  }

  .search-input .input-group {
    width: 280px;
    display: inline-flex;
  }

  .table-keys {
    font-size: 12px;
  }
  .selected-check {
    font-weight: 900;
  }
</style>
