"""
Testing Real-World LLM Evaluation Scenarios
"""

import pytest
from evaluation_framework import LLMEvaluator


class TestDataGenerator:
    """Generate various response types for testing LLM evaluations"""

    @staticmethod
    def generate_response(response_type: str) -> str:
        """Generate various response types for testing"""
        responses = {
            # Success cases
            "summary": "The article discusses three main points. First, temperatures have risen. Second, human activities are the cause. Third, immediate action is required.",
            "json": '{"status": "success", "data": {"id": 123}, "message": "Done"}',
            "list": "1. Initialize\n2. Configure\n3. Test\n4. Deploy",

            # Failure cases
            "refusal": "I cannot provide information on that topic.",
            "truncated": "The analysis shows that... [Output truncated]",
            "malformed_json": '{"status": "success", "data": {"id": 123',
            "empty": "",

            # Edge cases
            "special_chars": "Response with @#$% and émojis 🚀",
            "excessive_whitespace": "Text    with\n\n\nirregular    spacing",
            "boundary_length": "x" * 3999
        }
        return responses.get(response_type, "Default response")


class TestLLMEvaluations:
    """Test suite for LLM evaluations"""

    @pytest.fixture
    def evaluator(self):
        return LLMEvaluator()

    @pytest.fixture
    def generator(self):
        return TestDataGenerator()

    def test_json_validation(self, evaluator, generator):
        """Test successful and failed JSON responses"""
        # Test valid JSON
        valid = generator.generate_response("json")
        result = evaluator.evaluate_json_schema(
            valid,
            {"type": "object", "required": ["status"]}
        )
        assert result["passed"] == True

        # Test malformed JSON
        invalid = generator.generate_response("malformed_json")
        result = evaluator.evaluate_json_schema(
            invalid,
            {"type": "object"}
        )
        assert result["passed"] == False
        assert "Invalid JSON" in result["details"]

    @pytest.mark.parametrize("response_type,min_len,max_len,should_pass", [
        ("summary", 50, 500, True),
        ("json", 20, 200, True),
        ("empty", 1, 100, False),
        ("boundary_length", 100, 4000, True),
    ])
    def test_length_constraints(self, evaluator, generator,
                                response_type, min_len, max_len, should_pass):
        """Test various response lengths"""
        response = generator.generate_response(response_type)
        result = evaluator.evaluate_length(response, min_len, max_len)
        assert result["passed"] == should_pass

    @pytest.mark.parametrize("edge_type", [
        "special_chars", "excessive_whitespace", "boundary_length"
    ])
    def test_edge_case_handling(self, evaluator, generator, edge_type):
        """Ensure evaluator handles edge cases gracefully"""
        response = generator.generate_response(edge_type)

        # Should not crash on any input
        evaluations = [
            {"type": "length", "params": {"min_length": 1}},
            {"type": "format", "params": {"pattern": ".*"}}
        ]

        results = evaluator.run_evaluation(response, evaluations)
        assert "results" in results
        assert len(results["results"]) == 2

    def test_complete_workflow(self, evaluator, generator):
        """Test full evaluation pipeline"""
        test_cases = [
            ("summary", [
                {"type": "length", "params": {"min_length": 50, "max_length": 500}},
                {"type": "keywords", "params": {"required": ["main points"]}}
            ]),
            ("json", [
                {"type": "json_schema", "params": {"schema": {"type": "object"}}},
                {"type": "keywords", "params": {"forbidden": ["error"]}}
            ])
        ]

        for response_type, evaluations in test_cases:
            response = generator.generate_response(response_type)
            results = evaluator.run_evaluation(response, evaluations)

            # Verify structure
            assert "all_passed" in results
            assert "summary" in results
            assert len(results["results"]) == len(evaluations)


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v"])