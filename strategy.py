class TradingStrategy:
    def __init__(self):
        self.position = None  # 'LONG', 'SHORT', or None

    def evaluate(self, candles, bands):
        """
        candles: list of dicts with 'close', 'high', 'low', 'cover_sell', 'per_signal'
        bands: list of dicts with 'upper', 'lower'
        """
        signals = []
        
        # We need at least 2 candles to check "previous" (the signal candle) and "current" (the execution candle)
        for i in range(1, len(candles)):
            current_candle = candles[i]
            prev_candle = candles[i-1]
            prev_band = bands[i-1]
            
            # Sell Logic
            # Condition: The PREVIOUS candle had a 'cover_sell' signal
            # AND (Previous High > Upper Band OR Previous Close > Upper Band)
            # Action: Sell on the CURRENT candle (next candle after signal)
            
            prev_has_cover_sell = prev_candle.get('cover_sell', False)
            prev_broke_upper = (prev_candle['high'] > prev_band['upper']) or (prev_candle['close'] > prev_band['upper'])
            
            if prev_has_cover_sell and prev_broke_upper:
                print(f"Time {i}: SELL SIGNAL (Prev Candle: High {prev_candle['high']}/Close {prev_candle['close']} > Upper Band {prev_band['upper']}, Cover Sell: {prev_has_cover_sell})")
                signals.append({'time': i, 'type': 'SELL', 'price': current_candle['close']})
                self.position = 'SHORT'
                
            # Buy Logic
            # Condition: The PREVIOUS candle had a 'per_signal'
            # AND (Previous Low < Lower Band OR Previous Close < Lower Band)
            # Action: Buy on the CURRENT candle (next candle after signal)
            
            prev_has_per_signal = prev_candle.get('per_signal', False)
            prev_broke_lower = (prev_candle['low'] < prev_band['lower']) or (prev_candle['close'] < prev_band['lower'])
            
            if prev_has_per_signal and prev_broke_lower:
                print(f"Time {i}: BUY SIGNAL (Prev Candle: Low {prev_candle['low']}/Close {prev_candle['close']} < Lower Band {prev_band['lower']}, Per Signal: {prev_has_per_signal})")
                signals.append({'time': i, 'type': 'BUY', 'price': current_candle['close']})
                self.position = 'LONG'
        
        return signals

def run_strategy():
    # Mock data
    # 0: Normal
    # 1: Cover Sell Signal + High > Upper Band (103 > 102) -> Should trigger Sell at 2
    # 2: Execution of Sell
    # 3: Normal
    # 4: Per Signal + Low < Lower Band (97 < 98) -> Should trigger Buy at 5
    # 5: Execution of Buy
    
    candles = [
        {'close': 100, 'high': 101, 'low': 99, 'cover_sell': False, 'per_signal': False},
        
        # Candle 1: Cover Sell + High breaks band
        {'close': 101, 'high': 103, 'low': 100, 'cover_sell': True, 'per_signal': False}, 
        
        # Candle 2: Execution
        {'close': 100, 'high': 101, 'low': 99, 'cover_sell': False, 'per_signal': False},
        
        {'close': 100, 'high': 101, 'low': 99, 'cover_sell': False, 'per_signal': False},
        
        # Candle 4: Per Signal + Low breaks band
        {'close': 99, 'high': 100, 'low': 97, 'cover_sell': False, 'per_signal': True},
        
        # Candle 5: Execution
        {'close': 96, 'high': 97, 'low': 95, 'cover_sell': False, 'per_signal': False}, 
    ]
    bands = [
        {'upper': 102, 'lower': 98},
        {'upper': 102, 'lower': 98}, # Candle 1 compares to this band (High 103 > 102)
        {'upper': 102, 'lower': 98},
        {'upper': 102, 'lower': 98},
        {'upper': 102, 'lower': 98}, # Candle 4 compares to this band (Low 97 < 98)
        {'upper': 102, 'lower': 98},
    ]
    
    print("Running Strategy...")
    strategy = TradingStrategy()
    results = strategy.evaluate(candles, bands)
    print("Signals generated:", results)

if __name__ == "__main__":
    run_strategy()
