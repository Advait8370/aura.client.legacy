window.onerror = function(message, url, line) {
  console.error("JS ERROR:", message, "Line:", line);
  alert("JS ERROR: " + message + " Line: " + line);
};

// --- SECURE WINDOW CONTROLS ---
const minBtn = document.getElementById('minimize') || document.querySelector('.minimize') || document.querySelector('.titlebar-controls .minimize');
const maxBtn = document.getElementById('maximize') || document.querySelector('.maximize') || document.querySelector('.titlebar-controls .maximize');
const closeBtn = document.getElementById('close') || document.querySelector('.close') || document.querySelector('.titlebar-controls .close');

if (minBtn) {
    minBtn.addEventListener('click', () => {
        if (window.electron && window.electron.ipcRenderer) {
            window.electron.ipcRenderer.send('window-minimize');
        }
    });
}

if (maxBtn) {
    maxBtn.addEventListener('click', () => {
        if (window.electron && window.electron.ipcRenderer) {
            window.electron.ipcRenderer.send('window-maximize');
        }
    });
}

if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        if (window.electron && window.electron.ipcRenderer) {
            window.electron.ipcRenderer.send('window-close');
        }
    });
}

// --- DOM ELEMENTS ---
const statusText = document.getElementById("status");
const consoleBox = document.getElementById("console");
const accountName = document.getElementById("accountName");
const accountType = document.getElementById("accountType");
const accountSelect = document.getElementById("accountSelect");
const accountAvatarLarge = document.getElementById("accountAvatarLarge");
const accountNameLarge = document.getElementById("accountNameLarge");
const currentAccountStatus = document.getElementById("currentAccountStatus");
const accountUuid = document.getElementById("accountUuid");
const accountStatusIndicator = document.getElementById("accountStatusIndicator");

const clientSelect = document.getElementById("client");
const clientManagerSelect = document.getElementById("clientManagerSelect");
const installState = document.getElementById("installState");
const managerState = document.getElementById("managerState");
const downloadProgress = document.getElementById("downloadProgress");
const downloadPercent = document.getElementById("downloadPercent");
const managerProgress = document.getElementById("managerProgress");
const managerPercent = document.getElementById("managerPercent");

const logModal = document.getElementById("logModal");
const launchLog = document.getElementById("launchLog");
const logStatus = document.getElementById("logStatus");
const crashModal = document.getElementById("crashModal");
const crashText = document.getElementById("crashText");
const crashLog = document.getElementById("crashLog");

const javaPathInput = document.getElementById("javaPathInput");
const gameDirInput = document.getElementById("gameDirInput");
const closeAfterLaunchInput = document.getElementById("closeAfterLaunch");
const skinAvatar = document.getElementById("skinAvatar");
const defaultAvatar = document.getElementById("defaultAvatar");
const skinPreview = document.getElementById("skinPreview");
const skinName = document.getElementById("skinName");
const skinHelp = document.getElementById("skinHelp");
const dynamicBg = document.getElementById("dynamicBg"); // Background Overlay Layer

// Update Modal Elements
const updateModal = document.getElementById("updateModal");
const updateStatusText = document.getElementById("updateStatusText");
const updateProgressBar = document.getElementById("updateProgressBar");
const updateProgressText = document.getElementById("updateProgressText");

// --- STATE ---
let clientsCache = [];
let currentAccount = readCurrentAccount();
function readStoredSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem("auraSettings") || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    console.warn("Saved settings could not be read; using defaults.", error);
    return {};
  }
}

let settings = readStoredSettings();
let javaPath = settings.javaPath || "java";
let gameDir = settings.gameDir || "";
let closeAfterLaunch = settings.closeAfterLaunch || false;

// --- ACCOUNT LOGIC ---
function readAccounts() {
  return JSON.parse(localStorage.getItem("auraAccounts") || "[]");
}

function writeAccounts(accounts) {
  localStorage.setItem("auraAccounts", JSON.stringify(accounts));
}

function readCurrentAccount() {
  return JSON.parse(localStorage.getItem("auraAccount") || "null");
}

function setCurrentAccount(account) {
  currentAccount = account;
  if (account) {
    localStorage.setItem("auraAccount", JSON.stringify(account));
  } else {
    localStorage.removeItem("auraAccount");
  }
  renderAccountUI();
}

function accountLabel(account) {
  if (!account) return "No account";
  if (account.type === "microsoft") return "Microsoft Account";
  return account.type === "ely" ? "Ely.by Account" : "Offline Account";
}

function accountAvatar(account) {
  if (!account) return "";
  return account.avatarUrl || `https://mc-heads.net/avatar/${encodeURIComponent(account.name)}/128`;
}

function normalizeStoredAccounts() {
  const accounts = readAccounts().filter(account => account && account.id && account.name);
  const selected = readCurrentAccount();

  if (selected && !accounts.some(account => account.id === selected.id)) {
    accounts.push(selected);
  }

  writeAccounts(accounts);

  if (!selected && accounts.length > 0) {
    setCurrentAccount(accounts[0]);
  } else {
    currentAccount = selected;
  }
}

function renderAccountUI() {
  const accounts = readAccounts();
  if(accountSelect) accountSelect.innerHTML = "";

  if (accounts.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No saved accounts";
    if(accountSelect) accountSelect.appendChild(option);
  } else {
    accounts.forEach(account => {
      const option = document.createElement("option");
      option.value = account.id;
      let accTypeStr = account.type === "microsoft" ? "Microsoft" : (account.type === "ely" ? "Ely.by" : "Offline");
      option.textContent = `${account.name} · ${accTypeStr}`;
      if(accountSelect) accountSelect.appendChild(option);
    });
  }

  if (currentAccount) {
    if(accountSelect) accountSelect.value = currentAccount.id;
    if(accountName) accountName.innerText = currentAccount.name;
    if(accountType) accountType.innerText = accountLabel(currentAccount);
    if(accountNameLarge) accountNameLarge.innerText = currentAccount.name;
    if(currentAccountStatus) currentAccountStatus.innerText = accountLabel(currentAccount) + " selected";
    if(accountUuid) accountUuid.innerText = "UUID: " + currentAccount.uuid;
    
    if(accountStatusIndicator) {
      accountStatusIndicator.innerText = "Signed in";
      accountStatusIndicator.className = "install-state installed";
    }

    const avatarUrl = accountAvatar(currentAccount);
    if(skinAvatar) {
      skinAvatar.src = avatarUrl;
      skinAvatar.style.display = "block";
    }
    if(defaultAvatar) defaultAvatar.style.display = "none";
    if(accountAvatarLarge) {
      accountAvatarLarge.src = avatarUrl;
      accountAvatarLarge.style.display = "block";
    }
  } else {
    if(accountName) accountName.innerText = "Not logged in";
    if(accountType) accountType.innerText = "Add an account";
    if(accountNameLarge) accountNameLarge.innerText = "Not logged in";
    if(currentAccountStatus) currentAccountStatus.innerText = "No account selected";
    if(accountUuid) accountUuid.innerText = "UUID unavailable";
    
    if(accountStatusIndicator) {
      accountStatusIndicator.innerText = "Signed out";
      accountStatusIndicator.className = "install-state missing";
    }
    
    if(skinAvatar) skinAvatar.style.display = "none";
    if(defaultAvatar) defaultAvatar.style.display = "grid";
    if(accountAvatarLarge) accountAvatarLarge.style.display = "none";
  }

  updateSkinUI();
}

// --- UI NAVIGATION ---
function showPage(page, btn) {
  document.querySelectorAll(".page").forEach(section => {
    section.classList.remove("active-page");
  });

  const target = document.getElementById("page-" + page);
  if (target) target.classList.add("active-page");

  document.querySelectorAll(".side-btn").forEach(button => {
    button.classList.remove("active");
  });

  if (btn) {
    btn.classList.add("active");
  } else {
    const buttons = Array.from(document.querySelectorAll(".side-btn"));
    const activeButton = buttons.find(button => button.textContent.trim().toLowerCase().includes(page));
    if (activeButton) activeButton.classList.add("active");
  }

  if (page === "clients") checkManagerClient();
  if (page === "account") renderAccountUI();
  if (page === "skins") updateSkinUI();
}

function openLoginPage() {
  window.location.href = "login.html";
}

function switchAccount(accountId) {
  const account = readAccounts().find(saved => saved.id === accountId);
  if (!account) return;
  setCurrentAccount(account);
  if(statusText) statusText.innerText = "Switched to " + account.name;
}

function logoutAccount() {
  setCurrentAccount(null);
  if(statusText) statusText.innerText = "Logged out";
}

function deleteCurrentAccount() {
  if (!currentAccount) {
    if(statusText) statusText.innerText = "No account selected";
    return;
  }

  const ok = confirm("Delete account " + currentAccount.name + "?");
  if (!ok) return;

  const accounts = readAccounts().filter(account => account.id !== currentAccount.id);
  writeAccounts(accounts);
  setCurrentAccount(accounts[0] || null);
  if(statusText) statusText.innerText = "Account deleted";
}

// --- SETTINGS ---
function updateRamReadout() {
  const ramSlider = document.getElementById("ram");
  const ramText = document.getElementById("ramValueText");
  if (ramSlider && ramText) {
    ramText.innerText = ramSlider.value + " GB";
  }
}

function saveSettings() {
  const ramInput = document.getElementById("ram");
  const requestedRam = Number(ramInput ? ramInput.value : 2);
  const safeRam = Math.min(16, Math.max(1, Number.isFinite(requestedRam) ? Math.round(requestedRam) : 2));

  if (ramInput) ramInput.value = String(safeRam);

  settings = {
    ram: String(safeRam),
    updateChannel: document.getElementById("updateChannel")
      ? (document.getElementById("updateChannel").value === "beta" ? "beta" : "release")
      : "release",
    javaPath: typeof javaPath === "string" ? javaPath : "java",
    gameDir: typeof gameDir === "string" ? gameDir : "",
    closeAfterLaunch: Boolean(closeAfterLaunchInput && closeAfterLaunchInput.checked)
  };

  closeAfterLaunch = settings.closeAfterLaunch;
  localStorage.setItem("auraSettings", JSON.stringify(settings));
  updateRamReadout();
  window.electron.ipcRenderer.invoke(
    "set-update-channel",
    settings.updateChannel
  ).catch((error) => console.warn("Could not sync update channel:", error));
  showNotice("Settings saved", "success");
  if (statusText) statusText.innerText = "Settings saved";
}

function loadSettings() {
  const ramSlider = document.getElementById("ram");
  const updateChannelSelect = document.getElementById("updateChannel");
  const themeSelect = document.getElementById("theme");
  const accentSelect = document.getElementById("accentColor");
  const savedTheme = localStorage.getItem("auraTheme") === "light" ? "light" : "dark";
  const allowedAccents = ["#22c55e", "#3b82f6", "#a855f7", "#ef4444"];
  const storedAccent = localStorage.getItem("auraAccent") || "#22c55e";
  const savedAccent = allowedAccents.includes(storedAccent) ? storedAccent : "#22c55e";

  document.body.dataset.theme = savedTheme;
  document.documentElement.style.setProperty("--accent", savedAccent);

  if (ramSlider) {
    const savedRam = Number(settings.ram);
    ramSlider.value = String(Math.min(16, Math.max(1, Number.isFinite(savedRam) && savedRam > 0 ? Math.round(savedRam) : 2)));
    updateRamReadout();
  }
  if (updateChannelSelect) updateChannelSelect.value = settings.updateChannel || "release";
  if (themeSelect) themeSelect.value = savedTheme;
  if (accentSelect) accentSelect.value = savedAccent;
  if (javaPathInput) javaPathInput.value = javaPath === "java" ? "" : javaPath;
  if (gameDirInput) gameDirInput.value = gameDir || "";
  if (closeAfterLaunchInput) closeAfterLaunchInput.checked = closeAfterLaunch;

  window.electron.ipcRenderer.invoke(
    "set-update-channel",
    settings.updateChannel === "beta" ? "beta" : "release"
  ).catch((error) => {
    console.warn("Could not sync update channel:", error);
  });
}

// --- LIGHTWEIGHT IN-APP NOTIFICATIONS ---
let noticeTimer = null;
let lastLaunchError = null;
let lastMinecraftExitCode = null;

function showNotice(message, type = "info") {
  let notice = document.getElementById("auraNotice");
  if (!notice) {
    notice = document.createElement("div");
    notice.id = "auraNotice";
    notice.className = "aura-notice";
    notice.setAttribute("role", "status");
    notice.setAttribute("aria-live", "polite");
    document.body.appendChild(notice);
  }

  notice.textContent = String(message || "");
  notice.dataset.type = ["success", "error", "info"].includes(type) ? type : "info";
  notice.classList.add("visible");

  if (noticeTimer) clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => notice.classList.remove("visible"), 2800);
}

// --- SETTINGS RESET & DIAGNOSTICS ---
function resetSettings() {
  const confirmed = confirm(
    "Reset launcher settings to their defaults? Your accounts and Minecraft installations will not be deleted."
  );
  if (!confirmed) return;

  settings = {
    ram: "2",
    updateChannel: "release",
    javaPath: "java",
    gameDir: "",
    closeAfterLaunch: false
  };
  javaPath = "java";
  gameDir = "";
  closeAfterLaunch = false;

  localStorage.setItem("auraSettings", JSON.stringify(settings));
  localStorage.setItem("auraTheme", "dark");
  localStorage.setItem("auraAccent", "#22c55e");

  loadSettings();
  showNotice("Settings restored to defaults", "success");
  if (statusText) statusText.innerText = "Settings restored to defaults";
}

async function loadAboutInfo() {
  try {
    const info = await window.electron.ipcRenderer.invoke("get-app-info");
    const version = document.getElementById("aboutVersion");
    const build = document.getElementById("aboutBuildInfo");
    if (version) version.innerText = "Version v" + info.version;
    if (build) {
      build.innerText = `${info.platform} (${info.architecture}) • Electron ${info.electron} • Chromium ${info.chromium}`;
    }
  } catch (error) {
    const build = document.getElementById("aboutBuildInfo");
    if (build) build.innerText = "Build information unavailable";
    console.warn("Could not load application information:", error);
  }
}

async function copyDiagnostics() {
  try {
    const info = await window.electron.ipcRenderer.invoke("get-app-info");
    const report = [
      "Aura Launcher Legacy Diagnostics",
      `Version: ${info.version}`,
      `Platform: ${info.platform}`,
      `Architecture: ${info.architecture}`,
      `Electron: ${info.electron}`,
      `Chromium: ${info.chromium}`,
      `Node.js: ${info.node}`,
      `Packaged: ${info.packaged}`,
      `Update channel: ${settings.updateChannel || "release"}`
    ].join("\\n");

    await window.electron.ipcRenderer.invoke("copy-diagnostics", report);
    showNotice("Diagnostics copied to clipboard", "success");
    if (statusText) statusText.innerText = "Diagnostics copied to clipboard";
  } catch (error) {
    console.error("Could not copy diagnostics:", error);
    showNotice("Could not copy diagnostics", "error");
    if (statusText) statusText.innerText = "Could not copy diagnostics";
  }
}

async function copyErrorReport() {
  try {
    const info = await window.electron.ipcRenderer.invoke("get-app-info");
    const error = lastLaunchError || {
      code: "NO_RECENT_ERROR",
      title: "No recent launch error",
      message: "No launch error has been recorded in this session."
    };
    const report = [
      "Aura Launcher Legacy — Error Report",
      `Version: ${info.version}`,
      `Platform: ${info.platform} (${info.architecture})`,
      `Electron: ${info.electron}`,
      `Chromium: ${info.chromium}`,
      `Node.js: ${info.node}`,
      `Packaged: ${info.packaged}`,
      `Update channel: ${settings.updateChannel || "release"}`,
      `Error code: ${error.code}`,
      `Error: ${error.title}`,
      `Details: ${error.message}`,
      `Minecraft exit code: ${lastMinecraftExitCode === null ? "N/A" : lastMinecraftExitCode}`
    ].join("\\n");

    await window.electron.ipcRenderer.invoke("copy-diagnostics", report);
    showNotice("Error report copied. It contains no account tokens or passwords.", "success");
  } catch (error) {
    console.error("Could not copy error report:", error);
    showNotice("Could not copy error report", "error");
  }
}

// --- CLIENT LOGIC ---
async function loadClients() {
  try {
    clientsCache = await window.electron.ipcRenderer.invoke("load-clients");
    if(clientSelect) clientSelect.innerHTML = "";
    if(clientManagerSelect) clientManagerSelect.innerHTML = "";

    clientsCache.forEach(client => {
      const launchOption = document.createElement("option");
      launchOption.value = client.id;
      launchOption.textContent = client.name;
      if(clientSelect) clientSelect.appendChild(launchOption);

      const managerOption = document.createElement("option");
      managerOption.value = client.id;
      managerOption.textContent = client.name;
      if(clientManagerSelect) clientManagerSelect.appendChild(managerOption);
    });

    if (clientsCache.length > 0) {
      if(clientSelect) clientSelect.value = clientsCache[0].id;
      if(clientManagerSelect) clientManagerSelect.value = clientsCache[0].id;
    }

    await checkSelectedClient();
    await checkManagerClient();
  } catch (err) {
    if(statusText) statusText.innerText = "Failed to load clients";
    console.error(err);
    if(consoleBox) consoleBox.value += err.message + "\n";
  }
}

function updateSkinUI() {
  if (!currentAccount) {
    if(skinPreview) skinPreview.style.display = "none";
    if(skinName) skinName.innerText = "Not logged in";
    if(skinHelp) skinHelp.innerText = "Login with Microsoft or Ely.by to show your skin.";
    return;
  }

  if(skinName) skinName.innerText = currentAccount.name;

  if (currentAccount.type === "offline") {
    if(skinPreview) skinPreview.style.display = "none";
    if(skinHelp) skinHelp.innerText = "Offline accounts do not include skin sync.";
    return;
  }

  if (currentAccount.type === "microsoft") {
     if(skinPreview) skinPreview.src = `https://minotar.net/armor/body/${encodeURIComponent(currentAccount.name)}/160.png`;
     if(skinHelp) skinHelp.innerText = "Microsoft skin preview";
  } else {
     if(skinPreview) skinPreview.src = `https://skinsystem.ely.by/skins/${encodeURIComponent(currentAccount.name)}`;
     if(skinHelp) skinHelp.innerText = "Ely.by skin preview";
  }
  if(skinPreview) skinPreview.style.display = "block";
}

async function openElySkins() {
  await window.electron.ipcRenderer.invoke("open-external", "https://ely.by/skins");
}

async function selectJava() {
  const selected = await window.electron.ipcRenderer.invoke("select-java");
  if (selected) {
    javaPath = selected;
    if(javaPathInput) javaPathInput.value = selected;
    saveSettings();
    if(statusText) statusText.innerText = "Java selected";
  }
}

async function selectGameDir() {
  const selected = await window.electron.ipcRenderer.invoke("select-game-dir");
  if (selected) {
    gameDir = selected;
    if(gameDirInput) gameDirInput.value = selected;
    saveSettings();
    await checkSelectedClient();
    await checkManagerClient();
    if(statusText) statusText.innerText = "Game directory selected";
  }
}

async function checkSelectedClient() {
  if (!clientSelect || !clientSelect.value) return;

  // --- DYNAMIC BACKGROUND LOGIC ---
  const clientId = clientSelect.value.toLowerCase();
  
  // High-quality placeholder images (you can replace these URLs with local assets later)
  let bgUrl = "https://images.unsplash.com/photo-1607513746994-51f730a44832?q=80&w=2000"; // Default Vanilla
  
  if (clientId.includes("fabric")) {
      bgUrl = "https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=2000"; // Darker mountain theme
  } else if (clientId.includes("forge")) {
      bgUrl = "https://images.unsplash.com/photo-1627844642677-8b32e36bf268?q=80&w=2000"; // Forge/Lava aesthetic
  } else if (clientId.includes("optifine")) {
      bgUrl = "https://images.unsplash.com/photo-1629852230620-ce90d40510be?q=80&w=2000"; // High-fidelity shader look
  }
  
  if (dynamicBg) {
      // The CSS transition handles the smooth fade automatically
      dynamicBg.style.backgroundImage = `url('${bgUrl}')`;
  }
  // --------------------------------

  try {
    const installed = await window.electron.ipcRenderer.invoke("check-client", {
      client: clientSelect.value,
      gameDir
    });

    if (installed) {
      if(installState) installState.innerText = "Installed";
      if(installState) installState.className = "install-state installed";
    } else {
      if(installState) installState.innerText = "Not installed";
      if(installState) installState.className = "install-state missing";
    }
  } catch (err) {
    console.error(err);
  }
}

async function checkManagerClient() {
  if (!clientManagerSelect || !clientManagerSelect.value) return;
  try {
    const installed = await window.electron.ipcRenderer.invoke("check-client", {
      client: clientManagerSelect.value,
      gameDir
    });

    if (installed) {
      if(managerState) managerState.innerText = "Installed";
      if(managerState) managerState.className = "install-state installed";
    } else {
      if(managerState) managerState.innerText = "Not installed";
      if(managerState) managerState.className = "install-state missing";
    }
  } catch (err) {
    console.error(err);
  }
}

function syncClientSelect() {
  if(clientSelect && clientManagerSelect) clientSelect.value = clientManagerSelect.value;
  checkSelectedClient();
  checkManagerClient();
}

function resetProgress() {
  if(downloadProgress) downloadProgress.style.width = "0%";
  if(downloadPercent) downloadPercent.innerText = "0%";
  if(managerProgress) managerProgress.style.width = "0%";
  if(managerPercent) managerPercent.innerText = "0%";
}

async function repairSelectedClient() {
  if (!clientManagerSelect || !clientManagerSelect.value) return;

  resetProgress();
  if(consoleBox) consoleBox.value = "";
  if(launchLog) launchLog.value = "";
  if(logModal) logModal.classList.remove("hidden");
  if(logStatus) logStatus.innerText = "Repairing client...";

  try {
    await window.electron.ipcRenderer.invoke("repair-client", {
      client: clientManagerSelect.value,
      gameDir
    });

    if(logStatus) logStatus.innerText = "Repair complete";
    await checkSelectedClient();
    await checkManagerClient();
    setTimeout(() => { if(logModal) logModal.classList.add("hidden") }, 1200);
  } catch (err) {
    if(logStatus) logStatus.innerText = "Repair failed";
    if(consoleBox) consoleBox.value += err.message + "\n";
    if(launchLog) launchLog.value += err.message + "\n";
  }
}

async function deleteSelectedClient() {
  if (!clientManagerSelect || !clientManagerSelect.value) return;
  const ok = confirm("Delete selected client?");
  if (!ok) return;

  resetProgress();
  if(consoleBox) consoleBox.value = "";
  if(launchLog) launchLog.value = "";

  try {
    await window.electron.ipcRenderer.invoke("delete-client", {
      client: clientManagerSelect.value,
      gameDir
    });

    if(statusText) statusText.innerText = "Client deleted";
    await checkSelectedClient();
    await checkManagerClient();
  } catch (err) {
    if(statusText) statusText.innerText = "Delete failed";
    if(consoleBox) consoleBox.value += err.message + "\n";
  }
}

async function play() {
  const clientId = clientSelect ? clientSelect.value : null;

  if (!clientId) {
    alert("No client selected.");
    return;
  }

  if (!currentAccount) {
    if(statusText) statusText.innerText = "Login first";
    alert("Please add or select an account first.");
    showPage("account");
    return;
  }

  resetProgress();
  if(consoleBox) consoleBox.value = "";
  if(launchLog) launchLog.value = "";
  if(crashLog) crashLog.value = "";
  if(logModal) logModal.classList.remove("hidden");

  try {
    if(logStatus) logStatus.innerText = "Checking client...";
    if(statusText) statusText.innerText = "Checking client...";

    const installed = await window.electron.ipcRenderer.invoke("check-client", {
      client: clientId,
      gameDir
    });

    if (!installed) {
      if(logStatus) logStatus.innerText = "Downloading client...";
      if(statusText) statusText.innerText = "Downloading client...";

      await window.electron.ipcRenderer.invoke("install-client", {
        client: clientId,
        gameDir
      });

      await checkSelectedClient();
      await checkManagerClient();
    }

    if(logStatus) logStatus.innerText = "Launching Minecraft...";
    if(statusText) statusText.innerText = "Launching Minecraft...";

    window.electron.ipcRenderer.send("launch-game", {
      client: clientId,
      accountType: currentAccount.type,
      username: currentAccount.name,
      uuid: currentAccount.uuid,
      accessToken: currentAccount.accessToken,
      clientToken: currentAccount.clientToken,
      ram: document.getElementById("ram") ? document.getElementById("ram").value : "2",
      javaPath,
      gameDir,
      closeAfterLaunch: closeAfterLaunchInput ? closeAfterLaunchInput.checked : false
    });
  } catch (err) {
    if(logStatus) logStatus.innerText = "Error";
    if(statusText) statusText.innerText = "Error: " + err.message;
    if(consoleBox) consoleBox.value += err.message + "\n";
    if(launchLog) launchLog.value += err.message + "\n";
    console.error(err);
  }
}

function closeLogModal() {
  if(logModal) logModal.classList.add("hidden");
  if(statusText) statusText.innerText = "Launcher running";
}

function closeCrashModal() {
  if(crashModal) crashModal.classList.add("hidden");
}

function changeTheme() {
  const theme = document.getElementById("theme").value;
  document.body.dataset.theme = theme;
  localStorage.setItem("auraTheme", theme);
  showNotice(`${theme === "light" ? "Light" : "Dark"} theme applied`, "success");
}

function changeAccent() {
  const colour = document.getElementById("accentColor").value;
  document.documentElement.style.setProperty("--accent", colour);
  localStorage.setItem("auraAccent", colour);
  showNotice("Accent color updated", "success");
}

async function checkForUpdates() {
  const channel = settings.updateChannel === "beta" ? "beta" : "release";
  if (statusText) statusText.innerText = `Checking for ${channel} updates...`;
  showNotice(`Checking for ${channel} updates`, "info");
  try {
    await window.electron.ipcRenderer.invoke("check-for-updates", channel);
  } catch (error) {
    console.error("Manual update check failed:", error);
    showNotice("Update check failed. Please try again later.", "error");
    if (statusText) statusText.innerText = "Update check failed. Please try again later.";
  }
}

// --- IPC LISTENERS ---
window.electron.ipcRenderer.on("download-progress", (data) => {
  const payload = typeof data === "number" ? { percent: data } : data;
  const percent = Math.round(Number(payload.percent) || 0);

  if(downloadProgress) downloadProgress.style.width = percent + "%";
  if(managerProgress) managerProgress.style.width = percent + "%";
  if(downloadPercent) downloadPercent.innerText = `${percent}% • ${payload.speed?.toFixed(2) || 0} MB/s`;
  if(managerPercent) managerPercent.innerText = `${percent}% • ETA ${Math.round(payload.eta || 0)}s`;
});

window.electron.ipcRenderer.on("launch-status", (message) => {
  if(statusText) statusText.innerText = message;
  if(logStatus) logStatus.innerText = message;

  if (message === "Minecraft started.") {
    setTimeout(() => { if(logModal) logModal.classList.add("hidden") }, 1500);
  }
});

window.electron.ipcRenderer.on("launch-log", (message) => {
  if(consoleBox) {
    consoleBox.value += message + "\n";
    consoleBox.scrollTop = consoleBox.scrollHeight;
  }
  if(launchLog) {
    launchLog.value += message + "\n";
    launchLog.scrollTop = launchLog.scrollHeight;
  }
  if(crashLog) {
    crashLog.value += message + "\n";
    crashLog.scrollTop = crashLog.scrollHeight;
  }
});

window.electron.ipcRenderer.on("launch-error", (details) => {
  lastLaunchError = {
    code: String(details && details.code || "LAUNCH_FAILED"),
    title: String(details && details.title || "Minecraft could not start"),
    message: String(details && details.message || "Review the launcher console and try again.")
  };
  if (crashText) crashText.innerText = `${lastLaunchError.title}: ${lastLaunchError.message}`;
  if (crashModal) crashModal.classList.remove("hidden");
  showNotice(lastLaunchError.message, "error");
});

window.electron.ipcRenderer.on("minecraft-closed", (code) => {
  lastMinecraftExitCode = Number(code);
  if (code !== 0 && crashModal) {
    lastLaunchError = {
      code: "GAME_EXIT",
      title: "Minecraft closed unexpectedly",
      message: `Minecraft exited with code ${code}. Check the console for details.`
    };
    if(crashText) crashText.innerText = lastLaunchError.message;
    crashModal.classList.remove("hidden");
    showNotice(lastLaunchError.message, "error");
  }
});

// Update modal lifecycle: close manually, hide terminal statuses, and
// prevent a stalled update check from leaving the overlay stuck forever.
let updateModalDismissed = false;
let updateCheckTimeout = null;
let updateStatusHideTimeout = null;

function hideUpdateModal() {
  if (updateModal) updateModal.classList.add("hidden");
  updateModalDismissed = true;
  if (updateCheckTimeout) {
    clearTimeout(updateCheckTimeout);
    updateCheckTimeout = null;
  }
  if (updateStatusHideTimeout) {
    clearTimeout(updateStatusHideTimeout);
    updateStatusHideTimeout = null;
  }
}

const closeUpdateModalButton = document.getElementById("closeUpdateModal");
if (closeUpdateModalButton) {
  closeUpdateModalButton.addEventListener("click", hideUpdateModal);
}

window.electron.ipcRenderer.on("update-status", (message) => {
  const text = String(message || "");
  const normalized = text.toLowerCase();

  if (statusText) statusText.innerText = text;
  if (
    normalized.includes("up to date") ||
    normalized.includes("updates unavailable") ||
    normalized.includes("update check failed") ||
    normalized.includes("update ready")
  ) {
    const type = normalized.includes("unavailable") || normalized.includes("failed") ? "error" : "info";
    showNotice(text, type);
  }

  const isChecking = normalized.includes("checking for updates");
  const isDownloading = normalized.includes("downloading update") ||
    normalized.includes("downloading new version");
  const isTerminal = normalized.includes("up to date") ||
    normalized.includes("unavailable") ||
    normalized.includes("not available") ||
    normalized.includes("update error") ||
    normalized.includes("update check failed");

  if (isChecking || isDownloading) {
    updateModalDismissed = false;
    if (updateModal) updateModal.classList.remove("hidden");
    if (updateStatusText) updateStatusText.innerText = text;
    if (updateCheckTimeout) clearTimeout(updateCheckTimeout);

    const loader = document.getElementById("updateLoader");
    const progressTrack = document.getElementById("updateProgressTrack");
    if (loader) loader.style.display = "";
    if (progressTrack) progressTrack.style.display = "";
    if (updateProgressText) updateProgressText.style.display = "";

    if (isChecking) {
      updateCheckTimeout = setTimeout(() => {
        if (!updateModalDismissed && updateModal && !updateModal.classList.contains("hidden")) {
          if (updateStatusText) {
            updateStatusText.innerText =
              "Update check timed out. Aura Launcher Legacy will continue without an update.";
          }
          if (loader) loader.style.display = "none";
          if (progressTrack) progressTrack.style.display = "none";
          if (updateProgressText) updateProgressText.style.display = "none";

          // Automatically dismiss a stalled check so it cannot block the launcher.
          updateStatusHideTimeout = setTimeout(() => {
            if (!updateModalDismissed && updateModal) {
              updateModal.classList.add("hidden");
            }
          }, 2500);
        }
      }, 20000);
    }
    return;
  }

  if (normalized.includes("update ready")) {
    if (updateStatusText) updateStatusText.innerText = text;
    if (updateStatusHideTimeout) clearTimeout(updateStatusHideTimeout);
    updateStatusHideTimeout = setTimeout(() => {
      if (!updateModalDismissed && updateModal) updateModal.classList.add("hidden");
    }, 3000);
    return;
  }

  if (isTerminal) {
    if (updateStatusText) updateStatusText.innerText = text;
    if (updateCheckTimeout) {
      clearTimeout(updateCheckTimeout);
      updateCheckTimeout = null;
    }
    if (updateStatusHideTimeout) clearTimeout(updateStatusHideTimeout);
    updateStatusHideTimeout = setTimeout(() => {
      if (!updateModalDismissed && updateModal) updateModal.classList.add("hidden");
    }, 3000);
  }
});

window.electron.ipcRenderer.on("update-progress", (percent) => {
  const rounded = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
  if (updateProgressBar) updateProgressBar.style.width = rounded + "%";
  if (updateProgressText) updateProgressText.innerText = rounded + "%";
  if (consoleBox) consoleBox.value += `Update ${rounded}%\\n`;
});

// --- INIT ---
normalizeStoredAccounts();
loadSettings();
loadAboutInfo();
renderAccountUI();
loadClients().catch(err => {
  console.error("Client load failed:", err);
});