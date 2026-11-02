const { Client } = require("minecraft-launcher-core");
const path = require("path");
const os = require("os");
const fs = require("fs");
const fetch = require("node-fetch");
const extract = require("extract-zip");

const CLIENTS_JSON_URL = "https://advait8370.github.io/aura-launcher-cloud/clients.json";

let cachedClients = [];

function rootDir(customGameDir) {
  if (customGameDir && customGameDir.trim()) {
    return customGameDir.trim();
  }
  return path.join(os.homedir(), ".aura-launcher");
}

async function loadClients() {
  const res = await fetch(CLIENTS_JSON_URL);

  if (!res.ok) {
    throw new Error("Failed to load clients.json: HTTP " + res.status);
  }

  cachedClients = await res.json();

  if (!Array.isArray(cachedClients)) {
    throw new Error("clients.json must be an array");
  }

  return cachedClients;
}

async function getClient(id) {
  if (!cachedClients.length) {
    await loadClients();
  }

  const client = cachedClients.find(c => c.id === id);

  if (!client) {
    throw new Error("Client not found: " + id);
  }

  if (!client.profile || !client.url || !client.name) {
    throw new Error("Client data is missing name/profile/url in clients.json");
  }

  return client;
}

async function downloadFile(url, dest, log = console.log, progress = () => {}) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });

  if (fs.existsSync(dest)) {
    fs.unlinkSync(dest);
  }

  log("Downloading from: " + url);

  const res = await fetch(url, {
    headers: { "User-Agent": "AuraLauncher/1.3.2" }
  });

  if (!res.ok) {
    throw new Error("Download failed: HTTP " + res.status + " - " + url);
  }

  const total = Number(res.headers.get("content-length")) || 0;
  let downloaded = 0;
  const startTime = Date.now();
  const file = fs.createWriteStream(dest);

  await new Promise((resolve, reject) => {
    res.body.on("data", chunk => {
      downloaded += chunk.length;
      const elapsed = (Date.now() - startTime) / 1000;
      const speed = downloaded / 1024 / 1024 / Math.max(elapsed, 1);

      if (total > 0) {
        const percent = Math.round((downloaded / total) * 100);
        const remaining = total - downloaded;
        const eta = remaining / Math.max(downloaded / Math.max(elapsed, 1), 1);

        progress(percent, downloaded, total, speed, eta);
        log(`Progress: ${percent}% | ${speed.toFixed(2)} MB/s | ETA ${Math.round(eta)}s`);
      }
    });

    res.body.pipe(file);
    res.body.on("error", reject);
    file.on("finish", resolve);
    file.on("error", reject);
  });

  progress(100, downloaded, total, 0, 0);

  const buffer = fs.readFileSync(dest);
  if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    const preview = buffer.toString("utf8", 0, Math.min(buffer.length, 300));
    fs.unlinkSync(dest);

    throw new Error(
      "Downloaded file is not a valid ZIP.\nCheck clients.json URL and re-upload client ZIP.\n\nPreview:\n" + preview
    );
  }

  log("Downloaded valid ZIP: " + path.basename(dest));
}

async function isClientInstalled(id, gameDir) {
  const client = await getClient(id);
  const root = rootDir(gameDir);

  const jsonPath = path.join(root, "versions", client.profile, `${client.profile}.json`);
  const jarPath = path.join(root, "versions", client.profile, `${client.profile}.jar`);

  return fs.existsSync(jsonPath) && fs.existsSync(jarPath);
}

async function deleteClient(id, gameDir, log = console.log) {
  const client = await getClient(id);
  const root = rootDir(gameDir);

  const versionFolder = path.join(root, "versions", client.profile);
  const zipPath = path.join(root, "downloads", `${client.id}.zip`);

  if (fs.existsSync(versionFolder)) {
    fs.rmSync(versionFolder, { recursive: true, force: true });
    log("Deleted version folder: " + versionFolder);
  }

  if (fs.existsSync(zipPath)) {
    fs.rmSync(zipPath, { force: true });
    log("Deleted downloaded ZIP: " + zipPath);
  }

  log("Client deleted: " + client.name);
  return true;
}

async function installClient(id, log = console.log, progress = () => {}, gameDir) {
  const client = await getClient(id);

  if (await isClientInstalled(id, gameDir)) {
    log(client.name + " already installed.");
    progress(100);
    return true;
  }

  const root = rootDir(gameDir);
  const zipPath = path.join(root, "downloads", `${client.id}.zip`);

  log("Installing " + client.name + "...");
  log("Downloading client files...");

  await downloadFile(client.url, zipPath, log, progress);

  log("Extracting client...");
  await extract(zipPath, { dir: root });

  if (!(await isClientInstalled(id, gameDir))) {
    throw new Error(
      "Client ZIP extracted but version profile was not found.\nZIP must contain:\nversions/" +
      client.profile + "/" + client.profile + ".json\nversions/" + client.profile + "/" + client.profile + ".jar"
    );
  }

  log("Installed: " + client.name);
  progress(100);
  return true;
}

async function repairClient(id, log = console.log, progress = () => {}, gameDir) {
  const client = await getClient(id);

  log("Repairing " + client.name + "...");
  await deleteClient(id, gameDir, log);
  await installClient(id, log, progress, gameDir);

  log("Repair complete: " + client.name);
  return true;
}

async function launchMinecraft(options, log = console.log, onClose = () => {}) {
  const launcher = new Client();
  const client = await getClient(options.client);
  const root = rootDir(options.gameDir);

  if (!options.username || !options.uuid) {
    throw new Error("Select an account first");
  }

  const accountType = options.accountType === "ely" ? "ely" : "offline";

  const launchOptions = {
    root,
    authorization: {
      access_token: options.accessToken || "0",
      client_token: options.clientToken || "AuraLauncher",
      uuid: options.uuid,
      name: options.username,
      user_properties: "{}",
      meta: { type: accountType }
    },
    version: {
      number: client.profile,
      type: "release"
    },
    memory: {
      max: `${options.ram || "2"}G`,
      min: "1G"
    }
  };

  if (options.javaPath && options.javaPath !== "java") {
    launchOptions.javaPath = options.javaPath;
  }

  launcher.on("debug", e => log("[DEBUG] " + e));
  launcher.on("data", e => log("[MC] " + e));
  launcher.on("progress", e => log(`[DOWNLOAD] ${e.type || ""} ${e.task || ""}`));

  launcher.on("close", code => {
    log("Minecraft closed with code: " + code);
    onClose(code);
  });

  log("Starting " + client.name + " as " + options.username);
  log("Game directory: " + root);

  return launcher.launch(launchOptions);
}

module.exports = {
  loadClients,
  installClient,
  repairClient,
  deleteClient,
  isClientInstalled,
  launchMinecraft,
  rootDir
};