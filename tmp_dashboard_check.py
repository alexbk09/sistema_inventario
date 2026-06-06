import re
import pathlib
import subprocess

root = pathlib.Path('.')
pages = [
    root / 'resources/js/Pages/Admin/Dashboard.jsx',
    root / 'resources/js/Pages/Dashboard.jsx',
    root / 'resources/js/Pages/Customer/Dashboard.jsx',
]
regex = re.compile(r"t\(['\"]([^'\"]+)['\"]\s*,?")
keys = set()
for page in pages:
    text = page.read_text(encoding='utf-8')
    matches = regex.findall(text)
    print(f'PAGE {page}: {len(matches)} matched keys, {len(set(matches))} unique')
    keys.update(matches)
print(f'TOTAL UNIQUE KEYS: {len(keys)}')
for lang_dir in sorted((root / 'resources/lang').iterdir()):
    if not lang_dir.is_dir():
        continue
    app_file = lang_dir / 'app.php'
    if not app_file.exists():
        continue
    missing = []
    for key in sorted(keys):
        php_code = (
            "$translations = include '" + str(app_file).replace("'", "\\'") + "';"
            " $parts = explode('.', '" + key + "');"
            " $node = $translations;"
            " $found = true;"
            " foreach ($parts as $part) {"
            "     if (is_array($node) && array_key_exists($part, $node)) {"
            "         $node = $node[$part];"
            "     } else { $found = false; break; }"
            " }"
            " echo $found ? '1' : '0';"
        )
        result = subprocess.run(['php', '-r', php_code], capture_output=True, text=True)
        if result.returncode != 0 or result.stdout.strip() != '1':
            missing.append(key)
    print(f'LANG {lang_dir.name}: {len(missing)} missing keys')
    for key in missing:
        print(f' MISSING {key}')
