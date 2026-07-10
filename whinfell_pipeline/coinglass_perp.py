"""BBDM v2 Chunk 17 — CoinGlass API stub for BTC/ETH Litmus market signals.

Spec §5 market signals (funding + OI): Perp Funding Aggregate, Deribit,
Hyperliquid. CF Benchmark is an expected licensed limitation (no free public
API). ETF Flows prefer Koyfin drop CSVs; SoSoValue public API fills gaps.

Env-gated live fetch when COINGLASS_API_KEY is set.

When no CoinGlass key is present, public venue fallbacks hydrate Deribit +
Hyperliquid (+ aggregate). ETF Flows: Koyfin CSV first, SoSoValue public fallback.
"""

from __future__ import annotations

import csv
import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Optional

ADAPTER_VERSION = "2.0.0-chunk17.4"
SCHEMA_VERSION = "2.0.0"
EXPORT_ID = "coinglass_perp_market"
API_BASE = "https://open-api-v4.coinglass.com"
DEFAULT_OUT = Path(__file__).resolve().parents[1] / "bang_bang_da" / "litmus" / "crypto_market.json"
DEFAULT_DROP = Path.home() / "Downloads" / "whinfell_drop"

DERIBIT_TICKER_URL = "https://www.deribit.com/api/v2/public/ticker"
DERIBIT_INDEX_URL = "https://www.deribit.com/api/v2/public/get_index_price"
HYPERLIQUID_INFO_URL = "https://api.hyperliquid.xyz/info"
SOSOVALUE_ETF_INFLOW_URL = "https://api.sosovalue.xyz/openapi/v2/etf/historicalInflowChart"
COINGLASS_FUTURES_PAGE = "https://www.coinglass.com/currencies/{asset}/futures"

# Licensed CF Benchmarks reference rates — no free public series without API key.
# Probed 2026-07-10: CryptoQuant chart/API 403/401; CoinGlass funding API needs key;
# Deribit public index is venue index (not CME CF BRR/ETHUSD_RR).
CF_BENCHMARK_LIMITATION = (
    "CF Benchmarks (BRR/ETHUSD_RR) requires a licensed API subscription. "
    "Public probes: CryptoQuant funding chart/API blocked (auth), CoinGlass detailed "
    "funding API key-gated, Deribit public stats give venue index not CF reference rates. "
    "Status expected_limitation until desk keys CF or CoinGlass."
)

BTC_ETF_TICKERS = frozenset(
    {"IBIT", "FBTC", "GBTC", "ARKB", "BITB", "HODL", "BTCO", "EZBC", "BRRR", "BTCW", "BTC"}
)
ETH_ETF_TICKERS = frozenset(
    {
        "ETHA",
        "ETHE",
        "ETHW",
        "FETH",
        "EZET",
        "CETH",
        "QETH",
        "ETH",
        "ETHV",
        "TETH",
        "ETHB",
        "ETHU",
    }
)

MARKET_SIGNAL_COLUMNS = (
    "signal",
    "venue",
    "funding_rate",
    "open_interest_usd",
    "status",
)

TRADE_IDS = ("btc_basis", "btc_calendar", "eth_basis", "eth_calendar")

ASSET_META: dict[str, dict[str, str]] = {
    "BTC": {"symbol": "BTC", "pair": "BTCUSDT", "label": "Bitcoin"},
    "ETH": {"symbol": "ETH", "pair": "ETHUSDT", "label": "Ethereum"},
}

FetchFn = Callable[[str, str], Optional[dict[str, Any]]]

SIGNAL_DEFS: tuple[dict[str, Any], ...] = (
    {
        "signal_id": "perp_funding_aggregate",
        "label": "Perp Funding (Aggregate)",
        "venue": "aggregate",
        "source": "coinglass",
        "fetch_mode": "aggregate",
        "stub_status": "pending_coinglass",
    },
    {
        "signal_id": "deribit",
        "label": "Deribit",
        "venue": "deribit",
        "source": "coinglass",
        "fetch_mode": "exchange",
        "exchange": "Deribit",
        "stub_status": "pending_coinglass",
    },
    {
        "signal_id": "hyperliquid",
        "label": "Hyperliquid",
        "venue": "hyperliquid",
        "source": "coinglass",
        "fetch_mode": "exchange",
        "exchange": "Hyperliquid",
        "stub_status": "pending_coinglass",
    },
    {
        "signal_id": "cf_benchmark",
        "label": "CF Benchmark",
        "venue": "cf_benchmark",
        "source": "external_licensed",
        "fetch_mode": None,
        "stub_status": "expected_limitation",
    },
    {
        "signal_id": "etf_flows",
        "label": "ETF Flows",
        "venue": "etf",
        "source": "koyfin",
        "fetch_mode": None,
        "stub_status": "pending_koyfin",
    },
)

API_PATHS = {
    "funding_oi_weight": "/api/futures/funding-rate/oi-weight-history",
    "oi_aggregated": "/api/futures/open-interest/aggregated-history",
    "funding_exchange_list": "/api/futures/funding-rate/exchange-list",
    "oi_exchange_list": "/api/futures/open-interest/exchange-list",
}


def _utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def api_key_from_env() -> str | None:
    for name in ("COINGLASS_API_KEY", "WHINFELL_COINGLASS_API_KEY"):
        value = os.environ.get(name, "").strip()
        if value:
            return value
    return None


def api_key_configured() -> bool:
    return api_key_from_env() is not None


def _stub_signal_row(defn: dict[str, Any]) -> dict[str, Any]:
    row = {
        "signal_id": defn["signal_id"],
        "signal": defn["label"],
        "venue": defn["venue"],
        "funding_rate": None,
        "open_interest_usd": None,
        "status": defn["stub_status"],
        "source": defn["source"],
    }
    if defn["signal_id"] == "cf_benchmark":
        row["note"] = CF_BENCHMARK_LIMITATION
    return row


def _asset_signals_stub(asset: str) -> list[dict[str, Any]]:
    return [{**_stub_signal_row(defn), "asset": asset} for defn in SIGNAL_DEFS]


def build_crypto_market_stub(*, as_of: str | None = None) -> dict[str, Any]:
    stamp = as_of or _utc_now()
    assets = {
        asset: {
            "symbol": meta["symbol"],
            "pair": meta["pair"],
            "label": meta["label"],
            "signals": _asset_signals_stub(asset),
        }
        for asset, meta in ASSET_META.items()
    }
    return {
        "schema_version": SCHEMA_VERSION,
        "adapter_version": ADAPTER_VERSION,
        "data_status": "stub",
        "source": "coinglass",
        "as_of": stamp,
        "export_id": EXPORT_ID,
        "trade_ids": list(TRADE_IDS),
        "tables": build_litmus_tables(assets),
        "assets": assets,
        "lineage": {
            "api_base": API_BASE,
            "api_key_configured": api_key_configured(),
            "fetched_at": None,
            "fetch_errors": [],
            "notes": "Set COINGLASS_API_KEY to enable live funding/OI fetch",
        },
    }


def build_litmus_tables(assets: dict[str, Any]) -> list[dict[str, Any]]:
    tables: list[dict[str, Any]] = []
    for asset, block in assets.items():
        prefix = asset.lower()
        rows = [
            {col: signal.get(col if col != "signal" else "signal") for col in MARKET_SIGNAL_COLUMNS}
            for signal in block.get("signals", [])
        ]
        for trade_id in (f"{prefix}_basis", f"{prefix}_calendar"):
            tables.append(
                {
                    "id": f"{trade_id}_market",
                    "trade_id": trade_id,
                    "title": f"{block.get('label', asset)} — Market Signals",
                    "columns": list(MARKET_SIGNAL_COLUMNS),
                    "rows": rows,
                }
            )
    return tables


def write_crypto_market_stub(out_path: Path | None = None, *, as_of: str | None = None) -> Path:
    path = Path(out_path or DEFAULT_OUT)
    path.parent.mkdir(parents=True, exist_ok=True)
    doc = build_crypto_market_stub(as_of=as_of)
    path.write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")
    return path


def _safe_float(raw: Any) -> float | None:
    if raw is None:
        return None
    try:
        return round(float(raw), 8)
    except (TypeError, ValueError):
        return None


def _normalize_exchange_name(raw: str) -> str:
    return "".join(ch for ch in (raw or "").lower() if ch.isalnum())


def _latest_ohlc_close(rows: Any) -> float | None:
    if not isinstance(rows, list) or not rows:
        return None
    last = rows[-1]
    if not isinstance(last, dict):
        return None
    return _safe_float(last.get("close"))


def _find_exchange_row(rows: Any, exchange: str) -> dict[str, Any] | None:
    if not isinstance(rows, list):
        return None
    target = _normalize_exchange_name(exchange)
    for row in rows:
        if not isinstance(row, dict):
            continue
        name = row.get("exchange") or row.get("exchangeName") or row.get("name") or ""
        if _normalize_exchange_name(str(name)) == target:
            return row
    return None


def _exchange_funding_rate(row: dict[str, Any]) -> float | None:
    for key in ("fundingRate", "funding_rate", "rate", "usdFundingRate"):
        value = _safe_float(row.get(key))
        if value is not None:
            return value
    return None


def _exchange_open_interest(row: dict[str, Any]) -> float | None:
    for key in ("openInterest", "open_interest", "open_interest_usd", "oiUsd", "usdOpenInterest"):
        value = _safe_float(row.get(key))
        if value is not None:
            return value
    return None


def _coinglass_ok(payload: dict[str, Any] | None) -> bool:
    if not isinstance(payload, dict):
        return False
    code = payload.get("code")
    return str(code) in {"0", "200", "success"}


def _build_url(path: str, params: dict[str, Any]) -> str:
    query = urllib.parse.urlencode({k: v for k, v in params.items() if v is not None})
    return f"{API_BASE}{path}?{query}"


def default_fetcher(url: str, api_key: str, *, timeout: float = 30.0) -> dict[str, Any] | None:
    request = urllib.request.Request(
        url,
        headers={
            "CG-API-KEY": api_key,
            "accept": "application/json",
        },
        method="GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError, ValueError):
        return None


def fetch_coinglass(
    path: str,
    params: dict[str, Any],
    *,
    api_key: str | None = None,
    fetcher: FetchFn | None = None,
) -> dict[str, Any] | None:
    key = api_key or api_key_from_env()
    if not key:
        return None
    url = _build_url(path, params)
    fetch = fetcher or default_fetcher
    payload = fetch(url, key)
    if not _coinglass_ok(payload):
        return None
    return payload


def _http_json_get(url: str, *, timeout: float = 20.0) -> dict[str, Any] | list[Any] | None:
    request = urllib.request.Request(url, headers={"accept": "application/json"}, method="GET")
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError, ValueError):
        return None


def _http_json_post(url: str, body: dict[str, Any], *, timeout: float = 20.0) -> Any:
    request = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={"accept": "application/json", "content-type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError, ValueError):
        return None


def fetch_deribit_public(asset: str) -> dict[str, float | None]:
    """Public Deribit ticker — current_funding / funding_8h + open_interest.

    Aligns with desk link: https://www.deribit.com/statistics/ETH/metrics/futures
    (same public API surface; HTML stats page is not machine-readable).
    """
    instrument = "BTC-PERPETUAL" if asset.upper() == "BTC" else "ETH-PERPETUAL"
    url = f"{DERIBIT_TICKER_URL}?instrument_name={urllib.parse.quote(instrument)}"
    payload = _http_json_get(url)
    if not isinstance(payload, dict):
        return {"funding_rate": None, "open_interest_usd": None}
    result = payload.get("result") or {}
    # Deribit perpetual open_interest is already USD notional for BTC/ETH perps.
    oi = _safe_float(result.get("open_interest"))
    rate = None
    for key in ("current_funding", "funding_8h"):
        rate = _safe_float(result.get(key))
        if rate is not None:
            break
    return {"funding_rate": rate, "open_interest_usd": oi}


def fetch_deribit_index_price(asset: str) -> float | None:
    """Deribit public index (btc_usd / eth_usd) — venue index, not CME CF BRR."""
    index = "btc_usd" if asset.upper() == "BTC" else "eth_usd"
    payload = _http_json_get(f"{DERIBIT_INDEX_URL}?index_name={index}")
    if not isinstance(payload, dict):
        return None
    result = payload.get("result") or {}
    return _safe_float(result.get("index_price"))


def fetch_hyperliquid_public(asset: str) -> dict[str, float | None]:
    """Public Hyperliquid meta+ctxs — funding + OI (coins) × mark → USD."""
    payload = _http_json_post(HYPERLIQUID_INFO_URL, {"type": "metaAndAssetCtxs"})
    if not isinstance(payload, list) or len(payload) < 2:
        return {"funding_rate": None, "open_interest_usd": None}
    meta, ctxs = payload[0], payload[1]
    universe = (meta or {}).get("universe") if isinstance(meta, dict) else None
    if not isinstance(universe, list) or not isinstance(ctxs, list):
        return {"funding_rate": None, "open_interest_usd": None}
    target = asset.upper()
    idx = next((i for i, u in enumerate(universe) if isinstance(u, dict) and u.get("name") == target), None)
    if idx is None or idx >= len(ctxs) or not isinstance(ctxs[idx], dict):
        return {"funding_rate": None, "open_interest_usd": None}
    ctx = ctxs[idx]
    rate = _safe_float(ctx.get("funding"))
    oi_coins = _safe_float(ctx.get("openInterest"))
    mark = _safe_float(ctx.get("markPx") or ctx.get("oraclePx"))
    oi_usd = round(oi_coins * mark, 2) if oi_coins is not None and mark is not None else None
    return {"funding_rate": rate, "open_interest_usd": oi_usd}


def fetch_okx_public_funding(asset: str) -> float | None:
    inst = "BTC-USDT-SWAP" if asset.upper() == "BTC" else "ETH-USDT-SWAP"
    payload = _http_json_get(f"https://www.okx.com/api/v5/public/funding-rate?instId={inst}")
    if not isinstance(payload, dict) or str(payload.get("code")) != "0":
        return None
    rows = payload.get("data") or []
    if not rows or not isinstance(rows[0], dict):
        return None
    return _safe_float(rows[0].get("fundingRate"))


def fetch_bitget_public_funding(asset: str) -> float | None:
    sym = "BTCUSDT" if asset.upper() == "BTC" else "ETHUSDT"
    payload = _http_json_get(
        f"https://api.bitget.com/api/v2/mix/market/current-fund-rate?symbol={sym}&productType=USDT-FUTURES"
    )
    if not isinstance(payload, dict) or str(payload.get("code")) not in {"00000", "0"}:
        return None
    data = payload.get("data")
    row = data[0] if isinstance(data, list) and data else data
    if not isinstance(row, dict):
        return None
    return _safe_float(row.get("fundingRate"))


def fetch_gate_public_funding(asset: str) -> float | None:
    contract = "BTC_USDT" if asset.upper() == "BTC" else "ETH_USDT"
    payload = _http_json_get(f"https://api.gateio.ws/api/v4/futures/usdt/contracts/{contract}")
    if not isinstance(payload, dict):
        return None
    return _safe_float(payload.get("funding_rate") or payload.get("funding_rate_indicative"))


def fetch_public_funding_panel(asset: str) -> dict[str, float]:
    """Equal-weight multi-venue funding rates (Deribit/HL handled separately for Litmus rows).

    Free public exchanges only — CryptoQuant and CoinGlass funding APIs need keys.
    """
    panel: dict[str, float] = {}
    for name, fn in (
        ("okx", fetch_okx_public_funding),
        ("bitget", fetch_bitget_public_funding),
        ("gate", fetch_gate_public_funding),
    ):
        try:
            rate = fn(asset)
        except Exception:  # noqa: BLE001 — venue isolation
            rate = None
        if rate is not None:
            panel[name] = rate
    return panel


def fetch_coinglass_page_open_interest_usd(asset: str) -> float | None:
    """Market-wide OI USD from CoinGlass public futures page SSR (no API key).

    Desk link: https://www.coinglass.com/currencies/eth/futures
    Funding time series on that page still require CoinGlass API key.
    """
    url = COINGLASS_FUTURES_PAGE.format(asset=asset.upper())
    request = urllib.request.Request(
        url,
        headers={
            "accept": "text/html",
            "user-agent": "Mozilla/5.0 (compatible; WhinfellTransmissionControl/1.0)",
        },
        method="GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=25.0) as response:
            html = response.read().decode("utf-8", "replace")
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ValueError):
        return None
    match = re.search(r'<script[^>]*>\s*(\{"props":\{"pageProps".*?)\s*</script>', html, re.S)
    if not match:
        match = re.search(r'__NEXT_DATA__" type="application/json">(\{.*?)</script>', html, re.S)
    if not match:
        return None
    try:
        payload = json.loads(match.group(1))
    except json.JSONDecodeError:
        return None
    coin = (
        (payload.get("props") or {}).get("pageProps") or {}
    ).get("coinInfo") or {}
    return _safe_float(coin.get("openInterest"))


def discover_flows_csv(drop_dir: Path | None = None) -> Path | None:
    """Newest Koyfin flows export in drop (canonical or vendor name).

    When ``drop_dir`` is provided, only that directory is searched (tests / explicit).
    When omitted, defaults to the desk ``~/Downloads/whinfell_drop``.
    """
    roots: list[Path] = [Path(drop_dir)] if drop_dir is not None else [DEFAULT_DROP]
    patterns = (
        "flows_*.csv",
        "koyfin_WTM-Flows*",
        "WTM-Flows*.csv",
        "koyfin_*Flows*.csv",
    )
    candidates: list[Path] = []
    for root in roots:
        if not root.is_dir():
            continue
        for pattern in patterns:
            candidates.extend(root.glob(pattern))
    candidates = [p for p in candidates if p.is_file() and p.suffix.lower() == ".csv"]
    if not candidates:
        return None
    return max(candidates, key=lambda p: p.stat().st_mtime)


def _flows_column(fieldnames: list[str] | None) -> str | None:
    if not fieldnames:
        return None
    normalized = {re.sub(r"\s+", " ", (n or "").strip().lower()): n for n in fieldnames}
    for key in (
        "fund flows/periodic (d)",
        "fund flows/periodic(d)",
        "fund flows (d)",
        "flow $ d",
        "flows d",
    ):
        if key in normalized:
            return normalized[key]
    # fuzzy
    for norm, original in normalized.items():
        if "fund flow" in norm and "(d)" in norm:
            return original
        if norm.startswith("fund flows") and "d" in norm.split():
            return original
    return None


def parse_etf_flow_totals(csv_path: Path) -> dict[str, float]:
    """Sum 1D fund flows for BTC/ETH spot ETF tickers from Koyfin flows export."""
    totals = {"BTC": 0.0, "ETH": 0.0}
    hits = {"BTC": 0, "ETH": 0}
    with csv_path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        flow_col = _flows_column(reader.fieldnames)
        ticker_col = None
        for name in reader.fieldnames or []:
            if (name or "").strip().lower() in {"ticker", "symbol"}:
                ticker_col = name
                break
        if not flow_col or not ticker_col:
            return {}
        for row in reader:
            ticker = (row.get(ticker_col) or "").strip().upper().split(".")[0]
            flow = _safe_float(row.get(flow_col))
            if flow is None:
                continue
            # Koyfin often exports flow $ in millions — keep as USD millions * 1e6 if |flow| small vs AUM
            # Desk flows files use absolute $mm (e.g. 333.58 for LQD). Scale to USD.
            flow_usd = flow * 1_000_000.0 if abs(flow) < 1e7 else flow
            if ticker in BTC_ETF_TICKERS:
                totals["BTC"] += flow_usd
                hits["BTC"] += 1
            elif ticker in ETH_ETF_TICKERS:
                totals["ETH"] += flow_usd
                hits["ETH"] += 1
    return {asset: round(val, 2) for asset, val in totals.items() if hits[asset] > 0}


def fetch_sosovalue_etf_net_inflow(asset: str) -> float | None:
    """Latest 1D US spot ETF net inflow USD from SoSoValue public OpenAPI (no key)."""
    asset_u = asset.upper()
    type_map = {"BTC": "us-btc-spot", "ETH": "us-eth-spot"}
    etf_type = type_map.get(asset_u)
    if not etf_type:
        return None
    request = urllib.request.Request(
        SOSOVALUE_ETF_INFLOW_URL,
        data=json.dumps({"type": etf_type}).encode("utf-8"),
        headers={
            "accept": "application/json",
            "content-type": "application/json",
            "user-agent": "WhinfellTransmissionControl/1.0",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=20.0) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError, ValueError):
        return None
    if not isinstance(payload, dict) or str(payload.get("code")) not in {"0", "200", "success"}:
        return None
    rows = payload.get("data")
    if not isinstance(rows, list) or not rows:
        return None
    # Prefer most recent date; API may return newest-first or oldest-first.
    dated: list[tuple[str, float]] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        date_s = str(row.get("date") or "")
        val = _safe_float(row.get("totalNetInflow"))
        if date_s and val is not None:
            dated.append((date_s, val))
    if not dated:
        return None
    dated.sort(key=lambda x: x[0])
    return round(dated[-1][1], 2)


def resolve_etf_flow_totals(
    drop_dir: Path | None = None,
    *,
    sosovalue_fetch: Callable[[str], float | None] | None = None,
) -> tuple[dict[str, float], dict[str, str], list[str], list[str], Path | None]:
    """Koyfin CSV first (non-zero); SoSoValue fills missing **or zero** BTC/ETH totals.

    Desk WTM-Flows baskets often include only IBIT (not full US spot BTC set). A
    single IBIT row with Fund Flows/Periodic (D)=0.00 used to block SoSoValue and
    left Litmus BTC ETF Flows stuck at $0 while ETH (absent from CSV) got a real
    public aggregate. Treat Koyfin 0.0 as a gap and prefer SoSoValue when available.

    Returns (totals, asset_source, sources_used, errors, flows_path).
    asset_source maps BTC/ETH → ``koyfin_flows`` | ``sosovalue_public``.
    """
    sources_used: list[str] = []
    errors: list[str] = []
    asset_source: dict[str, str] = {}
    flows_path = discover_flows_csv(drop_dir)
    koyfin_totals = parse_etf_flow_totals(flows_path) if flows_path else {}
    etf_totals: dict[str, float] = {}
    if flows_path and koyfin_totals:
        sources_used.append(f"koyfin_flows:{flows_path.name}")
        for asset, val in koyfin_totals.items():
            if val != 0.0:
                etf_totals[asset] = val
                asset_source[asset] = "koyfin_flows"
            else:
                # Keep as candidate zero; SoSoValue may replace below.
                etf_totals[asset] = val
                asset_source[asset] = "koyfin_flows"
        missing = [a for a in ("BTC", "ETH") if a not in koyfin_totals]
        zeroed = [a for a in ("BTC", "ETH") if koyfin_totals.get(a) == 0.0]
        if missing:
            errors.append(
                f"etf_flows:koyfin_missing_{'+'.join(missing)}_in_{flows_path.name};trying_sosovalue"
            )
        if zeroed:
            errors.append(
                f"etf_flows:koyfin_zero_{'+'.join(zeroed)}_in_{flows_path.name};trying_sosovalue"
            )
    elif flows_path:
        errors.append(f"etf_flows:no_btc_eth_tickers_in_{flows_path.name}")
    else:
        errors.append("etf_flows:no_flows_csv;trying_sosovalue")

    fetch = sosovalue_fetch or fetch_sosovalue_etf_net_inflow
    for asset in ("BTC", "ETH"):
        koyfin_val = etf_totals.get(asset)
        # Trust non-zero Koyfin; fill missing or zero via SoSoValue public aggregate.
        if koyfin_val is not None and koyfin_val != 0.0:
            continue
        flow = fetch(asset)
        if flow is None:
            if koyfin_val is None:
                errors.append(f"etf_flows:sosovalue_{asset}_fetch_failed")
            else:
                errors.append(
                    f"etf_flows:sosovalue_{asset}_fetch_failed;keeping_koyfin_zero"
                )
            continue
        etf_totals[asset] = flow
        asset_source[asset] = "sosovalue_public"
        src_tag = f"sosovalue_public:{asset}"
        if src_tag not in sources_used:
            sources_used.append(src_tag)
    return etf_totals, asset_source, sources_used, errors, flows_path


def _apply_cf_benchmark_limitation(signal: dict[str, Any]) -> None:
    """Mark CF Benchmark as an expected licensed-data limitation (not a fetch bug)."""
    signal["status"] = "expected_limitation"
    signal["source"] = "external_licensed"
    signal["funding_rate"] = None
    signal["open_interest_usd"] = None
    signal["note"] = CF_BENCHMARK_LIMITATION


def apply_public_venue_fallback(
    doc: dict[str, Any],
    *,
    drop_dir: Path | None = None,
    sosovalue_fetch: Callable[[str], float | None] | None = None,
) -> dict[str, Any]:
    """Hydrate Deribit/Hyperliquid/aggregate + ETF flows (Koyfin → SoSoValue)."""
    merged = json.loads(json.dumps(doc))
    errors: list[str] = list(merged.get("lineage", {}).get("fetch_errors") or [])
    live_count = 0
    sources_used: list[str] = []

    etf_totals, etf_asset_source, flow_sources, flow_errors, flows_path = resolve_etf_flow_totals(
        drop_dir, sosovalue_fetch=sosovalue_fetch
    )
    sources_used.extend(flow_sources)
    errors.extend(flow_errors)

    for asset, block in merged.get("assets", {}).items():
        deribit = fetch_deribit_public(asset)
        hyper = fetch_hyperliquid_public(asset)
        panel = fetch_public_funding_panel(asset)
        cg_oi = fetch_coinglass_page_open_interest_usd(asset)
        if deribit.get("funding_rate") is None and deribit.get("open_interest_usd") is None:
            errors.append(f"{asset}:deribit_public_fetch_failed")
        else:
            sources_used.append(f"deribit_public:{asset}")
        if hyper.get("funding_rate") is None and hyper.get("open_interest_usd") is None:
            errors.append(f"{asset}:hyperliquid_public_fetch_failed")
        else:
            sources_used.append(f"hyperliquid_public:{asset}")
        for venue_name in panel:
            sources_used.append(f"{venue_name}_public:{asset}")
        if cg_oi is not None:
            sources_used.append(f"coinglass_page_oi:{asset}")
        else:
            errors.append(f"{asset}:coinglass_page_oi_unavailable")
        # CryptoQuant public chart/API requires login — record once per run context.
        if f"cryptoquant:auth_required" not in errors:
            errors.append("cryptoquant:auth_required")

        rates = [
            v
            for v in (
                deribit.get("funding_rate"),
                hyper.get("funding_rate"),
                *panel.values(),
            )
            if v is not None
        ]
        ois = [v for v in (deribit.get("open_interest_usd"), hyper.get("open_interest_usd")) if v is not None]
        agg_funding = round(sum(rates) / len(rates), 8) if rates else None
        # Prefer CoinGlass market-wide OI when page SSR is available; else sum known venues.
        agg_oi = round(cg_oi, 2) if cg_oi is not None else (round(sum(ois), 2) if ois else None)

        for signal in block.get("signals", []):
            sid = signal.get("signal_id")
            if sid == "perp_funding_aggregate":
                if agg_funding is not None:
                    signal["funding_rate"] = agg_funding
                if agg_oi is not None:
                    signal["open_interest_usd"] = agg_oi
                signal["source"] = "public_venues+coinglass_page" if cg_oi is not None else "public_venues"
                if panel:
                    signal["venue_panel"] = sorted(panel.keys())
            elif sid == "deribit":
                if deribit.get("funding_rate") is not None:
                    signal["funding_rate"] = deribit["funding_rate"]
                if deribit.get("open_interest_usd") is not None:
                    signal["open_interest_usd"] = deribit["open_interest_usd"]
                signal["source"] = "deribit_public"
            elif sid == "hyperliquid":
                if hyper.get("funding_rate") is not None:
                    signal["funding_rate"] = hyper["funding_rate"]
                if hyper.get("open_interest_usd") is not None:
                    signal["open_interest_usd"] = hyper["open_interest_usd"]
                signal["source"] = "hyperliquid_public"
            elif sid == "etf_flows":
                flow = etf_totals.get(asset)
                if flow is not None:
                    # Encode 1D ETF flow USD in open_interest_usd slot (desk metric column)
                    # and leave funding_rate null — matches column contract without schema break.
                    signal["open_interest_usd"] = flow
                    signal["funding_rate"] = None
                    signal["source"] = etf_asset_source.get(asset, "sosovalue_public")
                    signal["status"] = "live"
                    live_count += 1
                continue
            elif sid == "cf_benchmark":
                _apply_cf_benchmark_limitation(signal)
                continue
            else:
                continue

            if signal.get("funding_rate") is not None or signal.get("open_interest_usd") is not None:
                signal["status"] = "live"
                live_count += 1

    fillable = sum(
        1
        for block in merged.get("assets", {}).values()
        for signal in block.get("signals", [])
        if signal.get("signal_id") in {
            "perp_funding_aggregate",
            "deribit",
            "hyperliquid",
            "etf_flows",
        }
    )
    if live_count == 0:
        merged["data_status"] = "stub"
    elif live_count >= fillable:
        merged["data_status"] = "live"
    else:
        merged["data_status"] = "partial"

    merged["as_of"] = _utc_now()
    merged["tables"] = build_litmus_tables(merged.get("assets", {}))
    lineage = merged.setdefault("lineage", {})
    lineage["api_key_configured"] = api_key_configured()
    lineage["fetched_at"] = _utc_now()
    lineage["fetch_errors"] = errors
    lineage["live_signal_count"] = live_count
    lineage["fallback"] = "public_venues+koyfin_flows+sosovalue"
    lineage["sources_used"] = sorted(set(sources_used))
    lineage["expected_limitations"] = [
        {
            "signal_id": "cf_benchmark",
            "status": "expected_limitation",
            "detail": CF_BENCHMARK_LIMITATION,
        }
    ]
    lineage["notes"] = (
        None
        if live_count
        else "Public venue + Koyfin/SoSoValue flows fallback returned no usable metrics"
    )
    if flows_path:
        lineage["flows_file"] = str(flows_path)
    return merged


def apply_live_metrics(
    doc: dict[str, Any],
    *,
    api_key: str | None = None,
    fetcher: FetchFn | None = None,
    drop_dir: Path | None = None,
    sosovalue_fetch: Callable[[str], float | None] | None = None,
) -> dict[str, Any]:
    """Env-gated CoinGlass fetch; merges funding/OI into stub document.

    Falls back to public Deribit/Hyperliquid + Koyfin/SoSoValue flows when no API key.
    """
    merged = json.loads(json.dumps(doc))
    key = api_key or api_key_from_env()
    errors: list[str] = []
    live_count = 0

    if not key:
        merged["lineage"]["api_key_configured"] = False
        return apply_public_venue_fallback(
            merged, drop_dir=drop_dir, sosovalue_fetch=sosovalue_fetch
        )

    merged["lineage"]["api_key_configured"] = True

    for asset, block in merged.get("assets", {}).items():
        symbol = block.get("symbol") or asset
        pair = block.get("pair") or f"{asset}USDT"

        funding_agg = fetch_coinglass(
            API_PATHS["funding_oi_weight"],
            {"symbol": symbol, "interval": "1h", "limit": 1},
            api_key=key,
            fetcher=fetcher,
        )
        oi_agg = fetch_coinglass(
            API_PATHS["oi_aggregated"],
            {"symbol": symbol, "interval": "1h", "limit": 1},
            api_key=key,
            fetcher=fetcher,
        )
        funding_ex = fetch_coinglass(
            API_PATHS["funding_exchange_list"],
            {"symbol": pair},
            api_key=key,
            fetcher=fetcher,
        )
        oi_ex = fetch_coinglass(
            API_PATHS["oi_exchange_list"],
            {"symbol": pair},
            api_key=key,
            fetcher=fetcher,
        )

        agg_funding = _latest_ohlc_close((funding_agg or {}).get("data"))
        agg_oi = _latest_ohlc_close((oi_agg or {}).get("data"))
        funding_rows = (funding_ex or {}).get("data")
        oi_rows = (oi_ex or {}).get("data")

        if funding_agg is None:
            errors.append(f"{asset}:funding_oi_weight_fetch_failed")
        if oi_agg is None:
            errors.append(f"{asset}:oi_aggregated_fetch_failed")

        for signal in block.get("signals", []):
            sid = signal.get("signal_id")
            if sid == "cf_benchmark":
                _apply_cf_benchmark_limitation(signal)
                continue

            mode = next((d["fetch_mode"] for d in SIGNAL_DEFS if d["signal_id"] == sid), None)
            if mode is None:
                continue

            if mode == "aggregate":
                if agg_funding is not None:
                    signal["funding_rate"] = agg_funding
                if agg_oi is not None:
                    signal["open_interest_usd"] = agg_oi
            elif mode == "exchange":
                exchange = next(
                    (d["exchange"] for d in SIGNAL_DEFS if d["signal_id"] == sid),
                    None,
                )
                if exchange:
                    fr_row = _find_exchange_row(funding_rows, exchange)
                    oi_row = _find_exchange_row(oi_rows, exchange)
                    if fr_row:
                        rate = _exchange_funding_rate(fr_row)
                        if rate is not None:
                            signal["funding_rate"] = rate
                    if oi_row:
                        oi = _exchange_open_interest(oi_row)
                        if oi is not None:
                            signal["open_interest_usd"] = oi

            if signal.get("funding_rate") is not None or signal.get("open_interest_usd") is not None:
                signal["status"] = "live"
                live_count += 1

    # Koyfin first, SoSoValue public for any missing asset (incl. ETH-only gap).
    etf_totals, etf_asset_source, flow_sources, flow_errors, flows_path = resolve_etf_flow_totals(
        drop_dir, sosovalue_fetch=sosovalue_fetch
    )
    errors.extend(flow_errors)
    if etf_totals:
        for asset, block in merged.get("assets", {}).items():
            flow = etf_totals.get(asset)
            if flow is None:
                continue
            for signal in block.get("signals", []):
                if signal.get("signal_id") != "etf_flows":
                    continue
                signal["open_interest_usd"] = flow
                signal["source"] = etf_asset_source.get(asset, "sosovalue_public")
                signal["status"] = "live"
                live_count += 1

    coinglass_slots = sum(
        1
        for block in merged.get("assets", {}).values()
        for signal in block.get("signals", [])
        if signal.get("source") == "coinglass"
        or signal.get("signal_id") in {"perp_funding_aggregate", "deribit", "hyperliquid"}
    )
    if live_count == 0:
        merged["data_status"] = "stub"
        # CoinGlass failed entirely — try public venues
        return apply_public_venue_fallback(
            merged, drop_dir=drop_dir, sosovalue_fetch=sosovalue_fetch
        )
    elif live_count >= max(coinglass_slots, 1):
        merged["data_status"] = "live"
    else:
        merged["data_status"] = "partial"

    merged["as_of"] = _utc_now()
    merged["tables"] = build_litmus_tables(merged.get("assets", {}))
    merged["lineage"]["fetched_at"] = _utc_now()
    merged["lineage"]["fetch_errors"] = errors
    merged["lineage"]["live_signal_count"] = live_count
    merged["lineage"]["sources_used"] = sorted(
        set(list(merged.get("lineage", {}).get("sources_used") or []) + flow_sources)
    )
    merged["lineage"]["expected_limitations"] = [
        {
            "signal_id": "cf_benchmark",
            "status": "expected_limitation",
            "detail": CF_BENCHMARK_LIMITATION,
        }
    ]
    merged["lineage"]["notes"] = None if live_count else "CoinGlass fetch returned no usable metrics"
    if flows_path:
        merged["lineage"]["flows_file"] = str(flows_path)
    return merged


def litmus_rows_for_trade(doc: dict[str, Any], trade_id: str) -> list[dict[str, Any]]:
    for table in doc.get("tables", []):
        if table.get("trade_id") == trade_id:
            return list(table.get("rows", []))
    return []


def validate_crypto_market_doc(doc: Any) -> list[str]:
    errors: list[str] = []
    if not isinstance(doc, dict):
        return ["root: expected object"]

    for key in ("schema_version", "adapter_version", "data_status", "source", "export_id", "assets", "tables"):
        if key not in doc:
            errors.append(f"{key}: required")

    if doc.get("schema_version") != SCHEMA_VERSION:
        errors.append(f"schema_version: expected {SCHEMA_VERSION!r}")
    if doc.get("adapter_version") != ADAPTER_VERSION:
        errors.append(f"adapter_version: expected {ADAPTER_VERSION!r}")
    if doc.get("data_status") not in {"stub", "partial", "live"}:
        errors.append(f"data_status: invalid {doc.get('data_status')!r}")

    assets = doc.get("assets")
    if not isinstance(assets, dict):
        errors.append("assets: expected object")
    else:
        for asset in ("BTC", "ETH"):
            block = assets.get(asset)
            if not isinstance(block, dict):
                errors.append(f"assets.{asset}: required")
                continue
            signals = block.get("signals")
            if not isinstance(signals, list) or len(signals) != len(SIGNAL_DEFS):
                errors.append(f"assets.{asset}.signals: expected {len(SIGNAL_DEFS)} signals")
            else:
                for idx, signal in enumerate(signals):
                    for col in ("signal_id", "signal", "venue", "funding_rate", "open_interest_usd", "status"):
                        if col not in signal:
                            errors.append(f"assets.{asset}.signals[{idx}].{col}: required")

    tables = doc.get("tables")
    if not isinstance(tables, list) or len(tables) != 4:
        errors.append("tables: expected 4 litmus tables (btc/eth basis+calendar)")
    else:
        for idx, table in enumerate(tables):
            if list(table.get("columns", [])) != list(MARKET_SIGNAL_COLUMNS):
                errors.append(f"tables[{idx}].columns: mismatch")

    return errors


def ingest_crypto_market(
    *,
    out_path: Path | None = None,
    force_stub: bool = False,
    fetcher: FetchFn | None = None,
    drop_dir: Path | None = None,
    sosovalue_fetch: Callable[[str], float | None] | None = None,
) -> dict[str, Any]:
    """Ingest CoinGlass (if keyed) or public venues + Koyfin/SoSoValue flows into crypto_market.json."""
    target = Path(out_path or DEFAULT_OUT)
    stub = build_crypto_market_stub()
    if force_stub:
        write_crypto_market_stub(target)
        return build_crypto_market_stub()

    merged = apply_live_metrics(
        stub,
        fetcher=fetcher,
        drop_dir=drop_dir or DEFAULT_DROP,
        sosovalue_fetch=sosovalue_fetch,
    )
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(merged, indent=2) + "\n", encoding="utf-8")
    return merged


def main(argv: list[str] | None = None) -> int:
    import argparse

    parser = argparse.ArgumentParser(description="Ingest CoinGlass perp funding/OI into Litmus crypto_market.json.")
    parser.add_argument(
        "--out",
        type=Path,
        default=DEFAULT_OUT,
        help="Output path for bang_bang_da/litmus/crypto_market.json",
    )
    parser.add_argument(
        "--drop-dir",
        type=Path,
        default=DEFAULT_DROP,
        help="whinfell_drop for Koyfin flows CSV (ETF Flows signal)",
    )
    parser.add_argument(
        "--stub-only",
        action="store_true",
        help="Write typed stub without attempting CoinGlass API fetch",
    )
    args = parser.parse_args(argv)

    if args.stub_only:
        path = write_crypto_market_stub(args.out)
        print(f"wrote stub {path}")
        return 0

    doc = ingest_crypto_market(out_path=args.out, force_stub=False, drop_dir=args.drop_dir)
    live = doc.get("lineage", {}).get("live_signal_count")
    print(
        f"wrote {args.out} data_status={doc.get('data_status')} "
        f"api_key={api_key_configured()} live_signals={live} "
        f"fallback={doc.get('lineage', {}).get('fallback')}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())