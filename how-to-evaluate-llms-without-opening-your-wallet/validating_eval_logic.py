import pytest
from evaluation_framework import LLMEvaluator


class TestEvaluationValidation:
    @pytest.fixture
    def evaluator(self):
        """Create an evaluator instance for testing"""
        return LLMEvaluator()

    def test_known_good_bad_pairs(self, evaluator):
        """Validate evaluator with known outcomes"""
        test_pairs = [
            # (response, evaluation_config, must_pass)
            ('{"valid": "json"}',
             {"type": "json_schema", "params": {"schema": {"type": "object"}}},
             True),
            ('invalid json',
             {"type": "json_schema", "params": {"schema": {"type": "object"}}},
             False),
            ('Contains required keyword',
             {"type": "keywords", "params": {"required": ["required"]}},
             True),
            ('Missing keyword',
             {"type": "keywords", "params": {"required": ["required"]}},
             False),
        ]

        for response, config, must_pass in test_pairs:
            result = evaluator.run_evaluation(response, [config])
            assert result["all_passed"] == must_pass, \
                f"Evaluation logic error: {config['type']} gave wrong result"

    def test_cross_validation_consistency(self, evaluator):
        """Ensure related evaluations agree"""
        json_response = '{"name": "test", "count": 5}'

        # These should all pass for valid JSON
        evaluations = [
            {"type": "json_schema", "params": {"schema": {"type": "object"}}},
            {"type": "format", "params": {"pattern": r"^\{.*\}$"}},
            {"type": "keywords", "params": {"required": ["name", "count"]}}
        ]

        results = evaluator.run_evaluation(json_response, evaluations)
        assert results["all_passed"], "Valid JSON failed cross-validation"

        # All should agree the response is valid
        assert all(r["passed"] for r in results["results"])


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
