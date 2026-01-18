import unittest

from trend_follow import simple_moving_average, trend_follow


class TestSimpleMovingAverage(unittest.TestCase):
    def test_sma_basic(self) -> None:
        values = [1.0, 2.0, 3.0, 4.0]
        expected = [None, None, 2.0, 3.0]
        self.assertEqual(simple_moving_average(values, 3), expected)

    def test_sma_window_error(self) -> None:
        with self.assertRaises(ValueError):
            simple_moving_average([1.0, 2.0], 0)


class TestTrendFollow(unittest.TestCase):
    def test_trend_follow_signals(self) -> None:
        prices = [1.0, 2.0, 3.0, 4.0, 5.0, 4.0, 3.0, 2.0, 1.0]
        signals = trend_follow(prices, fast_window=2, slow_window=3)

        self.assertEqual(signals[0].signal, "flat")
        self.assertEqual(signals[2].signal, "long")
        self.assertEqual(signals[-1].signal, "short")

    def test_trend_follow_window_error(self) -> None:
        with self.assertRaises(ValueError):
            trend_follow([1.0, 2.0, 3.0], fast_window=3, slow_window=3)


if __name__ == "__main__":
    unittest.main()
