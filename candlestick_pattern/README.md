# Candlestick Pattern Recognition & AlphaTrend

This project analyzes financial data to identify candlestick patterns and technical indicators.

Currently, it implements the **AlphaTrend** indicator (originally by KivancOzbilgic) in Python.

## Features

- **AlphaTrend Indicator**:
  - Calculates AlphaTrend using RSI or MFI.
  - Generates Buy and Sell signals based on crossovers.
- **Visualization**:
  - Uses `mplfinance` to generate candlestick charts.
  - Overlays AlphaTrend line and signal markers.
  - Saves the output chart to `alphatrend_chart.png`.

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the main script:**
   
   To run the script and generate the chart:
   ```bash
   PYTHONPATH=src python3 src/main.py
   ```
   
   *Note: If running from the root directory `candlestick_pattern`, use:*
   ```bash
   PYTHONPATH=candlestick_pattern/src python3 candlestick_pattern/src/main.py
   ```

## Output

The script will generate an image file named `alphatrend_chart.png` showing the stock price (default: AAPL) with the AlphaTrend indicator and Buy/Sell signals.
