# Claude Clockify — Claude Desktop Extension

A Claude Desktop Extension that connects Claude to [Clockify](https://clockify.me), letting you log time, check running timers, and manage time entries directly from Claude.

## Installation

### Claude Desktop (macOS and Windows)

1. Download `claude-clockify.mcpb` from the [latest release](../../releases/latest)
2. Go to [claude.ai/settings](https://claude.ai/settings) → **Extensions**
3. Click **Add Extension** and select the downloaded `.mcpb` file
4. Enter your Clockify API key when prompted (see below)

> **Security prompt:** During installation, Claude will warn that "developer information has not been verified by Anthropic." This is shown for all third-party extensions — Anthropic doesn't yet offer a developer verification programme. You can review the full source in this repository.

### Claude CLI / Linux

1. Clone this repository: `git clone https://github.com/tallthom/claude-clockify.git`
2. Install dependencies: `cd claude-clockify/server && npm install`
3. Add the following to your Claude CLI MCP config (`~/.claude/settings.json` → `mcpServers`):

```json
{
  "mcpServers": {
    "clockify": {
      "command": "node",
      "args": ["/path/to/claude-clockify/server/dist/index.js"],
      "env": {
        "CLOCKIFY_API_KEY": "your_api_key"
      }
    }
  }
}
```

## Getting your Clockify credentials

You need one thing: an **API Key**.

### API Key

1. Log in to [app.clockify.me](https://app.clockify.me)
2. Click your avatar (top right) → **Profile Settings**
3. Scroll to the **API** section at the bottom
4. Click **Generate** if you don't have a key, then copy it

### Workspace ID (optional)

The extension automatically fetches your workspaces from the Clockify API. **If you only have one workspace, no further configuration is needed.**

If you have multiple workspaces and want to lock the extension to a specific one, add `CLOCKIFY_WORKSPACE_ID` to your config:

```json
"env": {
  "CLOCKIFY_API_KEY": "your_api_key",
  "CLOCKIFY_WORKSPACE_ID": "your_workspace_id"
}
```

## What you can do

Once installed, you can ask Claude things like:

- *"Start a timer for the team meeting"*
- *"What have I logged today?"*
- *"Stop my running timer"*
- *"Log 2 hours on the Documentation project"*

## Source

Built on top of [@hongkongkiwi/clockify-master-mcp](https://github.com/hongkongkiwi/clockify-master-mcp) with pagination and timezone fixes applied.
