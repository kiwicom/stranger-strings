import utils from "../utils"

describe("utils", () => {
  test("detectDynamicValues", () => {
    const fn = utils.detectDynamicValues
    expect(fn("Password should have more characters")).toEqual([])
    expect(fn("Password should have 8 or more characters")).toEqual(["8"])
    expect(fn("Password should have 12 or more characters")).toEqual(["12"])
    expect(fn("Password should have __number__ or more characters")).toEqual([])
    expect(fn("Password should have __number__ or more characters")).toEqual([])

    expect(fn("You have 48 hours")).toEqual(["48"])
    expect(fn("Hours left: 48")).toEqual(["48"])
    expect(fn("Hours left: 48!")).toEqual(["48"])
    expect(fn("48 hours left")).toEqual(["48"])

    expect(fn("Buy for 10€")).toEqual(["10"])
    expect(fn("Buy for 10EUR")).toEqual(["10"])
    expect(fn("Buy for 10 EUR")).toEqual(["10"])
    expect(fn("Buy for __price__")).toEqual([])
    expect(fn("Buy for __price__€")).toEqual([]) // TODO: In next iteration, also € should be detected as dynamic
    expect(fn("Buy for __price__EUR")).toEqual([]) // TODO: In next iteration, also EUR should be detected as dynamic
  })
})
