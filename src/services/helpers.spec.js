// eslint-disable-next-line import/first
import {
  getAvailableTags,
  sortTranslationKeys,
  strictSearch,
  getPlaceholders,
} from "./helpers"

describe("helpers", () => {
  test("getAvailableTags", () => {
    const translations = {
      "common-cancel": {
        count: 33,
        created_at: "2017-10-02T14:12:04Z",
        "en-GB": "cancel",
        key: "common.cancel",
        tags: ["tag1", "tag2"],
        updated_at: "2017-10-02T14:12:04Z",
        _inconsistencies_firstCharType: false,
        _inconsistencies_lastCharType: true,
        _inconsistencies_placeholders: false,
        _inconsistencies_tags: false,
      },
      "common-ok": {
        count: 33,
        created_at: "2017-10-02T14:12:04Z",
        "en-GB": "Ok",
        key: "common.ok",
        tags: ["tag2", "tag3"],
        updated_at: "2017-10-02T14:12:04Z",
        _inconsistencies_firstCharType: false,
        _inconsistencies_lastCharType: true,
        _inconsistencies_placeholders: false,
        _inconsistencies_tags: false,
      },
    }
    expect(getAvailableTags(translations)).toEqual(["tag1", "tag2", "tag3"])
  })

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
