"""
Example 3: Context-appropriate tool complexity matching

These tests demonstrate how to validate that an LLM agent matches tool
sophistication to task complexity, avoiding both over-engineering and
under-engineering.
"""

import pytest
from deepeval import assert_test
from deepeval.test_case import LLMTestCase
from deepeval.metrics import ToolCorrectnessMetric

import sys

sys.path.append('..')
from metrics.tool_efficiency_metric import ContextualComplexityMetric
from config.tool_config import DATA_TOOLS


def test_simple_filtering_avoids_overengineering():
    """Simple data filtering shouldn't trigger ML pipelines."""
    test_case = LLMTestCase(
        input="Show me all orders from last week",
        actual_output="Here are 47 orders from last week...",
        expected_output="Orders from last week",
        additional_metadata={"tools_used": ["simple_filter"]}
    )

    efficiency = ContextualComplexityMetric(
        task_complexity="simple",
        tool_costs=DATA_TOOLS["costs"],
        tool_latencies=DATA_TOOLS["latencies"],
        optimal_tool="simple_filter",
        acceptable_tools=["sql_query"],
        threshold=0.85,
        cost_weight=0.5,
        latency_weight=0.5
    )

    efficiency.measure(test_case)
    assert efficiency.is_successful()


def test_simple_task_detects_overengineering():
    """Using ML pipeline for simple filtering is overengineered."""
    test_case = LLMTestCase(
        input="Show me orders over $100",
        actual_output="Here are 23 orders over $100...",
        expected_output="Orders over $100",
        additional_metadata={"tools_used": ["ml_pipeline"]}  # Way overkill
    )

    efficiency = ContextualComplexityMetric(
        task_complexity="simple",
        tool_costs=DATA_TOOLS["costs"],
        tool_latencies=DATA_TOOLS["latencies"],
        optimal_tool="simple_filter",
        acceptable_tools=["sql_query"],
        threshold=0.85,
        cost_weight=0.5,
        latency_weight=0.5
    )

    efficiency.measure(test_case)
    assert not efficiency.is_successful()
    assert "Complexity mismatch" in efficiency.reason
    print(f"\nEfficiency score: {efficiency.score:.2f}")
    print(f"Reason: {efficiency.reason}")


def test_analytics_query_uses_appropriate_tool():
    """Analytical queries need SQL, not simple filters."""
    test_case = LLMTestCase(
        input="What's the average order value by customer segment over the last quarter?",
        actual_output="Average order values: Premium=$342, Standard=$156, Basic=$89",
        expected_output="Average order values by segment",
        additional_metadata={"tools_used": ["sql_query"]}
    )

    efficiency = ContextualComplexityMetric(
        task_complexity="moderate",
        tool_costs=DATA_TOOLS["costs"],
        tool_latencies=DATA_TOOLS["latencies"],
        optimal_tool="sql_query",
        acceptable_tools=["data_warehouse"],
        threshold=0.75,
        cost_weight=0.4,
        latency_weight=0.6
    )

    efficiency.measure(test_case)
    assert efficiency.is_successful()


def test_underengineered_solution_detected():
    """Complex analytics shouldn't use simple filters."""
    test_case = LLMTestCase(
        input="Predict next quarter's revenue based on historical trends and seasonal patterns",
        actual_output="Estimated revenue: $1.2M",
        expected_output="Revenue prediction",
        additional_metadata={"tools_used": ["simple_filter"]}  # Way too simple for this task
    )

    efficiency = ContextualComplexityMetric(
        task_complexity="advanced",
        tool_costs=DATA_TOOLS["costs"],
        tool_latencies=DATA_TOOLS["latencies"],
        optimal_tool="ml_pipeline",
        threshold=0.8,
        cost_weight=0.3,
        latency_weight=0.7
    )

    efficiency.measure(test_case)
    assert not efficiency.is_successful()
    assert "Complexity mismatch" in efficiency.reason
    print(f"\nEfficiency score: {efficiency.score:.2f}")
    print(f"Reason: {efficiency.reason}")


def test_ml_pipeline_appropriate_for_predictions():
    """ML pipeline is correct tool for predictive analytics."""
    test_case = LLMTestCase(
        input="Which customers are most likely to churn in the next 30 days?",
        actual_output="High churn risk customers: ID 1234, 5678, 9012...",
        expected_output="Churn prediction list",
        additional_metadata={"tools_used": ["ml_pipeline"]}
    )

    efficiency = ContextualComplexityMetric(
        task_complexity="advanced",
        tool_costs=DATA_TOOLS["costs"],
        tool_latencies=DATA_TOOLS["latencies"],
        optimal_tool="ml_pipeline",
        threshold=0.8,
        cost_weight=0.3,
        latency_weight=0.7
    )

    efficiency.measure(test_case)
    assert efficiency.is_successful()


@pytest.mark.parametrize("task,complexity,optimal_tool", [
    ("Show orders from customer #123", "simple", "simple_filter"),
    ("Calculate total revenue per product category", "moderate", "sql_query"),
    ("Identify purchasing patterns across customer segments", "complex", "data_warehouse"),
    ("Forecast inventory needs based on sales trends", "advanced", "ml_pipeline"),
])
def test_complexity_matching(task, complexity, optimal_tool):
    """Test that various tasks are matched with appropriately complex tools."""
    test_case = LLMTestCase(
        input=task,
        actual_output="Relevant data result...",
        expected_output="Result",
        additional_metadata={"tools_used": [optimal_tool]}
    )

    efficiency = ContextualComplexityMetric(
        task_complexity=complexity,
        tool_costs=DATA_TOOLS["costs"],
        tool_latencies=DATA_TOOLS["latencies"],
        optimal_tool=optimal_tool,
        threshold=0.75,
        cost_weight=0.5,
        latency_weight=0.5
    )

    efficiency.measure(test_case)
    assert efficiency.is_successful()


def test_data_warehouse_for_complex_analytics():
    """Complex multi-table analytics should use data warehouse."""
    test_case = LLMTestCase(
        input="Analyze correlation between marketing spend, customer acquisition, and lifetime value across all channels",
        actual_output="Correlation analysis: Email ROI 3.2x, Social 2.1x, Search 4.5x...",
        expected_output="Marketing ROI analysis",
        additional_metadata={"tools_used": ["data_warehouse"]}
    )

    efficiency = ContextualComplexityMetric(
        task_complexity="complex",
        tool_costs=DATA_TOOLS["costs"],
        tool_latencies=DATA_TOOLS["latencies"],
        optimal_tool="data_warehouse",
        acceptable_tools=["ml_pipeline"],
        threshold=0.75,
        cost_weight=0.4,
        latency_weight=0.6
    )

    efficiency.measure(test_case)
    assert efficiency.is_successful()


if __name__ == "__main__":
    print("Running contextual complexity matching tests...\n")

    # Demo: Appropriate simple tool
    print("=" * 60)
    print("Test 1: Simple task uses simple tool")
    print("=" * 60)
    test_simple_filtering_avoids_overengineering()
    print("✓ Test passed: Simple filter correctly used for basic query\n")

    # Demo: Overengineering detection
    print("=" * 60)
    print("Test 2: Detecting overengineering")
    print("=" * 60)
    test_simple_task_detects_overengineering()
    print("\n✓ Test correctly detected overengineered solution\n")

    # Demo: Underengineering detection
    print("=" * 60)
    print("Test 3: Detecting underengineering")
    print("=" * 60)
    test_underengineered_solution_detected()
    print("\n✓ Test correctly detected underengineered solution\n")

    # Demo: Appropriate ML pipeline
    print("=" * 60)
    print("Test 4: ML pipeline appropriate for predictions")
    print("=" * 60)
    test_ml_pipeline_appropriate_for_predictions()
    print("✓ Test passed: ML pipeline correctly used for predictive task\n")
