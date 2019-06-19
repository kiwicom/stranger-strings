/* eslint-disable global-require,no-param-reassign */
import Vue from "vue"
import Vuex from "vuex"
import VuexPersist from "vuex-persist"

import * as defaults from "../common/config"

Vue.use(Vuex)

const vuexPersist = new VuexPersist({
  key: "Stranger-Strings",
  storage: localStorage,
})

export default new Vuex.Store({
  state: {
    checks: {
      _inconsistencies_placeholders: {
        title: "Placeholders",
        description: "Detect missing/excess/inconsistent placeholders",
        icon: require("vue-material-design-icons/CodeBraces"),
        level: "high",
        active: false,
        exampleImage: "placeholders",
      },
      _inconsistencies_firstCharType: {
        title: "First character",
        description: "Detect inconsistencies of first character",
        icon: require("vue-material-design-icons/PageFirst"),
        level: "low",
        active: false,
        exampleImage: null,
      },
      _inconsistencies_lastCharType: {
        title: "Last character",
        description: "Detect inconsistencies of last character",
        icon: require("vue-material-design-icons/PageLast"),
        level: "low",
        active: false,
        exampleImage: null,
      },
      _inconsistencies_tags: {
        title: "HTML",
        description: "Detect invalid HTML and prohibited HTML tags",
        icon: require("vue-material-design-icons/CodeTags"),
        level: "high",
        active: false,
        exampleImage: null,
      },
      _inconsistencies_length: {
        title: "Length",
        description: "Detects suspicious variations in length",
        icon: require("vue-material-design-icons/ArrowExpandHorizontal"),
        level: "high",
        active: false,
        exampleImage: null,
      },
      _inconsistencies_typos: {
        title: "Spelling",
        description: "Detect spelling mistakes",
        icon: require("vue-material-design-icons/Spellcheck"),
        level: "high",
        active: false,
        exampleImage: null,
      },
      _inconsistencies_writeGood: {
        title: "Style",
        description: "Detect stylistic issues – passive voice, weasel words, overuse of adverbs, cliches and similar",
        icon: require("vue-material-design-icons/FileWordBox"),
        level: "low",
        active: false,
        exampleImage: null,
      },
      _inconsistencies_insensitiveness: {
        title: "Insensitiveness",
        description: "Detect gender favouring, polarising, race related, religion inconsiderate, or other unequal phrasing",
        icon: require("vue-material-design-icons/EmoticonCryOutline"),
        level: "low",
        active: false,
        exampleImage: null,
      },
      _inconsistencies_dynamic: {
        title: "Values",
        description: "Detects values, that should/could be replaced by placeholders to make text more customizable",
        icon: require("vue-material-design-icons/Resistor"),
        level: "low",
        active: false,
        exampleImage: null,
      },
      _inconsistencies_noEnglish: {
        title: "Missing default translation",
        description: "Detect missing translation for default locale",
        icon: require("vue-material-design-icons/EarthOff"),
        level: "high",
        active: false,
        exampleImage: null,
      },
    },
    locales: {
      // "en-GB": {
      //   important: true,
      // },
    },
    view: {
      hardWrap: false,
    },
  },
  getters: {
    getActiveChecks: state => Object.keys(state.checks).filter(c => state.checks[c].active),
    isActive: state => check => state.checks[check] && state.checks[check].active,
    getCheckData: state => check => state.checks[check],
    getLocales: state => Object.keys(state.locales),
    getLocalesCount: state => Object.keys(state.locales).length,
    getImportantLocales: state => Object.keys(state.locales).filter(l => state.locales[l].important),
    isImportant: state => locale => state.locales[locale].important,
    hardWrap: state => state.view.hardWrap,
  },
  mutations: {
    toggleCheckActiveness(state, check) {
      state.checks[check].active = !state.checks[check].active
    },
    setCheckActiveness(state, payload) {
      // payload = {
      //   check,
      //   newValue,
      // }
      state.checks[payload.check].active = payload.newValue
    },
    setDefaultCheckActiveness(state) {
      Object.keys(state.checks).forEach((c) => {
        state.checks[c].active = !defaults.DEFAULT_DISABLED_CHECKS.includes(c)
      })
    },
    setCheckLevel(state, payload) {
      // payload = {
      //   check,
      //   level,
      // }
      state.checks[payload.check].level = payload.level
    },
    setDefaultCheckLevels(state) {
      Object.keys(state.checks).forEach((c) => {
        state.checks[c].level = defaults.DEFAULT_IMPORTANT_CHECKS.includes(c) ? "high" : "low"
      })
    },
    addLocale(state, locale) {
      // let imp
      // if (localStorage.getItem("Stranger-Strings")) {
      //   imp = JSON.parse(localStorage.getItem("Stranger-Strings")).locales[locale]
      // }
      state.locales[locale] = {
        important: defaults.IMPORTANT_LOCALES.includes(locale),
      }
    },
    setLocaleImportance(state, payload) {
      // payload = {
      //   locale,
      //   important, // Boolean
      // }
      state.locales[payload.locale].important = payload.important
    },
    toggleHardWrap(state) {
      state.view.hardWrap = !state.view.hardWrap
    },
  },
  plugins: [vuexPersist.plugin],
})