import yfinance as yf
import mplfinance as mpf
import pandas as pd
import numpy as np
from alphatrend import alphatrend
from patterns import detect_outside_bars

def main():
    print("Fetching data...")
    # Fetch data
    ticker = "AAPL"
    df = yf.download(ticker, start="2024-01-01", end="2025-01-01")
    
    if df.empty:
        print("No data fetched.")
        return

    # yfinance returns MultiIndex columns in recent versions (Ticker, Price Type), we need to flatten it or access correctly
    # Check if columns are MultiIndex
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.droplevel(1) # Drop ticker level usually
    
    # Ensure index is DatetimeIndex
    df.index = pd.to_datetime(df.index)

    print("Calculating AlphaTrend...")
    # Calculate AlphaTrend
    # Parameters from Pine Script default: coeff=1, AP=14
    df = alphatrend(df, coeff=1, ap=14)

    print("Detecting Outside Bars...")
    df = detect_outside_bars(df)
    
    # Prepare plots
    print("Preparing plot...")
    
    # Filter out initial NaN values for plotting if necessary, but mplfinance handles it well usually.
    # We focus on the last 100 candles for better visibility
    plot_df = df.iloc[-100:]
    
    apds = []
    
    # Add AlphaTrend line
    apds.append(mpf.make_addplot(plot_df['AlphaTrend'], color='blue', width=1.5))
    
    # Add AlphaTrend Lag 2 line (optional, but part of logic)
    # apds.append(mpf.make_addplot(plot_df['AlphaTrend_Shift2'], color='red', width=1.5))
    
    # Add Buy Signals
    # Create a series with NaN everywhere except where Buy_Signal is True
    buy_signals = plot_df['AlphaTrend'].copy()
    buy_signals[:] = np.nan
    buy_signals[plot_df['Buy_Signal']] = plot_df['Low'][plot_df['Buy_Signal']] * 0.99
    
    if not buy_signals.isna().all():
        apds.append(mpf.make_addplot(buy_signals, type='scatter', markersize=100, marker='^', color='green'))

    # Add Sell Signals
    sell_signals = plot_df['AlphaTrend'].copy()
    sell_signals[:] = np.nan
    sell_signals[plot_df['Sell_Signal']] = plot_df['High'][plot_df['Sell_Signal']] * 1.01

    if not sell_signals.isna().all():
        apds.append(mpf.make_addplot(sell_signals, type='scatter', markersize=100, marker='v', color='red'))

    # Add Bullish Outside Bar Markers
    bull_outside = plot_df['AlphaTrend'].copy()
    bull_outside[:] = np.nan
    # Place marker below low
    bull_outside[plot_df['Bullish_Outside']] = plot_df['Low'][plot_df['Bullish_Outside']] * 0.98 
    
    if not bull_outside.isna().all():
        # Marker 'o' (circle) in Cyan for Bullish Outside
        apds.append(mpf.make_addplot(bull_outside, type='scatter', markersize=50, marker='o', color='cyan', label='Bullish Outside'))

    # Add Bearish Outside Bar Markers
    bear_outside = plot_df['AlphaTrend'].copy()
    bear_outside[:] = np.nan
    # Place marker above high
    bear_outside[plot_df['Bearish_Outside']] = plot_df['High'][plot_df['Bearish_Outside']] * 1.02
    
    if not bear_outside.isna().all():
        # Marker 'o' (circle) in Magenta for Bearish Outside
        apds.append(mpf.make_addplot(bear_outside, type='scatter', markersize=50, marker='o', color='magenta', label='Bearish Outside'))

    # Plot
    mpf.plot(
        plot_df,
        type='candle',
        style='yahoo',
        title=f'{ticker} AlphaTrend',
        ylabel='Price',
        addplot=apds,
        volume=True,
        savefig='alphatrend_chart.png'
    )
    print("Plot generated and saved to alphatrend_chart.png")

if __name__ == "__main__":
    main()
