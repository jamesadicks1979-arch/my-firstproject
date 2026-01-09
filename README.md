# Pine Script Starter Kit (TradingView, v5)

This repo contains **clean, from-scratch Pine Script v5 templates** you can copy into TradingView:

- `pinescript/StarterIndicator.pine`: indicator template (signals, plots, alerts)
- `pinescript/StarterStrategy.pine`: strategy template (entries/exits, risk, optional filters)

## How to use

1. Open TradingView → **Pine Editor**
2. Copy/paste either file into the editor
3. Click **Add to chart**

## What to customize first

- **Inputs**: symbol/session/timeframe assumptions, lengths, thresholds
- **Signals**: replace the example MA crossover logic with your own
- **Alerts**: adjust the `alertcondition()` messages
- **Strategy risk** (strategy file): position sizing, stops, take profit, trailing

## Notes

- These scripts are Pine v5 (`//@version=5`).
- If you want this starter kit to match a specific style (ICT/SMC, VWAP bands, ORB, mean reversion, etc.), tell me what you’re building and I’ll tailor the templates.