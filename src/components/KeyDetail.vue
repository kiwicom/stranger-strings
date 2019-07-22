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
        <th class="key-detail-header">Translation</th>
        <th class="key-detail-header">Errors</th>
        <th class="key-detail-header"></th>
        </thead>

        <tbody>
        <tr :key="locale" v-for="locale in getLocales" v-if="activeTranslations[locale]">
          <td class="flag-id">
            <div class="flag-icon"><CountryFlag :country="locale.slice(3, 5).toLowerCase()" size="small"></CountryFlag></div>
          </td>
          <td class="locale-id">
            {{ locale }}
          </td>
          <td class="translation">
            <Highlighting
              :content="activeTranslations[locale].content"
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
          <td class="errors-col">
            <div
              v-if="activeTranslations[locale]._writeGood && isActive('_inconsistencies_writeGood')"
              class="inline-warning"
              v-b-popover.hover="getWriteGoodReasons(activeTranslations[locale]._writeGood)"
              title="write good"
            >
              <component :is="getIcon('_inconsistencies_writeGood')" />
            </div>
            <div
              v-if="activeTranslations[locale]._insensitiveness && isActive('_inconsistencies_insensitiveness')"
              class="inline-warning"
              v-b-popover.hover="activeTranslations[locale]._insensitiveness.join(',\n')"
              title="insensitiveness"
            >
              <component :is="getIcon('_inconsistencies_insensitiveness')" />
            </div>
            <div
              v-if="hasInconsistentLength(locale, activeTranslations) && isActive('_inconsistencies_length')"
              class="inline-warning"
              v-b-popover.hover="'suspiciously long translation'"
              title="length"
            >
              <component :is="getIcon('_inconsistencies_length')" />
            </div>
            <div
              v-if="getMissingPlaceholders(locale, activeTranslations).length && isActive('_inconsistencies_placeholders')"
              class="inline-error"
              v-b-popover.hover="getMissingPlaceholders(locale, activeTranslations).join('\n')"
              title="Missing placeholders"
            >
              <component :is="getIcon('_inconsistencies_placeholders')" fill-color="#ef0000"/>
            </div>
            <div
              :id="`typosIndicator_${locale}`"
              v-if="activeTranslations[locale]._typos
                && activeTranslations[locale]._typos !== 'unsupported language'
                && isActive('_inconsistencies_typos')"
              class="inline-error clickable"
            >
              <component :is="getIcon('_inconsistencies_typos')" fill-color="#ef0000"/>
              <b-popover
                :target="`typosIndicator_${locale}`"
                title="Typos"
                triggers="click blur"
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
              v-if="activeTranslations[locale]._dynamic && isActive('_inconsistencies_dynamic')"
              class="inline-error-dynamic"
              v-b-popover.hover="removeDuplicates(activeTranslations[locale]._dynamic).join('\n')"
              title="Dynamic values"
            >
              <component :is="getIcon('_inconsistencies_dynamic')" fill-color="#800080" />
            </div>
            <div
              :id="`firstIndicator_${locale}`"
              v-if="isActive('_inconsistencies_firstCharType')
                && activeTranslations[locale]._firstCharType !== getExpectedFirstCharType(activeTranslations)"
              class="inline-warning"
            >
              <component :is="getIcon('_inconsistencies_firstCharType')" />
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
              v-if="isActive('_inconsistencies_lastCharType')
                && activeTranslations[locale]._lastCharType !== getExpectedLastCharType(activeTranslations)"
              class="inline-warning"
            >
              <component :is="getIcon('_inconsistencies_lastCharType')" />
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
          <td :class="isImportant(locale) ? 'locale-id not-translated-primary' : 'locale-id not-translated-secondary'" scope="row">
            {{ locale }}
          </td>
          <td colspan="3" :class="isImportant(locale) ?'locale-id not-translated-primary' : 'locale-id not-translated-secondary'">
            Not translated
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
      :notifyUser="notifyUser"
      @close="closeReportModal"
    />
  </div>
</template>

<script>
import ReportIcon from "vue-material-design-icons/AlertOctagon"
import CountryFlag from "vue-country-flag"

import NProgress from "nprogress"
import _ from "lodash"
import { mapGetters } from "vuex"
import { FbDb } from "../modules/firebase"
import * as helpers from "../services/helpers"
import * as gcFunctions from "../modules/functionsApi"
import maxExpansionRatio from "../../common/maxExpansionRatio"
import Reporting from "./Reporting"
import TranslationProgress from "../components/TranslationProgress"
import Highlighting from "../components/Highlighting"


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
  },
  data() {
    return {
      modalKeyDetail: false,

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
  computed: {
    ...mapGetters([
      "isActive",
      "getLocales",
      "getLocalesCount",
      "getImportantLocales",
      "isImportant",
      "getCheckData",
    ]),
  },
  created() {
    NProgress.start()
    this.activeTranslations = {}
    FbDb.ref("dictsExpansion/").once("value", (dictsData) => {
      this.dictsExpansionData = dictsData.val()
    })
    FbDb.ref("reportingConf").once("value", (snapshot) => {
      if (snapshot.val()) {
        this.reportConfig = snapshot.val()
      }
    })
    const fbKey = this.item.key.includes(".") ? this.item.key.split(".").join("-") : this.item.key
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
    getItemInconsistencies(key) {
      return helpers.getItemInconsistencies(key)
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
      if (this.isActive("_inconsistencies_writeGood")) {
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
      if (this.isActive("_inconsistencies_dynamic")) {
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
      if (this.isActive("_inconsistencies_typos")) {
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
    getIcon(checkKey) {
      return `${checkKey.replace(/.*_/g, "")}Icon`
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
  .note {
    font-size: 8px;
    color: gray;
  }
  .clickable {
    cursor: pointer;
  }
  .clickable:hover {
    color: #f9fafc;
    background-color: #D5011B;
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
  .translationsForm {
    margin-bottom: 16px;
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
    max-width: 900px;
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
  .not-translated-primary {
    color: rgba(255, 0, 0, 0.65);
  }
  .not-translated-secondary {
    color: #FFC107;
  }
</style>
