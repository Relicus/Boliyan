
import xml.etree.ElementTree as ET
import re
import sys

def parse_path(d):
    # Very basic path parser to find approximate bounding box
    # Extracts all numbers from the path data
    nums = [float(x) for x in re.findall(r'-?\d*\.?\d+(?:e[-+]?\d+)?', d)]
    points = []
    # This is a heuristic: usually points come in pairs, but commands vary.
    # We just want the min/max of all coordinates found.
    # It's not perfect but works for general translate cropping.
    # Since transforms are applied, we need to handle that too.
    return nums

def get_transform(el):
    trans = el.get('transform')
    dx, dy = 0, 0
    if trans and 'translate' in trans:
        # extract x, y
        match = re.search(r'translate\(([^,]+),([^)]+)\)', trans)
        if match:
            dx = float(match.group(1))
            dy = float(match.group(2))
    return dx, dy

svg_path = r'd:\VSCode\Boliyan\apps\web\public\mayaar-icon.svg'
out_path = r'd:\VSCode\Boliyan\apps\web\public\mayaar-icon-optimized.svg'

try:
    tree = ET.parse(svg_path)
    root = tree.getroot()
    
    # Register namespace to avoid ns0: prefixes
    ET.register_namespace('', "http://www.w3.org/2000/svg")

    min_x, min_y = float('inf'), float('inf')
    max_x, max_y = float('-inf'), float('-inf')

    # Update colors and find bounds
    for path in root.findall('.//{http://www.w3.org/2000/svg}path'):
        # Change color
        path.set('fill', '#2563eb')
        
        # Calculate bounds (Naive approach: just grab all points + translate)
        d = path.get('d', '')
        dx, dy = get_transform(path)
        
        coords = parse_path(d)
        
        # Treat even indices as X, odd as Y (approximation)
        xs = [coords[i] + dx for i in range(0, len(coords), 2)]
        ys = [coords[i] + dy for i in range(1, len(coords), 2)]
        
        if xs:
            min_x = min(min_x, min(xs))
            max_x = max(max_x, max(xs))
        if ys:
            min_y = min(min_y, min(ys))
            max_y = max(max_y, max(ys))

    # Add some padding
    padding = 10
    min_x -= padding
    min_y -= padding
    max_x += padding
    max_y += padding
    
    width = max_x - min_x
    height = max_y - min_y
    
    # Update viewBox
    root.set('viewBox', f"{min_x} {min_y} {width} {height}")
    root.set('width', str(width))
    root.set('height', str(height))
    
    tree.write(out_path)
    print(f"Optimized SVG saved to {out_path}")
    print(f"New viewBox: {min_x} {min_y} {width} {height}")

except Exception as e:
    print(f"Error: {e}")
