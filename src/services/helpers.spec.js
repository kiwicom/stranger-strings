// eslint-disable-next-line import/first
import {
  sortTranslationKeys,
  strictSearch,
  getPlaceholders,
} from "./helpers"

describe("helpers", () => {
  test("sortTranslationKeys", () => {
    const translations = {
      "zeta-zeta": {
        key: "zeta.zeta",
        count: 1,
      },
      "common-ok": {
        key: "common.ok",
        count: 999,
      },
      "common-abc": {
        key: "common.abc",
        count: 2,
      },
      "beta-beta": {
        key: "beta.beta",
        count: 0,
      },
    }
    expect(Object.keys(sortTranslationKeys(translations, "key", "asc"))).toEqual(["beta-beta", "common-abc", "common-ok", "zeta-zeta"])
    expect(Object.keys(sortTranslationKeys(translations, "key", "desc"))).toEqual(["zeta-zeta", "common-ok", "common-abc", "beta-beta"])
    expect(Object.keys(sortTranslationKeys(translations, "count", "asc"))).toEqual(["beta-beta", "zeta-zeta", "common-abc", "common-ok"])
    expect(Object.keys(sortTranslationKeys(translations, "count", "desc"))).toEqual(["common-ok", "common-abc", "zeta-zeta", "beta-beta"])
  })

  test("strictSearch", () => {
    const translations = {
      "zeta-zeta": {
        key: "zeta.zeta",
        count: 1,
        "en-GB": "Zeta",
      },
      "common-ok": {
        key: "common.ok",
        count: 999,
        "en-GB": "Ok",
      },
      "common-abc": {
        key: "common.abc",
        count: 2,
        "en-GB": "abc",
      },
      "beta-beta": {
        key: "beta.beta",
        count: 0,
        "en-GB": "Beta",
      },
    }
    expect(Object.keys(strictSearch(translations, "Zeta"))).toEqual([
      "zeta-zeta",
    ])
    expect(Object.keys(strictSearch(translations, "a"))).toEqual([
      "zeta-zeta",
      "common-abc",
      "beta-beta",
    ])
  })

  test("getPlaceholders", () => {
    expect(getPlaceholders(["__abc__", "__bcd__", "__cdf__"])).toBe("abc, bcd, cdf")
    expect(getPlaceholders(["__a__"])).toBe("a")
  })
})
