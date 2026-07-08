"""BBDM v2 Chunk 17 — CoinGlass API stub for BTC/ETH Litmus market signals.

Spec §5 market signals (funding + OI): Perp Funding Aggregate, Deribit,
Hyperliquid. CF Benchmark and ETF Flows ship as typed nulls (external sources).
Env-gated live fetch when COINGLASS_API_KEY is set.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Optional

ADAPTER_VERSION = "2.0.0-chunk17"
SCHEMA_VERSION = "2.0.0"
EXPORT_ID = "coinglass_perp_market"
API_BASE = "https://open-api-v4.coinglass.com"
DEFAULT_OUT = Path(__file__).resolve().parents[1] / "bang_bang_da" / "litmus" / "crypto_market.json"

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
        "source": "external",
        "fetch_mode": None,
        "stub_status": "pending_external",
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
    return {
        "signal_id": defn["signal_id"],
        "signal": defn["label"],
        "venue": defn["venue"],
        "funding_rate": None,
        "open_interest_usd": None,
        "status": defn["stub_status"],
        "source": defn["source"],
    }


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


def apply_live_metrics(
    doc: dict[str, Any],
    *,
    api_key: str | None = None,
    fetcher: FetchFn | None = None,
) -> dict[str, Any]:
    """Env-gated CoinGlass fetch; merges funding/OI into stub document."""
    merged = json.loads(json.dumps(doc))
    key = api_key or api_key_from_env()
    errors: list[str] = []
    live_count = 0

    if not key:
        merged["lineage"]["api_key_configured"] = False
        merged["lineage"]["notes"] = "COINGLASS_API_KEY not set — stub retained"
        return merged

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
            mode = next((d["fetch_mode"] for d in SIGNAL_DEFS if d["signal_id"] == signal.get("signal_id")), None)
            if mode is None:
                continue

            if mode == "aggregate":
                if agg_funding is not None:
                    signal["funding_rate"] = agg_funding
                if agg_oi is not None:
                    signal["open_interest_usd"] = agg_oi
            elif mode == "exchange":
                exchange = next(
                    (d["exchange"] for d in SIGNAL_DEFS if d["signal_id"] == signal.get("signal_id")),
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

    coinglass_slots = sum(
        1
        for block in merged.get("assets", {}).values()
        for signal in block.get("signals", [])
        if signal.get("source") == "coinglass"
    )
    if live_count == 0:
        merged["data_status"] = "stub"
    elif live_count >= coinglass_slots:
        merged["data_status"] = "live"
    else:
        merged["data_status"] = "partial"

    merged["as_of"] = _utc_now()
    merged["tables"] = build_litmus_tables(merged.get("assets", {}))
    merged["lineage"]["fetched_at"] = _utc_now()
    merged["lineage"]["fetch_errors"] = errors
    merged["lineage"]["live_signal_count"] = live_count
    merged["lineage"]["notes"] = None if live_count else "CoinGlass fetch returned no usable metrics"
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


def ingest_crypto_market(*, out_path: Path | None = None, force_stub: bool = False, fetcher: FetchFn | None = None) -> dict[str, Any]:
    target = Path(out_path or DEFAULT_OUT)
    stub = build_crypto_market_stub()
    if force_stub or not api_key_configured():
        write_crypto_market_stub(target)
        return build_crypto_market_stub()

    merged = apply_live_metrics(stub, fetcher=fetcher)
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
        "--stub-only",
        action="store_true",
        help="Write typed stub without attempting CoinGlass API fetch",
    )
    args = parser.parse_args(argv)

    if args.stub_only:
        path = write_crypto_market_stub(args.out)
        print(f"wrote stub {path}")
        return 0

    doc = ingest_crypto_market(out_path=args.out, force_stub=False)
    print(f"wrote {args.out} data_status={doc.get('data_status')} api_key={api_key_configured()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())