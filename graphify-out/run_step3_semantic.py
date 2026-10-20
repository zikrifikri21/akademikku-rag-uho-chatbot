import json
from pathlib import Path

# Write empty/base semantic output
Path('graphify-out/.graphify_semantic.json').write_text(
    json.dumps({'nodes': [], 'edges': [], 'hyperedges': [], 'input_tokens': 0, 'output_tokens': 0}),
    encoding='utf-8'
)
print("Semantic placeholder written.")
