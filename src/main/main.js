// Filepath: ./src/main/main.js
const { app, BrowserWindow, ipcMain, Menu } = require("electron/main");
const path = require("node:path");
const { execFile } = require("child_process");

let mainWindow;
let keypadWindow;
let timer;
let menuVisible = false;

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

    if (message === "Pin benar") {
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
            console.log("Setting Price clicked");
          },
        },
        {
          label: "Timer",
          click: () => {
            console.log("Setting Timer clicked");
          },
        },
        {
          label: "DSLR Path",
          click: () => {
            console.log("Setting DSLR Path clicked");
          },
        },
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
    width: 250,
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
    width: 300,
    height: 250,
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
  const price = voucher === "XYZ123" ? 40000 : 50000;
  mainWindow.loadFile("./src/renderer/pages/payment.html").then(() => {
    mainWindow.webContents.send("set-price", price);
  });
});

ipcMain.on("execute-app", () => {
  // const programPath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const programPath = "C:\\Program Files\\dslrBooth\\dslrBooth.exe";
  execFile(programPath, (error) => {
    if (error) {
      console.error(`Error opening Edge: ${error.message}`);
      return;
    } else {
      console.log("Edge opened successfully");
    }
  });
});

ipcMain.on("show-keypad", () => {
  if (!menuVisible) {
    createKeypadWindow();
  } else {
    menuVisible = false;
    Menu.setApplicationMenu(null);
  }
});
