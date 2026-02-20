# DevPilot 🚀

> AI-powered code assistant triggered by a Logitech button press.  
> Select code → press button → Improve, Debug, or Explain instantly.

Built for the **[DevStudio 2026 by Logitech](https://devstudiologitech2026.devpost.com/)** hackathon.

---

## What it does

DevPilot lets developers trigger AI code actions with a single Logitech button press (or `Ctrl+Alt+Space`):

- **Improve Code** — Select messy code → press → preview improved version → Apply replaces it in your editor
- **Debug Error** — Select an error message → press → get root cause + fix steps
- **Explain Code** — Select any code → press → get a plain-English explanation

The selected text is automatically copied, sent to an AI backend, and the result is shown in a floating popup. For "Improve Code", clicking Apply automatically replaces the original selection in your editor.

---

## Architecture

```
Logitech button press (or Ctrl+Alt+Space)
        ↓
  Loupedeck Plugin (C# / Logitech Actions SDK)
        ↓
  HTTP GET localhost:7734/improve (or /debug, /explain)
        ↓
  Electron App (Node.js)
  - Captures editor window handle
  - Auto Ctrl+C to copy selection
  - Opens floating popup
        ↓
  FastAPI Backend (Python)
  - Calls OpenRouter AI API
  - Returns improved/debugged/explained code
        ↓
  Popup shows result → Apply → Ctrl+V replaces selection in editor
```

---

## Prerequisites

- Windows 10/11
- Python 3.10+
- Node.js 18+
- .NET 8 SDK — https://dotnet.microsoft.com/download/dotnet/8.0
- Logitech Options+ or Loupedeck software — https://loupedeck.com/downloads/
- LogiPluginTool: `dotnet tool install --global LogiPluginTool`
- OpenRouter API key — https://openrouter.ai (free tier works)

---

## Setup & Running

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/devpilot.git
cd devpilot
```

### 2. Backend (Python FastAPI)

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv

# Windows:
.venv\Scripts\activate

# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install fastapi uvicorn openai python-dotenv

# Add your OpenRouter API key
echo OPENROUTER_API_KEY=your_key_here > .env

# Start the server
uvicorn main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`

### 3. Electron App (popup UI)

Open a new terminal:

```bash
cd plugin/devpilot-app
npm install
npm start
```

You should see:

```
DevPilot ready — Select text, press Ctrl+Alt+Space
Logitech trigger server listening on port 7734
```

### 4. Loupedeck Plugin (C# / Logitech Actions SDK)

Open a new terminal:

```bash
cd loupedeck-plugin
dotnet build
```

This automatically:

- Builds `DevPilotPlugin.dll`
- Creates a `.link` file in `%LOCALAPPDATA%\Logi\LogiPluginService\Plugins\`
- Sends a reload command to Logi Plugin Service

Then open **Loupedeck** → Add-on Manager → verify "Example" (DevPilot actions) shows as **Ready**.

Go to **Hide and Show Plugins** → enable **Example** → you'll see:

- DevPilot / Improve Code
- DevPilot / Debug Error
- DevPilot / Explain Code

Drag any of these onto a button in the Loupedeck UI.

---

## Usage

1. Start backend (`uvicorn`) in Terminal 1
2. Start Electron app (`npm start`) in Terminal 2
3. Open your code editor (VS Code, etc.)
4. Select some code
5. Press your mapped Logitech button (or `Ctrl+Alt+Space`)
6. Choose an action from the popup
7. For **Improve Code**: review the preview → click **Apply Changes** → code is replaced in your editor

---

## Project Structure

```
devpilot/
├── backend/                  # Python FastAPI AI backend
│   ├── main.py               # API routes (/improve, /debug, /explain)
│   ├── ai_service.py         # OpenRouter API integration
│   ├── prompts.py            # Prompt templates
│   └── requirements.txt
├── plugin/devpilot-app/      # Electron popup app
│   ├── main.js               # Global shortcut, PowerShell window management
│   ├── popup.html            # Floating UI
│   └── package.json
└── loupedeck-plugin/            # Logitech Actions SDK plugin (C#)
    └── src/
        ├── Actions/
        │   └── DevPilotCommands.cs   # Improve/Debug/Explain commands
        ├── ExamplePlugin.cs          # Plugin entry point
        └── ExamplePlugin.csproj     # Build config
```

---

## Tech Stack

- **Logitech Actions SDK** (C# / .NET 8) — button trigger integration
- **Electron** (Node.js) — floating popup UI, clipboard & window management
- **FastAPI** (Python) — AI backend
- **OpenRouter API** — AI model access
- **PowerShell Win32 API** — reliable window focus & paste on Windows

---
