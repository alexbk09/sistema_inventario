import re
from pathlib import Path
path = Path(r'c:\xampp\htdocs\sistema_inventario\resources\js\Pages\Admin\Settings\Index.jsx')
text = path.read_text(encoding='utf-8')
lines = text.splitlines()
start = 1632
end = 2245
segment = '\n'.join(lines[start-1:end])
clean = re.sub(r'{[^{}]*}', ' ', segment)
pattern = re.compile(r'<(/?)([A-Za-z0-9_.$-]+)([^>]*)>|<(>)|</>')
stack=[]
for i, line in enumerate(clean.splitlines(), start=start):
    for m in pattern.finditer(line):
        full = m.group(0)
        tag = m.group(2)
        if full.startswith('</'):
            if not stack:
                print('Unmatched close', full, 'at line', i)
            else:
                top = stack.pop()
                if top != tag:
                    print('Mismatch close', full, 'expected </%s> at line %d, stack top was <%s>' % (top, i, top))
        else:
            if full.endswith('/>') or full.lower().startswith('<input') or full.lower().startswith('<br') or full.lower().startswith('<img') or full.lower().startswith('<textarea') or full.lower().startswith('<select') or full.lower().startswith('<option'):
                continue
            stack.append(tag)
print('stack end', stack)
