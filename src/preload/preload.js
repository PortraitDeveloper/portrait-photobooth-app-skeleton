const { contextBridge, ipcRenderer } = require("electron/renderer");

contextBridge.exposeInMainWorld("electron", {
  startTimer: (duration) => ipcRenderer.send("start-timer", duration),
  stopTimer: () => ipcRenderer.send("stop-timer"),
  navigate: (page) => ipcRenderer.send("navigate", page),
  applyVoucher: (voucher) => ipcRenderer.send("apply-voucher", voucher),
  showKeypad: () => ipcRenderer.send("show-keypad"),
  //toggleMenu: () => ipcRenderer.send("toggle-menu"),
  executeApp: () => ipcRenderer.send("execute-app"),
  receiveData: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  },

  checkPin: (message) => ipcRenderer.send("check-pin", message),

  loadPin: () => ipcRenderer.send("load-pin"),
  onPinLoaded: (callback) => ipcRenderer.on("pin-loaded", callback),
  savePin: (pin) => ipcRenderer.send("save-pin", pin),

  loadPrice: () => ipcRenderer.send("load-price"),
  onPriceLoaded: (callback) => ipcRenderer.on("price-loaded", callback),
  savePrice: (price) => ipcRenderer.send("save-price", price),

  loadTimer: () => ipcRenderer.send("load-timer"),
  onTimerLoaded: (callback) => ipcRenderer.on("timer-loaded", callback),
  saveTimer: (timerProcedure, timerPayment) =>
    ipcRenderer.send("save-timer", timerProcedure, timerPayment),
});
