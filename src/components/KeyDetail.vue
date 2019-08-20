<template>
  <div>
    <!-- MODAL: KEY DETAIL -->
    <b-modal
      id="keyDetailModal"
      v-model="modalKeyDetail"
      :title="item.key"
      variant="primary"
      size="lg"
      no-fade
      hide-footer
      lazy
      @hide="$emit('close')"
    >
      <div class="translationsForm">
        <b-form inline>
          <b-button
            class="ml-auto p-2"
            :disabled="!reportConfig.active"
            variant="outline-secondary"
            @click="showReportModal('not-specified')"
          >
            <ReportIcon/>  Report
          </b-button>
        </b-form>
      </div>

      <table v-if="item" class="table table-sm b-table table-striped key-detail-table">
        <thead>
          <th colspan="2" class="key-detail-header">Locale</th>
          <th class="key-detail-header"></th>
          <th class="key-detail-header">Translation</th>
          <th class="key-detail-header"></th>
        </thead>

        <tbody>
        <tr :key="locale" v-for="locale in getLocales" v-if="activeTranslations && activeTranslations[locale]">
          <td class="flag-id">
            <div class="flag-icon"><CountryFlag :country="locale.slice(3, 5).toLowerCase()" size="small"></CountryFlag></div>
          </td>
          <td class="locale-id">
            {{ locale }}
          </td>
          <td class="alerts">
            <CheckAlerts
              :missingPlaceholders="getMissingEntities(locale, activeTranslations, '_placeholders')"
              :missingTags="getMissingEntities(locale, activeTranslations, '_tags')
                .filter(t => !(getMissingEntities(locale, activeTranslations, '_disallowedTags') || []).includes(t))"
              :length="hasInconsistentLength(locale, activeTranslations)"
              onlyActive
            />
          </td>
          <td class="translation">
            <Highlighting
              :content="JSON.stringify(activeTranslations[locale].content).slice(1, -1)"
              :locale="locale"
              :writeGood="isActive('_inconsistencies_writeGood') && activeTranslations[locale]._writeGood"
              :typos="activeTranslations[locale]._typos !== 'unsupported language' && isActive('_inconsistencies_writeGood') ?
                      activeTranslations[locale]._typos : null"
              :placeholders="activeTranslations[locale]._placeholders"
              :tags="activeTranslations[locale]._tags"
              :disallowedTags="isActive('_inconsistencies_tags') && activeTranslations[locale]._disallowedTags"
              :dynamics="isActive('_inconsistencies_dynamic') && activeTranslations[locale]._dynamic"
              :insensitiveness="isActive('_inconsistencies_insensitiveness') && activeTranslations[locale]._insensitiveness"
              :firstCharType="isActive('_inconsistencies_firstCharType')
                && [activeTranslations[locale]._firstCharType, getExpectedFirstCharType(activeTranslations)]"
              :lastCharType="isActive('_inconsistencies_lastCharType')
                && [activeTranslations[locale]._lastCharType, getExpectedLastCharType(activeTranslations)]"
            />
          </td>
          <td class="actions">
            <b-button
              class="action-b"
              v-b-tooltip.hover
              :disabled="!reportConfig.active"
              :title="`Copy ${locale} translation to clipboard`"
              size="sm"
              variant="outline-secondary"
              v-clipboard:copy="JSON.stringify(activeTranslations[locale].content).slice(1, -1)"
            >
              <CopyIcon/>
            </b-button>
            <b-button
              class="action-b"
              v-b-tooltip.hover
              :disabled="!reportConfig.active"
              :title="`report issue in ${locale} translation`"
              size="sm"
              variant="outline-secondary"
              @click="showReportModal(locale)"
            >
              <ReportIcon/>
            </b-button>
          </td>
        </tr>
        <tr v-else>
          <td class="flag-id">
            <div class="flag-icon transparent"><CountryFlag :country="locale.slice(3, 5).toLowerCase()" size="small"></CountryFlag></div>
          </td>
          <td colspan="2" :class="isImportant(locale) ? 'locale-id not-translated-primary' : 'locale-id not-translated-secondary'" scope="row">
            {{ locale }}
          </td>
          <td :class="isImportant(locale) ?'locale-id not-translated-primary' : 'locale-id not-translated-secondary'">
            Not translated
          </td>
          <td class="actions">
            <b-button
              v-b-tooltip.hover
              :disabled="!reportConfig.active"
              :title="`report missing translation for ${locale}`"
              size="sm"
              variant="outline-secondary"
              @click="showReportModal(locale)"
            >
              <ReportIcon/>
            </b-button>
          </td>
        </tr>
        </tbody>
      </table>
    </b-modal>
    <Reporting
      v-if="showReporting"
      :locale="reportedLocale"
      :translationKey="item.key"
      :email="user.email"
      :notTranslated="notTranslated"
      :errorType="notTranslated.includes(reportedLocale) ? 'missing translations' : null"
      :notifyUser="notifyUser"
      @close="closeReportModal"
    />
  </div>
</template>

<script>
import ReportIcon from "vue-material-design-icons/AlertOctagon"
import CopyIcon from "vue-material-design-icons/ContentCopy"
import CountryFlag from "vue-country-flag"

import NProgress from "nprogress"
import _ from "lodash"
import { mapGetters } from "vuex"
import { FbDb } from "../modules/firebase"
import maxExpansionRatio from "../../common/maxExpansionRatio"
import Reporting from "./Reporting"
import TranslationProgress from "../components/TranslationProgress"
import Highlighting from "../components/Highlighting"
import CheckAlerts from "../components/CheckAlerts"


export default {
  name: "KeyDetail",
  props: {
    user: { type: Object, required: true },
    item: { type: Object, required: true },
    notifyUser: { type: Function, required: true },
  },
  components: {
    TranslationProgress,
    Reporting,
    CountryFlag,
    ReportIcon,
    Highlighting,
    CheckAlerts,
    CopyIcon,
  },
  data() {
    return {
      modalKeyDetail: false,

      activeTranslations: null,

      // Reporting
      showReporting: false,
      reportedLocale: "not-specified",
      reportConfig: {
        active: false,
        option: "",
        webhook: "",
        slackChannel: "",
      },
    }
  },
  computed: {
    ...mapGetters([
      "isActive",
      "getLocales",
      "getLocalesCount",
      "getImportantLocales",
      "isImportant",
    ]),
    notTranslated() {
      return this.getLocales.filter(l => this.activeTranslations && !this.activeTranslations[l])
    },
  },
  created() {
    NProgress.start()
    FbDb.ref("reportingConf").once("value", (snapshot) => {
      if (snapshot.val()) {
        this.reportConfig = snapshot.val()
      }
    })
    const fbKey = this.item.key.replace(/[.#$/[\]]/gmi, "-")
    FbDb.ref(`translations/${fbKey}`).once("value", (snapshot) => {
      if (snapshot.val()) {
        this.activeTranslations = snapshot.val()
        this.modalKeyDetail = true
        NProgress.done()
      }
    })
    NProgress.done()
  },
  methods: {
    showReportModal(locale) {
      this.reportedLocale = locale
      this.showReporting = true
    },
    closeReportModal() {
      this.showReporting = false
    },
    getExpectedFirstCharType(activeTranslations) {
      const firstChars = Object.values(activeTranslations).map(t => t._firstCharType)
      return firstChars.sort((a, b) => firstChars.filter(v => v === a).length - firstChars.filter(v => v === b).length).pop()
    },
    getExpectedLastCharType(activeTranslations) {
      const lastChars = Object.values(activeTranslations).map(t => t._lastCharType)
      return lastChars.sort((a, b) => lastChars.filter(v => v === a).length - lastChars.filter(v => v === b).length).pop()
    },
    getMissingEntities(lang, translations, type) {
      /*
      e.g. for placeholders
      en -> ph1, ph1, ph1, ph2
      de -> ph1, ph1, ph2
      cz -> ph1, ph1, ph3

      allPlaceholders -> ph1, ph1. ph1, ph2, ph3
       */
      const allEntities = _.reduce(translations, (acc, translation) => {
        (translation[type] || []).forEach((entity) => {
          const entityAppearance = translation[type].filter(e => e === entity).length
          if (acc.filter(e => e === entity).length < entityAppearance) {
            // eslint-disable-next-line no-param-reassign
            acc = _.without(acc, entity).concat(_.fill(Array(entityAppearance), entity))
          }
        })
        return acc
      }, [])

      return allEntities.reduce((acc, entity) => {
        const totalEntityAppearance = allEntities.filter(e => e === entity).length
        const translationEntityAppearance = (
          translations[lang] && translations[lang][type]
          && translations[lang][type].filter(e => e === entity).length
        ) || 0
        return _.without(acc, entity).concat(_.fill(Array(totalEntityAppearance - translationEntityAppearance), entity))
      }, allEntities)
    },
    hasInconsistentLength(lang, translations) {
      if (translations[lang] && translations["en-GB"] && translations["en-GB"].content.length > 0) {
        const baseLength = translations["en-GB"].content.length
        return (translations[lang].content.length / baseLength) > maxExpansionRatio(baseLength)
      }
      return false
    },
    copyToClipboard(locale) {
      const content = JSON.stringify(this.activeTranslations[locale].content).slice(1, -1)
      this.$copyText(content).then(() => this.notifyUser("Copied!", `Translation of ${locale} copied to your clipboard.`, "success"))
    },
  },
}
</script>

<style scoped>
  .key-detail-header {
    padding-top: 10px;
    padding-bottom: 10px;
    font-weight: 600;
    font-size: 16px;
    border-bottom: 0.5px solid grey;
    border-top: none;
    background-color: #f9fafc;
  }
  .key-detail-table {
    font-size: 13px;
  }
  td {
    vertical-align: middle;
    padding: 5px;
  }
  .translationsForm {
    margin-bottom: 16px;
  }
  .locale-id {
    font-weight: bolder;
    width: 100px;
    border: none !important;
  }
  .flag-id {
    width: 30px;
    border: none !important;
  }
  .alerts {
    width: 85px;
  }
  .translation {
    max-width: 80%;
    border: none !important;
  }
  .actions {
    width: 90px;
    text-align: center;
  }
  .action-b {
    margin: 2px;
  }
  .flag-icon {
    width: 30px;
    height: 20px;
    text-align: center;
    margin-top: -33px;
  }
  .transparent {
    opacity: 0.3;
  }
  .not-translated-primary {
    color: rgba(255, 0, 0, 0.65);
  }
  .not-translated-secondary {
    color: #FFC107;
  }
</style>
