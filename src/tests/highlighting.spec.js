import { shallowMount, createLocalVue } from "@vue/test-utils"
import Vuex from "vuex"
import VTooltip from "v-tooltip"
import BootstrapVue from "bootstrap-vue"
import Highlighting from "../components/Highlighting"

const localVue = createLocalVue()

localVue.use(Vuex)
localVue.use(VTooltip, {
  defaultArrowSelector: ".tooltiper-arrow, .tooltiper__arrow",
  defaultInnerSelector: ".tooltiper-inner, .tooltiper__inner",
  defaultLoadingClass: "tooltiper-loading",
  popover: {
    defaultBaseClass: "tooltiper popoverer",
    defaultInnerClass: "tooltiper-inner popoverer-inner",
    defaultArrowClass: "tooltiper-arrow popoverer-arrow",
    defaultAutoHide: false,
  },
})
localVue.use(BootstrapVue)

const checks = {
  _inconsistencies_placeholders: {
    title: "Placeholders",
    description: "Detects missing / excess / inconsistent placeholders",
    level: "error",
    active: true,
  },
  _inconsistencies_firstCharType: {
    title: "First character",
    description: "Detects inconsistencies of first character",
    level: "warning",
    active: true,
  },
  _inconsistencies_lastCharType: {
    title: "Last character",
    description: "Detects inconsistencies of last character",
    level: "warning",
    active: true,
  },
  _inconsistencies_tags: {
    title: "HTML tags",
    description: "Detects invalid / inconsistent / prohibited HTML tags",
    level: "error",
    active: true,
  },
  _inconsistencies_length: {
    title: "Length",
    description: "Detects suspicious variations in length",
    level: "warning",
    active: true,
  },
  _inconsistencies_typos: {
    title: "Spelling",
    description: "Detects spelling mistakes",
    level: "warning",
    active: true,
  },
  _inconsistencies_writeGood: {
    title: "Style",
    description: "Detects stylistic issues – passive voice, weasel words, overuse of adverbs, cliches and " +
    "similar (available only for english and german translations, uses <a href='https://github.com/btford/write-good'>write-good library</a>)",
    level: "suggestion",
    active: true,
  },
  _inconsistencies_insensitiveness: {
    title: "Insensitiveness",
    description: "Detects gender favouring, polarising, race related, religion inconsiderate, or other unequal " +
    "phrasing (available only for english translations, uses <a href='https://github.com/get-alex/alex'>Alex library</a>)",
    level: "suggestion",
    active: true,
  },
  _inconsistencies_dynamic: {
    title: "Values",
    description: "Detects values, that should/could be replaced by placeholders, because values are likely to change over time",
    level: "suggestion",
    active: true,
  },
}

describe("Highlighting.vue", () => {
  let getters
  let store
  beforeEach(() => {
    getters = {
      getCheckData: () => check => checks[check] || {},
    }

    store = new Vuex.Store({
      getters,
    })
  })

  it("test basic", async () => {
    const wrapper = shallowMount(Highlighting, {
      propsData: {
        content: "tralala",
        locale: "en-GB",
        firstCharType: ["letter", "letter"],
        lastCharType: ["letter", "letter"],
      },
      localVue,
      store,
    })
    await wrapper.vm.$nextTick()
    const { tokens } = wrapper.vm
    expect(tokens.map(t => t.content).join("")).toEqual("tralala")
    expect(tokens[0].first).toEqual(false)
    expect(tokens[tokens.length - 1].last).toEqual(false)
    expect(tokens.filter(t => t.first).length).toEqual(0)
    expect(tokens.filter(t => t.last).length).toEqual(0)
  })

  it("test basic (de-DE)", async () => {
    const wrapper = shallowMount(Highlighting, {
      propsData: {
        content: "• vorbildung",
        locale: "de-DE",
        firstCharType: ["uncategorized", "uncategorized"],
        lastCharType: ["letter", "letter"],
      },
      localVue,
      store,
    })
    await wrapper.vm.$nextTick()
    const { tokens } = wrapper.vm
    expect(tokens.map(t => t.content).join("")).toEqual("• vorbildung")
    expect(tokens[0].first).toEqual(false)
    expect(tokens[tokens.length - 1].last).toEqual(false)
    expect(tokens.filter(t => t.first).length).toEqual(0)
    expect(tokens.filter(t => t.last).length).toEqual(0)
  })

  it("test trimming", async () => {
    const wrapper = shallowMount(Highlighting, {
      propsData: {
        content: "test test test tralala",
        locale: "en-GB",
        firstCharType: ["letter", "letter"],
        lastCharType: ["letter", "dot"],
      },
      localVue,
      store,
    })
    await wrapper.vm.$nextTick()
    const { tokens } = wrapper.vm
    expect(tokens.map(t => t.content).join("")).toEqual("test test test tralala")
    expect(tokens.length > 3).toEqual(true)
    expect(tokens[0].first).toEqual(false)
    expect(tokens[tokens.length - 1].last).toEqual(true)
    expect(tokens.filter(t => t.first).length).toEqual(0)
    expect(tokens.filter(t => t.last).length).toEqual(1)
  })

  it("test trimming spaces", async () => {
    const wrapper = shallowMount(Highlighting, {
      propsData: {
        content: " test test test tralala ",
        locale: "en-GB",
        firstCharType: ["space", "letter"],
        lastCharType: ["space", "letter"],
      },
      localVue,
      store,
    })
    await wrapper.vm.$nextTick()
    const { tokens } = wrapper.vm
    expect(tokens.map(t => t.content).join("")).toEqual(" test test test tralala ")
    expect(tokens.length > 3).toEqual(true)
    expect(tokens[0].first).toEqual(true)
    expect(tokens[tokens.length - 1].last).toEqual(true)
    expect(tokens.filter(t => t.first).length).toEqual(1)
    expect(tokens.filter(t => t.last).length).toEqual(1)
  })

  it("test trimming (zh-CN-Hans)", async () => {
    const wrapper = shallowMount(Highlighting, {
      propsData: {
        content: ":要接收确认电子邮件，请提供以下详细信息",
        locale: "zh-CN-Hans",
        firstCharType: ["colon", "letter"],
        lastCharType: ["letter", "letter"],
      },
      localVue,
      store,
    })
    await wrapper.vm.$nextTick()
    const { tokens } = wrapper.vm
    expect(tokens.map(t => t.content).join("")).toEqual(":要接收确认电子邮件，请提供以下详细信息")
    expect(tokens.length > 1).toEqual(true)
    expect(tokens[0].first).toEqual(true)
    expect(tokens[tokens.length - 1].last).toEqual(false)
    expect(tokens.filter(t => t.first).length).toEqual(1)
    expect(tokens.filter(t => t.last).length).toEqual(0)
  })

  it("test trimming (ja-JP)", async () => {
    const wrapper = shallowMount(Highlighting, {
      propsData: {
        content: "お支払いありがとうございます。追加荷物のご注文を処理し、完了した時点でメールにてお知らせします。航空会社によっては、この手続きに数時間かかる場合があります。",
        locale: "ja-JP",
        firstCharType: ["letter", "letter"],
        lastCharType: ["dot", "dot"],
      },
      localVue,
      store,
    })
    await wrapper.vm.$nextTick()
    const { tokens } = wrapper.vm
    expect(tokens.map(t => t.content).join("")).toEqual("お支払いありがとうございます。追加荷物のご注文を処理し、完了した時点でメールにてお知らせします。航空会社によっては、この手続きに数時間かかる場合があります。")
    expect(tokens.length > 10).toEqual(true)
    expect(tokens[0].first).toEqual(false)
    expect(tokens[tokens.length - 1].last).toEqual(false)
    expect(tokens.filter(t => t.first).length).toEqual(0)
    expect(tokens.filter(t => t.last).length).toEqual(0)
  })

  it("test inconsistency whole", async () => {
    const wrapper = shallowMount(Highlighting, {
      propsData: {
        content: "tralala",
        locale: "en-GB",
        firstCharType: ["letter", "letter"],
        lastCharType: ["letter", "letter"],
        typos: ["tralala"],
      },
      localVue,
      store,
    })
    await wrapper.vm.$nextTick()
    const { tokens } = wrapper.vm
    expect(tokens.map(t => t.content).join("")).toEqual("tralala")
    expect(tokens[0].first).toEqual(false)
    expect(tokens[tokens.length - 1].last).toEqual(false)
    expect(tokens.filter(t => t.first).length).toEqual(0)
    expect(tokens.filter(t => t.last).length).toEqual(0)
  })

  it("test inconsistency as first token", async () => {
    const wrapper = shallowMount(Highlighting, {
      propsData: {
        content: "tralala YOLO",
        locale: "en-GB",
        firstCharType: ["letter", "letter"],
        lastCharType: ["letter", "letter"],
        typos: ["tralala"],
      },
      localVue,
      store,
    })
    await wrapper.vm.$nextTick()
    const { tokens } = wrapper.vm
    expect(tokens.map(t => t.content).join("")).toEqual("tralala YOLO")
    expect(tokens[0].first).toEqual(false)
    expect(tokens[tokens.length - 1].last).toEqual(false)
    expect(tokens.filter(t => t.first).length).toEqual(0)
    expect(tokens.filter(t => t.last).length).toEqual(0)
  })

  it("test inconsistency as last token", async () => {
    const wrapper = shallowMount(Highlighting, {
      propsData: {
        content: "-YOLO tralala",
        locale: "en-GB",
        firstCharType: ["dash", "letter"],
        lastCharType: ["letter", "dot"],
        typos: ["tralala"],
      },
      localVue,
      store,
    })
    await wrapper.vm.$nextTick()
    const { tokens } = wrapper.vm
    expect(tokens.map(t => t.content).join("")).toEqual("-YOLO tralala")
    expect(tokens[0].first).toEqual(true)
    expect(tokens[tokens.length - 1].last).toEqual(true)
    expect(tokens.filter(t => t.first).length).toEqual(1)
    expect(tokens.filter(t => t.last).length).toEqual(1)
  })

  it("test inconsistency as last token (de-DE)", async () => {
    const wrapper = shallowMount(Highlighting, {
      propsData: {
        content: "• vorbildung",
        locale: "de-DE",
        firstCharType: ["uncategorized", "uncategorized"],
        lastCharType: ["letter", "letter"],
        typos: ["vorbildung"],
      },
      localVue,
      store,
    })
    await wrapper.vm.$nextTick()
    const { tokens } = wrapper.vm
    expect(tokens.map(t => t.content).join("")).toEqual("• vorbildung")
    expect(tokens[0].first).toEqual(false)
    expect(tokens[tokens.length - 1].last).toEqual(false)
    expect(tokens.filter(t => t.first).length).toEqual(0)
    expect(tokens.filter(t => t.last).length).toEqual(0)
  })

  it("test entity as last token", async () => {
    const wrapper = shallowMount(Highlighting, {
      propsData: {
        content: "<div>Hell yeah</div>",
        locale: "en-GB",
        firstCharType: ["letter", "letter"],
        lastCharType: ["letter", "letter"],
        tags: ["<div>", "</div>"],
      },
      localVue,
      store,
    })
    await wrapper.vm.$nextTick()
    const { tokens } = wrapper.vm
    expect(tokens.map(t => t.content).join("")).toEqual("<div>Hell yeah</div>")
    expect(tokens.length > 2).toEqual(true)
    expect(tokens[0].first).toEqual(false)
    expect(tokens[tokens.length - 1].last).toEqual(false)
    expect(tokens.filter(t => t.first).length).toEqual(0)
    expect(tokens.filter(t => t.last).length).toEqual(0)
  })

  it("test entity as middle token (zh-CN-Hans)", async () => {
    const wrapper = shallowMount(Highlighting, {
      propsData: {
        content: "注意，您预订的行程可能重复。继续预订之前，请通过电子邮箱查看另一行程的详情。您是否确认要继续处理此订单？如需帮助，请<a target=\\\"_blank\\\" href=\\\"/content/feedback\\\">联系我们</a>",
        locale: "zh-CN-Hans",
        firstCharType: ["letter", "letter"],
        lastCharType: ["letter", "letter"],
        tags: ["<a target=\\\"_blank\\\" href=\\\"/content/feedback\\\">", "</a>"],
      },
      localVue,
      store,
    })
    await wrapper.vm.$nextTick()
    const { tokens } = wrapper.vm
    expect(tokens.map(t => t.content).join(""))
      .toEqual("注意，您预订的行程可能重复。继续预订之前，请通过电子邮箱查看另一行程的详情。您是否确认要继续处理此订单？如需帮助，请<a target=\\\"_blank\\\" href=\\\"/content/feedback\\\">联系我们</a>")
    expect(tokens[0].first).toEqual(false)
    expect(tokens[tokens.length - 1].last).toEqual(false)
    expect(tokens.filter(t => t.first).length).toEqual(0)
    expect(tokens.filter(t => t.last).length).toEqual(0)
    expect(tokens.filter(t => t.type === "_entity_tags").length).toEqual(2)
  })

  it("complex test with multiple inconsistencies", async () => {
    const wrapper = shallowMount(Highlighting, {
      propsData: {
        content: "Rand text:: to to <u>I</u>> mean that this tpo is __placeholder__ policemen. Aniway 12 <div>Hell yeah</div>!",
        locale: "en-GB",
        firstCharType: ["letter", "letter"],
        lastCharType: ["letter mark", "exclamation mark"],
        disallowedTags: ["<u>", "</u>"],
        tags: ["<div>", "</div>"],
        typos: ["Rand", "tpo", "Aniway"],
        dynamics: ["12"],
        writeGood: [{ index: 15, offset: 2, reason: "\"to\" is repeated" }],
        insensitiveness: ["`policemen` may be insensitive, use `officers`, `police officers` instead"],
        placeholders: ["__placeholder__"],
      },
      localVue,
      store,
    })
    await wrapper.vm.$nextTick()
    const { tokens } = wrapper.vm
    expect(tokens.map(t => t.content).join(""))
      .toEqual("Rand text:: to to <u>I</u>> mean that this tpo is __placeholder__ policemen. Aniway 12 <div>Hell yeah</div>!")
    expect(tokens.length > 10).toEqual(true)
    expect(tokens[0].first).toEqual(false)
    expect(tokens[tokens.length - 1].last).toEqual(true)
    expect(tokens.filter(t => t.first).length).toEqual(0)
    expect(tokens.filter(t => t.last).length).toEqual(1)
    expect(tokens.filter(t => t.content === "</u>").length).toEqual(1)
    expect(tokens.filter(t => t.type === "_inconsistencies_typos").length).toEqual(3)
    expect(tokens.filter(t => t.type === "_inconsistencies_writeGood").length).toEqual(1)
    expect(tokens.filter(t => t.type === "_entity_placeholders").length).toEqual(1)
    expect(tokens.filter(t => t.type === "_inconsistencies_insensitiveness").length).toEqual(1)
    expect(tokens.filter(t => t.type === "_inconsistencies_tags").length).toEqual(2)
    expect(tokens.filter(t => t.type === "_entity_tags").length).toEqual(2)
    expect(tokens.filter(t => t.type === "_inconsistencies_dynamic").length).toEqual(1)
  })
})
