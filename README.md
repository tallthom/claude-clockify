# Moodle Clockify — Claude Desktop Extension

A Claude Desktop Extension that connects Claude to [Clockify](https://clockify.me), letting you log time, check running timers, and manage time entries directly from Claude.

## Installation

1. Download `moodle-clockify.mcpb` from the [latest release](../../releases/latest)
2. Open the file — Claude Desktop will prompt you to install it
3. Enter your Clockify credentials when prompted (see below)

Supported on **macOS** and **Windows**.

> **Security prompt:** During installation, Claude Desktop will warn that "developer information has not been verified by Anthropic." This is shown for all third-party extensions — Anthropic doesn't yet offer a developer verification programme. This extension is built and maintained by the Moodle team; you can review the full source in this repository.

## Getting your Clockify credentials

You'll need two things: an **API Key** and your **Workspace ID**.

### API Key

1. Log in to [app.clockify.me](https://app.clockify.me)
2. Click your avatar (top right) → **Profile Settings**
3. Scroll to the **API** section at the bottom
4. Click **Generate** if you don't have a key, then copy it

### Workspace ID

1. In Clockify, go to **Settings** → **General**
2. Your Workspace ID is shown near the top of the page
3. It's also visible in your browser URL: `app.clockify.me/workspaces/WORKSPACE_ID/...`

## What you can do

Once installed, you can ask Claude things like:

- *"Start a timer for the team meeting"*
- *"What have I logged today?"*
- *"Stop my running timer"*
- *"Log 2 hours on the Documentation project"*

## Source

Built on top of [clockify-master-mcp](https://github.com/tallthom/clockify-master-mcp), a fork of [@hongkongkiwi/clockify-master-mcp](https://github.com/hongkongkiwi/clockify-master-mcp) with pagination and timezone fixes applied.
