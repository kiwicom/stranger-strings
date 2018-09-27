const nspell = require("nspell")
const fs = require("fs")

const { spellcheck, trimWord } = require("../spellcheck")

jest.setTimeout(15000) // spellcheker can be a bit slower

describe("spellcheck", () => {
  const dict = nspell(
    fs.readFileSync("./functions/dicts/en-GB.aff"),
    fs.readFileSync("./functions/dicts/en-GB.dic"),
  )

  test("General spellcheck test for right parsing.", () => {
    expect(spellcheck(
      dict,
      "Blessed is he :who:, in *the* name of the #charity# and good will, \
      shepherds the /weak/ through the valley of darkness, for he is truly \
      his brothers keeper __and__ the finder of lost children. And I will strike \
      down upon thee with great vengeance and furious anger those who attempt \
      to poison and {destroy} my brothers. <Pulp/Fiction (1994)>"
    )).toEqual([])
  })
  test("General spellcheck test for right typos detection", () => {
    expect(spellcheck(dict, "The 1st rule 0f the Fight Club is: W'e nver tolk about Fight-club. <project@mayhem.com>"))
      .toEqual(["0f", "W'e", "nver", "tolk"])
  })
  test("General spellcheck test for parsing special unicode chars", () => {
    expect(spellcheck(dict, "Ťhé greátesť třick the deviĺ ěvéř půlled wa-s čoňvinciňg thé worľď he didn't exišť."))
      .toEqual(["Ťhé", "greátesť", "třick", "deviĺ", "ěvéř", "půlled", "čoňvinciňg", "thé", "worľď", "exišť"])
  })
  test("General spellcheck test for abbrevations", () => {
    expect(spellcheck(dict, "Enter promo code: e.g. XYZ12345"))
      .toEqual(["XYZ12345"])
  })


  test("trimWord", () => {
    expect(trimWord("test")).toEqual("test")
    expect(trimWord("1t3st1")).toEqual("1t3st1")
    expect(trimWord("420")).toEqual("")
    expect(trimWord("<^$_test_&#>")).toEqual("test")
    expect(trimWord(".test.")).toEqual("test")
    expect(trimWord(",test!")).toEqual("test")
    expect(trimWord("email@kiwi.com")).toEqual("email@kiwi.com")
    expect(trimWord("non-stop")).toEqual("non-stop")
    expect(trimWord("hasn't")).toEqual("hasn't")
    expect(trimWord("100%")).toEqual("")
    expect(trimWord("<1920x1080>")).toEqual("1920x1080")
    expect(trimWord("test?:")).toEqual("test")
    expect(trimWord("šěčřyoyuťľĺ")).toEqual("šěčřyoyuťľĺ")
    expect(trimWord("anotherapostrophe’s")).toEqual("anotherapostrophe’s")
    expect(trimWord("AaBbCc")).toEqual("AaBbCc")
  })
})
