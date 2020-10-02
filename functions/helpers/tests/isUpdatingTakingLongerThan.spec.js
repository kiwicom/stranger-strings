const isUpdatingTakingLongerThan = require("../isUpdatingTakingLongerThan")

describe("isUpdatingTakingLongerThan", () => {
  const time = new Date()
  const testTimestamps = {}
  testTimestamps.timestamp0minOld = { expected: false, value: new Date().toUTCString() }
  testTimestamps.timestamp5minOld = { expected: false, value: time.setMinutes(time.getMinutes() - 5) && time.toUTCString() }
  testTimestamps.timestamp11minOld = { expected: true, value: time.setMinutes(time.getMinutes() - 6) && time.toUTCString() }
  testTimestamps.timestamp1day11minutesOld = { expected: true, value: time.setDate(time.getDate() - 1) && time.toUTCString() }
  const time2 = new Date()
  testTimestamps.timestamp1dayOld = { expected: true, value: time2.setDate(time2.getDate() - 1) && time2.toUTCString() }

  Object.keys(testTimestamps).forEach((timestamp) => {
    test(`isUpdatingTakingLongerThan 10min - ${timestamp} - ${testTimestamps[timestamp].value}`, () => {
      expect(isUpdatingTakingLongerThan(10, testTimestamps[timestamp].value)).toBe(testTimestamps[timestamp].expected)
    })
  })
})
