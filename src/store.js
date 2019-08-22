/* eslint-disable global-require,no-param-reassign */
import Vue from "vue"
import Vuex from "vuex"
import VuexPersist from "vuex-persist"

import * as defaults from "../common/config"

Vue.use(Vuex)

const vuexPersist = new VuexPersist({
  key: `Stranger-Strings-${process.env.VUE_APP_GITHUB_REPO || process.env.VUE_APP_PHRASEAPP_PROJECT_ID}`,
  storage: localStorage,
})

export default new Vuex.Store({
  state: {
    checks: {
      _inconsistencies_placeholders: {
        title: "Placeholders",
        description: "Detects missing/excess/inconsistent placeholders",
        level: "error",
        active: true,
      },
      _inconsistencies_firstCharType: {
        title: "First character",
        description: "Detects inconsistencies of first character",
        level: "warning",
        active: true,
      },
      _inconsistencies_lastCharType: {
        title: "Last character",
        description: "Detects inconsistencies of last character",
        level: "warning",
        active: true,
      },
      _inconsistencies_tags: {
        title: "HTML tags",
        description: "Detects invalid HTML and prohibited HTML tags",
        level: "error",
        active: true,
      },
      _inconsistencies_length: {
        title: "Length",
        description: "Detects suspicious variations in length",
        level: "warning",
        active: true,
      },
      _inconsistencies_typos: {
        title: "Spelling",
        description: "Detects spelling mistakes",
        level: "warning",
        active: true,
      },
      _inconsistencies_writeGood: {
        title: "Style",
        description: "Detects stylistic issues – passive voice, weasel words, overuse of adverbs, cliches and " +
          "similar (available only for english and german translations, uses <a href='https://github.com/btford/write-good'>write-good library</a>)",
        level: "suggestion",
        active: true,
      },
      _inconsistencies_insensitiveness: {
        title: "Insensitiveness",
        description: "Detects gender favouring, polarising, race related, religion inconsiderate, or other unequal " +
          "phrasing (available only for english translations, uses <a href='https://github.com/get-alex/alex'>Alex library</a>)",
        level: "suggestion",
        active: true,
      },
      _inconsistencies_dynamic: {
        title: "Values",
        description: "Detects values, that should/could be replaced by placeholders to make text more customizable",
        level: "suggestion",
        active: true,
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
    getCheckData: state => check => state.checks[check] || {},
    getLocales: state => Object.keys(state.locales),
    getLocalesCount: state => Object.keys(state.locales).length,
    getImportantLocales: state => Object.keys(state.locales).filter(l => state.locales[l].important),
    isImportant: state => locale => state.locales[locale] && state.locales[locale].important,
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
    setDefaultCheckLevels(state) {
      Object.keys(state.checks).forEach((c) => {
        if (defaults.DEFAULT_IMPORTANT_CHECKS.includes(c)) {
          state.checks[c].level = "error"
        } else if (defaults.DEFAULT_UNIMPORTANT_CHECKS.includes(c)) {
          state.checks[c].level = "suggestion"
        } else {
          state.checks[c].level = "warning"
        }
      })
    },
    setCheckLevel(state, payload) {
      // payload = {
      //   check,
      //   level,
      // }
      state.checks[payload.check].level = payload.level
    },
    addLocale(state, locale) {
      const newLocale = {}
      newLocale[locale] = {
        important: defaults.IMPORTANT_LOCALES.includes(locale),
      }
      state.locales = { ...state.locales, ...newLocale } // allows computed behaviour
    },
    setLocaleImportance(state, payload) {
      // payload = {
      //   locale,
      //   important, // Boolean
      // }
      state.locales[payload.locale].important = payload.important
    },
    setDefaultLocaleImportance(state) {
      Object.keys(state.locales).forEach((l) => {
        state.locales[l] = {
          important: defaults.IMPORTANT_LOCALES.includes(l),
        }
      })
    },
    toggleHardWrap(state) {
      state.view.hardWrap = !state.view.hardWrap
    },
    setDefaultHardWrap(state) {
      state.view.hardWrap = false
    },
  },
  plugins: [vuexPersist.plugin],
})
