# ChronoBot

An AI tool to help visualize, investigate, and understand history.

See [CONCEPT.md](CONCEPT.md) for the full product concept — a conversational Histomap: an interactive synchronoptic chart where a map anchors space, lanes rise through time, and an AI copilot curates, explains, and reshapes the view.

A thin interactive prototype of the canvas lives at [`prototype/canvas.html`](prototype/canvas.html) — a single self-contained HTML file; open it in any browser.

The dataset is canonical in [`data/`](data/) (event pool, lanes-as-queries, taxonomy), governed by the [significance rubric](docs/significance-rubric.md). After editing data, run `node prototype/build.mjs` to validate it and re-inline it into the prototype.

To use the **copilot chat** (the conversational canvas controller), run the dev server:

```sh
npm install
cp .env.example .env   # then paste your DeepInfra token into DEEPINFRA_TOKEN
node server.mjs
# open http://localhost:8437
```

Inference runs on [DeepInfra](https://deepinfra.com), whose Anthropic-compatible Messages endpoint lets the server keep using `@anthropic-ai/sdk` against a DeepInfra model id. The copilot (DeepSeek V4 Flash by default — $0.09/$0.18 per MTok, 1M-token context; set `CHRONOBOT_MODEL` to any DeepInfra model id to swap it, or `CHRONOBOT_BASE_URL` to point at another Anthropic-compatible provider) sees the current view state and the full dataset, answers history questions (streamed live into the panel), and drives the canvas through tools: zoom to an era, move the time ruler, filter themes, highlight the events it discusses, draw cross-lane threads — curated chains like the written word or the Mongol world (`data/threads.json`), or dashed ad-hoc connections it composes while narrating — and split a lane into its sub-regions (Americas → North America · Mesoamerica · Andes; likewise Africa and East Asia) to compare developments within a continent — each action animates on the canvas. The dataset itself is curator-maintained; the copilot reads it but cannot write it. Click an event on the canvas to talk about it. Without the server, the canvas works fully; only the chat is offline.

**MCP App variant (parked):** ChronoBot is also an MCP server — the same canvas renders *inside* an MCP Apps-capable host (Claude Desktop, claude.ai, VS Code), which supplies the model, sessions, and its own knowledge tools alongside ChronoBot's view tools. The 2026-08-15 feel-test verdict: hosts render each tool call as a separate embedded snapshot, so this works as a distribution channel but not as the primary UX — the app ends up inside the chat rather than the chat inside the app (see [docs/specs/mcp-app.md](docs/specs/mcp-app.md)). It still runs with `npm run mcp` (stdio). Claude Desktop config (Windows + WSL):

```json
{
  "mcpServers": {
    "chronobot": {
      "command": "wsl.exe",
      "args": [
        "/home/lambdakris/.nvm/versions/node/v22.14.0/bin/node",
        "/home/lambdakris/source/chronobot/mcp-server.mjs"
      ]
    }
  }
}
```

(The config file lives at `%APPDATA%\Claude\claude_desktop_config.json` — or in the app: Settings → Developer → Edit Config. Note the absolute node path: nvm-managed node isn't on `wsl.exe`'s non-interactive PATH. If you upgrade node via nvm, update this path.)

Then ask Claude to "show the ChronoBot canvas". The custom variant above is canonical; a CopilotKit-based harness (Variant C) is the planned path to a first-class app with an embedded copilot — see [BACKLOG.md](BACKLOG.md).

How generation works, and the working method (spec-first, diagrams, invariants), is documented in [docs/architecture.md](docs/architecture.md) and [CLAUDE.md](CLAUDE.md).