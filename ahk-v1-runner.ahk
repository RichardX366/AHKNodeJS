#NoTrayIcon
A_MenuMaskKey := "vkFF"
#UseHook
CoordMode Pixel, Screen
CoordMode Mouse, Screen

stdin := FileOpen("*", "r `n", "UTF-8")
stdout := FileOpen("*", "w `n")
write(x) {
  global stdout
  stdout.Write(x)
  stdout.Read(0)
}

initVars := "
(
  {
    ""width"": " A_ScreenWidth ",
    ""height"": " A_ScreenHeight "
  }
)"
write(initVars)

SetWorkingDir % RTrim(stdin.ReadLine(), "`n") %

; joins array elements with given separator, starting from given index
JoinSubArray(sep, start, strings*) {
  out := ""
  for index,str in strings {
    if (index >= start) {
      if (index >= start + 1) {
        out .= sep
      }
      out .= str
    }
  }
  return out
}

Loop {
  x := RTrim(stdin.ReadLine(), "`n")
  data := StrSplit(x, ";")
  if (data[1] = "mouseMove") {
    MouseMove data[2], data[3], data[4]
    write("done")
  } else if (data[1] = "click") {
    Click % data[2] %
    write("done")
  } else if (data[1] = "clickPlay") {
    SendPlay % "{{}Click " data[2] "{}}" %
    write("done")
  } else if (data[1] = "getClipboard") {
    write(clipboard)
  } else if (data[1] = "setClipboard") {
    clipboard := % JoinSubArray(";", 2, data*) %
    write("done")
  } else if (data[1] = "pixelSearch") {
    PixelSearch x, y, data[2], data[3], data[4], data[5], data[6], [data[7], Fast RGB]
    write(x " " y)
  } else if (data[1] = "getPixelColor") {
    PixelGetColor color, data[2], data[3], % data[4] %
    write(color)
  } else if (data[1] = "getMousePos") {
    MouseGetPos x, y
    write(x " " y)
  } else if (data[1] = "imageSearch") {
    ImageSearch x, y, data[2], data[3], data[4], data[5], % data[6] %
    write(x " " y)
  } else if (data[1] = "setKeyDelay") {
    SetKeyDelay data[2], data[3], % data[4] %
    write("done")
  } else if (data[1] = "send") {
    Send % JoinSubArray(";", 2, data*) %
    write("done")
  } else if (data[1] = "sendInput") {
    SendInput % JoinSubArray(";", 2, data*) %
    write("done")
  } else if (data[1] = "sendPlay") {
    SendPlay % JoinSubArray(";", 2, data*) %
    write("done")
  } else if (data[1] = "setMouseSpeed") {
    SetDefaultMouseSpeed % data[2] %
    write("done")
  } else if (data[1] = "shutdown") {
    Shutdown 8
  }
}