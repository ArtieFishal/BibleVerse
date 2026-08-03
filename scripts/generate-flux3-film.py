#!/usr/bin/env python3
"""Generate BibleVerse contest short-film shots via Nous Portal FLUX 3 gateway."""

from __future__ import annotations

import asyncio
import json
import os
import shutil
import sys

HERMES = os.path.expanduser("~/.hermes/hermes-agent")
sys.path.insert(0, HERMES)

from tools.flux3_video_tool import (  # noqa: E402
    _handle_get_result,
    _handle_text_to_video,
)

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "exports", "flux3-short-film")
OUT_DIR = os.path.abspath(OUT_DIR)

SHOTS = [
    {
        "name": "shot1-arrive",
        "duration": 18,
        "prompt": (
            "Photoreal cinematic short film, 18 seconds, golden-hour Sea of Galilee shoreline. "
            "Camera walks beside Jesus of Nazareth — warm brown hair, beard, simple cream linen robe — "
            "moving left-to-right along wet sand. Lateral tracking shot, not zoom. Soft orange rim light, "
            "gentle waves, footprints forming. Intimate, reverent, quiet awe. Photoreal, 35mm anamorphic, "
            "natural audio of surf and breeze. No crowd, no disciples, no modern objects, no on-screen text. No music."
        ),
    },
    {
        "name": "shot2-question",
        "duration": 18,
        "prompt": (
            "Photoreal cinematic short film continuation, 18 seconds. Close medium shot walking beside "
            "Jesus on a golden-hour beach. Camera slows; Jesus gently turns toward the viewer with "
            "compassionate eyes. Soft spoken human voice asks: \"Lord, am I alone in this?\" Native "
            "dialogue plus quiet surf. Warm backlight, shallow depth of field, intimate and emotional, "
            "no text, no crowd, no disciples."
        ),
    },
    {
        "name": "shot3-answer",
        "duration": 18,
        "prompt": (
            "Photoreal cinematic short film finale, 18 seconds. Jesus walking the Galilee shore at "
            "golden hour answers softly: \"You are not alone. Walk with me.\" Then cut to close-up of "
            "footprints in wet sand as a gentle wave washes over them, warm sunset reflection on water. "
            "Native voice plus surf. Reverent, goosebumps, photoreal, no text, no logos, no crowd."
        ),
    },
]


def find_key(obj, keys=("id", "job_id", "saved_path")):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in keys and isinstance(v, str) and v.strip():
                return k, v
            found = find_key(v, keys)
            if found:
                return found
    elif isinstance(obj, list):
        for item in obj:
            found = find_key(item, keys)
            if found:
                return found
    return None


async def generate_shot(shot: dict) -> str | None:
    dest = os.path.join(OUT_DIR, f"{shot['name']}.mp4")
    if os.path.exists(dest) and os.path.getsize(dest) > 1000:
        print(f"[skip] exists {dest}", flush=True)
        return dest

    print(f"[submit] {shot['name']}", flush=True)
    raw = await _handle_text_to_video(
        {
            "prompt": shot["prompt"],
            "aspect_ratio": "16:9",
            "duration": shot["duration"],
            "resolution": "720p",
            "generate_audio": True,
            "grounding": False,
        }
    )
    print(raw[:2500], flush=True)
    data = json.loads(raw)
    if "error" in data:
        print(f"[error] submit failed: {data.get('error')}", flush=True)
        return None

    found = find_key(data, ("id", "job_id"))
    if not found:
        print("[error] no job id", flush=True)
        return None
    job_id = found[1]
    print(f"[job] {job_id}", flush=True)

    for attempt in range(10):
        print(f"[poll] {shot['name']} attempt {attempt + 1}", flush=True)
        raw2 = await _handle_get_result({"id": job_id, "save_to": dest})
        print(raw2[:2500], flush=True)
        data2 = json.loads(raw2)
        if os.path.exists(dest) and os.path.getsize(dest) > 1000:
            print(f"[done] {dest}", flush=True)
            return dest

        saved = find_key(data2, ("saved_path",))
        if saved and os.path.exists(saved[1]):
            shutil.copy2(saved[1], dest)
            print(f"[copied] {dest}", flush=True)
            return dest

        err = data2.get("error")
        if err and not data2.get("transport_error"):
            details = data2.get("details") or {}
            status = details.get("status") if isinstance(details, dict) else None
            # still generating messages may include guidance without hard fail
            if status in ("Error", "Request Moderated", "Content Moderated", "Task not found"):
                print(f"[terminal] {status}: {err}", flush=True)
                return None
            if "sign in" in str(err).lower() or "refused" in str(err).lower():
                if "still" not in str(err).lower() and "wait" not in str(err).lower():
                    print(f"[error] {err}", flush=True)
                    return None

    print(f"[timeout] {shot['name']}", flush=True)
    return None


async def main() -> int:
    os.makedirs(OUT_DIR, exist_ok=True)
    args = sys.argv[1:]
    results = []
    for shot in SHOTS:
        if args:
            aliases = {shot["name"], shot["name"].split("-")[0]}
            if not any(a in args for a in aliases):
                continue
        path = await generate_shot(shot)
        results.append((shot["name"], path))

    print("\n=== SUMMARY ===", flush=True)
    for name, path in results:
        print(f"{name}: {path or 'FAILED'}", flush=True)

    ok = [p for _, p in results if p]
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
