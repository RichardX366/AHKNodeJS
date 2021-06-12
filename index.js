const spawn = require("child_process").spawn;
const fs = require("fs/promises");

/**
 * Initiates AHK NodeJS with the following parameters
 * @module ahknodejs
 * @param {string} path - The path to AutoHotKey.exe
 * @param {[
 *  {key: string,
 *   modifiers?: [
 *    string
 *   ],
 *   noInterrupt?: boolean
 *  }?,
 *  {
 *   keys: [string],
 *   noInterrupt?: boolean
 *  }?
 * ]?} hotkeysList - A list of to-be-used hotkeys
 * @param {{
 *  defaultColorVariation?: number
 * }} options - The options to initiate AHK NodeJS with
 * @returns An object containing this package's functions
 */
module.exports = async function(path, hotkeysList, options) {
  if (!hotkeysList) {
    hotkeysList = [];
  }
  if (!options) {
    options = {};
  }
  function wait() {
    return new Promise(function(resolve) {
      ahk.current = resolve;
    });
  }
  const ahk = {
    defaultColorVariation: 0,
    hotkeysList: hotkeysList,
    current: null,
    hotkeys: {},
    hotkeysPending: [],
    /**
     * Turns pixel coordinates into screen percents
     * @param {[x: number, y: number]} x - The coordinates
     * @returns The array with pixels as screen percents.
     */
    toPercent(x) {
      return [x[0] * 100 / ahk.width, x[1] * 100 / ahk.height];
    },
    /**
     * Turns screen percents into pixel coordinates
     * @param {[x: number, y: number]} x - The percentages
     * @returns The array with screen percents as pixels.
     */
    toPx(x) {
      return [x[0] / 100 * ahk.width, x[1] / 100 * ahk.height];
    },
    /**
     * Sets a hotkey to a function
     * @param {string | object} key - The hotkey to bind
     * @param {function} run - The function to run on bind
     */
    setHotkey: function(key, run) {
      var ahkKey;
      if (typeof key === "string") ahkKey = key;
      else {
        if (key.keys) ahkKey = key.keys.join(" ");
        else {
          let mod = "";
          if (key.modifiers) {
            mod += key.modifiers.join("")
            .replace("win", "#")
            .replace("alt", "!")
            .replace("control", "^")
            .replace("shift", "+")
            .replace("any", "*")
          }
          ahkKey = mod + key.key;
        }
      }
      ahk.hotkeys[ahkKey] = run;
    },
    /**
     * Sleeps for a certain amount of time
     * @param {number} x - The time in ms to sleep for
     * @returns A promise that is fufilled once the time is up
     */
    sleep: function(x) {
      return new Promise(function(resolve) {
        setTimeout(resolve, x);
      });
    },
    /**
     * Runs a hotkey if one is detected
     */
    waitForInterrupt: async function() {
      while (ahk.hotkeysPending[0]) {
        await ahk.hotkeys[ahk.hotkeysPending[0]]();
        ahk.hotkeysPending.shift();
      }
    },
    /**
     * Moves the mouse; If positioning is % then the coordinates are interpreted as percents of the screen
     * @param {{
     *  x: number,
     *  y: number,
     *  time?: number,
     *  positioning?: number
     * }} x - The Parameters
     */
    mouseMove: async function(x) {
      if (!x.time) x.time = 2;
      if (x.positioning === "%") {
        x.x = Math.floor(x.x / 100 * ahk.width);
        x.y = Math.floor(x.y / 100 * ahk.height);
      }
      runner.stdin.write(`mouseMove;${x.x};${x.y};${x.time}\n`);
      await wait();
    },
    /**
     * Clicks the mouse. Look at the documentation for information on parameters.
     * @param {{
     *  button?: string,
     *  state?: string
     * }} x 
     */
    click: async function(x) {
      if (!x) {
        x = {};
      }
      if (!x.button) x.button = "left";
      if (x.state === "down") x.state = "D";
      else if (x.state === "up") x.state = "U";
      else x.state = "";
      runner.stdin.write(`click;${x.button};${x.state}\n`);
      await wait();
    },
    /**
     * Gets or sets the clipboard
     * @param {string} [x] - If provided, the clipboard is set to the value
     * @returns The clipboard if no parameters are passed in
     */
    clipboard: async function(x) {
      if (x) {
        runner.stdin.write(`setClipboard;${x}\n`);
        await wait();
      } else {
        runner.stdin.write(`getClipboard\n`);
        return await wait();
      }
    },
    /**
     * Types out a string. Look at documentation for extra information.
     * @param {string} x - The string to send
     */
    send: async function(x) {
      var toSend = "";
      if (x.blind) toSend += "{Blind}";
      toSend += x.msg
      .replace(/!/g, "{!}")
      .replace(/#/g, "{#}")
      .replace(/\+/g, "{+}")
      .replace(/\^/g, "{^}")
      .replace(/\\{/g, "{{}")
      .replace(/\\}/g, "{}}")
      .replace(/\n/g, "{Enter}");
      runner.stdin.write(`send;${toSend}\n`);
      await wait();
    },
    /**
     * Searches for a pixel of set color
     * @param {{
     *  x1: number,
     *  y1: number,
     *  x2: number,
     *  y2: number,
     *  color: string,
     *  variation?: number
     * }} x - The parameters
     * @returns If found, [x, y]. If % positioning is used, it returns them as screen percents.
     */
    pixelSearch: async function(x) {
      if (!x.variation) x.variation = ahk.defaultColorVariation;
      if (x.positioning === "%") {
        x.x1 = Math.floor(x.x1 / 100 * ahk.width);
        x.y1 = Math.floor(x.y1 / 100 * ahk.height);
        x.x2 = Math.floor(x.x2 / 100 * ahk.width);
        x.y2 = Math.floor(x.y2 / 100 * ahk.height);
      }
      runner.stdin.write(`pixelSearch;${x.x1};${x.y1};${x.x2};${x.y2};0x${x.color};${x.variation}\n`);
      var pos = (await wait()).split(" ");
      if (pos[0] === "") {
        return null;
      }
      if (x.positioning === "%") {
        pos[0] = pos[0] / ahk.width * 100;
        pos[1] = pos[1] / ahk.height * 100;
      }
      return pos;
    },
    /**
     * Gets a pixel's color
     * @param {{
     *  x: number,
     *  y: number,
     *  positioning?: string,
     *  mode?: string
     * }} x - The parameters
     * @returns The pixel's color in hex RGB
     */
    getPixelColor: async function(x) {
      if (x.positioning === "%") {
        x.x = Math.floor(x.x / 100 * ahk.width);
        x.y = Math.floor(x.y / 100 * ahk.height);
      }
      var mode = "RGB ";
      if (x.mode === "slow") {
        mode += "Slow";
      } else if (x.mode === "alt") {
        mode += "Alt";
      }
      runner.stdin.write(`getPixelColor;${x.x};${x.y};${mode}\n`);
      var color = (await wait()).replace("0x", "").split("");
      return color[4]+color[5]+color[2]+color[3]+color[0]+color[1];
    },
    /**
     * Gets the location of the mouse.
     * @param {string} [x] 
     * @returns [x, y] If % positioning is used, they are returned as screen percents.
     */
    getMousePos: async function(x) {
      runner.stdin.write(`getMousePos\n`);
      var pos = (await wait()).split(" ");
      if (x === "%") {
        pos[0] = pos[0] / ahk.width * 100;
        pos[1] = pos[1] / ahk.height * 100;
      }
      return pos;
    },
    /**
     * Searches for an image with path relative to the current working directory
     * @param {{
     *  x1: number,
     *  y1: number,
     *  x2: number,
     *  y2: number,
     *  variation?: number
     *  trans?: string
     *  positioning?: string
     * }} x - The parameters
     * @returns If found, [x, y]. If % positioning is used, it returns them as screen percents.
     */
    imageSearch: async function(x) {
      if (!x.variation) x.variation = ahk.defaultColorVariation;
      else x.variation = `*${x.variation} `;
      if (!x.trans) x.trans = "";
      else x.trans = `*Trans0x${x.trans} `;
      if (x.positioning === "%") {
        x.x1 = Math.floor(x.x1 / 100 * ahk.width);
        x.y1 = Math.floor(x.y1 / 100 * ahk.height);
        x.x2 = Math.floor(x.x2 / 100 * ahk.width);
        x.y2 = Math.floor(x.y2 / 100 * ahk.height);
      }
      runner.stdin.write(`imageSearch;${x.x1};${x.y1};${x.x2};${x.y2};${x.variation}${x.trans}${x.imgPath}\n`);
      var pos = (await wait()).split(" ");
      if (pos[0] === "") {
        return null;
      }
      if (x.positioning === "%") {
        pos[0] = pos[0] / ahk.width * 100;
        pos[1] = pos[1] / ahk.height * 100;
      }
      return pos;
    },
    /**
     * Changes the delay for key presses. Check the documentation for extra details.
     * @param {{
     *  delay?: number,
     *  duration?: number,
     *  play?: number
     * }} x - The parameters
     */
    setKeyDelay: async function(x) {
      if (!x.delay) x.delay = "";
      if (!x.duration) x.duration = "";
      if (x.play) x.play = "Play";
      else x.play = "";
      runner.stdin.write(`setKeyDelay;${x.delay};${x.duration};${x.play}\n`);
      await wait();
    },
    /**
     * Types out a string using SendInput. Look at documentation for extra information.
     * @param {string} x - The string to send
     */
    sendInput: async function(x) {
      var toSend = "";
      if (x.blind) toSend += "{Blind}";
      toSend += x.msg
      .replace(/!/g, "{!}")
      .replace(/#/g, "{#}")
      .replace(/\+/g, "{+}")
      .replace(/\^/g, "{^}")
      .replace(/\\{/g, "{{}")
      .replace(/\\}/g, "{}}")
      .replace(/\n/g, "{Enter}");
      runner.stdin.write(`sendInput;${toSend}\n`);
      await wait();
    },
    /**
     * Types out a string using SendPlay. Look at documentation for extra information.
     * @param {string} x - The string to send
     */
    sendPlay: async function(x) {
      var toSend = "";
      if (x.blind) toSend += "{Blind}";
      toSend += x.msg
      .replace(/!/g, "{!}")
      .replace(/#/g, "{#}")
      .replace(/\+/g, "{+}")
      .replace(/\^/g, "{^}")
      .replace(/\\{/g, "{{}")
      .replace(/\\}/g, "{}}")
      .replace(/\n/g, "{Enter}");
      runner.stdin.write(`sendPlay;${toSend}\n`);
      await wait();
    }
  };
  if (options.defaultColorVariation) {
    ahk.defaultColorVariation = options.defaultColorVariation;
  }
  const runner = spawn(path, [__dirname + "\\runner.ahk"]);
  runner.stdin.write(process.cwd() + "\n");
  var hotkeysString = `#NoTrayIcon
stdout := FileOpen("*", "w \`n")

write(x) {
  global stdout
  stdout.Write(x)
  stdout.Read(0)
}
`;
  hotkeysList.forEach(function(x) {
    if (x.noInterrupt) {
      hotkeysString += "~";
    }
    if (typeof x === "string") {
      hotkeysString += `${x}::write("${x}")
`;
    } else {
      if (x.keys) {
        ahk.hotkeys[x.keys.join(" ")] = function() {};
        hotkeysString += `${x.keys.join(" & ")}::write("${x.keys.join(" ")}")
  `;
      } else {
        let mod = "";
        if (x.modifiers) {
          mod += x.modifiers.join("")
          .replace("win", "#")
          .replace("alt", "!")
          .replace("control", "^")
          .replace("shift", "+")
          .replace("any", "*")
        }
        ahk.hotkeys[mod + x.key] = function() {};
        hotkeysString += `${mod + x.key}::write("${mod + x.key}")
  `;
      }
    }
  });
  await fs.writeFile(__dirname + "\\hotkeys.ahk", hotkeysString);
  const hotkeys = spawn(path, [__dirname + "\\hotkeys.ahk"]);
  runner.stdout.on("end", process.exit);
  hotkeys.stdout.on("end", process.exit);
  process.on("SIGINT", process.exit);
  process.on("exit", function() {
    if (!runner.killed) runner.kill();
    if (!hotkeys.killed) hotkeys.kill();
  });
  runner.stdout.on("data", function(data) {
    data = data.toString();
    if (ahk.current) {
      ahk.current(data);
      ahk.current = null;
    }
  });
  hotkeys.stdout.on("data", function(data) {
    data = data.toString();
    ahk.hotkeysPending.push(data);
  });
  var initVars = JSON.parse(await wait());
  ahk.width = initVars.width;
  ahk.height = initVars.height;
  return ahk;
};