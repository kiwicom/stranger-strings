const utils = require("../utils")

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
  test("getHTMLtags", () => {
    const fn = utils.getHTMLtags
    expect(fn("Password should have more characters")).toEqual([])
    expect(fn("Buy for __price__")).toEqual([])
    expect(fn("Hi there __emoji__.<br><br>" +
      "We're constantly looking for ways to improve your mobile user experience. In order " +
      "to do that, we use tools to record your in-app behavior and interactions.<br>" +
      "<br>No need for alarm,though. <b>We'll never record any sensitive information.</b>" +
      "We're only interested in how you use — navigate and interact with — the app.<br><br>" +
      "But we do need your approval."))
      .toEqual(["<br>", "<br>", "<br>", "<br>", "<b>", "</b>", "<br>", "<br>"])
    expect(fn("باستمرار عن طرق لتحسين تجربتك كمستخدم عبر الهاتف المحمول. ولتحقيق ذلك، نستخدم أدوات" +
      " لتسجيل سلوكك وتفاعلاتك داخل التطبيق.<br><br>لا حاجة للشعور بالخطر. <b>فنحن لن نسجل " +
      "أي معلومات حساسة أبدًا.</b> نهتم فقط بكيفية استخدامك للتطبيق؛ أي تصفحك " +
      "له وتفاعلك معه. <br><br>لكننا بحاجة إلى موافقتك."))
      .toEqual(["<br>", "<br>", "<b>", "</b>", "<br>", "<br>"])
    expect(fn("車受け取りの48時間前まで<b>キャンセル無料</b>")).toEqual(["<b>", "</b>"])
    expect(fn("取车前 48 小时前 <b>免费取消</b>")).toEqual(["<b>", "</b>"])
    expect(fn("I have read and accepted the <a href=\"https://www.randomlink.com\">Terms and Conditions</a>" +
      "and <a href=\"https://www.randomlink.com\">Privacy Policy</a>."))
      .toEqual(["<a href=\"https://www.randomlink.com\">", "</a>", "<a href=\"https://www.randomlink.com\">", "</a>"])
  })
})
