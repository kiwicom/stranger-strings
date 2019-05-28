import Vue from "vue"
import VueFire from "vuefire"
import BootstrapVue from "bootstrap-vue"
import Octicon from "vue-octicon/components/Octicon"
import CountryFlag from "vue-country-flag"

import VTooltip from "v-tooltip"
import "../styles/tooltip.css"

import App from "./App"
import router from "./router"

Vue.use(VueFire)
Vue.use(BootstrapVue)

Vue.use(VTooltip, {
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

Vue.component("octicon", Octicon)
Vue.component("vue-country-flag", CountryFlag)

Vue.config.productionTip = false
Vue.config.devtools = true
Vue.config.performance = true

new Vue({
  router,
  render: h => h(App),
}).$mount("#app")
