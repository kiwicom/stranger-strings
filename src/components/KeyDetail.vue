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
      @hidden="hideKeyDetail"
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
          <b-form-checkbox class="ml-3" v-model="escapeTranslationsChecked">Escape translations</b-form-checkbox>
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
          <td :class="imporantLoc.includes(locale) ? 'locale-id not-translated-primary' : 'locale-id not-translated-secondary'" scope="row">
            {{ locale }}
          </td>
          <td colspan="3" :class="imporantLoc.includes(locale) ?'locale-id not-translated-primary' : 'locale-id not-translated-secondary'">
            Not translated
          </td>
        </tr>
        </tbody>
      </table>
    </b-modal>
    <Reporting
      v-if="showReporting"
      :locale="reportedLocale"
      :key=""
      :email="user.email"
      :close="closeReportModal"
    />
  </div>
</template>

<script>
import Reporting from "./Reporting"

export default {
  name: "KeyDetail",
  props: {
    user: { type: Object, required: true },
  },
  components: {
    Reporting,
  },
  data() {
    return {
      // Modals
      showReporting: false,

      // Reporting
      reportedLocale: "not-specified",
    }
  },
  methods: {
    showReportModal(locale) {
      this.reportedLocale = locale
      this.showReporting = true
    },
    closeReportModal() {
      this.showReporting = false
    },
  },
}
</script>

<style scoped>

</style>
