<template>
  <!-- MODAL: REPORTING -->
  <b-modal
    id="reportModal"
    title="Report"
    v-model="modalReport"
    size="lg"
    ok-title="Send report"
    @ok="submitReport"
    :ok-disabled="reportForm.errorType.length < 1"
    lazy
  >
    <b-row class="my-2">
      <b-col sm="2"><label><strong>Author:</strong></label> </b-col>
      <b-col sm="10">{{ reportForm.author }}</b-col>
    </b-row>
    <b-row class="my-2" v-if="reportConfig.option === 'Slack'">
      <b-col sm="2"><label for="slack-id"><strong>Slack name:</strong></label></b-col>
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
      <b-col sm="10">{{ reportForm.key }}</b-col>
    </b-row>
    <b-row class="my-2">
      <b-col sm="2"><label for="locale-select"><strong>Locale:</strong></label></b-col>
      <b-col sm="10">
        <b-form-select id="locale-select" :options="locales.concat(['not-specified'])" v-model="reportForm.locale"></b-form-select>
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
      <th class="key-detail-header">Date</th>
      <th class="key-detail-header">Author</th>
      <th class="key-detail-header">Locale</th>
      <th class="key-detail-header">Type</th>
      <th class="key-detail-header">Description</th>
      </thead>
      <tbody>
      <tr v-for="report in reportLogs" :key="report.time + report.author">
        <td>{{ new Date(report.time).toLocaleDateString("en-GB") }}</td>
        <td>{{ report.author }}</td>
        <td>{{ report.locale }}</td>
        <td>{{ report.errorType }}</td>
        <td>{{ report.additionalInfo }}</td>
      </tr>
      </tbody>
    </table>
  </b-modal>
</template>

<script>
import NProgress from "nprogress"
import { FbDb } from "../modules/firebase"

import * as reporting from "../services/reporting"


export default {
  name: "Reporting",
  props: {
    locale: { type: String, required: true },
    key: { type: String, required: true },
    email: { type: String, required: true },
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
    this.reportForm.key = this.key
    this.reportForm.author = this.email
    this.reportForm.additionalInfo = ""
    this.reportForm.errorType = ""
    this.reportForm.url = ""
    this.reportForm.slackName = localStorage.getItem("slackName") ? JSON.parse(localStorage.getItem("slackName")) : ""

    FbDb.ref(`reports/${this.activeKey}`).once("value", (snapshot) => {
      if (snapshot.val()) {
        this.reportLogs = snapshot.val()
      }
      NProgress.done()
      this.modalReport = true
    })
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
      this.$emit("close")
    },
    notifyUser(title, text, variant) {
      this.$bvToast.toast(text, {
        title,
        variant,
        solid: true,
      })
    },
  },
}
</script>

<style scoped>

</style>
