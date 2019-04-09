const superagent = require("superagent")
const _ = require("lodash")
const async = require("async")


const path = "https://api.phraseapp.com/v2"

module.exports = function (projectId, token) {
  async function fetchProjectLastUpdate() {
    return new Promise((resolve, reject) => {
      superagent
        .get(`${path}/projects/${projectId}`)
        .query({ access_token: token })
        .end((err, res) => {
          if (err) {
            reject(err)
          } else {
            resolve(res.body.updated_at)
          }
        })
    })
  }


  async function fetchLocales() {
    return new Promise((resolve, reject) => {
      superagent
        .get(`${path}/projects/${projectId}/locales`)
        .query({ access_token: token, per_page: 100 }) // Rely on number of locales being less then 100
        .end((err, res) => {
          if (err) {
            reject(err)
          } else {
            resolve(res.body.map(locale => ({ id: locale.id, code: locale.code })))
          }
        })
    })
  }

  async function fetchTranslations(locales) {
    // TODO: Limit concurrency to 2 as specified in PhraseApp docs
    const promises = locales.map(locale => new Promise((resolve, reject) => {
      superagent
        .get(`${path}/projects/${projectId}/locales/${locale.id}/download`)
        .query({
          file_format: "simple_json",
          access_token: token,
          include_empty_translations: true,
        })
        .end((err, res) => {
          if (err) {
            reject(err)
          } else {
            resolve({
              code: locale.code,
              data: res.body,
            })
          }
        })
    }))

    // [
    //   {
    //     "code": "en-GB",
    //     "data": {
    //       "x.y.z": "AAA"
    //     }
    //   }
    // ]

    return Promise.all(promises).then(arr => arr.reduce((acc, x) => {
      acc[x.code] = x.data
      return acc
    }, {}))
  }

  return {
    version: async () => {
      const lastUpdate = await fetchProjectLastUpdate()
      return lastUpdate
    },

    fetch: async () => {
      const locales = await fetchLocales()
      // locales = locales.slice(0, 2) // For testing
      const translations = await fetchTranslations(locales)


      // {
      //   "en-GB": {
      //     "x.y.z": "AAA"
      //   }
      // }

      // const defaultLocaleCode = "en-GB";
      const defaultLocaleCode = Object.keys(translations)[0]

      const enKeys = Object.keys(translations[defaultLocaleCode])

      const output = enKeys.reduce((acc, key) => {
        acc[key] = locales.reduce((acc2, locale) => {
          acc2[locale.code] = translations[locale.code][key]
          return acc2
        }, {})
        return acc
      }, {})


      // {
      //   "x.y.z": {
      //     "en-GB": "AAA",
      //     "cz-CS": "BBB"
      //   }
      // }


      return {
        version: await fetchProjectLastUpdate(), // TODO: Try to save this one API call
        translations: output,
      }
    },
  }
}
