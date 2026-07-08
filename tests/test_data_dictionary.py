#!/usr/bin/env python3
"""Dictionary lock tests — China Policy + BTC basis routing."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
COUSINS = Path.home() / "Desktop" / "Whinfell_BUILD_Cousins_v2_OLD_2238_ARCHIVE"
for root in (REPO, COUSINS):
    if str(root) not in sys.path:
        sys.path.insert(0, str(root))

from whinfell_pipeline.tests.test_data_dictionary import TestDataDictionary  # noqa: E402


def main() -> int:
    suite = unittest.TestSuite()
    suite.addTest(TestDataDictionary("test_btc_basis_barchart_not_koyfin"))
    suite.addTest(TestDataDictionary("test_term_structure_barchart_not_koyfin"))
    suite.addTest(TestDataDictionary("test_project_structure_matches_tc_repo"))
    suite.addTest(TestDataDictionary("test_china_policy_validation"))
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    if result.wasSuccessful():
        print("PASS test_data_dictionary.py (btc_basis + term_structure + project_structure + china_policy)")
        return 0
    return 1


if __name__ == "__main__":
    raise SystemExit(main())