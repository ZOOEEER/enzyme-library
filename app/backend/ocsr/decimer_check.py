import json


def main() -> int:
    try:
        from DECIMER import predict_SMILES  # type: ignore
    except Exception as exc:
        print(json.dumps({
            "ok": False,
            "error": f"DECIMER is not available: {exc}"
        }, ensure_ascii=False))
        return 1
    print(json.dumps({
        "ok": True,
        "engine": "DECIMER",
        "predictor": getattr(predict_SMILES, "__name__", "predict_SMILES")
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
