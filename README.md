# Stranger Strings

![image 2018-10-02 13-10-15](https://user-images.githubusercontent.com/26377907/46345344-87030d00-c644-11e8-8a07-27f1eee81531.png)
##### Demo: <https://stranger-strings-showcase.firebaseapp.com> 
## Description
**Stranger Strings** is open-source Firebase web application for exploring inconsistencies and
 mistakes in translations.  The aim of this project is to create a versatile tool that will help
  users increase their online service qualities in terms of localization.

## Project setup
### Requirements
* [Firebase project](https://console.firebase.google.com) with (Flame/Blaze Plan*)
* Firebase Realtime Database
* GitHub repository with localizations in JSON format

*\* Flame and Blaze plans are required for Google Cloud Functions outbound API calls (e.g. GitHub)* 

### Installation
**1.** Configure ``.env`` file (e.g.:)
```
GITHUB_USER="yourGitHubUserAccontName"
GITHUB_PASSWORD="youtGitHubUserPassword"
GITHUB_REPO="https://github.com/yourRepository/yourTranslations"

VUE_APP_FIREBASE_MESSAGING_SENDER_ID="seeImagesBelow"
VUE_APP_FIREBASE_API_KEY="seeImagesBelow"
VUE_APP_FIREBASE_AUTH_DOMAIN="seeImagesBelow"
VUE_APP_FIREBASE_DATABASE_URL="seeImagesBelow"
VUE_APP_FIREBASE_PROJECT_ID="seeImagesBelow"
VUE_APP_FIREBASE_STORAGE_BUCKET="seeImagesBelow"
```
<img width="57%" src="https://user-images.githubusercontent.com/26377907/46346735-596c9280-c649-11e8-8750-63364380e73d.png"><img width="42.5%" alt="config_preview2" src="https://user-images.githubusercontent.com/26377907/46346761-6e492600-c649-11e8-9f4e-32a9404daf45.png">

**2.** Install dependencies
```
yarn install --all && yarn --cwd ./functions
```
**3.** Login to Firebase and select target project
```
firebase login
firebase use *your_Firebase_project_ID*
```
**4.** Deploy
```
yarn deploy
```
**5.** Enable sign-in providers in Firebase Console (Google)

![authproviderss](https://user-images.githubusercontent.com/26377907/50009509-76153700-ffb7-11e8-9666-224da7c46ca9.gif)

## Source data
For now **Stranger Strings** only supports importing translations from GitHub in JSON format.

### GitHub repository structure
```
.
├── en-GB.json              # file containing en-GB localization
├── ...
└── xx-XX.json
```
### JSON format
```
{
  ...
  "translation.key": "Translation content.",
  "another.translation.key": "Another translation content.",
  ...
}
```

