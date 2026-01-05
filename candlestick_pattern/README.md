# Candlestick Pattern Recognition & AlphaTrend

This project analyzes financial data to identify candlestick patterns and technical indicators.

Currently, it implements the **AlphaTrend** indicator and **Outside Bar** pattern detection.

## Features

- **AlphaTrend Indicator** (originally by KivancOzbilgic):
  - Calculates AlphaTrend using RSI or MFI.
  - Generates Buy and Sell signals based on crossovers.
  
- **Candlestick Pattern Detection**:
  - **Outside Bars**: Detects bars that engulf the previous bar's range.
    - **Bullish Outside**: Outside Bar + Green Close (Cyan circle below).
    - **Bearish Outside**: Outside Bar + Red Close (Magenta circle above).

- **Visualization**:
  - Uses `mplfinance` to generate candlestick charts.
  - Overlays AlphaTrend line and signal markers.
  - Marks detected Outside Bars.
  - Saves the output chart to `alphatrend_chart.png`.

## Project Structure

- `src/main.py`: Main Python script to run the analysis and visualization.
- `src/alphatrend.py`: Python implementation of the AlphaTrend logic.
- `src/patterns.py`: Logic for detecting candlestick patterns (e.g., Outside Bars).
- `src/alphatrend.pine`: **Pine Script** source code for use in TradingView.

## Which file should I use?

| Platform | File to Use | Action |
|----------|-------------|--------|
| **TradingView** | `src/alphatrend.pine` | Copy/Paste content into Pine Editor (Includes AlphaTrend + Outside Bars) |
| **Local Python** | `src/main.py` | Run via terminal (see below) |

## Setup & Usage (Python)

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the main script:**
   ```bash
   PYTHONPATH=candlestick_pattern/src python3 candlestick_pattern/src/main.py
   ```

   This will generate `alphatrend_chart.png` in your workspace.

## Usage (TradingView)

If you want to use the indicator in TradingView:
1. Open the file `candlestick_pattern/src/alphatrend.pine` in the explorer on the left.
2. Copy the entire content of that file.
3. Go to TradingView, open the Pine Editor, and paste the code there.
