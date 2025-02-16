import pytest


def pytest_addoption(parser):
    parser.addoption(
        "--env", action="store", default="default", help="Environment to run tests in"
    )

def pytest_runtest_setup(item):
    env = item.config.getoption("--env")
    marker = item.get_closest_marker("env_specific")
    if marker:  # Check if the marker exists
        allowed_envs = marker.args[0]
        if env not in allowed_envs:
            pytest.skip(f"Skipping test for environment: {env}. Allowed environments are: {allowed_envs}")
    # else:  # Optional: Handle cases where no env_specific marker is present
    #     print("No env_specific marker found. Running test.") # Or skip, or do nothing
