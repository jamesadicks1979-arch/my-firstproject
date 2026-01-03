import pandas as pd
import numpy as np

def detect_outside_bars(df):
    """
    Detects Bullish and Bearish Outside Bars.
    
    Definition:
    - Outside Bar: Current High > Previous High AND Current Low < Previous Low
    - Bullish Outside: Outside Bar AND Close > Open (Green Candle)
    - Bearish Outside: Outside Bar AND Close < Open (Red Candle)
    """
    # Create boolean masks
    # Compare current row with previous row (shift(1))
    
    prev_high = df['High'].shift(1)
    prev_low = df['Low'].shift(1)
    
    is_outside = (df['High'] > prev_high) & (df['Low'] < prev_low)
    
    is_green = df['Close'] > df['Open']
    is_red = df['Close'] < df['Open']
    
    df['Bullish_Outside'] = is_outside & is_green
    df['Bearish_Outside'] = is_outside & is_red
    
    return df
