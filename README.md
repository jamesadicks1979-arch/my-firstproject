# my-firstproject

This repo contains a TradingView Pine Script v5 indicator:

- `alphatrend_4h_prev_candle_fib_buy_window.pine`

## How to use (TradingView)

1. Open TradingView → **Pine Editor**
2. Create a new script
3. Paste in the contents of `alphatrend_4h_prev_candle_fib_buy_window.pine`
4. Click **Add to chart**

## What it does

- **AlphaTrend (locked MTF)**: 4H / Daily / Weekly / (optional) 1H AlphaTrend lines using fixed timeframes, so they stay “locked” when you change the chart timeframe.
- **Nadaraya-Watson Envelope (LuxAlgo-style)**: optional envelope with repainting/non-repainting modes.
- **4BAND Pivot Bands**: optional pivot band plots (with an “AlphaTrend alignment” gate).
- **Fib buy logic**: when AlphaTrends are aligned, detects a dip below NWE lower band or 4BAND support, then reclaim, then tracks the 50% retracement and marks a hit.

## License / attribution

The script header indicates **MPL-2.0** and includes attribution comments in-file.