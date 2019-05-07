// WIP, not working yet

const superagent = require("superagent")

const PhraseappLoader = require("./PhraseappLoader")("dummyProjectId", "dummyToken")

jest.mock("superagent")

describe.skip("PhraseappLoader", () => {
  test("PhraseappLoader - valid responses", (done) => {
    superagent.get = jest.fn((url) => {
      let body
      if (url.includes("locales?")) {
        body = { a: "A" }
      } else if (url.includes("translations?")) {
        body = { a: "A" }
      }
      return ({
        end: (cb) => {
          cb(null, { body })
        },
      })
    })

    PhraseappLoader.fetch().then((val) => {
      expect(val).toEqual([])
      done()
    })
  })
})
