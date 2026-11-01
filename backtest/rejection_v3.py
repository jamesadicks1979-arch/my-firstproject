"""
v3 rules (22 SMA / 50 EMA bias, lower-high / higher-low structure when the MAs
are close, A-grade setups at 100-bar extremes or outside bars with breakeven at
2R, exit on 2 closes beyond the 22 SMA). Mirrors pine/rejection_2d.pine.
"""
from rejection_2d import *


def prep(b, fastLen=22, slowLen=50, piv=3):
    b = b.copy()
    b["fast"] = b.close.rolling(fastLen).mean()
    b["slow"] = b.close.ewm(span=slowLen, adjust=False).mean()
    H, L = b.high.values, b.low.values
    n = len(b)
    bear = np.zeros(n, bool); bull = np.zeros(n, bool)
    lastH = lastL = np.nan; bs = bl = False
    for t in range(n):
        c = t - piv                       # pivot confirmed piv bars later (no look-ahead)
        if c - piv >= 0:
            win = H[c - piv:c + piv + 1]
            if H[c] == win.max() and (win == H[c]).sum() == 1:
                if not np.isnan(lastH) and H[c] < lastH:
                    bs = True; bl = False
                lastH = H[c]
            win = L[c - piv:c + piv + 1]
            if L[c] == win.min() and (win == L[c]).sum() == 1:
                if not np.isnan(lastL) and L[c] > lastL:
                    bl = True; bs = False
                lastL = L[c]
        if bs and not np.isnan(lastH) and H[t] > lastH: bs = False
        if bl and not np.isnan(lastL) and L[t] < lastL: bl = False
        bear[t] = bs; bull[t] = bl
    b["bearS"] = bear; b["bullS"] = bull
    return b


def run3(b, cp=0.0004, closeATR=0.5, extLen=100, useA=True, aIgnore=True, aBe=2.0,
         beAll=False, exitN=2, useStruct=True, side="both"):
    O, H, L, C = (b[k].values for k in ("open", "high", "low", "close"))
    F = b.fast.values; S = b.slow.values; A = b.atr.values
    pH = np.r_[np.nan, H[:-1]]; pL = np.r_[np.nan, L[:-1]]
    hh = b.high.rolling(extLen).max().values; ll = b.low.rolling(extLen).min().values
    n = len(b); tr = []; i = 0
    while i < n - 1:
        if np.isnan(F[i]) or np.isnan(A[i]): i += 1; continue
        openIn = pL[i] <= O[i] <= pH[i]; closeIn = pL[i] <= C[i] <= pH[i]
        out = H[i] > pH[i] and L[i] < pL[i]
        bearB = openIn and H[i] > pH[i] and closeIn and C[i] < O[i]
        bullB = openIn and L[i] < pL[i] and closeIn and C[i] > O[i]
        close_ = abs(F[i] - S[i]) < closeATR * A[i]
        if not close_:
            bias = 1 if F[i] > S[i] else -1
        elif useStruct:
            bias = -1 if b.bearS.values[i] else 1 if b.bullS.values[i] else 0
        else:
            bias = 0
        bA = useA and bearB and (H[i] >= hh[i] or out)
        lA = useA and bullB and (L[i] <= ll[i] or out)
        bs = bearB and side != "long" and (bias == -1 or (bA and aIgnore))
        ls = bullB and side != "short" and (bias == 1 or (lA and aIgnore))
        if not (bs or ls): i += 1; continue
        d = 1 if ls else -1; stp = L[i] if d == 1 else H[i]; isA = lA if d == 1 else bA
        j = i + 1; e = O[j]; risk = abs(e - stp)
        if (e - stp) * d <= 0:
            tr.append(dict(date=b.index[i], dir=d, A=isA, ra=np.nan, R=-cp * e / abs(C[i] - stp), exit="gap"))
            i = j; continue
        cur = stp; be = False; beyond = 0; k = j; xp = None
        while k < n:
            o, h, l, c = O[k], H[k], L[k], C[k]
            if k > j and (o - cur) * d <= 0: xp, why = o, "stop"; break
            if (l <= cur if d == 1 else h >= cur): xp, why = cur, "stop"; break
            if (isA or beAll) and not be and (h - e) * d >= aBe * risk:
                be = True; cur = max(cur, e) if d == 1 else min(cur, e)
            beyond = beyond + 1 if (c < F[k] if d == 1 else c > F[k]) else 0
            if beyond >= exitN:
                if k + 1 < n: xp, why = O[k + 1], "sma"; k += 1
                break
            k += 1
        if xp is None: break
        tr.append(dict(date=b.index[i], dir=d, A=isA, ra=risk / A[i], R=((xp - e) * d - cp * e) / risk,
                       exit=why if not (why == "stop" and be) else "be"))
        i = k
    return pd.DataFrame(tr)
