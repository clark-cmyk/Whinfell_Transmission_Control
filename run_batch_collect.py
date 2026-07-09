#!/usr/bin/env python3
"""CLI entrypoint — delegates to whinfell_pipeline.batch_collect."""
from whinfell_pipeline.batch_collect import main

if __name__ == "__main__":
    raise SystemExit(main())