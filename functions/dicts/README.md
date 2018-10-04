# Custom dictionaries
All dictionaries in this folder are used for spellchecking and are prioritized over [default dictionaries](https://github.com/wooorm/dictionaries). To add your own dicitonaries paste `xx-XX.aff` and `xx-XX.dic` files in this folder.
## Format
Names of dictionaries must match localization file name in your source files (e.g. `xx-XX.json` will be spellchecked by `xx-XX` dictionary). Every dictionary should consist of 2 files. `xx-XX.dic` and `xx-XX.aff`. For more info about hunspell format follow [this link](https://www.systutorials.com/docs/linux/man/4-hunspell/).

:warning: All files must have UTF-8 encoding. :warning:

## Reminder
Make sure your dictionary is enabled in `./common/config.js`
```
const DEFAULT_SPELLCHECKING_DICT_SUPPORT = {
  ...
  "xx-XX": true,
  ...
}
```
