// Filepath: ./src/main/main.js
const { app, BrowserWindow, ipcMain, Menu, dialog } = require("electron/main");
const { execFile } = require("child_process");
const path = require("node:path");
const fs = require("fs");
const express = require("express");
const restAPI = express();

let mainWindow;
let keypadWindow;
let settingPinWindow;
let settingPriceWindow;
let settingTimerWindow;
let settingBgWindow;
let menuVisible = false;
let timer;
let pin;
let price;
let bgPath;

restAPI.get("/dslr", function (req, res) {
  const eventType = req.query.event_type;
  // console.log(eventType);

  if (eventType === "session_end") {
    console.log("Finished");
    mainWindow.maximize();
  }
});
restAPI.listen(3000);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    fullscreen: true, // Set fullscreen to true
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
    },
  });

  mainWindow.loadFile("./src/renderer/pages/index.html");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.on("before-input-event", (event, input) => {
    // Intercept keyboard events to prevent certain key combinations
    if (input.key === "F4" && input.alt) {
      event.preventDefault();
    }
    if (input.key === "Tab" && input.alt) {
      event.preventDefault();
    }
    if (input.key === "Escape") {
      event.preventDefault();
    }
  });

  ipcMain.on("toggle-menu", () => {
    menuVisible = !menuVisible;
    Menu.setApplicationMenu(menuVisible ? menu : null);
  });

  ipcMain.on("check-pin", (event, message) => {
    console.log(message);

    if (message === "true") {
      menuVisible = true;
      Menu.setApplicationMenu(menu);
      keypadWindow.close();
    } else {
      return;
    }
  });

  // Create a custom menu without File and Edit
  const menuTemplate = [
    {
      label: "Setting",
      submenu: [
        {
          label: "Pin",
          click: () => {
            createSettingPinWindow();
          },
        },
        {
          label: "Price",
          click: () => {
            createSettingPriceWindow();
          },
        },
        {
          label: "Timer",
          click: () => {
            createSettingTimerWindow();
          },
        },
        {
          label: "Bg-Image",
          click: () => {
            createSettingBgWindow();
          },
        },
        // {
        //   label: "DSLR-App",
        //   click: () => {
        //     createSettingAppWindow();
        //   },
        // },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forcereload" },
        { role: "toggledevtools" },
        { type: "separator" },
        { role: "resetzoom" },
        { role: "zoomin" },
        { role: "zoomout" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [{ role: "minimize" }, { role: "close" }],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Learn More",
          click: async () => {
            const { shell } = require("electron");
            await shell.openExternal("https://electronjs.org");
          },
        },
        {
          label: "Device Info",
          click: () => {
            console.log("Device Info clicked");
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(null);
}

function createKeypadWindow() {
  keypadWindow = new BrowserWindow({
    width: 260,
    height: 400,
    resizable: false, // Prevent resizing
    parent: mainWindow,
    modal: true,
    show: false,
    titleBarStyle: "hiddenInset", // Hide minimize and maximize, keep close button
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
    },
  });

  keypadWindow.loadFile("./src/renderer/pages/keypad.html");
  keypadWindow.setMenu(null); // Remove menu bar

  keypadWindow.on("closed", () => {
    keypadWindow = null;
  });

  keypadWindow.once("ready-to-show", () => {
    keypadWindow.show();
  });
}

function createSettingPinWindow() {
  settingPinWindow = new BrowserWindow({
    width: 400,
    height: 280,
    resizable: false, // Prevent resizing
    parent: mainWindow,
    modal: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
    },
  });

  settingPinWindow.loadFile("./src/renderer/pages/setting-pin.html");
  settingPinWindow.setMenu(null); // Remove menu bar

  settingPinWindow.on("closed", () => {
    settingPinWindow = null;
  });

  settingPinWindow.once("ready-to-show", () => {
    settingPinWindow.show();
  });
}

function createSettingPriceWindow() {
  settingPriceWindow = new BrowserWindow({
    width: 300,
    height: 200,
    resizable: false, // Prevent resizing
    parent: mainWindow,
    modal: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
    },
  });

  settingPriceWindow.loadFile("./src/renderer/pages/setting-price.html");
  settingPriceWindow.setMenu(null); // Remove menu bar

  settingPriceWindow.on("closed", () => {
    settingPriceWindow = null;
  });

  settingPriceWindow.once("ready-to-show", () => {
    settingPriceWindow.show();
  });
}

function createSettingTimerWindow() {
  settingTimerWindow = new BrowserWindow({
    width: 450,
    height: 300,
    resizable: false, // Prevent resizing
    parent: mainWindow,
    modal: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
    },
  });

  settingTimerWindow.loadFile("./src/renderer/pages/setting-timer.html");
  settingTimerWindow.setMenu(null); // Remove menu bar

  settingTimerWindow.on("closed", () => {
    settingTimerWindow = null;
  });

  settingTimerWindow.once("ready-to-show", () => {
    settingTimerWindow.show();
  });
}

function createSettingBgWindow() {
  settingBgWindow = new BrowserWindow({
    width: 550,
    height: 250,
    resizable: false, // Prevent resizing
    parent: mainWindow,
    modal: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
    },
  });

  settingBgWindow.loadFile("./src/renderer/pages/setting-bg-path.html");
  settingBgWindow.setMenu(null); // Remove menu bar

  settingBgWindow.on("closed", () => {
    settingBgWindow = null;
  });

  settingBgWindow.once("ready-to-show", () => {
    settingBgWindow.show();
  });
}

function createSettingAppWindow() {
  settingAppWindow = new BrowserWindow({
    width: 550,
    height: 250,
    resizable: false, // Prevent resizing
    parent: mainWindow,
    modal: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
    },
  });

  settingAppWindow.loadFile("./src/renderer/pages/setting-app-path.html");
  settingAppWindow.setMenu(null); // Remove menu bar

  settingAppWindow.on("closed", () => {
    settingAppWindow = null;
  });

  settingAppWindow.once("ready-to-show", () => {
    settingAppWindow.show();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.on("start-timer", (event, duration) => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    mainWindow.loadFile("./src/renderer/pages/index.html");
  }, duration * 1000);
});

ipcMain.on("stop-timer", () => {
  clearTimeout(timer);
});

ipcMain.on("navigate", (event, page) => {
  mainWindow.loadFile(`./src/renderer/pages/${page}.html`);
});

ipcMain.on("apply-voucher", (event, voucher) => {
  const actualPrice = voucher === "XYZ123" ? price - 10000 : price;
  mainWindow.loadFile("./src/renderer/pages/payment.html").then(() => {
    mainWindow.webContents.send("set-price", actualPrice);
  });
});

ipcMain.on("execute-app", () => {
  // const programPath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  // const programPath = "C:\\Program Files\\dslrBooth\\dslrBooth.exe";
  // execFile(programPath, (error) => {
  //   if (error) {
  //     console.error(`Error opening Edge: ${error.message}`);
  //     return;
  //   } else {
  //     console.log("Edge opened successfully");
  //   }
  // });
  mainWindow.minimize();
});

ipcMain.on("show-keypad", () => {
  if (!menuVisible) {
    createKeypadWindow();
  } else {
    menuVisible = false;
    Menu.setApplicationMenu(null);
  }
});

// ---------------------- SETTING-PIN ---------------------- //
ipcMain.on("load-pin", (event) => {
  if (fs.existsSync("./data/pin.txt")) {
    pin = fs.readFileSync("./data/pin.txt", "utf-8");
    event.reply("pin-loaded", pin);
  }
});

ipcMain.on("save-pin", (event, newPin) => {
  fs.writeFileSync("./data/pin.txt", newPin);
});
// ----------------------------------------------------------- //

// ---------------------- SETTING-PRICE ---------------------- //
ipcMain.on("load-price", (event) => {
  if (fs.existsSync("./data/price.txt")) {
    price = fs.readFileSync("./data/price.txt", "utf-8");
    event.reply("price-loaded", price);
  }
});

ipcMain.on("save-price", (event, newPrice) => {
  fs.writeFileSync("./data/price.txt", newPrice);
});
// ----------------------------------------------------------- //

// ---------------------- SETTING-TIMER ---------------------- //
ipcMain.on("load-timer", (event) => {
  if (
    fs.existsSync("./data/procedure-time.txt") &&
    fs.existsSync("./data/payment-time.txt")
  ) {
    procedureTime = fs.readFileSync("./data/procedure-time.txt", "utf-8");
    paymentTime = fs.readFileSync("./data/payment-time.txt", "utf-8");
    event.reply("timer-loaded", procedureTime, paymentTime);
  }
});

ipcMain.on("save-timer", (event, newTimerProcedure, newTimerPayment) => {
  fs.writeFileSync("./data/procedure-time.txt", newTimerProcedure);
  fs.writeFileSync("./data/payment-time.txt", newTimerPayment);
});
// ----------------------------------------------------------- //

// --------------------- SETTING-APP-PATH -------------------- //
ipcMain.on("load-bg-path", (event) => {
  if (fs.existsSync("./data/bg-path.txt")) {
    bgPath = fs.readFileSync("./data/bg-path.txt", "utf-8");
    event.reply("bg-path-loaded", bgPath);
  }
});

ipcMain.handle("open-file", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({});
  if (!canceled) {
    return filePaths[0];
  }
});

ipcMain.on("save-bg-path", (event, newBgPath) => {
  fs.writeFileSync("./data/bg-path.txt", newBgPath);
});
// ----------------------------------------------------------- //

// ----------------------- Close Window ---------------------- //
ipcMain.on("close-window", (event, window) => {
  if (window === "setting-pin") {
    settingPinWindow.close();
  } else if (window === "setting-price") {
    settingPriceWindow.close();
  } else if (window === "setting-timer") {
    settingTimerWindow.close();
  } else {
    settingBgWindow.close();
  }
});
// ----------------------------------------------------------- //
