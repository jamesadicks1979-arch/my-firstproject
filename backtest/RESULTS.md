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

## Out-of-sample check: improved rules on 18 markets

I took the improved rules (trend EMA50, longs only, no breakeven move, 4R target) and ran them unchanged on 16 more Yahoo futures markets. Every market was charged a round-trip cost of 0.04% of price.

The per-market results are in `data/markets.csv` and the yearly running totals in `data/portfolio.csv`.

| | Trades | R/trade | Total R | t-stat | Max DD (R) |
|---|---|---|---|---|---|
| All 18, improved | 1,633 | +0.148 | +242 | 2.77 | 100 |
| 16 new markets only | 1,469 | +0.115 | +169 | 2.07 | 85 |
| All 18, original rules | 4,657 | +0.014 | +66 | 0.50 | 169 |

**How many markets were positive:** 15 of 18, or 12 of 18 when the 2D bars start a day later.

**Strongest markets:**
- Platinum: +0.68R a trade
- Gold: +0.51R
- S&P 500: +0.46R
- Corn: +0.44R
- Brent: +0.36R
- Soybeans: +0.33R

**Losing markets:**
- Yen: −0.21R a trade
- Pound: −0.17R
- 10y T-note: −0.09R

**How the returns arrive:** in bursts. The strong runs were 2002–03, 2006–10, 2019–20 and 2025. The portfolio was flat-to-losing from 2011 to 2018, and 14 of the 26 years were losing years.

**Takeaway:**
- The edge survives on markets the rules weren't tuned on. That makes it more likely to be real.
- It is about a quarter of the size seen on gold and Brent.
- The combined drawdown reached about 100R, so risk around 0.25% a trade.
- At that size, expect roughly 2–3% a year with long flat periods.

## Last 4 years only (signals from Nov 2022 to Oct 2026)

The indicators were warmed up on the full history, and only trades signalled from 2022-11-01 onward are counted. Costs are 0.04% of price per round trip. Results are shown for both 2D bar alignments (off0 / off1).

| All 18 markets | Trades | R/trade | Total R | t-stat |
|---|---|---|---|---|
| Improved (trend 50, longs only, 4R, no BE) | 266 / 275 | +0.06 / +0.05 | +16.5 / +14.6 | 0.5 / 0.4 |
| Improved, both sides | 483 / 491 | −0.02 / −0.13 | −10.5 / −64.0 | −0.2 / −1.5 |
| Original | 736 / 767 | +0.06 / −0.09 | +46.0 / −69.1 | 0.8 / −1.4 |
| Original, longs only | 359 / 364 | +0.32 / +0.05 | +113.7 / +17.1 | 2.9 / 0.5 |

**Improved rules by market group (off0):**

| Group | Trades | R/trade |
|---|---|---|
| Metals | 47 | +0.70 |
| Indices | 69 | +0.21 |
| Grains | 37 | +0.19 |
| Energy | 38 | −0.33 |
| FX | 66 | −0.31 |
| Rates | 9 | −0.59 |

**Markets that were positive on both alignments:**
- Gold: +1.01 / +0.82R
- S&P 500: +0.32 / +0.57R
- Silver: +0.46 / +0.68R
- Copper: +0.40 / +1.46R

**Takeaway:**
- Over the last 4 years the system is roughly break-even overall.
- The positive result comes from metals, which were in a strong bull run, and from US indices.
- With only about 10–25 trades per market in this window, the per-market numbers are mostly noise.

## Trailing stop: 1R behind the best price once 2R is reached

All tests use the improved rules (trend EMA50, longs only). Costs are 0.04% of price per round trip. Each cell shows both 2D alignments as off0 / off1.

**What I tested:** the trail starts once price has gone 2R in your favour. From then on, the stop sits 1R behind the best price since entry. It is updated at the bar close, so the new level applies from the next bar.

### All 18 markets, full history

| Exit | R/trade | Total R | Win % | Max DD | t-stat |
|---|---|---|---|---|---|
| Fixed 4R (previous) | +0.148 / +0.142 | +242 / +233 | 24 | 100 / 111 | 2.8 |
| Trail 1R after 2R, plus 4R target | +0.133 / +0.133 | +259 / +262 | 36 | 88 / 95 | 3.4 |
| **Trail 1R after 2R, no target** | +0.147 / +0.119 | **+287** / +233 | 36 | **88** / 104 | **3.6** |
| Trail 1.5R after 2R, no target | +0.197 / +0.153 | +367 / +288 | 37 | 95 / 99 | 4.1 |

### All 18 markets, last 4 years

| Exit | R/trade | Total R | Max DD |
|---|---|---|---|
| Fixed 4R (previous) | +0.06 / +0.05 | +16 / +15 | 27 / 41 |
| **Trail 1R after 2R, no target** | **+0.15 / +0.15** | **+45 / +49** | **21 / 23** |

### What the trail changes

- **Win rate rises from 24% to 36%.** Many trades that used to reach 2R and then fall back to −1R now bank about +1R instead.
- **Trade count goes up.** Trades end sooner, which frees the system to take the next signal.
- **The last 4 years improve a lot.** Profit roughly triples and drawdown shrinks, and this holds on both alignments.
- **Over the full history, profit per trade is unchanged.** Total R rises and drawdown falls.
- **The Pine script default is now the 1R trail with no fixed target.** A wider trail (1.5R) did better over the full history, but I kept 1R as you asked.

## v3 rules: 22 SMA bias, structure, A-grade setups, SMA exit

The code is in `rejection_v3.py`. It covers 18 markets, with costs of 0.04% of price per round trip. Each cell shows both 2D alignments as off0 / off1.

### Full history

| Variant | R/trade | Total R | Max DD | t-stat |
|---|---|---|---|---|
| Previous (EMA50 long-only, 1R trail) | +0.15 / +0.11 | +304 / +227 | 74 / 113 | 3.8 / 2.9 |
| v3 as specified | +0.18 / +0.11 | +634 / +368 | 147 / 168 | 1.8 / 1.4 |
| v3, longs only | +0.34 / +0.27 | +736 / +568 | 128 / 104 | 2.3 / 2.3 |
| v3, A-grade trades only | +0.02 / +0.13 | +34 / +189 | 105 / 60 | 0.3 / 1.5 |

### Problems with v3

- **The profit rests on a few huge trades.** The SMA exit lets winners run for months, and trades with very tight stops then produce enormous R. The biggest were corn 2007 at +256R, silver 2025 at +140R and copper 2003 at +66R.
- **Without its top 1% of trades, v3 loses money.**
  - v3 as specified: −514R.
  - v3 longs only: −91R.
  - The previous version stays positive: +156R.
- **v3 shorts lose:** −0.05R a trade.
- **A-grade setups are no better than ordinary ones.**
- **Filtering out tight stops doesn't rescue it.** With a minimum stop of 0.5 ATR, v3 falls to +0.06R a trade.
- **The structure rule does help.** Using it when the MAs are close beats skipping those trades: +634R vs +429R.

### Last 4 years

| Variant | Total R |
|---|---|
| v3 longs only | +201 / +252 |
| Previous | +46 / +52 |

The 4-year result has the same weakness: one silver trade is worth +140R, and without the top 1% of trades v3 longs only is about flat (+9 / −11R).
