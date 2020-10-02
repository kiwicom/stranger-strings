const database = require("./database")
const isUpdatingTakingLongerThan = require("./helpers/isUpdatingTakingLongerThan")

async function tryLock(status) {
  const updateInProgress = (await database.ref("/updateInProgress").once("value")).val()
  if (updateInProgress && isUpdatingTakingLongerThan(10, updateInProgress.info.timestamp)) {
    await database.ref("/updateInProgress").remove()
  } else if (updateInProgress) {
    return false
  }
  console.log(`Setting updateInProgress to state: ${status}`)
  await database.ref("/updateInProgress/info").set({ state: status, timestamp: new Date().toUTCString() })
  return true
}

async function unlock() {
  await database.ref("/updateInProgress").remove()
}

module.exports = {
  tryLock,
  unlock,
}
