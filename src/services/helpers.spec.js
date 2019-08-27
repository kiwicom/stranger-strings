// eslint-disable-next-line import/first
import {
  sortTranslationKeys,
  strictSearch,
  getPlaceholders,
} from "./helpers"

describe("helpers", () => {
  test("sortTranslationKeys", () => {
    const translations = [
      {
        key: "zeta.zeta",
        count: 1,
        ".key": "zeta-zeta",
      },
      {
        key: "common.ok",
        count: 999,
        ".key": "common-ok",
      },
      {
        key: "common.abc",
        count: 2,
        ".key": "common.abc",
      },
      {
        key: "beta.beta",
        count: 0,
        ".key": "beta-beta",
      },
    ]

    expect(sortTranslationKeys(translations, "key", "asc").map(t => t.key)).toEqual(["beta.beta", "common.abc", "common.ok", "zeta.zeta"])
    expect(sortTranslationKeys(translations, "key", "desc").map(t => t.key)).toEqual(["zeta.zeta", "common.ok", "common.abc", "beta.beta"])
    expect(sortTranslationKeys(translations, "count", "asc").map(t => t.key)).toEqual(["beta.beta", "zeta.zeta", "common.abc", "common.ok"])
    expect(sortTranslationKeys(translations, "count", "desc").map(t => t.key)).toEqual(["common.ok", "common.abc", "zeta.zeta", "beta.beta"])
  })

  test("getPlaceholders", () => {
    expect(getPlaceholders(["__abc__", "__bcd__", "__cdf__"])).toBe("abc, bcd, cdf")
    expect(getPlaceholders(["__a__"])).toBe("a")
  })
})
