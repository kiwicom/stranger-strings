<template>
  <div id="app">
    <Navbar
      :onSignOut="handleSignOut"
      :user="user"
    />
    <Status
      v-if="loading"
      :statusText="statusText"
    />
    <Welcome
      v-if="!loading && !user.email"
      :onSignIn="handleSignIn"
    />
    <router-view :user="user" v-if="!loading && user.email"/>
  </div>
</template>

<script type="text/javascript">
import "bootstrap/dist/css/bootstrap.css"
import "bootstrap-vue/dist/bootstrap-vue.css"
import "vue-material-design-icons/styles.css"
import firebase from "firebase"
import NProgress from "nprogress"

import "../styles/bootstrap-overrides.css"
import "../styles/nprogress.css"
import Navbar from "./components/Navbar"
import Welcome from "./components/Welcome"
import Status from "./components/Status"
import * as gcFunctions from "./modules/functionsApi"
import { FbAuthProvider } from "./modules/firebase"
import { NO_LOGIN, WHITELIST } from "../common/config"

export default {
  components: {
    Navbar,
    Welcome,
    Status,
  },
  data() {
    return {
      user: {}, // logged-in firebase user
      statusText: "Loading data...",
      loading: true,
      availableTags: [],
      scene: "items",
    }
  },
  created() {
    NProgress.start()
    // handlers
    // --
    firebase.auth().getRedirectResult().then((result) => {
      if (result.user) {
        console.info(`user logged in ${result.user.displayName}`)
      }
    }).catch((error) => {
      console.error(error.code, error.message, error.email)
    })
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        if (NO_LOGIN && user.isAnonymous) {
          this.user = { email: "unknown" }
        } else if (WHITELIST.some(x => user.email.endsWith(x))) {
          this.user = user
        } else {
          this.user = {}
          this.handleSignOut()
        }
      } else {
        this.user = {}
      }
      NProgress.done()
      this.loading = false
    })
    gcFunctions.update()
  },
  methods: {
    handleSignIn() {
      this.loading = true
      NProgress.start()
      if (!NO_LOGIN) {
        firebase.auth().signInWithRedirect(FbAuthProvider)
      } else {
        firebase.auth().signInAnonymously()
      }
    },
    handleSignOut() {
      firebase.auth().signOut().then(() => {
        console.info("user logged out")
      }, (error) => {
        console.error(error)
      })
    },
  },
}
</script>

<style scoped>
  #app {
    height: 100%;
  }
</style>

