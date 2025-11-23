import pytest


class MockLLM:
    def __init__(self, responses=None):
        self.responses = responses or {}
        self.call_count = 0
        self.history = []

    def complete(self, prompt, **kwargs):
        """Simulate an LLM completion"""
        self.history.append({"prompt": prompt, "kwargs": kwargs})
        self.call_count += 1

        # Return predefined response or generate based on prompt
        if prompt in self.responses:
            return self.responses[prompt]

        # Default response structure
        return {
            "choices": [{
                "message": {
                    "content": f"Mock response for: {prompt[:50]}..."
                }
            }],
            "usage": {"total_tokens": 100}
        }


@pytest.fixture
def mock_llm():
    """Pytest fixture for mock LLM"""
    return MockLLM({
        "test prompt": {"choices": [{"message": {"content": "Expected response"}}]},
        "json prompt": {"choices": [{"message": {"content": '{"key": "value"}'}}]}
    })


def test_llm_evaluation(mock_llm):
    response = mock_llm.complete("test prompt")
    assert response["choices"][0]["message"]["content"] == "Expected response"
    assert mock_llm.call_count == 1