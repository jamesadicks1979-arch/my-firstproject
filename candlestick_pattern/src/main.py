import yfinance as yf
import mplfinance as mpf
import pandas as pd
import numpy as np
from alphatrend import alphatrend
from patterns import detect_outside_bars

def main():
    print("Fetching data...")
    # Fetch data (use 1H data to simulate lower timeframe, but allow resampling to 4H, Daily, Weekly)
    # yfinance limits: 1h data is only available for 730 days.
    ticker = "AAPL"
    df = yf.download(ticker, start="2024-01-01", end="2025-01-01", interval="1h")
    
    if df.empty:
        print("No data fetched.")
        return

    # yfinance returns MultiIndex columns in recent versions (Ticker, Price Type), we need to flatten it or access correctly
    # Check if columns are MultiIndex
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.droplevel(1) # Drop ticker level usually
    
    # Ensure index is DatetimeIndex
    df.index = pd.to_datetime(df.index)

    print("Calculating Multi-Timeframe AlphaTrend...")

    # --- Resample Function Helper ---
    def calculate_mtf(resample_rule, prefix):
        # Resample logic
        # 'agg' dictionary to define how to aggregate OHLCV
        ohlc_dict = {
            'Open': 'first',
            'High': 'max',
            'Low': 'min',
            'Close': 'last',
            'Volume': 'sum'
        }
        
        # Resample
        resampled_df = df.resample(resample_rule).agg(ohlc_dict).dropna()
        
        # Calculate AlphaTrend on resampled data
        resampled_df = alphatrend(resampled_df, coeff=1, ap=14, prefix=prefix)
        
        # Reindex back to original timeframe (forward fill) using asof or merge_asof logic or simply reindex/ffill
        # Ideally, we map the higher timeframe value to the bars that fall within it.
        # We use reindex and ffill to propagate the higher timeframe value forward to lower timeframe bars.
        
        # Select only relevant columns to merge back
        cols_to_merge = [c for c in resampled_df.columns if c.startswith(prefix)]
        subset = resampled_df[cols_to_merge]
        
        # Merge back:
        # We need to reindex to the original index. 'method=ffill' propagates the last valid observation forward.
        aligned_df = subset.reindex(df.index, method='ffill')
        
        return aligned_df

    # --- Calculate for different Timeframes ---
    
    # 1. 2D (Default, Main Plot)
    # '2D' rule might not be standard in pandas aliases like '2D'. It's '2D'.
    mtf_2d = calculate_mtf('2D', '2D_')
    
    # 2. Weekly
    mtf_weekly = calculate_mtf('W', 'Weekly_')
    
    # 3. Daily
    mtf_daily = calculate_mtf('D', 'Daily_')
    
    # 4. 4H (4 hours)
    mtf_4h = calculate_mtf('4h', '4H_')

    # Concatenate all results
    df = pd.concat([df, mtf_2d, mtf_weekly, mtf_daily, mtf_4h], axis=1)

    # --- Detect Outside Bars (Using 2D Data as per request for main pattern overlay) ---
    # We need to run pattern detection on the *resampled* 2D data first, then map it back.
    # Actually, simpler: resample 2D again specifically for patterns if not included in alphatrend function.
    # The 'alphatrend' function doesn't detect outside bars, 'detect_outside_bars' does.
    
    # Create a temporary 2D dataframe for pattern detection
    df_2d_resampled = df.resample('2D').agg({'Open': 'first', 'High': 'max', 'Low': 'min', 'Close': 'last', 'Volume': 'sum'}).dropna()
    df_2d_resampled = detect_outside_bars(df_2d_resampled)
    
    # Rename pattern columns to avoid collision if we ran it on main df
    df_2d_resampled = df_2d_resampled.rename(columns={'Bullish_Outside': '2D_Bullish_Outside', 'Bearish_Outside': '2D_Bearish_Outside'})
    
    # Merge patterns back
    patterns_subset = df_2d_resampled[['2D_Bullish_Outside', '2D_Bearish_Outside']]
    # For patterns, we only want to show them once or propagate? 
    # Usually patterns are valid for the duration. ffill works to show it persists until next bar.
    patterns_aligned = patterns_subset.reindex(df.index, method='ffill')
    
    df = pd.concat([df, patterns_aligned], axis=1)
    
    # Prepare plots
    print("Preparing plot...")
    
    # Filter out initial NaN values for plotting if necessary, but mplfinance handles it well usually.
    # We focus on the last 500 candles of 1H data to see details
    plot_df = df.iloc[-200:]
    
    apds = []
    
    # Helper to add plots if column exists
    def add_at_plot_with_fill(prefix, line_color, lag_color):
        at_col = f'{prefix}AlphaTrend'
        lag_col = f'{prefix}AlphaTrend_Shift2'
        
        if at_col in plot_df.columns and lag_col in plot_df.columns:
            # Main Line + Bull Fill (Green)
            # fill_between: y1 is the plot values (AT), y2 needs to be specified (Lag)
            apds.append(mpf.make_addplot(
                plot_df[at_col], 
                color=line_color, 
                width=1.5,
                fill_between=dict(
                    y1=plot_df[at_col].values, 
                    y2=plot_df[lag_col].values, 
                    where=plot_df[at_col].values > plot_df[lag_col].values, 
                    color='green', 
                    alpha=0.2
                )
            ))
            
            # Lag Line + Bear Fill (Red)
            # We plot the lag line separately
            apds.append(mpf.make_addplot(
                plot_df[lag_col], 
                color=lag_color, 
                width=1.0,
                fill_between=dict(
                    y1=plot_df[at_col].values, 
                    y2=plot_df[lag_col].values, 
                    where=plot_df[at_col].values < plot_df[lag_col].values, 
                    color='red', 
                    alpha=0.2
                )
            ))

    # Add AlphaTrends with Fills and Distinct Colors
    add_at_plot_with_fill('2D_', 'blue', 'darkblue')     # 2D: Blue
    add_at_plot_with_fill('Weekly_', 'purple', 'indigo') # Weekly: Purple
    add_at_plot_with_fill('Daily_', 'orange', '#CC5500') # Daily: Orange (Burnt Orange for lag)
    add_at_plot_with_fill('4H_', 'gray', 'black')        # 4H: Gray
    
    # Add 2D Outside Bar Markers
    # Since we have boolean columns '2D_Bullish_Outside', we need to map them to price levels
    
    # Bullish
    bull_mask = plot_df['2D_Bullish_Outside'].fillna(False).astype(bool)
    # To avoid plotting a marker on every single 1H bar that constitutes the 2D bar, 
    # we ideally want to plot it only when the 2D bar *changes* or starts.
    # We can detect change in the '2D_AlphaTrend' or the resampled index?
    # Simpler: Plot on every bar (continuous line of dots) or just check for change.
    
    # Let's verify change in the 2D boolean signal to act as a trigger, OR plot continuously as requested "locked".
    # Plotting continuously emphasizes the "locked" state.
    
    bull_markers = plot_df['2D_AlphaTrend'].copy() # Dummy series
    bull_markers[:] = np.nan
    # Use the 1H Low for placement, or better, the *2D Low* if we had propagated it.
    # Using 1H Low is fine for visual proximity.
    bull_markers[bull_mask] = plot_df['Low'][bull_mask] * 0.98
    
    if not bull_markers.isna().all():
        apds.append(mpf.make_addplot(bull_markers, type='scatter', markersize=20, marker='o', color='cyan', label='2D Bull Outside'))
        
    # Bearish
    bear_mask = plot_df['2D_Bearish_Outside'].fillna(False).astype(bool)
    bear_markers = plot_df['2D_AlphaTrend'].copy()
    bear_markers[:] = np.nan
    bear_markers[bear_mask] = plot_df['High'][bear_mask] * 1.02
    
    if not bear_markers.isna().all():
        apds.append(mpf.make_addplot(bear_markers, type='scatter', markersize=20, marker='o', color='magenta', label='2D Bear Outside'))

    # Plot
    mpf.plot(
        plot_df,
        type='candle',
        style='yahoo',
        title=f'{ticker} Multi-Timeframe AlphaTrend (Base: 1H)',
        ylabel='Price',
        addplot=apds,
        volume=True,
        savefig='alphatrend_chart.png'
    )
    print("Plot generated and saved to alphatrend_chart.png")

if __name__ == "__main__":
    main()
