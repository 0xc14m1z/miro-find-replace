# Miro Find & Replace

A Miro app that adds find and replace functionality for text across board items (sticky notes, text items, shapes).

## Current State (PoC)

Working proof of concept with basic find & replace:
- Search text across sticky notes, text items, and shapes
- Replace all or replace single item
- Case sensitive toggle
- Click result to zoom to item on the board
- Miro toast notifications for feedback

## Plan

### v1 — Core polish
- [ ] Highlight matching text in search results (bold or color)
- [ ] Show match count per item (e.g. "3 matches")
- [ ] "Replace & Find Next" button to step through matches one by one
- [ ] Keyboard shortcut to open the panel (e.g. Ctrl/Cmd+H)
- [ ] Scope search to selected items only (toggle)
- [ ] Regex mode toggle for advanced users
- [ ] Preserve HTML formatting when replacing (don't break bold/italic/links)

### v2 — UX improvements
- [ ] Highlight matched items on the board (e.g. colored border or selection)
- [ ] Undo last replace action
- [ ] Search history (recent searches dropdown)
- [ ] Live search as you type (debounced)
- [ ] Filter by item type (sticky notes only, shapes only, etc.)
- [ ] Match whole word only option

### v3 — Publish
- [ ] App icon (colored + outline SVG)
- [ ] Deploy to static hosting (Vercel / Cloudflare Pages)
- [ ] Update `sdkUri` in manifest to production URL
- [ ] Submit to Miro Marketplace

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** (dev server & build)
- **Miro Web SDK v2** (board interaction)
- **Mirotone** (UI components matching Miro's design)

## Development

```bash
npm install
npm start        # Dev server on http://localhost:3000
npm run build    # Production build to dist/
```

### Miro setup

1. Go to https://developers.miro.com → Your apps → Create new app
2. Set App URL to `http://localhost:3000`
3. Enable scopes: `boards:read`, `boards:write`
4. Install on your Developer Team
5. Open a board and find the app in the apps panel
