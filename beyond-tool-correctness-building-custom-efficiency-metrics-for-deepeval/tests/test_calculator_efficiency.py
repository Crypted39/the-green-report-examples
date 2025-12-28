"""
Example 1: Cost-aware calculator selection tests

These tests demonstrate how to validate that an LLM agent selects the most
cost-efficient calculation tool for basic math operations.
"""

import pytest
from deepeval.test_case import LLMTestCase, ToolCall
from deepeval.metrics import ToolCorrectnessMetric

import sys

sys.path.append('..')
from metrics.tool_efficiency_metric import ToolEfficiencyMetric
from config.tool_config import CALCULATOR_TOOLS


@pytest.mark.parametrize("calculation,expected_result", [
    ("What is 25 + 37?", "62"),
    ("Calculate 15% of 240", "36"),
    ("If I have 8 apples and give away 3, how many remain?", "5"),
])
def test_basic_math_uses_efficient_tool(calculation, expected_result):
    """Test that basic math operations use the most cost-efficient tool."""
    # Simulate agent response
    test_case = LLMTestCase(
        input=calculation,
        actual_output=expected_result,
        expected_output=expected_result,
        tools_called=[ToolCall(name="basic_calculator")],
        expected_tools=[ToolCall(name="basic_calculator")],
        additional_metadata={"tools_used": ["basic_calculator"]}
    )

    # Verify correctness
    correctness = ToolCorrectnessMetric()

    # Verify efficiency with strict cost prioritization
    efficiency = ToolEfficiencyMetric(
        tool_costs=CALCULATOR_TOOLS["costs"],
        tool_latencies=CALCULATOR_TOOLS["latencies"],
        optimal_tool="basic_calculator",
        acceptable_tools=[],  # No acceptable alternatives for basic math
        threshold=0.9,  # Strict threshold
        cost_weight=0.8,  # Heavily weight cost
        latency_weight=0.2
    )

    # Measure both metrics
    correctness.measure(test_case)
    efficiency.measure(test_case)

    # Assert both pass
    assert correctness.is_successful()
    assert efficiency.is_successful()


def test_basic_math_detects_inefficient_tool():
    """Test that using expensive tools for simple math is detected as inefficient."""
    test_case = LLMTestCase(
        input="What is 42 * 7?",
        actual_output="294",
        expected_output="294",
        tools_called=[ToolCall(name="wolfram_alpha")],
        expected_tools=[ToolCall(name="basic_calculator")],
        additional_metadata={"tools_used": ["wolfram_alpha"]}
    )

    correctness = ToolCorrectnessMetric()

    efficiency = ToolEfficiencyMetric(
        tool_costs=CALCULATOR_TOOLS["costs"],
        tool_latencies=CALCULATOR_TOOLS["latencies"],
        optimal_tool="basic_calculator",
        threshold=0.9,
        cost_weight=0.8,
        latency_weight=0.2
    )

    # Correctness should fail since wrong tool was used
    correctness.measure(test_case)
    # Note: This will likely fail correctness too since wolfram_alpha != basic_calculator

    # Efficiency should also fail
    efficiency.measure(test_case)
    assert not efficiency.is_successful()
    assert "Suboptimal tool" in efficiency.reason
    print(f"\nEfficiency score: {efficiency.score:.2f}")
    print(f"Reason: {efficiency.reason}")


def test_code_interpreter_acceptable_for_moderate_complexity():
    """Test that code interpreter is acceptable for moderately complex calculations."""
    test_case = LLMTestCase(
        input="Calculate the compound interest on $1000 at 5% annual rate for 3 years",
        actual_output="$1157.63",
        expected_output="$1157.63",
        tools_called=[ToolCall(name="code_interpreter")],
        expected_tools=[ToolCall(name="code_interpreter")],
        additional_metadata={"tools_used": ["code_interpreter"]}
    )

    correctness = ToolCorrectnessMetric()

    # For more complex calculations, code_interpreter is acceptable
    efficiency = ToolEfficiencyMetric(
        tool_costs=CALCULATOR_TOOLS["costs"],
        tool_latencies=CALCULATOR_TOOLS["latencies"],
        optimal_tool="code_interpreter",  # This task warrants it
        acceptable_tools=["wolfram_alpha"],
        threshold=0.7,
        cost_weight=0.6,
        latency_weight=0.4
    )

    # Measure both metrics
    correctness.measure(test_case)
    efficiency.measure(test_case)

    # Assert both pass
    assert correctness.is_successful()
    assert efficiency.is_successful()


if __name__ == "__main__":
    # Run a quick demo
    print("Running calculator efficiency tests...\n")

    # Demo: Optimal selection
    print("=" * 60)
    print("Test 1: Optimal tool selection")
    print("=" * 60)
    test_basic_math_uses_efficient_tool("What is 10 + 5?", "15")
    print("✓ Test passed: Basic calculator correctly selected for simple math\n")

    # Demo: Inefficient selection
    print("=" * 60)
    print("Test 2: Detecting inefficient selection")
    print("=" * 60)
    test_basic_math_detects_inefficient_tool()
    print("\n✓ Test correctly detected inefficient tool selection\n")

    # Demo: Acceptable complexity
    print("=" * 60)
    print("Test 3: Acceptable tool for moderate complexity")
    print("=" * 60)
    test_code_interpreter_acceptable_for_moderate_complexity()
    print("✓ Test passed: Code interpreter appropriate for complex calculation\n")
