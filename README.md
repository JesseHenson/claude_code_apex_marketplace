# Claude Code Apex Marketplace

Private marketplace for Claude Code plugins targeting MCP marketplaces (Apify, MCPrize, etc).

## Structure

```
claude_code_apex_marketplace/
├── .claude-plugin/
│   └── marketplace.json      # Marketplace metadata
├── README.md
└── plugins/
    └── <plugin-name>/
        ├── .claude-plugin/
        │   └── plugin.json   # Plugin metadata
        ├── README.md
        ├── CHANGELOG.md
        ├── commands/         # Slash commands (*.md)
        ├── skills/           # Skills (SKILL.md in subdirs)
        ├── agents/           # Agent definitions (*.md)
        └── hooks/            # Lifecycle hooks (*.sh)
```

## Installation

```bash
# Add marketplace to Claude Code
claude plugin marketplace add JesseHenson/claude_code_apex_marketplace

# Or for local development
claude plugin marketplace add --path /path/to/claude_code_apex_marketplace
```

## Creating a New Plugin

1. Create plugin directory: `plugins/<plugin-name>/`
2. Add `plugin.json` in `.claude-plugin/`
3. Add commands, skills, agents, or hooks as needed
4. Register in `marketplace.json`

## Plugins

*No plugins yet. Add your first plugin!*
