
# AHK NodeJS

AHK NodeJS allows users to communicate with AutoHotKey using NodeJS.

## Contents

* [Installation](#Installation)
* [Initiation](#Initiation)

## Installation

Use [npm](https://www.npmjs.com) to install AHK NodeJS.
If AutoHotKey.exe is not installed on your computer, please install it or refer to another npm module, [ahk.exe](https://www.npmjs.com/package/ahk.exe).

```bash
npm i ahknodejs
```

## Usage

### Important Notes

- When a parameter is followed by a question mark, it means it is optional
- If curly brackets are to be used in strings, the must be escaped as such: "\\\\{".
- Special characters in strings can be typed the same way as in AutoHotKey, as shown [here](https://www.autohotkey.com/docs/commands/Send.htm#keynames).

### Initiation

```js
require("ahknodejs")(Path, Hotkeys?, Options?);
```

**Path** - A string representing the location of AutoHotKey.exe
**Hotkeys** - A list of either strings and/or objects representing the hotkeys that will be used. The hotkeys will need to be [set](#setHotkey) in order to be used.

- If a string is used, it will be formatted the same way AutoHotKey hotkeys are formatted. This is further explained [here](https://www.autohotkey.com/docs/Hotkeys.htm).
- If an object is used, it be one of two forms depending on if multiple keys are used in the hotkey.

Note: if noInterrupt is set to true, the keys will still be sent when the hotkey is triggered. This option defaults to false.
One Key:
```js
{
  "key": "KEY TO LISTEN",
  "modifiers": [
    "list of modifiers"
  ],
  "noInterrupt": true or false
}
```
Modifiers that can be used are win, alt, control, shift, and any (any modifier will trigger the hotkey). This defaults to an empty array if not provided.

Multiple Keys:
```js
{
  "keys": [
    "KEY TO LISTEN",
   ],
  "noInterrupt": true or false
}
```
Note: If a multi-key hotkey is used, it will trigger no matter what modifers are present in accordance with [AutoHotKey](https://www.autohotkey.com/docs/Hotkeys.htm#combo).
 
**Options** - An object with the options to set for AHKNodeJS. The properties are listed below:

- defaultColorVariation: If the color variation is not set for [imageSearch](#imageSearch) and [pixelSearch](#pixelSearch), this value is automatically used. (Defaults to 0)

## License
[MIT](https://github.com/Richard-X-366/AHKNodeJS/blob/master/LICENSE/)
