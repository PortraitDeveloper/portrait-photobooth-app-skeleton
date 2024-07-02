const { contextBridge, ipcRenderer } = require("electron/renderer");

contextBridge.exposeInMainWorld("electron", {
  startTimer: (duration) => ipcRenderer.send("start-timer", duration),
  stopTimer: () => ipcRenderer.send("stop-timer"),
  navigate: (page) => ipcRenderer.send("navigate", page),
  applyVoucher: (voucher) => ipcRenderer.send("apply-voucher", voucher),
  toggleMenu: () => ipcRenderer.send("toggle-menu"),
  executeApp: () => ipcRenderer.send("execute-app"),
  receiveData: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  },
});
