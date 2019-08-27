const database = require("./database")

async function tryLock(status) {
  const updateInProgress = (await database.ref("/updateInProgress").once("value")).val()
  if (updateInProgress) {
    return false
  }
  console.log(`Setting updateInProgress to state: ${status}`)
  await database.ref("/updateInProgress/info").set({ state: status })
  return true
}

async function unlock() {
  await database.ref("/updateInProgress").remove()
}

module.exports = {
  tryLock,
  unlock,
}
