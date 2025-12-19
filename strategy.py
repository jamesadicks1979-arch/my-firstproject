class TradingStrategy:
    def __init__(self):
        self.position = None  # 'LONG', 'SHORT', or None

    def evaluate(self, candles, bands):
        """
        candles: list of dicts with 'close', 'cover_sell', 'per_signal'
        bands: list of dicts with 'upper', 'lower'
        """
        signals = []
        
        # We need at least 2 candles to check "previous" and "current"
        for i in range(1, len(candles)):
            current_candle = candles[i]
            prev_candle = candles[i-1]
            prev_band = bands[i-1]
            
            # Sell Logic
            # Condition: Price went above band previously, and we have a cover sell now
            was_above_band = prev_candle['close'] > prev_band['upper']
            has_cover_sell = current_candle.get('cover_sell', False)
            
            if was_above_band and has_cover_sell:
                print(f"Time {i}: SELL SIGNAL (Price was {prev_candle['close']} > Upper Band {prev_band['upper']}, Cover Sell: {has_cover_sell})")
                signals.append({'time': i, 'type': 'SELL', 'price': current_candle['close']})
                self.position = 'SHORT'
                
            # Buy Logic
            # Condition: Price went below band previously, and we get a "per" signal now
            was_below_band = prev_candle['close'] < prev_band['lower']
            has_per_signal = current_candle.get('per_signal', False)
            
            if was_below_band and has_per_signal:
                print(f"Time {i}: BUY SIGNAL (Price was {prev_candle['close']} < Lower Band {prev_band['lower']}, Per Signal: {has_per_signal})")
                signals.append({'time': i, 'type': 'BUY', 'price': current_candle['close']})
                self.position = 'LONG'
        
        return signals

def run_strategy():
    # Mock data
    # 0: Normal
    # 1: Goes Above Upper Band (105 > 102)
    # 2: Cover Sell Signal -> Should Sell
    # 3: Normal
    # 4: Goes Below Lower Band (95 < 98)
    # 5: Per Signal -> Should Buy
    
    candles = [
        {'close': 100, 'cover_sell': False, 'per_signal': False},
        {'close': 105, 'cover_sell': False, 'per_signal': False},  # Above 102
        {'close': 104, 'cover_sell': True,  'per_signal': False},  # Cover Sell trigger
        {'close': 100, 'cover_sell': False, 'per_signal': False},
        {'close': 95,  'cover_sell': False, 'per_signal': False},  # Below 98
        {'close': 96,  'cover_sell': False, 'per_signal': True},   # Per trigger
    ]
    bands = [
        {'upper': 102, 'lower': 98},
        {'upper': 102, 'lower': 98},
        {'upper': 102, 'lower': 98},
        {'upper': 102, 'lower': 98},
        {'upper': 102, 'lower': 98},
        {'upper': 102, 'lower': 98},
    ]
    
    print("Running Strategy...")
    strategy = TradingStrategy()
    results = strategy.evaluate(candles, bands)
    print("Signals generated:", results)

if __name__ == "__main__":
    run_strategy()
