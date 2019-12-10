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
import { SIGN_IN_METHOD, WHITELIST } from "../common/config"

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
        if (SIGN_IN_METHOD === "none" && user.isAnonymous) {
          this.user = { email: "unknown" }
        } else if (SIGN_IN_METHOD === "google" && user.email && WHITELIST.some(x => user.email.endsWith(x))) {
          this.user = user
        } else if (!SIGN_IN_METHOD === "email link") {
          this.user = {}
          this.handleSignOut()
        }
      } else {
        this.user = {}
      }
      if (!(SIGN_IN_METHOD === "email link" && window.localStorage.getItem("emailForSignIn"))) {
        NProgress.done()
        this.loading = false
      }
    })
    if (SIGN_IN_METHOD === "email link") {
      this.user = { email: window.localStorage.getItem("emailForSignIn") }
      if (this.user.email) {
        firebase.auth().signInWithEmailLink(this.user.email, window.location.href)
          .then((result) => {
            window.localStorage.removeItem("emailForSignIn")
            this.user = result.user
            this.loading = false
          })
      }
    }
    gcFunctions.update()
  },
  methods: {
    handleSignIn(user) {
      this.loading = true
      NProgress.start()
      if (SIGN_IN_METHOD === "google") {
        firebase.auth().signInWithRedirect(FbAuthProvider)
      } else if (SIGN_IN_METHOD === "email link") {
        if (!(typeof user.email === "string") || !WHITELIST.some(x => user.email.endsWith(x))) {
          this.notifyUser("Access denied", "You don't have permission to login.", "danger")
          NProgress.done()
          this.loading = false
          return
        }
        firebase.auth().sendSignInLinkToEmail(user.email, { url: window.location.href, handleCodeInApp: true })
          .then(() => {
            window.localStorage.setItem("emailForSignIn", user.email)
            this.notifyUser("Login link sent!", "Check your inbox to complete sign in.", "success")
          })
          .catch((error) => {
            this.notifyUser("Login error occured", error.message, "danger")
            NProgress.done()
            this.loading = false
          })
      } else {
        firebase.auth().signInAnonymously()
      }
    },
    handleSignOut() {
      firebase.auth().signOut().then(() => {
        this.$router.push("/")
        console.info("user logged out")
      }, (error) => {
        console.error(error)
      })
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
  #app {
    height: 100%;
  }
</style>

