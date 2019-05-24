<template>
  <b-modal
    v-model="modalAdminConfig"
    :title="'Admin Configuration'"
    size="lg"
    ok-title="Save"
    @ok="updateAdminConfig"
    @hide="$emit('close')"
  >
    <div class="config">
      <h4>Write Good</h4>
      <div class="setDefault" v-if="writeGoodLoaded"><b-button variant="link" @click="setDefaultWriteGoodConfig">Set default config</b-button></div>
      <div v-if="writeGoodLoaded">
        <div v-for="(settings, lang) in writeGoodConfig" :key="lang">
          <div class="wgLangHeader">{{ lang }}:</div>
          <b-form-checkbox
            v-for="(value, option) in settings"
            :key="option"
            :checked="value"
            @change="toggleWriteGoodSetting(lang, option)"
            style="display: block"
          >
            <strong>{{ option }}</strong> ({{ optionsDescription[option] }})
          </b-form-checkbox>
        </div>
        <div class="regexInput">
          <label for="regFormIn">Regex:</label>
          <b-form-input
            if="regFormIn"
            v-model="placeholderRegex"
            type="text"
            :placeholder="'e.g. ({{\\w+}})'"
          ></b-form-input>
        </div>
      </div>
      <div v-else>Loading...</div>
    </div>

    <div class="config">
      <h4>Placeholder</h4>
      <div v-if="placeholderLoaded">
        <div class="regexPreview">
          <div class="previewText">
            <label>Preview:</label>
            <b-form-textarea id="textarea1"
                             v-model="regexPreviewText"
                             :rows="6"
                             :max-rows="6">
            </b-form-textarea>
          </div>
          <div class="matched-placeholders">
            <label>Matched placeholders:</label>
            <ul>
              <li v-for="mp in matchedPlaceholders" :key="mp">{{ mp }}</li>
            </ul>
          </div>
        </div>
      </div>
      <div v-else>Loading...</div>
    </div>

    <div class="config">
      <h4>Insensitiveness</h4>
      <div v-if="insensitivenessLoaded">
        <label for="range-1">Profanity sureness level: {{ insensitivenessConfig.profanitySureness }}</label>
        <b-form-input number id="range-1" v-model="insensitivenessConfig.profanitySureness" type="range" min="0" max="2"></b-form-input>
        <div class="mt-2">Detecting words that are <strong>{{ getProfanitySureness }}</strong></div>
      </div>
      <div v-else>Loading...</div>
    </div>

    <div class="config">
      <h4>Reporting</h4>
      <div v-if="reportingLoaded">
        <div class="mx-auto" style="width: fit-content">
          <b-form-checkbox
            switch
            v-model="reportConfig.active"
          >
            Enable Reporting
          </b-form-checkbox>
        </div>
        <div v-if="reportConfig.active" class="mt-3">
          <label for="report-option"><strong>Select reporting option:</strong></label>
          <b-form-select if="report-option" v-model="reportConfig.option" :options="getReportingOptions()"></b-form-select>
        </div>
        <div v-if="reportConfig.active && reportConfig.option === 'Slack'" class="mt-3">
          <label for="webhook"><strong>Enter your <a href="https://api.slack.com/incoming-webhooks">Slack Incoming Webhook URL</a>:</strong></label>
          <b-form-input
            id="webhook"
            :value="reportConfig.webhook"
            @change.native="reportConfig.webhook = $event.target.value"
            placeholder="e.g. https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"
          >
          </b-form-input>
          <label for="slack-channel">Channel:</label>
          <b-input-group prepend="#">
            <!-- note: V-MODEL avoided due to performance issues -->
            <b-input
              id="slack-channel"
              placeholder="translation-bugs"
              :value="reportConfig.slackChannel"
              @change.native="reportConfig.slackChannel = $event.target.value"
            ></b-input>
          </b-input-group>
        </div>
      </div>
      <div v-else>Loading...</div>
    </div>
  </b-modal>
</template>

<script>
import { FbDb } from "../modules/firebase"
import * as reporting from "../services/reporting"
import * as defaults from "../../common/config"
import * as gcFunctions from "../modules/functionsApi"
import ADMIN from "../consts/admin"

export default {
  name: "AdminSettings",
  props: {
    email: { type: String, required: true },
    notifyUser: { type: Function, required: true },
  },
  data() {
    return {
      modalAdminConfig: false,

      // loading
      writeGoodLoaded: false,
      reportingLoaded: false,
      placeholderLoaded: false,
      insensitivenessLoaded: false,

      // Write good config
      writeGoodConfig: {},
      optionsDescription: {
        passive: "Checks for passive voice.",
        illusion: "Checks for lexical illusions – cases where a word is repeated.",
        so: "Checks for \"so\" at the beginning of the sentence.",
        thereIs: "Checks for \"there is\" or \"there are\" at the beginning of the sentence.",
        weasel: "Checks for weasel words.",
        adverb: "Checks for adverbs that can weaken meaning: really, very, extremely, etc.",
        tooWordy: "Checks for wordy phrases and unnecessary words.",
        cliches: "Checks for common cliches.",
        eprime: "Checks for \"to-be\" verbs.",
      },

      // Reporting
      reportConfig: {
        active: false,
        option: "",
        webhook: "",
        slackChannel: "",
      },

      // Placeholder config
      placeholderRegex: "",
      regexPreviewText: "Hi {{name}}, have a nice day!",

      // Insensitiveness config
      insensitivenessConfig: {
        profanitySureness: 2,
        allow: [],
      },
    }
  },
  created() {
    FbDb.ref("writeGood").once("value", (snapshot) => {
      if (snapshot.val()) {
        this.writeGoodConfig = snapshot.val()
      } else {
        this.setDefaultWriteGoodConfig()
      }
      this.writeGoodLoaded = true
    })
    FbDb.ref("reportingConf/").once("value", (snapshot) => {
      if (snapshot.val()) {
        this.reportConfig = snapshot.val()
      }
      this.reportingLoaded = true
    })
    FbDb.ref("insensitivenessConfig/").once("value", (snapshot) => {
      if (snapshot.val()) {
        this.insensitivenessConfig = snapshot.val()
      }
      this.insensitivenessLoaded = true
    })
    FbDb.ref("placeholders/regex").once("value", (snapshot) => {
      if (snapshot.val()) {
        this.placeholderRegex = snapshot.val()
      }
      this.placeholderLoaded = true
    })
    this.modalAdminConfig = true
  },
  computed: {
    getProfanitySureness() {
      const level = this.insensitivenessConfig.profanitySureness
      if (level === 2) {
        return "likely to be profanity"
      }
      if (level === 1) {
        return "maybe profanity"
      }
      return "unlikely to be profanity"
    },
  },
  methods: {
    updateAdminConfig() {
      console.log(ADMIN)
      console.log(this.email)
      if (ADMIN.includes(this.email)) {
        if (this.writeGoodLoaded) {
          FbDb.ref("writeGood").update(this.writeGoodConfig)
        }
        if (this.reportingLoaded) {
          FbDb.ref("reportingConf").update(this.reportConfig)
        }
        if (this.insensitivenessLoaded) {
          FbDb.ref("insensitivenessConfig").update(this.insensitivenessConfig)
        }
        if (this.placeholderLoaded) {
          FbDb.ref("placeholders").update({
            regex: this.placeholderRegex,
          })
        }
        this.notifyUser("Success!", "Configuration successfully updated", "success")
        gcFunctions.inconsistenciesUpdate()
      } else {
        // eslint-disable-next-line no-alert
        this.notifyUser("Action denied", "You don't have permission to modify this setting", "danger")
      }
    },
    setDefaultWriteGoodConfig() {
      this.writeGoodConfig = JSON.parse(JSON.stringify(defaults.DEFAULT_WRITE_GOOD_SETTINGS)) // deep copy to avoid modification of constant
    },
    toggleWriteGoodSetting(lang, option) {
      this.writeGoodConfig[lang][option] = !this.writeGoodConfig[lang][option]
    },
    getReportingOptions() {
      return reporting.options
    },
    matchedPlaceholders() {
      if (this.placeholderRegex === "" || this.placeholderRegex === null) {
        return []
      }
      const matches = this.regexPreviewText.match(RegExp(this.placeholderRegex, "g"))
      if (Array.isArray(matches) && matches.length > 10) {
        return ["...too much matches..."]
      }
      return matches || []
    },
  },
}
</script>

<style scoped>
  .setDefault {
    display: inline-block;
  }
  .regexPreview label {
    font-size: larger;
    padding-left: 5px;
  }
  .previewText {
    display: inline-block;
    width: 50%;
  }
  .matched-placeholders {
    width: 50%;
    display: inline-grid;
  }
  .wgLangHeader {
    font-size: larger;
    font-weight: bold;
    margin-top: 10px;
  }
  .config {
    margin-bottom: 40px;
    width: 100%;
  }
  h4 {
    vertical-align: bottom;
    width: fit-content;
    display: inline-block;
  }
</style>
