"""Download the two optional animation libraries (pinned versions) into nimbus/static/vendor during the Docker build.
A failed download is not an error: Nimbus simply skips the animations."""
import os
import sys
import urllib.request

LIBS = [
    ("gsap", "gsap.min.js", ["https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js", "https://unpkg.com/gsap@3.13.0/dist/gsap.min.js"]),
    ("fonts", "inter.woff2", ["https://cdn.jsdelivr.net/npm/@fontsource-variable/inter@5.2.8/files/inter-latin-wght-normal.woff2"]),
    ("fonts", "newsreader.woff2", ["https://cdn.jsdelivr.net/npm/@fontsource-variable/newsreader@5.2.8/files/newsreader-latin-wght-normal.woff2"]),
    ("lenis", "lenis.min.js", ["https://cdn.jsdelivr.net/npm/lenis@1.1.21/dist/lenis.min.js", "https://unpkg.com/lenis@1.1.21/dist/lenis.min.js"]),
]
root = sys.argv[1] if len(sys.argv) > 1 else "nimbus/static/vendor"
for folder, name, urls in LIBS:
    os.makedirs(os.path.join(root, folder), exist_ok=True)
    for url in urls:
        try:
            data = urllib.request.urlopen(url, timeout=25).read()
            assert len(data) > 8000 and not data.lstrip().startswith(b"<"), "not a script or font"
            with open(os.path.join(root, folder, name), "wb") as fh:
                fh.write(data)
            print("vendor ok:", url, len(data))
            break
        except Exception as exc:  # noqa: BLE001
            print("vendor skip:", url, exc)
