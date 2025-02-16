import pytest
import os

ENVS = ["dev", "qa"] if os.getenv("TEST_ENV") == "perf" else ["dev", "qa", "perf"]

@pytest.mark.parametrize("env", ENVS)
def test_feature_x(env):
    assert env in ["dev", "qa"]
