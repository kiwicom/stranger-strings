const functions = require("firebase-functions")

const {
  originToFirebase,
  updateInconsistencies,
  updateCollections,
} = require("./dbUpdates")

const { loader } = require("./loaderManager")
const database = require("./database")

const runtimeConfig = {
  mainUpdate: {
    timeoutSeconds: 540,
    memory: "2GB",
  },
  secondaryUpdate: {
    timeoutSeconds: 540,
    memory: "2GB",
  },
}

exports.update = functions.runWith(runtimeConfig.mainUpdate).https.onRequest(async (req, res) => {
  // CORS
  res.set("Access-Control-Allow-Origin", "*")
  res.set("Access-Control-Allow-Methods", "GET, POST")

  const lastUpdateFirebase = (await database.ref("/lastUpdate").once("value")).val()
  if (lastUpdateFirebase) { // Nothing in firebase yet, update!
    const lastVersionOrigin = await loader.version()
    if (lastUpdateFirebase.version === lastVersionOrigin) {
      database.ref("/updateInProgress").remove()
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
