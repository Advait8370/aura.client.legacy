const loginStatus = document.getElementById("loginStatus");

function setStatus(message) {
  if (loginStatus) loginStatus.innerText = message;
}

function getAccounts() {
  return JSON.parse(localStorage.getItem("auraAccounts") || "[]");
}

function setAccounts(accounts) {
  localStorage.setItem("auraAccounts", JSON.stringify(accounts));
}

function saveAccount(account) {
  const accounts = getAccounts();
  const index = accounts.findIndex(saved => saved.id === account.id);

  if (index >= 0) {
    accounts[index] = account;
  } else {
    accounts.push(account);
  }

  setAccounts(accounts);
  localStorage.setItem("auraAccount", JSON.stringify(account));
}

function createAvatarUrl(account) {
  return `https://mc-heads.net/avatar/${encodeURIComponent(account.name)}/128`;
}

function validUsername(username) {
  return /^[A-Za-z0-9_]{3,16}$/.test(username);
}

// --- MICROSOFT AUTH ---
async function loginMicrosoft() {
  setStatus("Waiting for browser login...");
  try {
    const account = await window.electron.ipcRenderer.invoke("login-microsoft");
    if (account) {
      saveAccount(account);
      setStatus("Logged in as " + account.name);
      setTimeout(() => {
        window.location.href = "index.html";
      }, 500);
    }
  } catch (err) {
    setStatus("Microsoft login failed.");
    alert(err.message);
  }
}

// --- OFFLINE AUTH ---
async function loginOffline() {
  const username = document.getElementById("offlineUsername").value.trim();

  if (!validUsername(username)) {
    setStatus("Use a 3-16 character username with letters, numbers, or underscores.");
    return;
  }

  const offlineId = await window.electron.ipcRenderer.invoke("generate-offline-uuid", username);

  const account = {
    id: "offline:" + username.toLowerCase(),
    type: "offline",
    name: username,
    uuid: offlineId,
    accessToken: "0",
    clientToken: "AuraLauncher",
    avatarUrl: createAvatarUrl({ name: username }),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  saveAccount(account);
  setStatus("Logged in as " + account.name);

  setTimeout(() => {
    window.location.href = "index.html";
  }, 500);
}

// --- ELY.BY AUTH ---
async function loginEly() {
  const username = document.getElementById("elyUsername").value.trim();
  const password = document.getElementById("elyPassword").value.trim();

  if (!username || !password) {
    setStatus("Enter Ely.by username and password.");
    return;
  }

  try {
    setStatus("Logging in with Ely.by...");

    const res = await fetch("https://authserver.ely.by/auth/authenticate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username,
        password,
        clientToken: "AuraLauncher",
        requestUser: true
      })
    });

    const data = await res.json();

    if (!res.ok || !data.accessToken || !data.selectedProfile) {
      setStatus("Ely.by login failed.");
      alert(data.errorMessage || "Wrong username or password.");
      return;
    }

    const account = {
      id: "ely:" + data.selectedProfile.id,
      type: "ely",
      name: data.selectedProfile.name,
      uuid: data.selectedProfile.id,
      accessToken: data.accessToken,
      clientToken: data.clientToken || "AuraLauncher",
      avatarUrl: createAvatarUrl({ name: data.selectedProfile.name }),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    saveAccount(account);
    setStatus("Logged in as " + account.name);

    setTimeout(() => {
      window.location.href = "index.html";
    }, 500);
  } catch (err) {
    setStatus("Login error.");
    alert(err.message);
  }
}

function goBack() {
  window.location.href = "index.html";
}
// --- GUI TAB CONTROLLER ---
function switchLoginTab(tabId, btnElement) {
  // Hide all tab content
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Remove active styling from all buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Show the selected tab and highlight the button
  document.getElementById('tab-' + tabId).classList.add('active');
  btnElement.classList.add('active');
  
  // Reset the status message cleanly
  setStatus("Ready");
}