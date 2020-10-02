# Stranger Strings

![image](https://user-images.githubusercontent.com/26377907/55490923-de565a00-5634-11e9-9349-0f5f0dc90336.png)
### Demo 👉 <https://stranger-strings-showcase.firebaseapp.com>
## 📝 Description
**Stranger Strings** is open-source Firebase web application for analyzing localisation and exploring inconsistencies and
 mistakes in translations. It currently supports Github repos with JSON loc files or Phrase loc projects.
 
<img width="50%" src="https://user-images.githubusercontent.com/26377907/67780983-245a8b80-fa67-11e9-82de-6bbcfe9bc96d.png"><img width="50%" alt="config_preview2" src="https://user-images.githubusercontent.com/26377907/67783430-836dcf80-fa6a-11e9-8939-747230fe366a.png">
 
 ### Checks:
 * **Placeholders** - Detects missing / excess / inconsistent placeholders
 * **HTML tags** - Detects invalid / inconsistent / prohibited HTML tags
 * **Length** - Detects suspicious variations in length
 * **Spelling** - Detects spelling mistakes (supported languages can be chosen by enabling dictionaries in config file, uses <a href='https://github.com/wooorm/nspell'>nspell</a>)
 * **Style** - Detects stylistic issues – passive voice, weasel words, overuse of adverbs, cliches and similar (available only for english and german translations, uses <a href='https://github.com/btford/write-good'>write-good</a>)
 * **Insensitiveness** - Detects gender favouring, polarising, race related, religion inconsiderate, or other unequal phrasing (available only for english translations, uses <a href='https://github.com/get-alex/alex'>Alex</a>)
 * **Values** - Detects values, that should/could be replaced by placeholders, because values are likely to change over time
 * **First character** - Detects inconsistencies of first character
 * **Last character** - Detects inconsistencies of last character

<img width="50%" src="https://user-images.githubusercontent.com/26377907/67780983-245a8b80-fa67-11e9-82de-6bbcfe9bc96d.png"><img width="50%" alt="config_preview2" src="https://user-images.githubusercontent.com/26377907/67783430-836dcf80-fa6a-11e9-8939-747230fe366a.png">

 ### ✅ Checks:
 * **Placeholders** - Detects missing / excess / inconsistent placeholders
 * **HTML tags** - Detects invalid / inconsistent / prohibited HTML tags
 * **Length** - Detects suspicious variations in length
 * **Spelling** - Detects spelling mistakes (supported languages can be chosen by enabling dictionaries in config file, uses <a href='https://github.com/wooorm/nspell'>nspell</a>)
 * **Style** - Detects stylistic issues – passive voice, weasel words, overuse of adverbs, cliches and similar (available only for english and german translations, uses <a href='https://github.com/btford/write-good'>write-good</a>)
 * **Insensitiveness** - Detects gender favouring, polarising, race related, religion inconsiderate, or other unequal phrasing (available only for english translations, uses <a href='https://github.com/get-alex/alex'>Alex</a>)
 * **Values** - Detects values, that should/could be replaced by placeholders, because values are likely to change over time
 * **First character** - Detects inconsistencies of first character
 * **Last character** - Detects inconsistencies of last character

## 🛠 Project setup
### 📌 Requirements
* [Firebase project](https://console.firebase.google.com) with (Flame/Blaze Plan*)
* Firebase Realtime Database
* GitHub repository with localizations in flat JSON format **or** Phrase account

*\* Flame and Blaze plans are required for Google Cloud Functions outbound API calls (e.g. GitHub). Stranger Strings is a very lightweight application so if you choose Blaze plan you shouldn't pay anything at all*

### 🧩 Installation
**1.** Configure ``.env`` file (e.g.:)
```
# note: select one data source and fill it's data

################ DATASOURCE: PhraseApp ################

VUE_APP_PHRASEAPP_PROJECT_ID="yourPhraseAppProjectID"
VUE_APP_PHRASEAPP_TOKEN="yourPhraseAppToken"

################# DATASOURCE: GitHub ##################

VUE_APP_GITHUB_USER="yourGitHubUserAccontName"
VUE_APP_GITHUB_PASSWORD="youtGitHubUserPassword"
VUE_APP_GITHUB_REPO="https://github.com/yourRepository/yourTranslations"

#######################################################

VUE_APP_FIREBASE_MESSAGING_SENDER_ID="seeImagesBelow"
VUE_APP_FIREBASE_API_KEY="seeImagesBelow"
VUE_APP_FIREBASE_AUTH_DOMAIN="seeImagesBelow"
VUE_APP_FIREBASE_DATABASE_URL="seeImagesBelow"
VUE_APP_FIREBASE_PROJECT_ID="seeImagesBelow"
VUE_APP_FIREBASE_STORAGE_BUCKET="seeImagesBelow"
VUE_APP_FIREBASE_APP_ID="seeImagesBelow"
```
<img width="49.69%" src="https://user-images.githubusercontent.com/26377907/67397632-c2eb7600-f5a9-11e9-8dcb-4d2bf064631c.png"><img width="50%" alt="config_preview2" src="https://user-images.githubusercontent.com/26377907/67397689-dac2fa00-f5a9-11e9-8dc3-c202cf501acc.png">

**2.** Install dependencies
```
yarn install --all && yarn --cwd ./functions
```
**3.** Login to Firebase and select target project
```
firebase login
firebase use *your_Firebase_project_ID*
```

**4.** (Optional) Adjust access rights and sign-in method in`/common/config.js`

**5.** Deploy
```
yarn deploy
```

**6.** Enable sign-in providers accordingly to config `const SIGN_IN_METHOD` in `/common/config.js` in Firebase Console (default Anonymous)

![authproviderss](https://user-images.githubusercontent.com/26377907/50009509-76153700-ffb7-11e8-9666-224da7c46ca9.gif)

## 💽 Data sources
**Stranger Strings** supports importing translations from Phrase or GitHub.

### :octocat: GitHub repository structure
```
.
├── en-GB.json              # file containing en-GB localization
├── ...
└── xx-XX.json
```
### :octocat: JSON format
Supports only basic key-value format where key is translation key and value is translation content.

flat form:
```
{
  ...
  "translation.key": "Translation content 1.",
  "translation.keyTwo": "Translation content 2.",
  "another.translation.key": "Another translation content.",
  ...
}
```
or nested form:
```
{
  ...
  "translation": {
    "key": "Translation content 1.",
    "keyTwo": "Translation content 2."
  },
  "another": {
    "translation": {
      "key": "Another translation content."
    }
  },
  ...
}
```
