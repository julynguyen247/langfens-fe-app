import json
import struct

def parse_glb(file_path):
    with open(file_path, 'rb') as f:
        f.read(12)
        chunk_length = struct.unpack('<I', f.read(4))[0]
        f.read(4)
        data = json.loads(f.read(chunk_length).decode('utf-8'))
        
        print("Nodes:")
        for i, n in enumerate(data.get('nodes', [])):
            print(f"Node {i}: {n.get('name')} | translation: {n.get('translation')} | children: {n.get('children')}")
parse_glb('public/models/penguin.glb')
