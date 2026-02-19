const {
  app,
  BrowserWindow,
  ipcMain,
  globalShortcut,
  Tray,
  Menu,
  screen,
  nativeImage,
} = require("electron");
const { execSync } = require("child_process");
const clipboardy = require("clipboardy");
const fetch = require("node-fetch");
const path = require("path");

const BACKEND_URL = "http://127.0.0.1:8000";

let win = null;
let tray = null;
let savedHwnd = null;

// ─── PowerShell runner (base64-encoded — avoids ALL escaping issues) ──────────

function runPS(script) {
  try {
    // UTF-16LE is what PowerShell -EncodedCommand expects
    const encoded = Buffer.from(script, "utf16le").toString("base64");
    return execSync(
      `powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`,
      { timeout: 5000 },
    )
      .toString()
      .trim();
  } catch (e) {
    console.log("PS error:", e.message);
    return null;
  }
}

// ─── Win32 helpers ────────────────────────────────────────────────────────────

function getForegroundHwnd() {
  const result = runPS(`
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class DevPilotWin {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
}
"@
[DevPilotWin]::GetForegroundWindow()
  `);
  console.log("HWND captured:", result);
  return result;
}

function copySelectionFromWindow(hwnd) {
  runPS(`
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class DevPilotCopy {
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int n);
}
"@
[DevPilotCopy]::ShowWindow([IntPtr]${hwnd}, 9)
Start-Sleep -Milliseconds 100
[DevPilotCopy]::SetForegroundWindow([IntPtr]${hwnd})
Start-Sleep -Milliseconds 100
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.SendKeys]::SendWait("^c")
Start-Sleep -Milliseconds 150
  `);
}

function activateAndPaste(hwnd) {
  runPS(`
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class DevPilotPaste {
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int n);
}
"@
[DevPilotPaste]::ShowWindow([IntPtr]${hwnd}, 9)
Start-Sleep -Milliseconds 150
[DevPilotPaste]::SetForegroundWindow([IntPtr]${hwnd})
Start-Sleep -Milliseconds 200
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.SendKeys]::SendWait("^v")
  `);
}

// ─── Backend call ─────────────────────────────────────────────────────────────

async function callBackend(endpoint, text) {
  const res = await fetch(`${BACKEND_URL}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Backend returned ${res.status}`);
  const data = await res.json();
  return data.result;
}

// ─── Popup window ─────────────────────────────────────────────────────────────

async function openPopup() {
  if (win && !win.isDestroyed()) {
    win.close();
    return;
  }

  // Step 1: capture editor window BEFORE Electron takes focus
  savedHwnd = getForegroundHwnd();
  console.log("Editor HWND saved:", savedHwnd);

  if (!savedHwnd) {
    console.log("WARNING: Could not capture editor window handle");
  }

  // Step 2: send Ctrl+C to editor to copy the current selection
  if (savedHwnd) {
    copySelectionFromWindow(savedHwnd);
  }

  // Step 3: small pause so clipboard is ready before popup reads it
  await new Promise((r) => setTimeout(r, 200));

  // Step 4: open popup
  const cursor = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursor);

  let x = cursor.x + 12;
  let y = cursor.y + 12;
  if (x + 260 > display.bounds.x + display.bounds.width) x = cursor.x - 272;
  if (y + 210 > display.bounds.y + display.bounds.height) y = cursor.y - 222;

  win = new BrowserWindow({
    width: 260,
    height: 210,
    x,
    y,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile(path.join(__dirname, "popup.html"));

  win.on("blur", () => {
    if (win && !win.isDestroyed()) win.close();
  });

  win.on("closed", () => {
    win = null;
  });
}

// ─── IPC handlers ─────────────────────────────────────────────────────────────

ipcMain.on("action", async (event, actionName) => {
  console.log("Action received:", actionName);

  if (win && !win.isDestroyed()) {
    win.webContents.send("loading", actionName);
  }

  try {
    const text = await clipboardy.read();

    if (!text || text.trim().length === 0) {
      if (win && !win.isDestroyed()) {
        win.webContents.send(
          "error",
          "No text selected — select some code first.",
        );
      }
      return;
    }

    if (actionName === "improve") {
      const result = await callBackend("improve", text);
      if (win && !win.isDestroyed()) {
        win.webContents.send("show-preview", { result, hwnd: savedHwnd });
        win.setSize(680, 460);
        const { width, height } = screen.getPrimaryDisplay().workAreaSize;
        win.setPosition(
          Math.floor(width / 2 - 340),
          Math.floor(height / 2 - 230),
        );
        win.setAlwaysOnTop(true);
        win.removeAllListeners("blur");
      }
    } else {
      const result = await callBackend(actionName, text);
      if (win && !win.isDestroyed()) {
        win.webContents.send("show-result", { result, actionName });
        win.setSize(560, 400);
        const { width, height } = screen.getPrimaryDisplay().workAreaSize;
        win.setPosition(
          Math.floor(width / 2 - 280),
          Math.floor(height / 2 - 200),
        );
        win.removeAllListeners("blur");
      }
    }
  } catch (e) {
    console.log("Action error:", e);
    if (win && !win.isDestroyed()) {
      win.webContents.send("error", `Error: ${e.message}`);
    }
  }
});

ipcMain.on("apply-changes", async (event, { newCode, hwnd }) => {
  try {
    await clipboardy.write(newCode);
    const target = hwnd || savedHwnd;
    console.log("Applying to HWND:", target);

    if (win && !win.isDestroyed()) win.close();

    setTimeout(() => {
      activateAndPaste(target);
    }, 150);
  } catch (e) {
    console.log("apply-changes error:", e);
  }
});

ipcMain.on("close-popup", () => {
  if (win && !win.isDestroyed()) win.close();
});

// ─── App lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  if (app.dock) app.dock.hide();

  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip("DevPilot");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "DevPilot", enabled: false },
      { type: "separator" },
      { label: "Open Popup", click: openPopup },
      { label: "Quit", click: () => app.quit() },
    ]),
  );

  const registered = globalShortcut.register(
    "CommandOrControl+Alt+Space",
    openPopup,
  );
  console.log(
    registered
      ? "DevPilot ready — Select text, press Ctrl+Alt+Space"
      : "WARNING: Shortcut Ctrl+Alt+Space could not be registered",
  );
});

app.on("will-quit", () => globalShortcut.unregisterAll());
app.on("window-all-closed", (e) => e.preventDefault());
