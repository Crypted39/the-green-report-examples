"""
Comprehensive Example: Combining Correctness and Efficiency Metrics

This example demonstrates how to use ToolCorrectnessMetric and
ToolEfficiencyMetric together for complete tool selection validation.
"""

from deepeval.test_case import LLMTestCase, ToolCall
from deepeval.metrics import ToolCorrectnessMetric

import sys

sys.path.append('..')
from metrics.tool_efficiency_metric import ToolEfficiencyMetric
from config.tool_config import CALCULATOR_TOOLS, get_efficiency_config


def test_comprehensive_tool_selection():
    """
    Complete example showing both correctness and efficiency validation.

    This test validates:
    1. The agent selected a functionally correct tool
    2. The agent selected an efficient tool based on cost and latency
    """

    test_case = LLMTestCase(
        input="What is 15% of 240?",
        actual_output="36",
        expected_output="36",
        tools_called=[ToolCall(name="basic_calculator")],
        expected_tools=[ToolCall(name="basic_calculator")],
        additional_metadata={"tools_used": ["basic_calculator"]}
    )

    # Step 1: Validate functional correctness
    correctness_metric = ToolCorrectnessMetric()

    # Step 2: Validate efficiency
    efficiency_config = get_efficiency_config("cost_critical")
    efficiency_metric = ToolEfficiencyMetric(
        tool_costs=CALCULATOR_TOOLS["costs"],
        tool_latencies=CALCULATOR_TOOLS["latencies"],
        optimal_tool="basic_calculator",
        **efficiency_config
    )

    # Measure both metrics
    correctness_metric.measure(test_case)
    efficiency_metric.measure(test_case)

    print("\n" + "=" * 60)
    print("COMPREHENSIVE TEST RESULTS")
    print("=" * 60)
    print(f"Input: {test_case.input}")
    print(f"Tools used: {test_case.additional_metadata['tools_used']}")
    print(f"\nCorrectness: {'✓ PASS' if correctness_metric.is_successful() else '✗ FAIL'}")
    print(f"Efficiency: {'✓ PASS' if efficiency_metric.is_successful() else '✗ FAIL'}")
    print(f"Efficiency Score: {efficiency_metric.score:.2f}")
    print(f"Reason: {efficiency_metric.reason}")
    print("=" * 60)

    # Assert both pass
    assert correctness_metric.is_successful()
    assert efficiency_metric.is_successful()


def test_correct_but_inefficient():
    """
    Example where the tool is functionally correct but inefficient.

    This demonstrates the value of testing beyond correctness alone.
    """

    test_case = LLMTestCase(
        input="What is 8 + 7?",
        actual_output="15",
        expected_output="15",
        tools_called=[ToolCall(name="wolfram_alpha")],
        expected_tools=[ToolCall(name="basic_calculator")],
        additional_metadata={"tools_used": ["wolfram_alpha"]}  # Correct but expensive
    )

    correctness_metric = ToolCorrectnessMetric()

    efficiency_metric = ToolEfficiencyMetric(
        tool_costs=CALCULATOR_TOOLS["costs"],
        tool_latencies=CALCULATOR_TOOLS["latencies"],
        optimal_tool="basic_calculator",
        threshold=0.9,
        cost_weight=0.8,
        latency_weight=0.2
    )

    # Measure both metrics
    correctness_metric.measure(test_case)
    efficiency_metric.measure(test_case)

    print("\n" + "=" * 60)
    print("CORRECT BUT INEFFICIENT SCENARIO")
    print("=" * 60)
    print(f"Input: {test_case.input}")
    print(f"Tools used: {test_case.additional_metadata['tools_used']}")
    print(f"\nCorrectness: {'✓ PASS' if correctness_metric.is_successful() else '✗ FAIL'}")
    print(f"Efficiency: {'✓ PASS' if efficiency_metric.is_successful() else '✗ FAIL'}")
    print(f"Efficiency Score: {efficiency_metric.score:.2f}")
    print(f"Reason: {efficiency_metric.reason}")
    print("\nThis is why we need efficiency testing!")
    print("=" * 60)


def test_with_multiple_efficiency_profiles():
    """
    Show how the same tool selection is evaluated differently
    under different efficiency profiles.
    """

    test_case = LLMTestCase(
        input="Calculate compound interest: $1000 at 5% for 3 years",
        actual_output="$1157.63",
        expected_output="$1157.63",
        tools_called=[ToolCall(name="code_interpreter")],
        expected_tools=[ToolCall(name="code_interpreter")],
        additional_metadata={"tools_used": ["code_interpreter"]}
    )

    profiles = ["cost_critical", "latency_critical", "balanced"]

    print("\n" + "=" * 60)
    print("SAME TOOL SELECTION, DIFFERENT PROFILES")
    print("=" * 60)
    print(f"Input: {test_case.input}")
    print(f"Tools used: {test_case.additional_metadata['tools_used']}")
    print()

    for profile_name in profiles:
        config = get_efficiency_config(profile_name)

        metric = ToolEfficiencyMetric(
            tool_costs=CALCULATOR_TOOLS["costs"],
            tool_latencies=CALCULATOR_TOOLS["latencies"],
            optimal_tool="basic_calculator",
            acceptable_tools=["code_interpreter"],
            **config
        )

        metric.measure(test_case)

        print(f"\n{profile_name.upper()} Profile:")
        print(f"  Cost Weight: {config['cost_weight']}, Latency Weight: {config['latency_weight']}")
        print(f"  Threshold: {config['threshold']}")
        print(f"  Result: {'✓ PASS' if metric.is_successful() else '✗ FAIL'}")
        print(f"  Score: {metric.score:.2f}")
        print(f"  Reason: {metric.reason}")

    print("\n" + "=" * 60)


def test_cost_calculation_at_scale():
    """
    Demonstrate the financial impact of tool selection at scale.
    """

    # Simulate 10,000 daily calculations
    daily_calculations = 10000

    scenarios = {
        "optimal": "basic_calculator",
        "acceptable": "code_interpreter",
        "wasteful": "wolfram_alpha"
    }

    print("\n" + "=" * 60)
    print("COST IMPACT AT SCALE (10,000 calculations/day)")
    print("=" * 60)

    for scenario_name, tool in scenarios.items():
        daily_cost = CALCULATOR_TOOLS["costs"][tool] * daily_calculations
        annual_cost = daily_cost * 365

        avg_latency = CALCULATOR_TOOLS["latencies"][tool]
        total_daily_latency = avg_latency * daily_calculations / 1000  # Convert to seconds

        print(f"\n{scenario_name.upper()} ({tool}):")
        print(f"  Daily cost: ${daily_cost:.2f}")
        print(f"  Annual cost: ${annual_cost:,.2f}")
        print(f"  Average latency: {avg_latency}ms")
        print(f"  Total daily latency: {total_daily_latency:.1f} seconds")

    # Calculate waste
    optimal_annual = CALCULATOR_TOOLS["costs"]["basic_calculator"] * daily_calculations * 365
    wasteful_annual = CALCULATOR_TOOLS["costs"]["wolfram_alpha"] * daily_calculations * 365
    waste = wasteful_annual - optimal_annual

    print(f"\n{'ANNUAL WASTE' if waste > 0 else 'ANNUAL SAVINGS'}:")
    print(f"  Using wolfram_alpha vs basic_calculator: ${waste:,.2f}")
    print("=" * 60)


if __name__ == "__main__":
    print("\n" + "#" * 60)
    print("# DEEPEVAL TOOL EFFICIENCY: COMPREHENSIVE EXAMPLES")
    print("#" * 60)

    # Example 1: Both metrics pass
    test_comprehensive_tool_selection()

    # Example 2: Correct but inefficient
    test_correct_but_inefficient()

    # Example 3: Different profiles
    test_with_multiple_efficiency_profiles()

    # Example 4: Cost analysis
    test_cost_calculation_at_scale()

    print("\n" + "#" * 60)
    print("# All examples completed!")
    print("#" * 60 + "\n")
