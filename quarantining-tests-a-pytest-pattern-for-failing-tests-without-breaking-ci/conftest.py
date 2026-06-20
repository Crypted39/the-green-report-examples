import pytest


def pytest_collection_modifyitems(config, items):
    for item in items:
        marker = item.get_closest_marker("quarantine")
        if marker:
            reason = marker.kwargs.get("reason", "Quarantined test")
            item.add_marker(pytest.mark.xfail(reason=reason, strict=False))
