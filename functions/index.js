require("dotenv").config()

const functions = require("firebase-functions")
const admin = require("firebase-admin")
const fetch = require("node-fetch")
const {
  githubToFirebase,
  getGithubApi,
  updateInconsistencies,
  updateCollections,
} = require("./dbUpdates")

// We don't init with no params, as config depends on NODE_ENV
admin.initializeApp({
  apiKey: process.env.VUE_APP_FIREBASE_API_KEY,
  authDomain: process.env.VUE_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.VUE_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.VUE_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VUE_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VUE_APP_FIREBASE_MESSAGING_SENDER_ID,
})

const runtimeConfig = {
  mainUpdate: {
    timeoutSeconds: 300,
    memory: "2GB",
  },
  secondaryUpdate: {
    timeoutSeconds: 150,
    memory: "2GB",
  },
}

exports.update = functions.runWith(runtimeConfig.mainUpdate).https.onRequest(async (req, res) => {
  // CORS
  res.set("Access-Control-Allow-Origin", "*")
  res.set("Access-Control-Allow-Methods", "GET, POST")

  const lastCommitFetch = await fetch(getGithubApi(process.env.GITHUB_REPO, "/commits"), {
    headers: {
      Authorization: `Basic ${Buffer.from((`${process.env.GITHUB_USER}:${process.env.GITHUB_PASSWORD}`)).toString("base64")}`,
    },
  })
  const lastCommitJson = await lastCommitFetch.json()
  const lastCommit = lastCommitJson[0].sha

  const lastUpdate = (await admin.database().ref("/lastUpdate").once("value")).val()
  if (lastUpdate && lastCommit === lastUpdate.commitSha) {
    admin.database().ref("/updateInProgress").remove()
    return res.send("no new updates")
  }

  return res.send(await githubToFirebase())
})

exports.inconsistenciesUpdate = functions.runWith(runtimeConfig.secondaryUpdate).https.onRequest(async (req, res) => {
  // CORS
  res.set("Access-Control-Allow-Origin", "*")
  res.set("Access-Control-Allow-Methods", "GET, POST")
  return res.send(await updateInconsistencies())
})

exports.collectionsUpdate = functions.runWith(runtimeConfig.secondaryUpdate).https.onRequest(async (req, res) => {
  // CORS
  res.set("Access-Control-Allow-Origin", "*")
  res.set("Access-Control-Allow-Methods", "GET, POST")
  return res.send(await updateCollections())
})
