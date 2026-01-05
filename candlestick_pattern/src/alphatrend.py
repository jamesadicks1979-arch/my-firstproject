import numpy as np
import pandas as pd
# import pandas_ta as ta  # Optional: we can implement manually if we don't want to add the dependency, but let's try to implement manually first to avoid extra installs unless needed.

def calculate_rsi(series, period=14):
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).fillna(0)
    loss = (-delta.where(delta < 0, 0)).fillna(0)
    
    avg_gain = gain.rolling(window=period, min_periods=1).mean()
    avg_loss = loss.rolling(window=period, min_periods=1).mean()
    
    # Use Wilder's smoothing if we want to match Pine Script exactly, but SMA is often close enough. 
    # Pine Script rsi uses RMA (Wilder's).
    # Let's implement Wilder's smoothing manually for better accuracy.
    avg_gain = gain.ewm(alpha=1/period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1/period, adjust=False).mean()
    
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

def calculate_mfi(high, low, close, volume, period=14):
    typical_price = (high + low + close) / 3
    raw_money_flow = typical_price * volume
    
    # Get the direction of the price change
    delta = typical_price.diff()
    
    positive_flow = np.where(delta > 0, raw_money_flow, 0)
    negative_flow = np.where(delta < 0, raw_money_flow, 0)
    
    positive_flow_series = pd.Series(positive_flow, index=close.index)
    negative_flow_series = pd.Series(negative_flow, index=close.index)
    
    mfi_pos = positive_flow_series.rolling(window=period).sum()
    mfi_neg = negative_flow_series.rolling(window=period).sum()
    
    mfi_ratio = mfi_pos / mfi_neg
    mfi = 100 - (100 / (1 + mfi_ratio))
    return mfi

def calculate_atr(high, low, close, period=14):
    tr1 = high - low
    tr2 = (high - close.shift(1)).abs()
    tr3 = (low - close.shift(1)).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    # Pine Script 'ta.sma(ta.tr, AP)' uses SMA, not RMA/Wilder's for this specific indicator based on the code provided: 'ATR = ta.sma(ta.tr, AP)'
    atr = tr.rolling(window=period).mean()
    return atr

def alphatrend(df, coeff=1, ap=14, use_volume=True, prefix=''):
    """
    Calculates the AlphaTrend indicator.
    
    Args:
        df: DataFrame with 'Open', 'High', 'Low', 'Close', 'Volume'
        coeff: Multiplier
        ap: Common Period
        use_volume: If True, uses MFI. If False, uses RSI.
        prefix: Optional prefix for output columns (e.g., 'Weekly_', 'Daily_')
    """
    # Ensure column names are correct
    high = df['High']
    low = df['Low']
    close = df['Close']
    if 'Volume' in df.columns:
        volume = df['Volume']
    else:
        volume = pd.Series(0, index=df.index)
    
    # Calculate ATR
    atr = calculate_atr(high, low, close, ap)
    
    # Calculate MFI or RSI
    if use_volume:
        # Check if Volume is available and not all zero
        if 'Volume' in df.columns and df['Volume'].sum() > 0:
            momentum_ind = calculate_mfi(high, low, close, volume, ap)
        else:
            momentum_ind = calculate_rsi(close, ap)
    else:
        momentum_ind = calculate_rsi(close, ap)
        
    upT = low - atr * coeff
    downT = high + atr * coeff
    
    alpha_trend = np.zeros(len(df))
    # We need to iterate because it depends on the previous value
    
    # Convert series to numpy arrays for faster iteration
    momentum_vals = momentum_ind.values
    upT_vals = upT.values
    downT_vals = downT.values
    
    # Initialize first value (can be NaN or close)
    if len(close) > 0:
        alpha_trend[0] = close.iloc[0] # or 0
    
    for i in range(1, len(df)):
        prev_at = alpha_trend[i-1]
        
        # Condition: (novolumedata ? ta.rsi(src, AP) >= 50 : ta.mfi(hlc3, AP) >= 50)
        # Here momentum_vals already holds the selected indicator
        is_bullish = momentum_vals[i] >= 50
        
        if np.isnan(momentum_vals[i]):
            alpha_trend[i] = prev_at # Maintain previous if NaN
            continue

        if is_bullish:
            # upT < nz(AlphaTrend[1]) ? nz(AlphaTrend[1]) : upT
            if upT_vals[i] < prev_at:
                alpha_trend[i] = prev_at
            else:
                alpha_trend[i] = upT_vals[i]
        else:
            # downT > nz(AlphaTrend[1]) ? nz(AlphaTrend[1]) : downT
            if downT_vals[i] > prev_at:
                alpha_trend[i] = prev_at
            else:
                alpha_trend[i] = downT_vals[i]
                
    at_col = f'{prefix}AlphaTrend'
    at_shift_col = f'{prefix}AlphaTrend_Shift2'
    buy_col = f'{prefix}Buy_Signal'
    sell_col = f'{prefix}Sell_Signal'

    df[at_col] = alpha_trend
    
    # Signal generation
    # buySignalk = ta.crossover(AlphaTrend, AlphaTrend[2])
    # sellSignalk = ta.crossunder(AlphaTrend, AlphaTrend[2])
    
    df[at_shift_col] = df[at_col].shift(2)
    
    # Buy Signal: AlphaTrend crosses OVER AlphaTrend[2]
    # This means: prev_AT <= prev_AT_Shift2 AND curr_AT > curr_AT_Shift2
    # Pine Script `ta.crossover(source1, source2)`: source1 crosses over source2
    # Logic: source1[1] <= source2[1] and source1 > source2
    
    df[buy_col] = (
        (df[at_col].shift(1) <= df[at_shift_col].shift(1)) & 
        (df[at_col] > df[at_shift_col])
    )
    
    df[sell_col] = (
        (df[at_col].shift(1) >= df[at_shift_col].shift(1)) & 
        (df[at_col] < df[at_shift_col])
    )
    
    return df
