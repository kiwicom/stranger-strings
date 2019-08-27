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
            <AdminIcon/>&nbsp; admin config
          </b-dropdown-item-button>
          <b-dropdown-item-button
            @click="showDictExpansion = true"
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

    <div class="table-head">
      <div class="head-item key">
        <div
          class="sort-button"
          @click="changeSort('key')"
        >
          Key (showing {{ Object.keys(items).length }} / {{ Object.keys(allItems).length }})
        </div>
      </div>
      <div class="head-item prog-bar">
        <div
          class="sort-button"
          @click="changeSort('count')"
        >
          Progress
        </div>
      </div>
      <div
        class="head-item check"
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
                    'sort-button': true,
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
              :toggleCheckFilter="toggleCheckFilter"
              :activeFilter="checkFilter === checkKey"
              class="p-3"
            />
          </template>
        </v-popover>
      </div>
      <div class="head-item">
        <div
          class="sort-button translation"
          @click="changeSort('en-GB')"
        >
          English
        </div>
      </div>
    </div>
    <div class="table-body">
      <DynamicScroller
        :items="items"
        key-field="key"
        :min-item-size="39"
        class="scroller"
      >
        <template v-slot="{ item, index, active }">
          <DynamicScrollerItem
            :item="item"
            :active="active"
            :size-dependencies="[
              item['en-GB'],
            ]"
            :data-index="index"
            :class="{
              'table-row': true,
              'odd-row': index & 1,
            }"
          >
              <div class="table-item key">
                <b-link @click="showKeyDetail(item['.key'])" :title="item.key">
                  {{ item.key }}
                </b-link>
              </div>
              <div class="table-item prog-bar">
                <TranslationProgress
                  :get-maximum-translations="getLocalesCount"
                  :important-loc="getImportantLocales.filter(l => !(item.translated || []).includes(l))"
                  :translated="item.translated || []"
                />
              </div>
              <div
                v-for="(check, checkKey) in checks" :key="checkKey"
                :class="{
                  'table-item': true,
                  'check': true,
                  'disabled': !isActive(checkKey),
                 }"
              >
                <keep-alive>
                  <component v-if="isActive(checkKey) && item[checkKey]" :is="getIcon(checkKey)" />
                  <div style="opacity: 0;" v-else>-</div>
                </keep-alive>
              </div>
              <div
                :class="{ 'translation-hard-wrap': hardWrap, 'translation': !hardWrap, 'table-item': true }"
              >
                {{ getTranslation(item, "en-GB") }}
              </div>
          </DynamicScrollerItem>
        </template>
      </DynamicScroller>
    </div>

    <DictionaryExpansion
      :show="showDictExpansion"
      @close="showDictExpansion = false"
      :notifyUser="notifyUser"
    />

    <UserConfig
      :show="showUserConfig"
      @close="showUserConfig = false"
      :notifyUser="notifyUser"
    />

    <AdminConfig
      :show="showAdminConfig"
      :email="user.email"
      :notifyUser="notifyUser"
      @close="showAdminConfig = false"
    />

    <KeyDetail
      v-if="activeKey && localesLoaded && itemsLoaded"
      :user="user"
      :item="items.find(i => i['.key'] === activeKey)"
      :notifyUser="notifyUser"
      @close="hideKeyDetail"
    />
  </div>
</template>

<script type="text/javascript">
import NProgress from "nprogress"
import "vue-octicon/icons"
import AdminIcon from "vue-material-design-icons/CloudBraces"
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
import DictionaryExpansion from "../components/DictionaryExpansion"

export default {
  props: {
    user: { type: Object, required: true },
  },
  components: {
    DictionaryExpansion,
    TranslationProgress,
    Check,
    KeyDetail,
    UserConfig,
    AdminConfig,
    AdminIcon,
  },
  data() {
    return {
      // View
      items: [], // filtered items with search query
      itemsLoaded: false,
      localesLoaded: false,

      // Searching, sorting, filtering
      searchQuery: "",
      sort: ["key", "asc"], // key/count asc/desc
      checkFilter: "all",
      errors: {},

      // Active
      activeKey: this.$route.params.all ? this.$route.params.all : null,

      // Configs
      showUserConfig: false,
      showAdminConfig: false,
      showDictExpansion: false,
    }
  },
  firebase() {
    return {
      allItems: {
        source: FbDb.ref("items"),
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
    triggerUpdate() {
      gcFunctions.update()
    },
    search() { // event param if needed
      NProgress.start()
      this.items = _.reduce(this.allItems, (acc, val) => {
        if (this.checkFilter === "all" || this.getItemInconsistencies(val).includes(this.checkFilter)) {
          acc.push(val)
        }
        return acc
      }, [])
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
        const fuse = new Fuse(this.items, searchOptions)
        const result = fuse.search(this.searchQuery)
        this.items = result
      }
      NProgress.done()
    },
    exportKeys() {
      saveJSON(this.items.map(i => i.key), "export.json")
    },
    getTranslation(key, locale) {
      const translation = JSON.stringify(_.get(key, [locale], "» not translated «")).replace(/\\"/gm, "\"")
      if (translation && translation.length >= 2000) {
        return `${translation.substring(1, 1997)}...`
      }
      return translation.substr(1, translation.length - 2)
    },
    hideKeyDetail() {
      this.activeKey = null
      this.$router.replace({ name: "items" })
    },
    getItemInconsistencies(key) {
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
  watch: {
    $route(to) {
      if (to.path === "/items") {
        this.activeKey = null
        this.showUserConfig = false
        this.showAdminConfig = false
        this.showDictExpansion = false
      }
    },
    hardWrap() { // to avoid glitches in UI
      const tmp = _.cloneDeep(this.items)
      this.items = []
      this.items = tmp
    },
  },
}
</script>

<style scoped>
  @import url('https://fonts.googleapis.com/css?family=Megrim');

  .sort-button {
    cursor: pointer;
  }
  .scroller {
    height: 100vh;
    overflow-y: auto;
  }

  .table-head {
    display: flex;
    flex-direction: row;
    top: -1px;
    z-index: 1;
    position: sticky;
    position: -webkit-sticky;
    background-color: #f9fafc;
    font-weight: 500;
    font-size: 16px;
    padding: 7px 0 7px 0;
  }

  .check-filter {
    border-bottom: 2px solid black;
  }

  .table-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
    font-size: 13px;
    vertical-align: middle;
    border-top: 1px solid #dee2e6;
    align-items: stretch;
  }
  .table-row:hover {
    background-color: rgba(0, 0, 0, 0.065);
  }
  .odd-row {
    background-color: rgba(0, 0, 0, 0.05);
  }
  .key {
    width: 32vw;
    max-width: 32vw;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding-left: 10px;
    display: flex;
    align-items: center;
  }
  .key a {
    text-overflow: ellipsis;
    overflow: hidden;
    width: 100%;
  }
  .prog-bar {
    width: 80px;
  }
  .check {
    width: 35px;
    text-align: center;
    font-size: 18px;
  }
  .table-row .disabled {
    background-image: repeating-linear-gradient(-45deg, #E6E7E9, #cfd8e2 1px, white 2px, white 5px);
  }
  .table-row .prog-bar {
    border-right: 1px solid #ccc;
    padding: 11px 8px 11px 0px;
    display: flex;
    align-items: center;
  }
  .table-row .check {
    border-right: 1px solid #ccc;
    padding: 5px;
    display: flex;
    justify-content: center;
  }
  .translation {
    padding-left: 10px;
    max-height: 50px;
    width: 40vw;
    max-width: 40vw;
    min-width: 38vw;
    overflow: hidden;
    overflow-x: scroll;
    white-space: nowrap;
    -ms-overflow-style: none;
    overflow: -moz-scrollbars-none;
    flex-grow: 20;
    display: flex;
    align-items: center;
  }
  .translation-hard-wrap {
    padding: 10px 5px 10px 5px;
    max-height: max-content;
    width: 38vw;
    max-width: 38vw;
    min-width: 38vw;
    overflow: hidden;
    display: flex;
    align-items: center;
  }

  .textInput {
    max-width: 100%;
    width: 500px;
    font-size: 14px;
  }

  .search-input {
    position: absolute;
    left: 0;
    right: 0;
    width: fit-content;
    margin-left: auto;
    margin-right: auto;
    top: 12px;
  }

  .search-input .input-group {
    width: 280px;
    display: inline-flex;
  }
</style>
