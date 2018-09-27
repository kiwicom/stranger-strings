import Vue from "vue"
import VueFire from "vuefire"
import BootstrapVue from "bootstrap-vue"
import Octicon from "vue-octicon/components/Octicon"
import App from "./App"
import router from "./router"

Vue.use(VueFire)
Vue.use(BootstrapVue)
Vue.component("octicon", Octicon)

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App),
}).$mount("#app")
