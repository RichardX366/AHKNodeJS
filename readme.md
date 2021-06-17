
# AHK NodeJS

AHK NodeJS allows users to communicate with AutoHotKey using NodeJS.

## Contents

- [Important Notes](#important-notes)
- [Installation](#installation)
- [Initiation](#initiation)
- [The AHK Object](#the-ahk-object)
  - Parsers
    - [toPercent](#topercent)
    - [toPx](#topx)
  - Non-Communication
    - [setHotkey](#sethotkey)
    - [sleep](#sleep)
    - [waitForInterrupt](#waitforinterrupt)
  - Gets Information
    - [clipboard](#clipboard)
    - [imageSearch](#imagesearch)
    - [pixelSearch](#pixelsearch)
    - [getPixelColor](#getpixelcolor)
    - [getMousePos](#getmousepos)
  - Does things
    - [mouseMove](#mousemove)
    - [click](#click)
    - [clickPlay](#clickplay)
    - [clipboard](#clipboard)
    - [send](#send)
    - [sendPlay](#sendplay)
    - [sendInput](#sendinput)
    - [setKeyDelay](#setkeydelay)
    - [setMouseSpeed](#setmousespeed)
    - [shutdown](#shutdown)

## Installation

Use [npm](https://www.npmjs.com) to install AHK NodeJS.
If AutoHotKey.exe is not installed on your computer, please install it or refer to another npm module, [ahk.exe](https://www.npmjs.com/package/ahk.exe).

```bash
npm i ahknodejs
```

## Important Notes

- When a parameter is followed by a question mark, it means it is optional
- If curly brackets are to be used in strings, the must be escaped as such: `"\\{"`
- Special characters in strings can be typed the same way as in AutoHotKey, as shown [here](https://www.autohotkey.com/docs/commands/Send.htm#keynames)
- AHKNodeJS executes AHK commands in a set order asynchronously, so await is pretty much required as AHK commands attempting to run synchronously will likely crash the script.
- When RGB hex *strings* are mentioned, it is talking about a color focused as RRGGBB without a 0x or # prefix

## Initiation

```js
const ahk = await require("ahknodejs")(Path, Hotkeys?, Options?);
```

**Path** - A *string* representing the location of AutoHotKey.exe

**Hotkeys** - A list of either *strings* and/or *objects* representing the hotkeys that will be used. The hotkeys will need to be [set](#sethotkey) in order to be used.

- If a string is used, it will be formatted the same way AutoHotKey hotkeys are formatted. This is further explained [here](https://www.autohotkey.com/docs/Hotkeys.htm).
- If an object is used, it be in one of two forms depending on if multiple keys are used in the hotkey

Note: if noInterrupt is set to true, the keys will still be sent when the hotkey is triggered. This option defaults to false.

**One Key**:
```js
{
  key: "KEY TO LISTEN",
  modifiers: [
    "list of modifiers"
  ],
  noInterrupt: true or false
}
```
Modifiers that can be used are win, alt, control, shift, and any (any modifier will trigger the hotkey). This defaults to an empty array if not provided.

**Multiple Keys**:
```js
{
  keys: [
    "KEY TO LISTEN",
   ],
  noInterrupt: true or false
}
```
Note: If a multi-key hotkey is used, it will trigger no matter what modifers are present in accordance with [AutoHotKey](https://www.autohotkey.com/docs/Hotkeys.htm#combo)
#### Options:
 An object with the options to set for AHKNodeJS. The properties are listed below:
- **defaultColorVariation** -  If the color variation is not set for [imageSearch](#imagesearch) and [pixelSearch](#pixelsearch), this *number* is automatically used. (Defaults to 1)

**Returns** - The AHK object

## The AHK Object 

The AHK object holds all the functions that are used to communicate with AutoHotKey as well as other properties that may be useful. Such properties and functions will be listed below.

*Note:* In the following bits of code, AHK is the AHK object.

### Properties
- **Options** - The AHK object contains the [options](#options) that were used to initiate it as different properties of the AHK object. If an option was not set, the property in the AHK object will be the default value. If this value is changed, it will be as if AHKNodeJS had initialized with that option changed.
- **width** - The current width of the screen in pixels (Do not change)
- **height** - The current height of the screen in pixels (Do not change)
- **hotkeys** - An *object* containing each hotkey and the function that it runs once pressed. (Do not change)
- **hotkeysPending** - An array containing the hotkeys that are pending to be run in a [waitForInterrupt](#waitforinterrupt)
***
### toPercent
Converts a pair of coordinates to percentages of the screen's width and height
```js
var percentages = ahk.toPercent([x, y]);
```
**x** - The x coordinate

**y** - The y coordinate

**Returns** - [Percent of screen's width, Percent of screen's height]
***
### toPx
Converts a pair of coordinates to percentages of the screen's width and height
```js
var percentages = ahk.toPx([x, y]);
```
**x** - The percent of the screen's width

**y** - The percent of the screen's height

**Returns** - [x-coordinate, y-coordinate]
***
### setHotkey
Binds a hotkey to a function
```js
ahk.setHotkey(hotkey, toRun, instant?);
```
**hotkey** - The *object* or *string* hotkey used in the intitialization of AHKNodeJS

**toRun** - An async or normal function that will be run when the hotkey is triggered and run in [waitForInterrupt](#waitforinterrupt)

**instant** - A boolean that determines whether or not the function will be run instantly. If this is set to true, toRun should not contain any AHK communication as it could result in two AHK functions running synchronously which would likely crash the script.
***
### sleep
Sleeps for a certain amount of time
```js
await ahk.sleep(ms);
```
**ms** - The amount of time to wait for in milliseconds
***
### waitForInterrupt
Checks if any hotkeys have been pressed and executes their functions asynchronously in order from oldest hotkey pressed to newest. Once all functions have been executed, this function is resolved.
```js
await ahk.waitForInterrupt();
```
***
### mouseMove
Moves the mouse to the specified position
```js
await ahk.mouseMove({
  x: number,
  y: number,
  speed?: number,
  positioning?: string
});
```
**x** - The x coordinate or percent of the screen's width to move to

**y** - The y coordinate or percent of the screen's height to move to

**speed** - The speed of the mouse on a range of (0 - 100). A speed of 0 will move the mouse instantly to its position, and if not specified, the mouse speed will default to the speed set by [setMouseSpeed](#setmousespeed)

**positioning** - If positioning is set to %, then x and y will be interpreted as percentages of the screen's width and height rather than coordinates
***
### click
Clicks the mouse. If x and y are specified, the mouse will move at the speed set by [setMouseSpeed](#setmousespeed). If no parameters are provided, it will perform one left click at the mouse's current position.
```js
await ahk.click({
  x?: number,
  y?: number,
  positioning?: string,
  button?: string,
  state?: string,
  count?: number
}?);
```
**x** - The x coordinate or percent of the screen's width to click the mouse at

**y** - The y coordinate or percent of the screen's height to click the mouse at

**positioning** - If positioning is set to %, then x and y will be interpreted as percentages of the screen's width and height rather than coordinates

**button** - Controls which mouse button will be clicked. If button is set to left, it will left click. If button is set to middle, it will middle click. If button is set to right, it will right click. This value defaults to left.

**state** - Controls the state of the mouse button. If state is set to down, it will hold the mouse button down. If state is set to up, it will release the mouse button. If no state is specified, it will send the mouse button down and back up.

**count** - The amount of clicks that it will perform. This value defaults to one.
***
### clickPlay
Clicks the mouse using SendPlay. It is the same as [click](#click) in every other way.
```js
await ahk.click({
  x?: number,
  y?: number,
  positioning?: string,
  button?: string,
  state?: string,
  count?: number
}?);
```
**x** - The x coordinate or percent of the screen's width to click the mouse at

**y** - The y coordinate or percent of the screen's height to click the mouse at

**positioning** - If positioning is set to %, then x and y will be interpreted as percentages of the screen's width and height rather than coordinates

**button** - Controls which mouse button will be clicked. If button is set to left, it will left click. If button is set to middle, it will middle click. If button is set to right, it will right click. This value defaults to left.

**state** - Controls the state of the mouse button. If state is set to down, it will hold the mouse button down. If state is set to up, it will release the mouse button. If no state is specified, it will send the mouse button down and back up.

**count** - The amount of clicks that it will perform. This value defaults to one.
***
### clipboard
Accesses the clipboard. If value is not specified, it returns the current clipboard. If value is specified, it will set the clipboard to value.
```js
var clipboard = await ahk.clipboard(value?);
```
**value** - The *string* that the clipboard will be set to

**Returns** - The value of the clipboard if no parameter is passed in
***
### imageSearch
Searches for a color in a specified area
```js
var found = await ahk.imageSearch({
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  imgPath: string,
  variation?: number,
  trans?: string,
  positioning?: string
});
```
**x1** - The x coordinate or percent of the screen's width of the top left corner of the rectangle that the color will be searched for

**y1** - The y coordinate or percent of the screen's height of the top left corner of the rectangle that the color will be searched for

**x2** - The x coordinate or percent of the screen's width of the bottom right corner of the rectangle that the color will be searched for

**y2** - The y coordinate or percent of the screen's height of the bottom right corner of the rectangle that the color will be searched for

**imgPath** - A *string* representing the path to the image to be searched. This path is either relative to the current working directory or an absolute file path.

**variation** - A *number* showing the amount of shades a pixel's red, green, and blue values can be off by ranging from (0 - 255). Defaults to the option, defaultColorVariation.

**trans** - An RGB hex *string* representing the color that should be treated as transparent and match any color.

**positioning** - If positioning is set to %, then x1, y1, x2, and y2 will be interpreted as percentages of the screen's width and height rather than coordinates

**Returns** - If the image is not found, it returns null. If normal positioning is used, it returns [x, y] where x and y are the coordinates of the top left corner of the found image.  If percent positioning is used, it returns [x, y] where x and y are percentages of the screen.
***
### pixelSearch
Searches for a color in a specified area
```js
var found = await ahk.pixelSearch({
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  variation?: number,
  positioning?: string
});
```
**x1** - The x coordinate or percent of the screen's width of the top left corner of the rectangle that the color will be searched for

**y1** - The y coordinate or percent of the screen's height of the top left corner of the rectangle that the color will be searched for

**x2** - The x coordinate or percent of the screen's width of the bottom right corner of the rectangle that the color will be searched for

**y2** - The y coordinate or percent of the screen's height of the bottom right corner of the rectangle that the color will be searched for

**color** - An RGB hex *string* representing the color that should be searched for in.

**variation** - A *number* showing the amount of shades a pixel's red, green, and blue values can be off by ranging from (0 - 255). Defaults to the option, defaultColorVariation.

**positioning** - If positioning is set to %, then x1, y1, x2, and y2 will be interpreted as percentages of the screen's width and height rather than coordinates

**Returns** - If no pixel with the specified color is found, it returns null. If normal positioning is used, it returns [x, y] where x and y are the coordinates of the first pixel with the specified color.  If percent positioning is used, it returns [x, y] where x and y are percentages of the screen.
***
### getPixelColor
Gets the specified pixel's color
```js
var color = await ahk.getPixelColor({
  x: number,
  y: number,
  positioning?: string,
  mode?: string
});
```
**x** - The x coordinate or percent of the screen's width to click the mouse at

**y** - The y coordinate or percent of the screen's height to click the mouse at

**positioning** - If positioning is set to %, then x and y will be interpreted as percentages of the screen's width and height rather than coordinates

**mode** - The [mode](https://www.autohotkey.com/docs/commands/PixelGetColor.htm#Parameters) documented by AutoHotKey. This *string* can either be slow or alt.

**Returns** - The color of the pixel formatted as an RGB hex *string*.
***
### getMousePos
Gets the position of the mouse.
```js
var position = await ahk.getMousePos(positioning?);
```
**positioning** - The *string* that the clipboard will be set to

**Returns** - If normal positioning is used, it returns [x, y] where x and y are the coordinates of the mouse. If percent positioning is used, it returns [x, y] where x and y are percentages of the screen.
***
### send
Sends the provided *string* possibly wrapped in an *object*.
```js
await ahk.send({
  msg: string,
  blind?: boolean
} | msg);
```
**msg** - The message to send

**blind** - Whether or not [blind mode](https://www.autohotkey.com/docs/commands/Send.htm#Blind) will be used
***
### sendInput
Sends the provided *string* using [sendInput](https://www.autohotkey.com/docs/commands/Send.htm#SendInputDetail) possibly wrapped in an *object*.
```js
await ahk.sendInput({
  msg: string,
  blind?: boolean
} | msg);
```
**msg** - The message to send

**blind** - Whether or not [blind mode](https://www.autohotkey.com/docs/commands/Send.htm#Blind) will be used
***
### sendPlay
Sends the provided *string* using [sendPlay](https://www.autohotkey.com/docs/commands/Send.htm#SendPlayDetail) possibly wrapped in an *object*.
```js
await ahk.sendPlay({
  msg: string,
  blind?: boolean
} | msg);
```
**msg** - The message to send

**blind** - Whether or not [blind mode](https://www.autohotkey.com/docs/commands/Send.htm#Blind) will be used
***
### setKeyDelay
Sets the key delay and duration for play or normal send. Either duration or delay should be present.
```js
await ahk.setKeyDelay({
  delay?: number,
  duration?: number,
  play?: boolean
});
```
**delay** - The milliseconds between each key press

**duration** - The duration of how long the keys will stay down for

**play** - Determines whether the provided parameters will be applied to [sendPlay](#sendplay). This defaults to false.
***
### setMouseSpeed
Sets the default mouse speed to the provided number.
```js
await ahk.setMouseSpeed(speed);
```
**speed** - A *number* from (0 - 100) of how fast the mouse will move by default. A speed of 0 will instantly move the mouse.
***
### shutdown
Shuts down the entire computer. Because it shuts down the computer, this will return nothing nor wait for AHK to return anything.
```js
ahk.shutdown();
```
## Examples
A script that exits on `\`, clicks on `]`, and clicks every 5 seconds.
```js
async function allCode() {
  const ahk = await require("./AHKNodeJS")(require("ahk.exe"), [
    { key: "\\", noInterrupt: true },
    { key: "]", noInterrupt: true },
  ]);
  ahk.setHotkey( { key: "\\", noInterrupt: true }, function() {
    process.exit();
  }, true);
  ahk.setHotkey( { key: "]", noInterrupt: true }, async function() {
    await ahk.click();
  });
  while (true) {
    await ahk.waitForInterrupt();
    await ahk.click();
    await ahk.sleep(5000);
  }
}
allCode().catch(function(error) {
  console.log(error);
});
```

## License
[MIT](https://github.com/Richard-X-366/AHKNodeJS/blob/master/LICENSE/)
