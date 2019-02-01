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
import firebase from "firebase"
import NProgress from "nprogress"

import "../styles/bootstrap-overrides.css"
import "../styles/nprogress.css"
import Navbar from "./components/Navbar"
import Welcome from "./components/Welcome"
import Status from "./components/Status"
import * as gcFunctions from "./modules/functionsApi"
import { FbAuthProvider } from "./modules/firebase"
import WHITELIST from "./consts/whiltelist"

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
        if (WHITELIST.some(x => user.email.endsWith(x))) {
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
      firebase.auth().signInWithRedirect(FbAuthProvider)
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

