require("dotenv").config()

const functions = require("firebase-functions")
const admin = require("firebase-admin")

const {
  originToFirebase,
  updateInconsistencies,
  updateCollections,
} = require("./dbUpdates")

const { loader } = require("./loaderManager")

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
    timeoutSeconds: 200,
    memory: "2GB",
  },
}

exports.update = functions.runWith(runtimeConfig.mainUpdate).https.onRequest(async (req, res) => {
  // CORS
  res.set("Access-Control-Allow-Origin", "*")
  res.set("Access-Control-Allow-Methods", "GET, POST")

  const lastUpdateFirebase = (await admin.database().ref("/lastUpdate").once("value")).val()
  if (lastUpdateFirebase) { // Nothing in firebase yet, update!
    const lastVersionOrigin = await loader.version()
    if (lastUpdateFirebase.version === lastVersionOrigin) {
      admin.database().ref("/updateInProgress").remove()
      return res.send("no new updates")
    }
  }

  return res.send(await originToFirebase())
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
