<template>
  <div>
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
      @hide="$emit('close')"
    >
      <div class="keyOverview" v-if="items[activeKey]">
        <div class="errors-overview">
          <div v-for="inconsistency in getItemInconsistencies(items[activeKey])" :key="inconsistency" class="error">
            <div v-if="allowedChecks && allowedChecks.includes(inconsistency) && inconsistency === '_inconsistencies_placeholders'">
              <div class="inline-error"><PlaceholderIcon :size="30"></PlaceholderIcon></div> - missing placeholders
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
            <div v-else-if="allowedChecks && allowedChecks.includes(inconsistency) && inconsistency === '_inconsistencies_insensitiveness'">
              <div class="inline-warning">
                <InsensitivenessIcon :size="30"></InsensitivenessIcon>
              </div> - insensitiveness (in locales: {{ items[activeKey][inconsistency].join(", ") }})
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
            :missingPrimary="importantLoc.filter(l => !items[activeKey].translated.includes(l)).length"
            :missingSecondary="
            getMaximumTranslations()
            - items[activeKey].translated.length
            - importantLoc.filter(l => !items[activeKey].translated.includes(l)).length"
          ></LocalizationProgressChart>
        </div>
        <div class="progress-legend">
          <div v-if="importantLoc.filter(l => !items[activeKey].translated.includes(l)).length > 0">
            <strong class="missing-important">Missing primary locales: </strong>
            <strong>{{ importantLoc.filter(l => !items[activeKey].translated.includes(l)).join(", ") }}</strong>
          </div>
          <div v-if="locales.filter(l => !items[activeKey].translated.includes(l) && !importantLoc.includes(l)).length > 0">
            <strong class="missing-normal">Missing secondary locales: </strong>
            {{ locales.filter(l => !items[activeKey].translated.includes(l) && !importantLoc.includes(l)).join(", ") }}
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

      <table v-if="items[activeKey]" class="table table-sm b-table table-striped key-detail-table">
        <thead>
        <th colspan="2" class="key-detail-header">Locale</th>
        <th class="key-detail-header">Translation</th>
        <th class="key-detail-header">Errors</th>
        <th class="key-detail-header"></th>
        </thead>

        <tbody>
        <tr :key="locale" v-for="locale in locales" v-if="activeTranslations[locale]">
          <td class="flag-id">
            <div class="flag-icon"><CountryFlag :country="locale.slice(3, 5).toLowerCase()" size="small"></CountryFlag></div>
          </td>
          <td class="locale-id">
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
              v-if="activeTranslations[locale]._insensitiveness && allowedChecks.includes('_inconsistencies_insensitiveness')"
              class="inline-warning"
              v-b-popover.hover="activeTranslations[locale]._insensitiveness.join(',\n')"
              title="insensitiveness"
            >
              <InsensitivenessIcon></InsensitivenessIcon>
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
              :id="`typosIndicator_${locale}`"
              v-if="activeTranslations[locale]._typos
                && activeTranslations[locale]._typos !== 'unsupported language'
                && allowedChecks.includes('_inconsistencies_typos')"
              class="inline-error clickable"
            >
              <TyposIcon fill-color="#ef0000"></TyposIcon>
              <b-popover
                :target="`typosIndicator_${locale}`"
                title="Typos"
                triggers="click"
              >
                <div v-for="typo in removeDuplicates(activeTranslations[locale]._typos)" :key="typo">
                  <strong :class="dictsExpansionData[locale].includes(typo) ? 'strikethrough' : ''">{{ typo }}  </strong>
                  <b-button
                    @click="addWordToDict(typo, locale)"
                    :disabled="dictsExpansionData[locale].includes(typo)"
                    variant="outline-success"
                    size="sm">
                    add to {{ locale }} dictionary
                  </b-button>
                </div>
                <div class="note">note: please take in mind that changes in dictionaries will be visible after next spellchecking (&lt;1 min)</div>
              </b-popover>
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
              :id="`firstIndicator_${locale}`"
              v-if="allowedChecks.includes('_inconsistencies_firstCharType')
                && activeTranslations[locale]._firstCharType !== getExpectedFirstCharType(activeTranslations)"
              class="inline-warning"
            >
              <FirstIcon></FirstIcon>
              <b-popover
                :target="`firstIndicator_${locale}`"
                title="First character inconsistency"
                triggers="hover"
              >
                First character is
                <strong> {{ activeTranslations[locale]._firstCharType }} </strong>
                but expected
                <strong> {{  getExpectedFirstCharType(activeTranslations) }} </strong>
              </b-popover>
            </div>
            <div
              :id="`lastIndicator_${locale}`"
              v-if="allowedChecks.includes('_inconsistencies_lastCharType')
                && activeTranslations[locale]._lastCharType !== getExpectedLastCharType(activeTranslations)"
              class="inline-warning"
            >
              <LastIcon></LastIcon>
              <b-popover
                :target="`lastIndicator_${locale}`"
                title="Last character inconsistency"
                triggers="hover"
              >
                Last character is
                <strong> {{ activeTranslations[locale]._lastCharType }} </strong>
                but expected
                <strong> {{  getExpectedLastCharType(activeTranslations) }} </strong>
              </b-popover>
            </div>
          </td>
          <td>
            <b-button
              v-b-tooltip.hover
              :disabled="!reportConfig.active"
              :title="`report ${locale}`"
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
          <td :class="importantLoc.includes(locale) ? 'locale-id not-translated-primary' : 'locale-id not-translated-secondary'" scope="row">
            {{ locale }}
          </td>
          <td colspan="3" :class="importantLoc.includes(locale) ?'locale-id not-translated-primary' : 'locale-id not-translated-secondary'">
            Not translated
          </td>
        </tr>
        </tbody>
      </table>
    </b-modal>
    <Reporting
      v-if="showReporting"
      :locale="reportedLocale"
      :key="items[activeKey].key"
      :email="user.email"
      @close="closeReportModal"
    />
  </div>
</template>

<script>
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
import ReportIcon from "vue-material-design-icons/AlertOctagon"
import CountryFlag from "vue-country-flag"

import NProgress from "nprogress"
import { FbDb } from "../modules/firebase"
import * as helpers from "../services/helpers"
import * as gcFunctions from "../modules/functionsApi"
import * as defaults from "../../common/config"
import maxExpansionRatio from "../../common/maxExpansionRatio"
import Reporting from "./Reporting"
import LocalizationProgressChart from "./LocalizationProgressChart"


export default {
  name: "KeyDetail",
  props: {
    user: { type: Object, required: true },
    items: { type: Object, required: true },
    locales: { type: Array, required: true },
    activeKey: { type: String, required: true },
    importantLoc: { type: Array, required: true },
  },
  components: {
    Reporting,
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
    LocalizationProgressChart,
    CountryFlag,
    ReportIcon,
  },
  data() {
    return {
      modalKeyDetail: false,

      allowedChecks: [],
      dictsExpansionData: {},
      activeTranslations: null,

      showTagsChecked: false,

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
  created() {
    NProgress.start()
    this.allowedChecks = this.loadUserChecksConfig()
    this.activeTranslations = {}
    FbDb.ref("dictsExpansion/").once("value", (dictsData) => {
      this.dictsExpansionData = dictsData.val()
    })
    FbDb.ref("reportingConf").once("value", (snapshot) => {
      if (snapshot.val()) {
        this.reportConfig = snapshot.val()
      }
    })
    FbDb.ref(`translations/${this.activeKey}`).once("value", (snapshot) => {
      if (snapshot.val()) {
        this.activeTranslations = snapshot.val()
        this.modalKeyDetail = true
        NProgress.done()
      }
    })
    NProgress.done()
    console.log(`1:${this.getMaximumTranslations()}2:${this.items[this.activeKey].translated.length}3:${this.importantLoc.filter(l => !this.items[this.activeKey].translated.includes(l)).length}`)
  },
  methods: {
    showReportModal(locale) {
      this.reportedLocale = locale
      this.showReporting = true
    },
    closeReportModal() {
      this.showReporting = false
    },
    loadUserChecksConfig() {
      if (localStorage.getItem("allowedChecks")) {
        return JSON.parse(localStorage.getItem("allowedChecks"))
      }
      return Object.keys(this.errors).filter(err => !defaults.DEFAULT_DISABLED_CHECKS.includes(err))
    },
    getItemInconsistencies(key) {
      return helpers.getItemInconsistencies(key)
    },
    getMaximumTranslations() {
      return this.locales ? this.locales.length : 0
    },
    getTranslationContent(translation) {
      if (!translation) {
        return null
      }
      const { content } = translation
      return this.showTagsChecked ? content : this.stripHtml(content)
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
            highlightedParts.push(suggestion.reason.match(/".+(?=")/m) && suggestion.reason.match(/".+(?=")/m)[0].slice(1))
          })
        }
        highlightedParts.forEach((part) => {
          content = content.replace(
            new RegExp(`${part}(?=[^\\w]|$)`, "g"),
            match => `<span class="inline-highlight-wg">${match}</span>`,
          )
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
              new RegExp(`${_.escapeRegExp(typo)}(?=[^\\w]|$)`, "g"),
              match => `<span class="inline-highlight-typos">${match}</span>`,
            )
          })
        }
      }
      return content
    },
    getWriteGoodReasons(writeGood) {
      return this.removeDuplicates(writeGood.map(lint => lint.reason)).join(",\n")
    },
    removeDuplicates(array) {
      return [...new Set(array)]
    },
    addWordToDict(word, locale) {
      FbDb.ref(`dictsExpansion/${locale}`).once("value", (snapshot) => {
        if (!snapshot.val().includes(word)) {
          FbDb.ref(`dictsExpansion/${locale}/${snapshot.val().length}`).set(word)
          gcFunctions.inconsistenciesUpdate()
          FbDb.ref("dictsExpansion/").once("value", (updatedData) => {
            this.dictsExpansionData = updatedData.val()
          })
        }
      })
    },
    getExpectedFirstCharType(activeTranslations) {
      const firstChars = Object.values(activeTranslations).map(t => t._firstCharType)
      return firstChars.sort((a, b) => firstChars.filter(v => v === a).length - firstChars.filter(v => v === b).length).pop()
    },
    getExpectedLastCharType(activeTranslations) {
      const lastChars = Object.values(activeTranslations).map(t => t._lastCharType)
      return lastChars.sort((a, b) => lastChars.filter(v => v === a).length - lastChars.filter(v => v === b).length).pop()
    },
    getMissingPlaceholders(lang, translations) {
      /*
      e.g. for placeholder
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
    hasInconsistentLength(lang, translations) {
      if (translations[lang] && translations["en-GB"] && translations["en-GB"].content.length > 0) {
        const baseLength = translations["en-GB"].content.length
        return (translations[lang].content.length / baseLength) > maxExpansionRatio(baseLength)
      }
      return false
    },
    stripHtml(text) {
      const tmpHTML = document.createElement("div")
      tmpHTML.innerHTML = text
      return tmpHTML.textContent || tmpHTML.innerText || ""
    },
    getPlaceholders(translation) {
      if (!translation._placeholders) {
        return null
      }
      return helpers.getPlaceholders(translation._placeholders)
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
  .strikethrough {
    text-decoration: line-through;
  }
  .note {
    font-size: 8px;
    color: gray;
  }
  .clickable {
    cursor: pointer;
  }
  .errors-overview {
    width: 33%;
  }
  .progress-chart {
    width: 33%;
    text-align: center;
  }
  .progress-legend {
    font-size: 16px;
    display: inline-block;
    width: 33%;
    float: right;
  }
  .missing-important {
    color: #D5011B;
  }
  .missing-normal {
    color: #ffb508;
  }
  .unimportant {
    color: gray;
    display: contents;
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
  .error {
    display: list-item;
    margin: 1px;
    font-size: 16px;
    border: 1px;
    list-style: none;
    padding-bottom: 10px;
  }
  .not-translated-primary {
    color: rgba(255, 0, 0, 0.65);
  }
  .not-translated-secondary {
    color: #FFC107;
  }
  .locale-id {
    font-weight: bolder;
    width: max-content;
    border: none !important;
  }
  .flag-id {
    width: 30px;
    border: none !important;
  }
  .translation {
    width: 80%;
    border: none !important;
  }
  .errors-col {
    border: none !important;
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

</style>
