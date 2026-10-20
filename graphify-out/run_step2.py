import json
from graphify.detect import detect
from pathlib import Path

result = detect(Path('.'))
Path('graphify-out/.graphify_detect.json').write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")
print(f"Total files: {result.get('total_files', 0)}")
print(f"Total words: {result.get('total_words', 0)}")
print("Categories:", {k: len(v) for k, v in result.get('files', {}).items()})
