const superagent = require("superagent")

async function tryLock(status) {
  const updateInProgress = (await superagent.get(`${process.env.VUE_APP_FIREBASE_DATABASE_URL}/updateInProgress.json`)).body
  if (updateInProgress) {
    return false
  }
  console.log(`Setting updateInProgress to state: ${status}`)
  await superagent.put(`${process.env.VUE_APP_FIREBASE_DATABASE_URL}/updateInProgress/info.json`).send({ state: status })
  return true
}

async function unlock() {
  await superagent.delete(`${process.env.VUE_APP_FIREBASE_DATABASE_URL}/updateInProgress.json`)
}

module.exports = {
  tryLock,
  unlock,
}
