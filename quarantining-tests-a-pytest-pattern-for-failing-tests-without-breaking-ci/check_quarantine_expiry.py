"""
check_quarantine_expiry.py

Run this after your test suite to verify no quarantined test has
outlived its expiry date. Exits with status 1 if any are found.
"""
import sys
from datetime import date

import pytest


class ExpiryCollector:
    def __init__(self):
        self.expired = []

    def pytest_collection_modifyitems(self, items):
        for item in items:
            marker = item.get_closest_marker("quarantine")
            if marker:
                expires = date.fromisoformat(marker.kwargs["expires"])
                if expires < date.today():
                    self.expired.append(
                        (item.nodeid, marker.kwargs.get("ticket", "no ticket"))
                    )


def main():
    collector = ExpiryCollector()
    pytest.main(["--collect-only", "-q"], plugins=[collector])

    if collector.expired:
        print("\nThe following quarantined tests have expired:")
        for nodeid, ticket in collector.expired:
            print(f"  {nodeid} (ticket: {ticket})")
        sys.exit(1)

    print("No expired quarantined tests found.")
    sys.exit(0)


if __name__ == "__main__":
    main()
