const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: {
    send: (channel, data) => {
      const validChannels = [
        "window-minimize", 
        "window-maximize", 
        "window-close", 
        "launch-game"
      ];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    invoke: (channel, data) => {
      const validChannels = [
        "generate-offline-uuid", 
        "login-microsoft", 
        "select-java", 
        "select-game-dir", 
        "open-external", 
        "load-clients", 
        "check-client", 
        "install-client", 
        "repair-client", 
        "delete-client", 
        "check-for-updates",
        "set-update-channel",
        "get-app-info",
        "copy-diagnostics"
      ];
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, data);
      }
    },
    on: (channel, func) => {
      const validChannels = [
        "download-progress", 
        "launch-status", 
        "launch-log", 
        "minecraft-closed",
        "launch-error", 
        "update-status", 
        "update-progress"
      ];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    }
  }
});