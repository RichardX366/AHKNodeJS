const spawn = require('child_process').spawn;
const fs = require('fs/promises');

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
 *  ahkV1?: boolean
 * }} options - The options to initiate AHK NodeJS with
 * @returns An object containing this package's functions
 */
module.exports = async function (path, hotkeysList, options) {
  if (!hotkeysList) {
    hotkeysList = [];
  }
  if (!options) {
    options = {};
  }
  function wait() {
    return new Promise(function (resolve) {
      current = resolve;
    });
  }
  function formatCmd(...cmdAndArgs) {
    return `${cmdAndArgs.join(';')}\n`;
  }
  var current = null;
  const ahk = {
    defaultColorVariation: 1,
    width: 1366,
    height: 768,
    hotkeys: {},
    hotkeysPending: [],
    /**
     * Turns pixel coordinates into screen percentages
     * @param {[x: number, y: number]} x - The coordinates
     * @returns The array with pixels as screen percentages.
     */
    toPercent(x) {
      return [(x[0] * 100) / ahk.width, (x[1] * 100) / ahk.height];
    },
    /**
     * Turns screen percentages into pixel coordinates
     * @param {[x: number, y: number]} x - The percentages
     * @returns The array with screen percentages as pixels.
     */
    toPx(x) {
      return [(x[0] / 100) * ahk.width, (x[1] / 100) * ahk.height];
    },
    /**
     * Sets a hotkey to a function
     * @param {string | object} key - The hotkey to bind
     * @param {function} run - The function to run on bind
     * @param {boolean} instant - Whether or not to instantly run the hotkey
     */
    setHotkey(key, run, instant) {
      var ahkKey;
      if (typeof key === 'string') ahkKey = key;
      else {
        if (key.keys)
          ahkKey = key.keys
            .replace(/!/g, '{!}')
            .replace(/#/g, '{#}')
            .replace(/\+/g, '{+}')
            .replace(/\^/g, '{^}')
            .replace(/\\{/g, '{{}')
            .replace(/\\}/g, '{}}')
            .join(' ');
        else {
          let mod = '';
          if (key.modifiers) {
            mod += key.modifiers
              .join('')
              .replace('win', '#')
              .replace('alt', '!')
              .replace('control', '^')
              .replace('shift', '+')
              .replace('any', '*');
          }
          ahkKey =
            mod +
            key.key
              .replace(/!/g, '{!}')
              .replace(/#/g, '{#}')
              .replace(/\+/g, '{+}')
              .replace(/\^/g, '{^}')
              .replace(/\\{/g, '{{}')
              .replace(/\\}/g, '{}}');
        }
      }
      ahk.hotkeys[ahkKey] = run;
      if (instant) ahk.hotkeys[ahkKey].instant = true;
    },
    /**
     * Sleeps for a certain amount of time
     * @param {number} x - The time in ms to sleep for
     * @returns A promise that is fufilled once the time is up
     */
    sleep(x) {
      return new Promise(function (resolve) {
        setTimeout(resolve, x);
      });
    },
    /**
     * Runs a hotkey if one is detected
     */
    async waitForInterrupt() {
      while (ahk.hotkeysPending[0]) {
        await ahk.hotkeysPending[0]();
        ahk.hotkeysPending.shift();
      }
    },
    /**
     * Moves the mouse; If positioning is % then the coordinates are interpreted as percentages of the screen
     * @param {{
     *  x: number,
     *  y: number,
     *  speed?: number,
     *  positioning?: number
     * }} x - The Parameters
     */
    async mouseMove(x) {
      if (!x.speed) x.speed = '';
      if (x.positioning === '%') {
        x.x = Math.floor((x.x / 100) * ahk.width);
        x.y = Math.floor((x.y / 100) * ahk.height);
      }
      runner.stdin.write(formatCmd('mouseMove', x.x, x.y, x.speed));
      await wait();
    },
    /**
     * Clicks the mouse. Look at the documentation for information on parameters.
     * @param {{
     *  x?: number,
     *  y?: number,
     *  positioning?: string
     *  button?: string,
     *  state?: string,
     *  count?: number
     * }} x - The parameters
     */
    async click(x) {
      if (!x) {
        x = {};
      }
      if (!x.x || !x.y) {
        x.x = '';
        x.y = '';
      }
      if (x.positioning === '%' && x.x) {
        x.x = Math.floor((x.x / 100) * ahk.width);
        x.y = Math.floor((x.y / 100) * ahk.height);
      }
      if (x.button === 'left') x.button = 'L';
      else if (x.button === 'middle') x.button = 'M';
      else if (x.button === 'right') x.button = 'R';
      else x.button = '';
      if (x.state === 'down') x.state = 'D';
      else if (x.state === 'up') x.state = 'U';
      else x.state = '';
      if (!x.count) x.count = '';
      runner.stdin.write(
        formatCmd('click', `${x.x} ${x.y} ${x.button} ${x.state} ${x.count}`)
      );
      await wait();
    },
    /**
     * Clicks the mouse using SendPlay. Look at the documentation for information on parameters.
     * @param {{
     *  x?: number,
     *  y?: number,
     *  positioning?: string
     *  button?: string,
     *  state?: string,
     *  count?: number
     * }} x - The parameters
     */
    async clickPlay(x) {
      if (!x) {
        x = {};
      }
      if (!x.x || !x.y) {
        x.x = '';
        x.y = '';
      }
      if (x.positioning === '%' && x.x) {
        x.x = Math.floor((x.x / 100) * ahk.width);
        x.y = Math.floor((x.y / 100) * ahk.height);
      }
      if (x.button === 'left') x.button = 'L';
      else if (x.button === 'middle') x.button = 'M';
      else if (x.button === 'right') x.button = 'R';
      else x.button = '';
      if (x.state === 'down') x.state = 'D';
      else if (x.state === 'up') x.state = 'U';
      else x.state = '';
      if (!x.count) x.count = '';
      runner.stdin.write(
        formatCmd('clickPlay', `${x.x} ${x.y} ${x.button} ${x.state} ${x.count}`)
      );
      await wait();
    },
    /**
     * Gets or sets the clipboard
     * @param {string} [x] - If provided, the clipboard is set to the value
     * @returns The clipboard if no parameters are passed in
     */
    async clipboard(x) {
      if (x) {
        runner.stdin.write(formatCmd('setClipboard', x));
        await wait();
      } else {
        runner.stdin.write(formatCmd('getClipboard'));
        return await wait();
      }
    },
    /**
     * Searches for a pixel of set color
     * @param {{
     *  x1: number,
     *  y1: number,
     *  x2: number,
     *  y2: number,
     *  color: string,
     *  variation?: number,
     *  positioning?: string
     * }} x - The parameters
     * @returns If found, [x, y]. If % positioning is used, it returns them as screen percentages.
     */
    async pixelSearch(x) {
      if (!x.variation) x.variation = ahk.defaultColorVariation;
      if (x.positioning === '%') {
        x.x1 = Math.floor((x.x1 / 100) * ahk.width);
        x.y1 = Math.floor((x.y1 / 100) * ahk.height);
        x.x2 = Math.floor((x.x2 / 100) * ahk.width);
        x.y2 = Math.floor((x.y2 / 100) * ahk.height);
      }
      runner.stdin.write(
        formatCmd('pixelSearch', x.x1, x.y1, x.x2, x.y2, `0x${x.color}`, x.variation)
      );
      var pos = (await wait()).split(' ');
      if (pos[0] === '') {
        return null;
      }
      if (x.positioning === '%') {
        pos[0] = (pos[0] / ahk.width) * 100;
        pos[1] = (pos[1] / ahk.height) * 100;
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
    async getPixelColor(x) {
      if (x.positioning === '%') {
        x.x = Math.floor((x.x / 100) * ahk.width);
        x.y = Math.floor((x.y / 100) * ahk.height);
      }
      var mode = 'RGB ';
      if (x.mode === 'slow') mode += 'Slow';
      else if (x.mode === 'alt') mode += 'Alt';
      runner.stdin.write(formatCmd('getPixelColor', x.x, x.y, mode));
      return (await wait()).replace('0x', '');
    },
    /**
     * Gets the location of the mouse.
     * @param {string} [x]
     * @returns [x, y] If % positioning is used, they are returned as screen percentages.
     */
    async getMousePos(x) {
      runner.stdin.write(formatCmd('getMousePos'));
      var pos = (await wait()).split(' ');
      pos[0] = Number(pos[0]);
      pos[1] = Number(pos[1]);
      if (x === '%') {
        pos[0] = (pos[0] / ahk.width) * 100;
        pos[1] = (pos[1] / ahk.height) * 100;
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
     *  imgPath: string,
     *  variation?: number,
     *  trans?: string,
     *  positioning?: string
     * }} x - The parameters
     * @returns If found, [x, y]. If % positioning is used, it returns them as screen percentages.
     */
    async imageSearch(x) {
      if (!x.variation) x.variation = `*${ahk.defaultColorVariation} `;
      else x.variation = `*${x.variation} `;
      if (!x.trans) x.trans = '';
      else x.trans = `*Trans0x${x.trans} `;
      if (x.positioning === '%') {
        x.x1 = Math.floor((x.x1 / 100) * ahk.width);
        x.y1 = Math.floor((x.y1 / 100) * ahk.height);
        x.x2 = Math.floor((x.x2 / 100) * ahk.width);
        x.y2 = Math.floor((x.y2 / 100) * ahk.height);
      }
      runner.stdin.write(
        formatCmd('imageSearch', x.x1, x.y1, x.x2, x.y2, x.variation, x.trans, x.imgPath)
      );
      var pos = (await wait()).split(' ');
      if (pos[0] === '') {
        return null;
      }
      if (x.positioning === '%') {
        pos[0] = (pos[0] / ahk.width) * 100;
        pos[1] = (pos[1] / ahk.height) * 100;
      }
      return pos;
    },
    /**
     * Changes the delay for key presses. Check the documentation for extra details.
     * @param {{
     *  delay?: number,
     *  duration?: number,
     *  play?: boolean
     * }} x - The parameters
     */
    async setKeyDelay(x) {
      if (!x.delay) x.delay = '';
      if (!x.duration) x.duration = '';
      if (x.play) x.play = 'Play';
      else x.play = '';
      runner.stdin.write(formatCmd('setKeyDelay', x.delay, x.duration, x.play));
      await wait();
    },
    /**
     * Types out a string. Look at documentation for extra information.
     * @param {'send' | 'sendInput' | 'sendPlay'} sendType - type of "send" command
     * @param {{ msg: string, blind?: boolean } | string} x - The string to send
     */
    async sendGeneric(sendType, x) {
      if (typeof x === 'string') x = { msg: x };
      let toSend = '';
      if (x.blind) toSend += '{Blind}';
      toSend += x.msg
        .replace(/!/g, '{!}')
        .replace(/#/g, '{#}')
        .replace(/\+/g, '{+}')
        .replace(/\^/g, '{^}')
        .replace(/\\{/g, '{{}')
        .replace(/\\}/g, '{}}')
        .replace(/\n/g, '{enter}');
      runner.stdin.write(formatCmd(sendType, toSend));
      await wait();
    },
    /**
     * Types out a string. Look at documentation for extra information.
     * @param {{ msg: string, blind?: boolean } | string} x - The string to send
     */
    async send(x) {
      return ahk.sendGeneric('send', x);
    },
    /**
     * Types out a string using SendInput. Look at documentation for extra information.
     * @param {{ msg: string, blind?: boolean } | string} x - The string to send
     */
    async sendInput(x) {
      return ahk.sendGeneric('sendInput', x);
    },
    /**
     * Types out a string using SendPlay. Look at documentation for extra information.
     * @param {{ msg: string, blind?: boolean } | string} x - The string to send
     */
    async sendPlay(x) {
      return ahk.sendGeneric('sendPlay', x);
    },
    /**
     * Sets the default mouse speed for clicks and mouseMove
     * @param {number} x - The mouse speed from 0 - 100
     */
    async setMouseSpeed(x) {
      runner.stdin.write(formatCmd('setMouseSpeed', x));
      await wait();
    },
    /**
     * Shuts down the computer
     */
    shutdown() {
      runner.stdin.write(formatCmd('shutdown'));
    },
  };
  if (options.defaultColorVariation) {
    ahk.defaultColorVariation = options.defaultColorVariation;
  }
  const ahkV1Path = '\\ahk-v1-runner.ahk';
  const ahkV2Path = '\\ahk-v2-runner.ahk';
  // Defaults to AHK V2 [7/6/2023]
  const runner = spawn(path, [
    __dirname + (options.ahkV1 ? ahkV1Path : ahkV2Path),
  ]);
  runner.stdin.write(process.cwd() + '\n');
  var hotkeysString = `#NoTrayIcon
stdout := FileOpen("*", "w \`n")

write(x) {
  global stdout
  stdout.Write(x)
  stdout.Read(0)
}
`;
  hotkeysList.forEach(function (x) {
    if (x.noInterrupt) {
      hotkeysString += '~';
    }
    if (typeof x === 'string') {
      hotkeysString += `${x}::write("${x}")
`;
    } else {
      if (x.keys) {
        ahk.hotkeys[x.keys.join(' ')] = function () {};
        hotkeysString += `${x.keys.join(' & ')}::write("${x.keys.join(' ')}")
`;
      } else {
        let mod = '';
        if (x.modifiers) {
          mod += x.modifiers
            .join('')
            .replace('win', '#')
            .replace('alt', '!')
            .replace('control', '^')
            .replace('shift', '+')
            .replace('any', '*');
        }
        var key = x.key.replace(/\\{/g, '{{}').replace(/\\}/g, '{}}');
        ahk.hotkeys[mod + key] = function () {};
        hotkeysString += `${mod + key}::write("${mod + key}")
`;
      }
    }
  });
  await fs.writeFile(__dirname + '\\hotkeys.ahk', hotkeysString);
  const hotkeys = spawn(path, [__dirname + '\\hotkeys.ahk']);
  runner.stdout.on('end', process.exit);
  hotkeys.stdout.on('end', process.exit);
  process.on('SIGINT', process.exit);
  process.on('exit', function () {
    if (!runner.killed) runner.kill();
    if (!hotkeys.killed) hotkeys.kill();
  });
  runner.stdout.on('data', function (data) {
    data = data.toString();
    if (current) {
      current(data);
      current = null;
    }
  });
  hotkeys.stdout.on('data', function (data) {
    data = data.toString();
    if (ahk.hotkeys[data].instant) ahk.hotkeys[data]();
    else ahk.hotkeysPending.push(ahk.hotkeys[data]);
  });

  var initVars = JSON.parse(await wait());
  ahk.width = initVars.width;
  ahk.height = initVars.height;
  console.log(ahk);
  return ahk;
};
