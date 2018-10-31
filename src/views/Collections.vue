<template>
  <div>
    <!-- SUBHEADER -->
    <b-navbar>
      <b-button-toolbar>
        <b-button
          @click="showAddCollection"
          size="md"
          variant="outline-primary"
        >
          <octicon name="plus"></octicon>
        </b-button>
      </b-button-toolbar>
      <b-button-group right>
        <b-dropdown right variant="info" size="md" no-caret>
          <template slot="button-content">
            <octicon name="gear"></octicon>
          </template>
          <b-dropdown-item-button
            @click="triggerUpdate"
          >
            <octicon name="sync"></octicon>&nbsp; update
          </b-dropdown-item-button>
        </b-dropdown>
      </b-button-group>
    </b-navbar>
    <!-- </SUBHEADER -->

    <!-- MAIN TABLE --->
    <table class="table table-sm b-table table-striped table-hover table-collections">
      <thead>
        <tr>
          <th>Collection name</th>
          <th>Keys</th>
          <th>Suspected errors</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody v-if="isLoaded">
        <tr v-for="(collection) in collections" :key="collection['.key']">
          <td>
            <b-link
              v-b-popover.hover="'/' + collection.regex + '/' + collection.regexFlags"
              title="regex" @click="showCollectionDetail(collection)"
            >
              {{ collection['.key'] }}
            </b-link>
          </td>
          <td class="keys">
            <div class="keys-list" v-for="(key, idx) in collection.keys" :key="idx">{{ key.replace(/[-]/g, '.') }}</div>
          </td>
          <td class="errors">
            <div class="error" v-for="(langs, inconsistencyName) in getCollectionInconsistencies(collection)" :key="inconsistencyName">
              <div class="err-type">{{ inconsistencyName }}</div>
              <div class="err-lang" v-for="lang in langs" :key="lang">{{ lang }}</div>
            </div>
          </td>
          <td class="actions">
            <b-button
              size="sm"
              variant="outline-danger"
              @click="deleteCollection(collection['.key'])"
            >
              <octicon name="trashcan"></octicon>
            </b-button>
          </td>
        </tr>
      </tbody>
    </table>
    <!-- </MAIN TABLE -->

    <!-- MODAL: ADD COLLECTION -->
    <b-modal
      id="addCollection"
      ref="addCollection"
      v-model="modalAddCollection"
      title="Add new collection"
      size="lg"
      lazy
      ok-title="Add"
      @ok="handleCollectionAdd"
      @shown="clearCollectionModal"
    >
      <label>Collection name:</label>
      <b-form-input
        v-model.trim="newCollectionName"
        type="text"
        :state="!correctInput"
        aria-describedby="invalidFeedback"
        :placeholder="newCollectionRegex || 'Enter collection name'"
      ></b-form-input>
      <b-form-invalid-feedback id="invalidFeedback">
        {{ correctInput }}
      </b-form-invalid-feedback>
      <label>Regex:</label>
      <b-form-input
        v-model="newCollectionRegex"
        type="text"
        placeholder="Enter your regex"
      ></b-form-input>
      <b-form-checkbox-group
        id="regexFlags"
        v-model="newCollectionRegexFlags"
        :options="regexFlags"
        style="margin-top: 5px;"
      ></b-form-checkbox-group>
      <h6 style="margin-top: 20px">Your regex: <code>/{{ newCollectionRegex }}/{{ newCollectionRegexFlags.join("") }}</code></h6>
    </b-modal>

    <!-- MODAL: COLLECTION DETAIL -->
    <b-modal
      id="collectionDetailModal"
      v-model="modalCollectionDetail"
      size="lg"
      :title="activeCollection && activeCollection['.key']"
      hide-footer
      lazy
      @hidden="hideCollectionDetail"
    >
      <div>
        <strong>Regex: </strong> <code>/{{ activeCollection.regex }}/{{ activeCollection.regexFlags }}</code><br/>
        <strong>Languages with errors:</strong>
        <ul>
          <li
            v-for="lang in getLangsWithInconsistencies(activeCollection)"
            :key="lang"
          >
            {{ lang }} ({{ getInconsistencyTypesOfLang(lang, activeCollection).join(", ") }})
          </li>
        </ul>
      </div>
      <table class="table table-sm b-table table-striped table-hover table-keys">
        <thead>
          <tr>
            <th>Keys</th>
            <th v-for="lang in getLangsWithInconsistencies(activeCollection)" :key="lang">{{ lang }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="key in activeCollection.keys" :key="key">
            <td>{{ key.replace(/[-]/g, '.') }}</td>
            <td v-for="lang in getLangsWithInconsistencies(activeCollection)" :key="lang">
              <div
                v-bind:class="{ firstCharCasingErr: activeCollection._inconsistencies_firstCharCasing.includes(lang) }"
                v-b-popover.hover.left="activeTranslations[key] && activeTranslations[key][lang] && activeTranslations[key][lang].content"
              >
                {{ getTrimmedTranslation(key, lang) }}</div>
              </td>
          </tr>
        </tbody>
      </table>
    </b-modal>
  </div>
</template>

<script>
import NProgress from "nprogress"

import { FbDb } from "../modules/firebase"

import * as gcFunctions from "../modules/functionsApi"

export default {
  data() {
    return {
      // Collection creator
      newCollectionName: "",
      newCollectionRegex: "",
      newCollectionRegexFlags: [],
      regexFlags: [
        { text: "global match", value: "g" },
        { text: "ignore case", value: "i" },
        { text: "multiline", value: "m" },
        { text: "Unicode", value: "u" },
        { text: "sticky", value: "y" },
      ],

      // Collection detail
      activeCollection: {},
      activeTranslations: {},

      // Modals
      modalAddCollection: false,
      modalCollectionDetail: false,

      // Loading
      loadingCollections: true,
    }
  },
  firebase() {
    return {
      collections: {
        source: FbDb.ref("collections"),
        readyCallback: () => {
          this.loadingCollections = false
          this.activeCollection = this.$route.params.all ? this.collections.find(collection => collection[".key"] === this.$route.params.all) : {}
          this.modalCollectionDetail = !!this.$route.params.all
        },
      },
    }
  },
  created() {
    NProgress.start()
  },
  computed: {
    correctInput() {
      const name = this.newCollectionName || this.newCollectionRegex

      if (Object.values(this.collections).some(collection => collection[".key"] === name)) {
        return "Collection name must be unique"
      }
      if (name === "") {
        return "Collection name cannot be empty"
      }
      if (/[.#$[\]]/g.test(name)) {
        return "Collection name cannot contain \".\", \"#\", \"$\", \"[\", or \"]\"\""
      }

      return ""
    },
    isLoaded() {
      if (!this.loadingCollections) {
        NProgress.done()
        return true
      }
      return false
    },
  },
  methods: {
    triggerUpdate() {
      gcFunctions.update()
    },
    showAddCollection() {
      this.modalAddCollection = true
    },
    handleCollectionAdd(evt) {
      evt.preventDefault()
      const name = this.newCollectionName || this.newCollectionRegex
      if (!Object.keys(this.collections).includes(name) && name !== "" && !/[.#$[\]]/g.test(name)) {
        this.addCollection()
      }
    },
    addCollection() {
      const name = this.newCollectionName || this.newCollectionRegex
      const newCollection = { regex: this.newCollectionRegex, regexFlags: this.newCollectionRegexFlags.join("") }
      FbDb.ref(`collections/${name}`).set(newCollection)
      this.$refs.addCollection.hide()
      gcFunctions.collectionsUpdate()
    },
    clearCollectionModal() {
      this.newCollectionName = ""
      this.newCollectionRegex = ""
      this.newCollectionRegexFlags = []
    },
    userify(inconsistency) {
      switch (inconsistency) {
      case "_inconsistencies_firstCharCasing":
        return "Casing"
      default:
        return inconsistency
      }
    },
    getCollectionInconsistencies(collection) {
      const inconsistencies = Object.keys(collection).filter(item => /^_inconsistencies_.*/.test(item))
      const result = {}
      inconsistencies.forEach((inconsistency) => {
        result[this.userify(inconsistency)] = collection[inconsistency]
      })
      return result
    },
    deleteCollection(key) {
      this.$firebaseRefs.collections.child(key).remove()
    },
    async showCollectionDetail(collection) {
      this.activeCollection = collection
      this.activeTranslations = {}
      const loaded = []
      if (collection.keys) {
        collection.keys.forEach((key) => {
          loaded.push(new Promise((res) => {
            FbDb.ref(`translations/${key}`).once("value", (snapshot) => {
              if (snapshot.val()) {
                this.activeTranslations[key] = snapshot.val()
              }
              res()
            })
          }))
        })
      }
      Promise.all(loaded).then(() => {
        this.modalCollectionDetail = true
        this.$router.push({ name: "collections", params: { all: collection[".key"] } })
      })
    },
    getLangsWithInconsistencies(collection) {
      let langs = []
      Object.keys(collection)
        .filter(item => /^_inconsistencies_.*/.test(item))
        .forEach((inconsistency) => { langs = langs.concat(collection[inconsistency]) })
      return [...new Set(langs)] // unique languages
    },
    getTrimmedTranslation(key, lang) {
      const content = this.activeTranslations[key] && this.activeTranslations[key][lang] && this.activeTranslations[key][lang].content
      if (!content) {
        return ""
      }
      return content.length > 10 ? `${content.substr(0, 10)}...` : content
    },
    getInconsistencyTypesOfLang(lang, collection) {
      return Object.keys(collection)
        .filter(item => /^_inconsistencies_.*/.test(item))
        .filter(inconsistency => collection[inconsistency].includes(lang))
        .map(this.userify)
    },
    hideCollectionDetail() {
      this.$router.push({ name: "collections" })
    },
  },
}
</script>

<style scoped>
  .firstCharCasingErr::first-letter {
    color: red;
    font-weight: bold;
  }

  .table-collections {
    .keys-list {
      font-size: 14px;
    }
  }
  td.errors {
    width: 600px;
    vertical-align: middle;
  }
  td.actions {
    width: 80px;
    text-align: center;
    vertical-align: middle;
  }
  .error {
    color: white;
    background: #dc3545;
    text-align: center;
    width: 80px;
    border: solid 2px #dc3545;
    border-radius: 10px;
  }
  .err-type {
    font-size: 16px;
    font-weight: normal;
  }
  .err-lang {
    font-weight: lighter;
    font-size: 12px;
  }
</style>
