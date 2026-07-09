# My Virtual Office Node.js

A Node.js recreation of the original `eliautobot/my-virtual-office` browser experience.

This version keeps the core virtual-office loop in a compact Node app:

- Express server and static browser client
- WebSocket activity updates
- Persisted office layout in `data/office-config.json`
- Canvas-rendered pixel office seeded from the original default layout
- Wandering agents, branch dashboard, activity log, chat panel, office pet, and edit mode

## Run

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Controls

- Drag empty canvas space to pan.
- Mouse wheel zooms around the pointer.
- Click an agent to open chat.
- Toggle **Edit Office**, choose a furniture type, click to place, drag items to move, then save.

## Attribution

This is a Node.js recreation inspired by and seeded from the default office layout in:

`https://github.com/eliautobot/my-virtual-office`

The original project is licensed under GPL-3.0; this repository includes the GPL-3.0 license.
