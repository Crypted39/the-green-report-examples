import pytest

@pytest.mark.env_specific(["dev", "qa"])
def test_feature_x():
    print("Running test_feature_x")  # Add a print statement for clarity
    assert True

@pytest.mark.env_specific(["qa", "perf"])
def test_feature_y():
    print("Running test_feature_y")  # Add a print statement for clarity
    assert True

def test_feature_z(): # This test should run regardless of the env because it has no marker
    print("Running test_feature_z")  # Add a print statement for clarity
    assert True