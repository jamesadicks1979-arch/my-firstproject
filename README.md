# Pocket Caddy (Web MVP)

Pocket Caddy is a first web version of a golf caddy app.

## What it does

- Lets a player create a profile with:
  - Name
  - Handicap
  - Strengths
  - Weaknesses
  - Club-by-club distances (yards)
- Lets the player enter course details:
  - Course name
  - Tee color
  - Hole yardages (9 or 18 holes)
- Builds a yardage chart table and gives club suggestions from saved distances.

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

- `index.html` - app layout
- `styles.css` - styling
- `script.js` - app logic and local storage