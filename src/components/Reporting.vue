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
    <b-row class="my-2">
      <b-col sm="2"><label><strong>Author:</strong></label> </b-col>
      <b-col sm="10">{{ reportForm.author }}</b-col>
    </b-row>
    <b-row class="my-2" v-if="reportConfig.option === 'Slack'">
      <b-col sm="2"><label for="slack-id"><strong>Your Slack name:</strong></label></b-col>
      <b-col sm="10">
        <b-input-group prepend="@">
          <!-- note: V-MODEL avoided due to performance issues -->
          <b-input
            id="slack-id"
            placeholder="name.surname"
            :value="reportForm.slackName"
            @change.native="reportForm.slackName = $event.target.value"
          ></b-input>
        </b-input-group>
      </b-col>
    </b-row>
    <b-row class="my-2">
      <b-col sm="2"><label><strong>Key:</strong></label> </b-col>
      <b-col sm="10" class="translation-key">{{ reportForm.key }}</b-col>
    </b-row>
    <b-row class="my-2">
      <b-col sm="2"><label for="locale-select"><strong>Locale:</strong></label></b-col>
      <b-col sm="10">
        <b-form-select id="locale-select" :options="getLocales.concat(['not-specified'])" v-model="reportForm.locale"></b-form-select>
      </b-col>
    </b-row>
    <b-row class="my-2">
      <b-col sm="2"><label><strong>Error Type:</strong></label></b-col>
      <b-col sm="10">
        <b-form-input
          :state="reportForm.errorType.length > 0"
          placeholder="e.g. typo"
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
        <td colspan="5">No reports</td>
      </tr>
      </tbody>
    </table>
  </b-modal>
</template>

<script>
import NProgress from "nprogress"
import _ from "lodash"
import { mapGetters } from "vuex"
import { FbDb } from "../modules/firebase"

import * as reporting from "../services/reporting"


export default {
  name: "Reporting",
  props: {
    translationKey: { type: String, required: true },
    locale: { type: String, required: true },
    email: { type: String, required: true },
    notifyUser: { type: Function, required: true },
  },
  data() {
    return {
      modalReport: false,

      reportForm: {
        key: "",
        locale: "",
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
    this.reportForm.locale = this.locale
    this.reportForm.key = this.translationKey
    this.reportForm.author = this.email
    this.reportForm.additionalInfo = ""
    this.reportForm.errorType = ""
    this.reportForm.url = ""
    this.reportForm.slackName = localStorage.getItem("slackName") ? JSON.parse(localStorage.getItem("slackName")) : ""

    FbDb.ref(`reports/${this.activeKey}`).once("value", (snapshot) => {
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
      delete reportLog.key
      if (this.reportConfig.option !== "Slack") {
        delete reportLog.slackName
      }
      reportLog.time = new Date().toString()
      FbDb.ref(`reports/${this.activeKey}`).push(reportLog)
      this.modalReport = false
    },
  },
}
</script>

<style scoped>
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
</style>
