import json
import os

with open("test_config.json") as f:
    test_config = json.load(f)

current_env = os.getenv("TEST_ENV")

if "testB" in test_config[current_env]:
    def testB():
        assert True
