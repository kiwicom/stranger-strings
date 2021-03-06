<template>
  <!-- MODAL: REPORTING -->
  <b-modal
    id="reportModal"
    :title="'Report translation bug to ' + reportConfig.option"
    v-model="modalReport"
    size="lg"
    :ok-title="'Send report to ' + reportConfig.option"
    @ok="submitReport"
    :ok-disabled="reportForm.errorType.length < 1"
    @hide="$emit('close')"
    lazy
  >
    <v-popover
      trigger="hover"
      v-if="reportConfig.option === 'Slack'"
      class="slack-example"
    >
      <keep-alive>
        <SlackIcon title="Example of Slack report" :size="48"/>
      </keep-alive>
      <template slot="popover">
        <div class="hint-wrapper">
          <div class="pseudoheader">Example of report on Slack</div>
          <div class="slack-example"><img src="../../public/examples/slack_repoprt_example.jpg"></div>
        </div>
      </template>
    </v-popover>
    <b-row class="my-2">
      <b-col sm="4"><label><strong>Author:</strong></label> </b-col>
      <b-col sm="8">{{ reportForm.author }}</b-col>
    </b-row>
    <b-row class="my-2" v-if="reportConfig.option === 'Slack'">
      <b-col sm="4">
        <label for="slack-id">
          <strong>Your Slack member ID:</strong>&nbsp;
          <v-popover
            trigger="hover"
            style="display: contents; color: #26539B"
          >
            <keep-alive>
              <HelpIcon style="float: right"/>
            </keep-alive>
            <template slot="popover">
              <div class="hint-wrapper">
                <div class="slack-id pseudoheader">To allow mention of your Slack account name enter your Slack member ID</div>
                <div class="hint-image"><img src="../../public/examples/slack_ID_hint.jpg"></div>
              </div>
            </template>
          </v-popover>
        </label>
      </b-col>
      <b-col sm="8">
        <b-input-group>
          <!-- note: V-MODEL avoided due to performance issues -->
          <b-input
            id="slack-id"
            placeholder="U024BE7LH"
            :value="reportForm.slackName"
            @change.native="reportForm.slackName = $event.target.value"
          ></b-input>
        </b-input-group>
      </b-col>
    </b-row>
    <b-row class="my-2">
      <b-col sm="4"><label><strong>Key:</strong></label> </b-col>
      <b-col sm="8" class="translation-key">{{ reportForm.key }}</b-col>
    </b-row>
    <b-row class="my-2">
      <b-col sm="4"><label for="locale-select"><strong>Locales:</strong></label></b-col>
      <b-col sm="8">
        <b-row
          v-for="(locale, key) in reportForm.locales"
          :key="key"
          class="my-2"
        >
          <b-col sm="10">
            <b-form-select
              id="locale-select"
              :options="locales"
              v-model="reportForm.locales[key]"></b-form-select>
          </b-col>
          <b-col sm="2">
            <b-button
              variant="success"
              v-if="key < 1"
              @click="reportForm.locales.push('not-specified')"
            >
              <AddIcon/>
            </b-button>
            <b-button
              v-else
              variant="danger"
              @click="reportForm.locales.splice(key, 1)"
            >
              <RemoveIcon/>
            </b-button>
          </b-col>
        </b-row>
      </b-col>
    </b-row>
    <b-row class="my-2">
      <b-col sm="4"><label><strong>Error Type:</strong></label></b-col>
      <b-col sm="8">
        <b-form-input
          :state="reportForm.errorType.length > 0"
          placeholder="e.g. missing placeholder"
          :value="reportForm.errorType"
          @change.native="reportForm.errorType = $event.target.value"
        >
        </b-form-input>
      </b-col>
    </b-row>
    <label class="mt-3"><strong>Additional info:</strong></label>
    <b-form-textarea
      :value="reportForm.additionalInfo"
      @change.native="reportForm.additionalInfo = $event.target.value"
      rows="3"
      max-rows="6"
    >
    </b-form-textarea>
    <b-row class="my-2">
      <b-col sm="2"><label><strong>Image link:</strong></label></b-col>
      <b-col sm="10">
        <b-form-input
          placeholder="e.g. https://api.monosnap.com/file/download?id=qJs0h7H5GpBgkl2TcTjOOSRAPaqf0q"
          v-model="reportForm.image"
        >
        </b-form-input>
      </b-col>
    </b-row>
    <h5 class="mt-5">Latest reports</h5>
    <table v-if="reportLogs" class="table table-sm b-table table-striped key-detail-table">
      <thead>
        <th class="report-table-head">Date</th>
        <th class="report-table-head">Author</th>
        <th class="report-table-head">Locale</th>
        <th class="report-table-head">Type</th>
        <th class="report-table-head">Description</th>
      </thead>
      <tbody>
      <tr v-for="report in reportLogs" :key="report.time + report.author">
        <td>{{ new Date(report.time).toLocaleDateString("en-GB") }}</td>
        <td>{{ report.author }}</td>
        <td>{{ report.locale }}</td>
        <td>{{ report.errorType }}</td>
        <td>{{ report.additionalInfo }}</td>
      </tr>
      <tr v-if="!Object.keys(reportLogs).length" class="no-reports">
        <td colspan="5">No reports for this specific key</td>
      </tr>
      </tbody>
    </table>
  </b-modal>
</template>

<script>
import NProgress from "nprogress"
import _ from "lodash"
import { mapGetters } from "vuex"
import HelpIcon from "vue-material-design-icons/HelpCircleOutline"
import AddIcon from "vue-material-design-icons/PlusCircle"
import RemoveIcon from "vue-material-design-icons/CloseCircle"
import SlackIcon from "vue-material-design-icons/Slack"
import { FbDb } from "../modules/firebase"

import * as reporting from "../services/reporting"

export default {
  name: "Reporting",
  components: {
    HelpIcon, AddIcon, RemoveIcon, SlackIcon,
  },
  props: {
    translationKey: { type: String, required: true },
    locale: { type: String, required: true },
    email: { type: String, required: true },
    notifyUser: { type: Function, required: true },
    errorType: { type: String },
    notTranslated: { type: Array, required: true },
  },
  data() {
    return {
      modalReport: false,

      reportForm: {
        key: "",
        locales: [],
        errorType: "not-specified",
        additionalInfo: "",
        author: "",
        slackName: "",
        url: "",
      },
      reportLogs: {},
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
    this.reportForm.locales = [this.locale]
    this.reportForm.key = this.translationKey
    this.reportForm.author = this.email
    this.reportForm.additionalInfo = ""
    this.reportForm.errorType = this.errorType || ""
    this.reportForm.url = ""
    this.reportForm.image = ""
    this.reportForm.slackName = localStorage.getItem("slackName") ? JSON.parse(localStorage.getItem("slackName")) : ""

    FbDb.ref(`reports/${this.reportingKey}`).once("value", (snapshot) => {
      if (snapshot.val()) {
        this.reportLogs = snapshot.val()
      }
      FbDb.ref("reportingConf").once("value", (snap) => {
        if (snap.val()) {
          this.reportConfig = snap.val()
        }
        NProgress.done()
        this.modalReport = true
      })
    })
  },
  computed: {
    ...mapGetters([
      "getLocales",
    ]),
    locales() {
      return this.getLocales.concat(["not-specified"]).map(l => ({
        value: l,
        text: this.notTranslated.includes(l) ? `${l} (not translated)` : l,
      }))
    },
    reportingKey() {
      return this.translationKey.replace(/[.#$/[\]]/gmi, "-")
    },
  },
  methods: {
    submitReport() {
      this.reportForm.url = document.location.href
      localStorage.setItem("slackName", JSON.stringify(this.reportForm.slackName))

      // Slack reporting
      if (this.reportConfig.option === "Slack") {
        reporting.reportOnSlack(this.reportConfig.webhook, this.reportConfig.slackChannel, this.reportForm, this.notifyUser)
      }

      // create log
      const reportLog = _.cloneDeep(this.reportForm)
      reportLog.locale = _.cloneDeep(reportLog.locales.join(", "))
      delete reportLog.locales
      delete reportLog.key
      if (this.reportConfig.option !== "Slack") {
        delete reportLog.slackName
      }
      reportLog.time = new Date().toString()
      FbDb.ref(`reports/${this.reportingKey}`).push(reportLog)
      this.modalReport = false
    },
  },
}
</script>

<style scoped>
  label {
    font-size: 15px;
  }
  .no-reports {
    text-align: center;
    font-size: 18px;
    background-color: #f9fafc !important;
    font-weight: 200;
    padding: 10px !important;
    color: grey;
  }
  .translation-key {
    font-weight: 300;
    font-style: italic;
  }
  .report-table-head {
    border-top: 0px;
  }
  .hint-wrapper {
    width: fit-content;
    text-align: center;
  }
  .pseudoheader {
    padding: 15px;
    background-color: #26539B;
    color: white;
  }
  .slack-id {
    max-width: 370px;
  }
  .hint-image img{
    width: 350px;
    border: solid 1px rgba(191, 191, 191, 0.94);
    margin: 5px;
    border-radius: 10px;
  }
  .slack-example {
    text-align: center;
    color: #26539B;
    font-size: 28px;
    margin-bottom: 20px;
  }
  .slack-example img {
    width: 500px;
    border: solid 1px rgba(191, 191, 191, 0.94);
    margin: 5px;
    border-radius: 10px;
  }
</style>
