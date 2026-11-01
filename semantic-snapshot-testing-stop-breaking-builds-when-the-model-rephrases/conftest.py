from pathlib import Path

import pytest

from semantic_snapshot import SemanticSnapshot


def pytest_addoption(parser):
    parser.addoption(
        "--update-snapshots",
        action="store_true",
        default=False,
        help="Re-record every semantic snapshot with the response the test received.",
    )


@pytest.fixture
def semantic_snapshot(request):
    directory = Path(request.fspath).parent / "snapshots"
    return SemanticSnapshot(directory, update=request.config.getoption("--update-snapshots"))
