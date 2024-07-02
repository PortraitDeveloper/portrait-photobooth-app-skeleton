const { app, BrowserWindow, ipcMain, Menu } = require("electron/main");
const path = require("node:path");
const { exec } = require("child_process");

let mainWindow;
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

  // Create a custom menu without File and Edit
  const menuTemplate = [
    {
      label: "Setting",
      submenu: [
        {
          label: "Setting Timer",
          click: () => {
            // Add logic here to handle setting the timer
            console.log("Setting Timer clicked");
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
      submenu: [{ role: "minimize" }, { role: "zoom" }, { role: "close" }],
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
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(null);
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

ipcMain.on("apply-voucher", (event, voucher) => {
  const price = voucher === "XYZ123" ? 40000 : 50000;
  mainWindow.loadFile("./src/renderer/pages/payment.html").then(() => {
    mainWindow.webContents.send("set-price", price);
  });
});

// Handle IPC calls
ipcMain.on("navigate", (event, page) => {
  mainWindow.loadFile(`./src/renderer/pages/${page}.html`);
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

ipcMain.on("execute-app", () => {
  // Open Microsoft Edge
  exec("start microsoft-edge:", (error) => {
    if (error) {
      console.error(`Error opening Edge: ${error.message}`);
      return;
    } else {
      console.log("Edge opened successfully");
      // Close Microsoft Edge after 60 seconds
      // setTimeout(() => {
      //   exec("taskkill /IM msedge.exe /F", (error) => {
      //     if (error) {
      //       console.error(`Error closing Edge: ${error.message}`);
      //       return;
      //     }
      //     console.log("Edge closed successfully");
      //   });
      // }, 60000);
    }
  });
});
