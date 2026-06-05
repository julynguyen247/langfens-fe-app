import json
import struct

def parse_glb(file_path):
    with open(file_path, 'rb') as f:
        magic = f.read(4)
        if magic != b'glTF':
            print("Not a GLB file")
            return
        
        version = struct.unpack('<I', f.read(4))[0]
        length = struct.unpack('<I', f.read(4))[0]
        
        chunk_length = struct.unpack('<I', f.read(4))[0]
        chunk_type = f.read(4)
        
        if chunk_type != b'JSON':
            print("First chunk is not JSON")
            return
            
        json_data = f.read(chunk_length)
        data = json.loads(json_data.decode('utf-8'))
        
        print("Meshes:")
        if 'meshes' in data:
            for i, mesh in enumerate(data['meshes']):
                print(f"Mesh {i}: {mesh.get('name', 'Unnamed')}")
                
        print("\nNodes:")
        if 'nodes' in data:
            for i, node in enumerate(data['nodes']):
                mesh_idx = node.get('mesh')
                mesh_str = f"(Mesh {mesh_idx})" if mesh_idx is not None else ""
                print(f"Node {i}: {node.get('name', 'Unnamed')} {mesh_str}")

parse_glb('public/models/penguin.glb')
