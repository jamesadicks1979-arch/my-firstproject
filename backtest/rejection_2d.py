"""
Backtest of the "2D Rejection Candle System" Pine strategy, rebuilt in Python.

Mirrors the Pine logic:
  * Signal: open inside prev range, sweep prev high (bear) / low (bull),
    close back inside prev range, opposite body colour.
  * Entry next bar open. Stop = signal wick (or prev range). Target = targetR.
  * Protective orders live from the fill bar; on the fill bar the target is
    based on the signal close (as in the Pine), refined from the next bar.
  * Breakeven: once a bar's high/low tags scratchR, stop moves to entry from
    the NEXT bar (Pine evaluates at bar close).
  * Intrabar path uses TradingView's broker-emulator rule: if open is closer
    to high, path is O-H-L-C, else O-L-H-C. Gaps through stop/target fill at
    the open.
Results are in R (risk = |actual entry - original stop|), like the Pine table.

Usage: python rejection_2d.py GC=F.json BZ=F.json   (Yahoo chart JSON)
"""
import json
import sys

import numpy as np
import pandas as pd


# ───────────────────────── data ─────────────────────────
def load_yahoo(path):
    j = json.load(open(path))["chart"]["result"][0]
    q = j["indicators"]["quote"][0]
    df = pd.DataFrame(
        {k: q[k] for k in ("open", "high", "low", "close")},
        index=pd.to_datetime(j["timestamp"], unit="s").normalize(),
    )
    df = df.dropna()
    df = df[(df.high >= df[["open", "close"]].max(axis=1)) &
            (df.low <= df[["open", "close"]].min(axis=1)) & (df.low > 0)]
    # drop zero-range placeholder bars (stale prints)
    df = df[df.high > df.low]
    return df[~df.index.duplicated()]


def to_2d(daily, offset=0):
    """Group consecutive trading days in pairs (TradingView-style 2D)."""
    d = daily.iloc[offset:]
    g = np.arange(len(d)) // 2
    out = d.groupby(g).agg(open=("open", "first"), high=("high", "max"),
                           low=("low", "min"), close=("close", "last"))
    out.index = d.index[::2][: len(out)]
    return out


def add_features(b):
    b = b.copy()
    tr = pd.concat([b.high - b.low, (b.high - b.close.shift()).abs(),
                    (b.low - b.close.shift()).abs()], axis=1).max(axis=1)
    b["atr"] = tr.rolling(14).mean()
    b["ema50"] = b.close.ewm(span=50, adjust=False).mean()
    b["ema20"] = b.close.ewm(span=20, adjust=False).mean()
    b["hh10"] = b.high.shift(1).rolling(10).max()   # prior 10-bar extremes
    b["ll10"] = b.low.shift(1).rolling(10).min()
    return b


COSTS = {"GC=F": 0.40, "BZ=F": 0.04}   # spread+commission+slippage per round trip


# ───────────────────────── engine ─────────────────────────
DEFAULT = dict(
    reqOpenInside=True, reqOppBody=True, stopMode="wick",
    targetR=4.0, useScratch=True, scratchR=2.0,
    trend=None,            # None | "ema50" | "ema20"  (trade with trend only)
    sweepExtreme=False,    # swept level must be the 10-bar high/low
    closePos=None,         # e.g. 0.5 → bear close in lower half of signal bar
    minRiskATR=None, maxRiskATR=None,
    maxBars=None,          # time stop (bars after fill)
    cost=0.0,              # round-trip cost in price units
)


def signals(b, p):
    pH, pL = b.high.shift(1), b.low.shift(1)
    openIn = (b.open >= pL) & (b.open <= pH)
    closeIn = (b.close >= pL) & (b.close <= pH)
    oi = openIn if p["reqOpenInside"] else True
    bear = oi & (b.high > pH) & closeIn & ((b.close < b.open) if p["reqOppBody"] else True)
    bull = oi & (b.low < pL) & closeIn & ((b.close > b.open) if p["reqOppBody"] else True)
    bear, bull = bear & ~bull, bull & ~bear

    rng = (b.high - b.low).replace(0, np.nan)
    if p["closePos"] is not None:
        pos = (b.close - b.low) / rng      # 0 = closed on low, 1 = on high
        bear &= pos <= p["closePos"]
        bull &= pos >= 1 - p["closePos"]
    if p["trend"]:
        e = b[p["trend"]]
        bull &= b.close > e
        bear &= b.close < e
    if p["sweepExtreme"]:
        bear &= b.high > b.hh10
        bull &= b.low < b.ll10
    stopB = b.high if p["stopMode"] == "wick" else pH
    stopL = b.low if p["stopMode"] == "wick" else pL
    return bull.fillna(False).values, bear.fillna(False).values, stopL.values, stopB.values


def run(b, **kw):
    p = {**DEFAULT, **kw}
    bull, bear, stopL, stopB = signals(b, p)
    O, H, L, C = (b[c].values for c in ("open", "high", "low", "close"))
    atr = b.atr.values
    n = len(b)
    trades = []
    i = 0
    while i < n - 1:
        if not (bull[i] or bear[i]):
            i += 1
            continue
        d = 1 if bull[i] else -1
        stp = stopL[i] if d == 1 else stopB[i]
        if not (C[i] > stp if d == 1 else C[i] < stp):
            i += 1
            continue
        est = abs(C[i] - stp)
        if p["minRiskATR"] and not np.isnan(atr[i]) and est < p["minRiskATR"] * atr[i]:
            i += 1; continue
        if p["maxRiskATR"] and not np.isnan(atr[i]) and est > p["maxRiskATR"] * atr[i]:
            i += 1; continue

        j = i + 1
        entry = O[j]
        risk = abs(entry - stp)
        if (entry - stp) * d <= 0:
            # Opened through the stop: Pine fills the entry and the stop at the
            # same open price → 0 R (but you paid costs).
            trades.append(dict(date=b.index[i], dir=d, R=-p["cost"] / est,
                               exit="gap-stop", bars=1, risk=est))
            i = j
            continue
        tgt_fill = C[i] + d * p["targetR"] * est     # target on fill bar (Pine quirk)
        tgt = entry + d * p["targetR"] * risk
        scr = entry + d * p["scratchR"] * risk
        cur_stop = stp
        scratched = False
        exit_px, why = None, None
        k = j
        while k < n:
            t = tgt_fill if k == j else tgt
            o, h, l = O[k], H[k], L[k]
            if k > j:   # gap checks at open (fill bar opens at entry)
                if (o - cur_stop) * d <= 0:
                    exit_px, why = o, "stop"; break
                if (o - t) * d >= 0:
                    exit_px, why = o, "target"; break
            hit_stop = (l <= cur_stop) if d == 1 else (h >= cur_stop)
            hit_tgt = (h >= t) if d == 1 else (l <= t)
            if hit_stop and hit_tgt:
                high_first = abs(o - h) < abs(o - l)
                tgt_first = high_first if d == 1 else not high_first
                exit_px, why = (t, "target") if tgt_first else (cur_stop, "stop")
                break
            if hit_stop:
                exit_px, why = cur_stop, "stop"; break
            if hit_tgt:
                exit_px, why = t, "target"; break
            # bar close: scratch check (applies from next bar)
            if p["useScratch"] and not scratched and ((h >= scr) if d == 1 else (l <= scr)):
                scratched = True
                cur_stop = entry
            if p["maxBars"] and k - j + 1 >= p["maxBars"]:
                if k + 1 < n:
                    exit_px, why = O[k + 1], "time"; k += 1
                break
            k += 1
        if exit_px is None:
            break   # still open at end of data
        R = ((exit_px - entry) * d - p["cost"]) / risk
        if why == "stop" and scratched:
            why = "scratch"
        trades.append(dict(date=b.index[i], dir=d, R=R, exit=why, bars=k - j + 1, risk=risk))
        i = k   # Pine allows a new signal on the exit bar
    return pd.DataFrame(trades)


def stats(t):
    if len(t) == 0:
        return dict(n=0, win=np.nan, totR=0, exp=np.nan, pf=np.nan, maxDD=0)
    r = t.R.values
    eq = np.cumsum(r)
    dd = (np.maximum.accumulate(np.r_[0, eq])[1:] - eq).max()
    gw, gl = r[r > 0.1].sum(), -r[r < -0.1].sum()
    return dict(n=len(r), win=round(100 * (r > 0.1).mean(), 1),
                scr=round(100 * (np.abs(r) <= 0.1).mean(), 1),
                totR=round(r.sum(), 1), exp=round(r.mean(), 3),
                pf=round(gw / gl, 2) if gl > 0 else np.inf, maxDD=round(dd, 1))


def row(name, t):
    return {"variant": name, **stats(t)}


if __name__ == "__main__":
    pd.set_option("display.width", 200)
    for path in sys.argv[1:]:
        d = load_yahoo(path)
        name = path.split("/")[-1].replace(".json", "")
        cost = COSTS.get(name, 0.0)
        print(f"\n=== {name}: {d.index[0].date()} → {d.index[-1].date()}  ({len(d)} daily bars), cost/RT={cost}")
        b0 = add_features(to_2d(d, 0))
        b1 = add_features(to_2d(d, 1))

        rows = []
        base = run(b0)
        rows.append(row("BASE (as Pine) offset0", base))
        rows.append(row("BASE offset1 (other 2D anchor)", run(b1)))
        rows.append(row("BASE + costs", run(b0, cost=cost)))
        rows.append(row("BASE longs only", base[base.dir == 1]))
        rows.append(row("BASE shorts only", base[base.dir == -1]))
        rows.append(row("stop = prev range", run(b0, stopMode="prev")))
        rows.append(row("no opposite-body rule", run(b0, reqOppBody=False)))
        print(pd.DataFrame(rows).to_string(index=False))
        print("exit mix (base):", base.exit.value_counts().to_dict(),
              "| avg bars held:", round(base.bars.mean(), 1))

        print("\n-- target / scratch grid (expectancy R, n) offset0 | offset1")
        grid = []
        for tr in (1, 1.5, 2, 3, 4, 6):
            for sc in (None, 1.0, 2.0):
                if sc is not None and sc >= tr:
                    continue
                kw = dict(targetR=tr, useScratch=sc is not None, scratchR=sc or 2.0)
                s0, s1 = stats(run(b0, **kw)), stats(run(b1, **kw))
                grid.append(dict(target=tr, scratch=sc or "off", n=s0["n"], win=s0["win"],
                                 exp0=s0["exp"], exp1=s1["exp"], totR0=s0["totR"], pf0=s0["pf"], dd0=s0["maxDD"]))
        print(pd.DataFrame(grid).to_string(index=False))

        print("\n-- filters (on base 4R/2R-scratch)")
        F = {
            "trend EMA50": dict(trend="ema50"),
            "trend EMA20": dict(trend="ema20"),
            "counter-trend EMA50 (fade)": None,
            "sweep = 10-bar extreme": dict(sweepExtreme=True),
            "close in far half of bar": dict(closePos=0.5),
            "close in far third of bar": dict(closePos=0.33),
            "risk >= 0.5 ATR": dict(minRiskATR=0.5),
            "risk <= 1.5 ATR": dict(maxRiskATR=1.5),
            "time stop 10 bars": dict(maxBars=10),
        }
        frows = []
        for k, kw in F.items():
            if kw is None:
                continue
            frows.append({"filter": k, **stats(run(b0, **kw)),
                          "exp_off1": stats(run(b1, **kw))["exp"]})
        print(pd.DataFrame(frows).to_string(index=False))

        print("\n-- combos, split in-sample (<2016) vs out-of-sample (>=2016), with costs")
        combos = {
            "BASE": {},
            "2R target, no scratch": dict(targetR=2, useScratch=False),
            "trend50 + 4R/2R": dict(trend="ema50"),
            "trend50 + 2R": dict(trend="ema50", targetR=2, useScratch=False),
            "trend50 + far-half close + 3R/1.5R": dict(trend="ema50", closePos=0.5, targetR=3, scratchR=1.5),
            "trend50 + 10bar sweep + 3R": dict(trend="ema50", sweepExtreme=True, targetR=3, useScratch=False),
            "far-half close + 2R": dict(closePos=0.5, targetR=2, useScratch=False),
            "10bar sweep + 2R": dict(sweepExtreme=True, targetR=2, useScratch=False),
        }
        crows = []
        for k, kw in combos.items():
            t0 = run(b0, cost=cost, **kw)
            t1 = run(b1, cost=cost, **kw)
            ins, oos = t0[t0.date < "2016-01-01"], t0[t0.date >= "2016-01-01"]
            si, so, sa = stats(ins), stats(oos), stats(t0)
            crows.append(dict(combo=k, n=sa["n"], win=sa["win"], exp=sa["exp"], pf=sa["pf"], dd=sa["maxDD"],
                              exp_IS=si["exp"], n_IS=si["n"], exp_OOS=so["exp"], n_OOS=so["n"],
                              exp_off1=stats(t1)["exp"]))
        print(pd.DataFrame(crows).to_string(index=False))

        yr = base.groupby(base.date.dt.year).R.agg(["count", "sum"]).round(1)
        print("\n-- base R by year:", " ".join(f"{y}:{r['sum']:+.0f}({int(r['count'])})" for y, r in yr.iterrows()))
