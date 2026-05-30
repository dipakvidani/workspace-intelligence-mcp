# Quickstart (Under 2 Minutes)

Get the Dev Workspace Assistant up and running, and connected to your AI client in less than 2 minutes.

## 1. Prerequisites

- **Node.js**: v18 or higher
- **Ripgrep**: Must be installed and available on your system `PATH`.
  - macOS: `brew install ripgrep`
  - Windows: `choco install ripgrep` or `winget install BurntSushi.ripgrep.MSVC`
  - Linux: `sudo apt install ripgrep`

## 2. Install and Build

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-org/dev-workspace-assistant.git
cd dev-workspace-assistant
npm install
```

Verify compilation (ensures strict TypeScript health):

```bash
npm run build
```

*(Optional)* Run the production smoke tests to validate your environment:

```bash
npx tsx tests/smoke.test.ts
```

## 3. Configuration (Optional)

By default, the server auto-detects your workspace root. However, to connect databases, create a `workspace.config.json` at the root of your project:

```json
{
  "workspaceRoot": ".",
  "databases": [
    {
      "name": "local-sqlite",
      "type": "sqlite",
      "filePath": "./data/dev.db"
    }
  ]
}
```

## 4. Connect to an MCP Client

The server communicates over `stdio`. Configure your preferred client to spawn the server process.

### For Claude Desktop

Edit your `claude_desktop_config.json` (found at `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS or `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "dev-workspace": {
      "command": "node",
      "args": [
        "dist/index.js"
      ],
      "cwd": "C:/Path/To/Your/Project/dev-workspace-assistant",
      "env": {
        "WORKSPACE_ROOT": "C:/Path/To/Your/Project"
      }
    }
  }
}
```

### For Cursor

1. Open Cursor Settings -> Features -> MCP Servers
2. Click **+ Add New MCP Server**
3. Type: `stdio`
4. Command: `node dist/index.js` (ensure you set the appropriate CWD)

## 5. Test the Connection

Once your client is restarted, simply ask your AI:

> *"Please use the get_project_summary tool to tell me about my workspace."*

You're all set!
