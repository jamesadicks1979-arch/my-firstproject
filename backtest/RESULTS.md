# 2D Rejection Candle System: backtest results

The script `rejection_2d.py` rebuilds the Pine strategy in Python. It uses the same rules: next-bar-open entry, wick stop, a 4R target, and a move to breakeven once 2R is tagged. Fills follow TradingView's intrabar rules. Results are in R.

**Data:** Yahoo continuous front-month futures. Daily bars are grouped in pairs to make 2D bars.

| Market | Ticker | Period | 2D bars |
|---|---|---|---|
| Gold | GC=F | Aug 2000 – Oct 2026 | ~2,690 |
| Brent | BZ=F | Jul 2007 – Oct 2026 | ~2,320 |

**Costs:** each trade is charged a round-trip cost of $0.40/oz on gold and $0.04/bbl on Brent.

**2D anchor:** 2D bars can start on either of two days. I tested both ("off0" and "off1"), because the results change a lot depending on which one you use.

## Base system (exactly as coded)

| | Trades | Win % | Scratch % | Exp R/trade | Exp after costs | PF | Max DD (R) |
|---|---|---|---|---|---|---|---|
| Gold off0 | 226 | 19.9 | 13.7 | +0.12 | +0.07 | 1.17 | 17 |
| Gold off1 | 219 | 21.5 | 16.0 | +0.26 | +0.22 | 1.39 | 17 |
| Brent off0 | 220 | 14.5 | 14.5 | −0.13 | −0.15 | 0.83 | 50 |
| Brent off1 | 201 | 14.9 | 16.4 | −0.02 | −0.07 | 0.98 | 30 |

That works out to roughly 9–11 trades a year per market.

### Longs vs shorts (off0, no costs)

| | Longs | Shorts |
|---|---|---|
| Gold | +0.47R (n=114) | −0.24R (n=112) |
| Brent | +0.10R (n=109) | −0.35R (n=111) |

**Shorts lose money on both markets.** All of the system's edge comes from the long side.

### Gold's longs are mostly drift

A dumb benchmark buys any 2D open and holds it for 5 bars. With risk sized at 0.75 × ATR, it averages **+0.39R per trade** on gold. The rejection-candle longs average +0.42–0.51R. So the pattern adds very little on top of gold's 26-year bull market. On Brent the same benchmark makes +0.07R.

## Target and scratch (off0, no costs)

| Target | Scratch | Gold exp | Brent exp |
|---|---|---|---|
| 2R | off | +0.03 | −0.06 |
| 4R | off | **+0.15** | **+0.06** |
| 4R | at 2R (current) | +0.12 | −0.13 |
| 6R | off | +0.35 | +0.39 (but −0.18 on off1) |

- **The 2R scratch hurts.** It turns some trades that would have hit 4R into 0R exits. That costs more than it saves.
- **Smaller targets are worse.** Below 3R the win rate rises, but not by enough to make up for the smaller wins.

## Filters (4R target, 2R scratch, off0 → off1)

| Filter | Gold | Brent |
|---|---|---|
| None (base) | +0.12 → +0.26 | −0.13 → −0.02 |
| Trend: close vs 2D EMA50 | **+0.33 → +0.31** | −0.07 → +0.10 |
| Trend: close vs 2D EMA20 | +0.21 → +0.22 | **+0.12 → +0.11** |
| Sweep must be a 10-bar high/low | −0.11 → +0.27 | −0.16 → −0.19 |
| Close in the far half of the candle | +0.15 → +0.33 | −0.14 → +0.03 |
| Risk ≥ 0.5 ATR | +0.07 → +0.25 | −0.18 → +0.13 |
| 10-bar time stop | +0.10 → +0.30 | −0.16 → +0.07 |

- **The trend filter helps on both markets and both anchors.** Take longs only above the EMA and shorts only below it.
- **None of the other filters helped consistently.**

## Best candidates (with costs)

| Variant | Gold off0 / off1 | Brent off0 / off1 |
|---|---|---|
| Trend EMA50, 4R, no scratch | +0.29 / +0.34 (t≈1.6) | −0.02 / +0.14 |
| Trend EMA50, 4R, no scratch, **longs only** | +0.51 / +0.50 (t≈2.0) | +0.36 / +0.28 (t≈1.0–1.4) |
| Trend EMA20, 4R, no scratch, longs only | +0.39 / +0.48 | +0.60 / +0.25 |

**Statistical caution:** the t-stats sit around 1–2.5 across ~60–150 trades. That is suggestive, not proof. Gold's best result is also close to its buy-and-hold drift.

## Bottom line

**Gold:**
- The base system is slightly positive.
- Its edge is mostly long-side bull-market drift.
- Adding a trend filter and dropping the 2R scratch improves it in a way that holds up on both anchors.

**Brent:**
- The base system as written loses money.
- Shorts are the main drain.
- Nothing I tested turned it into a robust edge. The best variants are positive but weak and inconsistent between anchors.

## Caveats

- These are Yahoo continuous futures, which carry contract-roll gaps. TradingView's `GC1!` / `UKOIL` data will differ somewhat.
- TradingView's 2D session anchoring decides which of the two anchors you get. Results differ a lot between them, which is itself a warning sign about robustness.
- Sample size is small, about 10 trades a year.
