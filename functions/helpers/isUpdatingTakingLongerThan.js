module.exports = function isUpdatingTakingLongerThan(minutes, timestamp) {
  const currentTime = new Date().getTime()
  const msPerMinute = 1000 * 60
  const diffMins = Math.floor((currentTime - new Date(timestamp).getTime()) / msPerMinute)
  return diffMins > minutes
}
