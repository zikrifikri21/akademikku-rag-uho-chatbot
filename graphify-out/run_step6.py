import json
from pathlib import Path
from graphify.export import to_html

graph_data = json.loads(Path('graphify-out/graph.json').read_text(encoding="utf-8"))
to_html(graph_data, 'graphify-out/graph.html')
print("HTML visualization generated at graphify-out/graph.html")
