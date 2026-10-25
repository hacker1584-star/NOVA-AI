FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    NIMBUS_DATA_DIR=/data \
    NIMBUS_HOST=0.0.0.0

WORKDIR /app
COPY pyproject.toml README.md extra_providers.json* ./
COPY nimbus ./nimbus
COPY fetch_vendor.py ./
# Optional animation libraries (GSAP and Lenis, pinned versions). If a download fails the build still succeeds and the app just skips the animations.
RUN python fetch_vendor.py || true
RUN pip install ".[analysis]" \
 && useradd --create-home --uid 10001 nimbus \
 && mkdir -p /data && chown nimbus:nimbus /data

USER nimbus
VOLUME ["/data"]
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD python -c "import os,urllib.request as u; u.urlopen('http://127.0.0.1:%s/api/health' % (os.environ.get('NIMBUS_PORT') or os.environ.get('PORT') or '8000'), timeout=4)"

CMD ["nimbus", "serve"]
