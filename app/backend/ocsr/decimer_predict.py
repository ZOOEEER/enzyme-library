import json
import sys


def main() -> int:
    if len(sys.argv) < 2:
        print(json.dumps({"ok": False, "error": "Missing image path."}, ensure_ascii=False))
        return 1
    image_path = sys.argv[1]
    try:
        from DECIMER import predict_SMILES  # type: ignore
    except Exception as exc:
        print(json.dumps({
            "ok": False,
            "error": f"DECIMER is not available: {exc}. Source development: run `pixi install`, `pixi run ocsr-install`, and `pixi run ocsr-check`. Packaged app: ensure the OCSR runtime is bundled."
        }, ensure_ascii=False))
        return 1
    try:
        smiles = str(predict_SMILES(image_path) or "").strip()
        if not smiles:
            print(json.dumps({"ok": False, "error": "DECIMER did not return a SMILES string."}, ensure_ascii=False))
            return 1
        print(json.dumps({"ok": True, "smiles": smiles}, ensure_ascii=False))
        return 0
    except Exception as exc:
        print(json.dumps({"ok": False, "error": f"DECIMER recognition failed: {exc}"}, ensure_ascii=False))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
