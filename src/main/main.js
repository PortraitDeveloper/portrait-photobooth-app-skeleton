// Filepath: ./src/main/main.js
const { app, BrowserWindow, ipcMain, Menu, dialog } = require("electron/main");
const path = require("node:path");
const fs = require("fs");
const express = require("express");
const restAPI = express();
const generateTxCode = require("../utils/generateTxCode");

let loginWindow;
let mainWindow;
let keypadWindow;
let settingPinWindow;
let settingPriceWindow;
let settingTimerWindow;
let settingBgWindow;
let popupVoucherWindow;
let deviceInfoWindow;
let deviceData = {};
let voucherData = {};
let menuVisible = false;
let timer;
let pin;
let price;
let setPrice = 0;
let bgPath;
let dslrVisibleTime;
let dslrTimeOut;
const port = 3001;
const url = "http://localhost:3000";
const token = "cvV8DaxQiYPBx9bW2NkGMtYzuPGNM0K8";

restAPI.get("/dslr", function (req, res) {
  const eventType = req.query.event_type;

  if (eventType === "session_end") {
    // console.log(eventType);
    // mainWindow.maximize();
    try {
      console.log(eventType);
      mainWindow.maximize();
      if (dslrTimeOut) {
        clearTimeout(dslrTimeOut);
      }
    } catch (error) {
      console.error("Error when maximizing mainWindow:", error);
    }
  }
});
restAPI.listen(port);

async function requestLogin(username, password) {
  const fetch = (await import("node-fetch")).default;

  try {
    const response = await fetch(
      `${url}/api/photobooth/device/credential/login`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          login_username: username,
          login_password: password,
        }),
      }
    );

    if (!response.ok) {
      console.error("Error:", response.status);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error:", error);
  }
}

async function requestLogout(photobooth_id) {
  const fetch = (await import("node-fetch")).default;

  try {
    const response = await fetch(
      `${url}/api/photobooth/device/credential/logout`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          photobooth_id,
        }),
      }
    );

    if (!response.ok) {
      console.error("Error:", response.status);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error:", error);
  }
}

async function requestVoucher(code) {
  const fetch = (await import("node-fetch")).default;

  try {
    const response = await fetch(`${url}/api/photobooth/voucher/${code}/all`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("Error:", response.status);
    }

    setPrice = 0;
    voucherData = {};
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error:", error);
  }
}

async function requestTransaction() {
  const fetch = (await import("node-fetch")).default;

  try {
    const response = await fetch(`${url}/api/photobooth/transaction`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        transaction_code: generateTxCode(deviceData.photobooth_name),
        photobooth_id: deviceData.photobooth_id,
        voucher_id: voucherData.voucher_id,
        price: setPrice,
      }),
    });

    if (!response.ok) {
      console.error("Error:", response.status);
    }

    setPrice = 0;
    voucherData = {};
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error:", error);
  }
}

async function requestDeviceCookies(deviceCookies) {
  const fetch = (await import("node-fetch")).default;

  try {
    const response = await fetch(
      `${url}/api/photobooth/device/credential/cookies`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          device_cookies: deviceCookies,
        }),
      }
    );

    if (!response.ok) {
      console.error("Error:", response.status);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error:", error);
  }
}

function createLoginWindow() {
  loginWindow = new BrowserWindow({
    width: 400,
    height: 300,
    resizable: false, // Prevent resizing
    modal: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
    },
  });

  loginWindow.loadFile("./src/renderer/pages/login.html");
  loginWindow.setMenu(null); // Remove menu bar

  loginWindow.on("closed", () => {
    loginWindow = null;
  });

  loginWindow.once("ready-to-show", () => {
    loginWindow.show();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    fullscreen: true, // Set fullscreen to true
    // setSkipTaskbar: true, // Prevent showing in taskbar
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
      label: "Device",
      submenu: [
        {
          label: "Info",
          click: () => {
            createDeviceInfoWindow();
          },
        },
        {
          label: "Logout",
          click: async () => {
            await requestLogout(deviceData.photobooth_id);
            fs.writeFileSync("./data/device.txt", "");
            app.quit();
          },
        },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Tutorial",
          click: async () => {
            const { shell } = require("electron");
            await shell.openExternal("https://electronjs.org");
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
    // skipTaskbar: false, // Prevent showing in taskbar
    // setSkipTaskbar: true, // Prevent showing in taskbar
    fullscreen: true, // Set fullscreen to true
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
    height: 380,
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

function createPopupVoucherWindow() {
  popupVoucherWindow = new BrowserWindow({
    width: 400,
    height: 200,
    resizable: false, // Prevent resizing
    parent: mainWindow,
    modal: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
    },
  });

  popupVoucherWindow.loadFile("./src/renderer/pages/popup-voucher.html");
  popupVoucherWindow.setMenu(null); // Remove menu bar

  popupVoucherWindow.on("closed", () => {
    popupVoucherWindow = null;
  });

  popupVoucherWindow.once("ready-to-show", () => {
    popupVoucherWindow.show();
  });
}

function createDeviceInfoWindow() {
  deviceInfoWindow = new BrowserWindow({
    width: 500,
    height: 350,
    resizable: false, // Prevent resizing
    parent: mainWindow,
    modal: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
    },
  });

  deviceInfoWindow.loadFile("./src/renderer/pages/device-info.html");
  deviceInfoWindow.setMenu(null); // Remove menu bar

  deviceInfoWindow.on("closed", () => {
    deviceInfoWindow = null;
  });

  deviceInfoWindow.once("ready-to-show", () => {
    deviceInfoWindow.show();
  });
}

app.whenReady().then(async () => {
  const deviceCookies = fs.readFileSync("./data/device.txt", "utf-8");
  const response = await requestDeviceCookies(deviceCookies);

  if (response.status !== 200) {
    createLoginWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createLoginWindow();
      }
    });
  } else {
    deviceData = response.data;
    createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  }
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

ipcMain.on("login", async (event, username, password) => {
  const response = await requestLogin(username, password);

  if (response.status !== 200) {
    loginWindow.webContents.send("modal-login-notification", response.message);
  } else {
    deviceData = response.data;
    fs.writeFileSync("./data/device.txt", deviceData.photobooth_name);
    loginWindow.close();
    createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  }
});

ipcMain.on("navigate", (event, page) => {
  mainWindow.loadFile(`./src/renderer/pages/${page}.html`);
});

ipcMain.on("open-modal-voucher", () => {
  createPopupVoucherWindow();
});

ipcMain.on("without-voucher", () => {
  mainWindow.loadFile("./src/renderer/pages/payment.html").then(() => {
    setPrice = price;
    mainWindow.webContents.send("set-price", price);
  });
});

ipcMain.on("apply-voucher", async (event, voucher) => {
  if (!voucher) {
    popupVoucherWindow.webContents.send(
      "modal-voucher-notification",
      "Kode voucher tidak boleh kosong"
    );
  }

  const response = await requestVoucher(voucher);

  if (response.status !== 200) {
    popupVoucherWindow.webContents.send(
      "modal-voucher-notification",
      "Kode voucher tidak ditemukan"
    );
  } else {
    if (
      response.data[0].device !== "all devices" &&
      response.data[0].device !== deviceData.photobooth_name
    ) {
      popupVoucherWindow.webContents.send(
        "modal-voucher-notification",
        "Voucher tidak berlaku di cabang ini"
      );
    } else if (response.data[0].quota <= 0) {
      popupVoucherWindow.webContents.send(
        "modal-voucher-notification",
        "Kuota voucher habis"
      );
    } else if (new Date(response.data[0].start_date) > new Date()) {
      popupVoucherWindow.webContents.send(
        "modal-voucher-notification",
        "Voucher belum berlaku"
      );
    } else if (new Date(response.data[0].end_date) < new Date()) {
      popupVoucherWindow.webContents.send(
        "modal-voucher-notification",
        "Voucher sudah tidak berlaku"
      );
    } else {
      voucherData = response.data[0];
      const type = response.data[0].type;
      const discount =
        type === "nominal"
          ? response.data[0].nominal
          : response.data[0].percentage;
      setPrice =
        type === "nominal" ? price - discount : price - price * discount;
      if (setPrice === 0) {
        popupVoucherWindow.close();
        mainWindow.loadFile("./src/renderer/pages/payment-free.html");
      } else {
        popupVoucherWindow.close();
        mainWindow.loadFile("./src/renderer/pages/payment.html").then(() => {
          mainWindow.webContents.send("set-price", setPrice);
        });
      }
    }
  }
});

ipcMain.on("execute-app", async () => {
  const response = await requestTransaction();

  if (response.status !== 200) {
    console.error("Transaksi gagal, segera hubungi PIC yang bertugas");
  }

  dslrVisibleTime = fs.readFileSync("./data/dslr-visible-time.txt", "utf-8");
  mainWindow.minimize();
  dslrTimeOut = setTimeout(() => {
    mainWindow.maximize();
    console.log(`Main window maximized after ${dslrVisibleTime} seconds`);
  }, dslrVisibleTime * 1000);
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
    fs.existsSync("./data/payment-time.txt") &&
    fs.existsSync("./data/dslr-visible-time.txt")
  ) {
    procedureTime = fs.readFileSync("./data/procedure-time.txt", "utf-8");
    paymentTime = fs.readFileSync("./data/payment-time.txt", "utf-8");
    sessionTime = fs.readFileSync("./data/dslr-visible-time.txt", "utf-8");
    event.reply("timer-loaded", procedureTime, paymentTime, sessionTime);
  }
});

ipcMain.on(
  "save-timer",
  (event, newTimerProcedure, newTimerPayment, newTimerSession) => {
    fs.writeFileSync("./data/procedure-time.txt", newTimerProcedure);
    fs.writeFileSync("./data/payment-time.txt", newTimerPayment);
    fs.writeFileSync("./data/dslr-visible-time.txt", newTimerSession);
  }
);

// ----------------------------------------------------------- //

// --------------------- SETTING-BG-PATH -------------------- //
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

// ---------------------- DEVICE-INFO ------------------------ //
ipcMain.on("load-device", (event) => {
  event.reply("device-loaded", deviceData);
});
// ----------------------------------------------------------- //

// ----------------------- CLOSE WINDOW ---------------------- //
ipcMain.on("close-window", (event, window) => {
  if (window === "setting-pin") {
    settingPinWindow.close();
  } else if (window === "setting-price") {
    settingPriceWindow.close();
  } else if (window === "setting-timer") {
    settingTimerWindow.close();
  } else if (window === "setting-bg") {
    settingBgWindow.close();
  } else if (window === "popup-voucher") {
    popupVoucherWindow.close();
  } else if (window === "keypad") {
    keypadWindow.close();
  }
});
// ----------------------------------------------------------- //
