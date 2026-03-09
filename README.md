# Pocket Caddy (Wentworth West Web App)

Pocket Caddy is a web version of a golf caddy app focused on one famous course first: **Wentworth West**.

## What it does

- Lets a player create a profile with:
  - Name
  - Handicap
  - Strengths
  - Weaknesses
  - Club-by-club distances (yards)
- Includes a dedicated 18-hole Wentworth West strategy guide.
- Shows each hole like a full caddie page with:
  - Best side to miss the fairway
  - Best side/length to miss the green (short/long/left/right)
  - Hole notes for safer scoring decisions
- Adds two shot-plan buttons on each hole page:
  - **Aggressive**: driver line + approach club into green
  - **Safe**: 4-iron line + approach club into green
  - Visual shot map with dots and line (tee -> landing -> green)
- Includes a strategy chart table for all 18 holes.
- Gives club suggestions from the player profile distances.

## Run it locally

No build tools are needed.

1. Open `index.html` in your browser
   **or**
2. Serve it quickly:
   ```bash
   python -m http.server 8080
   ```
   Then visit `http://localhost:8080`.

## Files

- `index.html` - profile + Wentworth West hole pages
- `styles.css` - styling for caddie layout
- `script.js` - player profile logic, hole strategy data, and club recommendations