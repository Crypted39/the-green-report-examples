"""
Example 2: Latency optimization for search tools

These tests demonstrate how to validate that an LLM agent prioritizes
low-latency search tools for user-facing queries while accepting slower
tools for complex research tasks.
"""

import pytest
from deepeval.test_case import LLMTestCase, ToolCall
from deepeval.metrics import ToolCorrectnessMetric

import sys

sys.path.append('..')
from metrics.tool_efficiency_metric import ToolEfficiencyMetric
from config.tool_config import SEARCH_TOOLS


def test_faq_search_prioritizes_speed():
    """For FAQ queries, users expect instant answers from local index."""
    test_case = LLMTestCase(
        input="What is your return policy?",
        actual_output="Our return policy allows 30-day returns with receipt...",
        expected_output="Our return policy allows 30-day returns...",
        tools_called=[ToolCall(name="local_index")],
        expected_tools=[ToolCall(name="local_index")],
        additional_metadata={"tools_used": ["local_index"]}
    )

    correctness = ToolCorrectnessMetric()

    # For user-facing searches, latency is critical
    efficiency = ToolEfficiencyMetric(
        tool_costs=SEARCH_TOOLS["costs"],
        tool_latencies=SEARCH_TOOLS["latencies"],
        optimal_tool="local_index",
        acceptable_tools=["vector_search"],  # Acceptable if local fails
        threshold=0.8,
        cost_weight=0.2,  # Cost matters less
        latency_weight=0.8  # Speed is critical
    )

    # Measure both metrics
    correctness.measure(test_case)
    efficiency.measure(test_case)

    # Assert both pass
    assert correctness.is_successful()
    assert efficiency.is_successful()


def test_faq_search_detects_slow_tool():
    """Using web search for FAQ queries is inefficient due to latency."""
    test_case = LLMTestCase(
        input="What are your business hours?",
        actual_output="We're open Monday-Friday 9am-5pm EST",
        expected_output="We're open Monday-Friday 9am-5pm EST",
        tools_called=[ToolCall(name="web_search")],
        expected_tools=[ToolCall(name="local_index")],
        additional_metadata={"tools_used": ["web_search"]}  # Too slow for simple FAQ
    )

    correctness = ToolCorrectnessMetric()

    efficiency = ToolEfficiencyMetric(
        tool_costs=SEARCH_TOOLS["costs"],
        tool_latencies=SEARCH_TOOLS["latencies"],
        optimal_tool="local_index",
        acceptable_tools=["vector_search"],
        threshold=0.8,
        cost_weight=0.2,
        latency_weight=0.8
    )

    # Correctness should fail since wrong tool was used
    correctness.measure(test_case)
    # Note: This will likely fail correctness too since web_search != local_index

    # Efficiency should also fail due to poor latency
    efficiency.measure(test_case)
    assert not efficiency.is_successful()
    print(f"\nEfficiency score: {efficiency.score:.2f}")
    print(f"Reason: {efficiency.reason}")


def test_complex_research_accepts_slower_tools():
    """For complex research, deeper tools are contextually appropriate."""
    test_case = LLMTestCase(
        input="Compare the regulatory approaches to AI governance across EU, US, and China",
        actual_output="Detailed comparison of AI regulations across regions...",
        expected_output="Detailed comparison...",
        tools_called=[ToolCall(name="deep_research")],
        expected_tools=[ToolCall(name="deep_research")],
        additional_metadata={"tools_used": ["deep_research"]}
    )

    correctness = ToolCorrectnessMetric()

    # For complex queries, the slower tool is actually optimal
    efficiency = ToolEfficiencyMetric(
        tool_costs=SEARCH_TOOLS["costs"],
        tool_latencies=SEARCH_TOOLS["latencies"],
        optimal_tool="deep_research",  # This task requires depth
        threshold=0.7,
        cost_weight=0.3,
        latency_weight=0.7
    )

    # Measure both metrics
    correctness.measure(test_case)
    efficiency.measure(test_case)

    # Assert both pass
    assert correctness.is_successful()
    assert efficiency.is_successful()


@pytest.mark.parametrize("query,optimal_tool", [
    ("What's your shipping policy?", "local_index"),
    ("How do I reset my password?", "local_index"),
    ("What payment methods do you accept?", "local_index"),
])
def test_common_queries_use_local_index(query, optimal_tool):
    """Common support queries should use the fastest local index."""
    test_case = LLMTestCase(
        input=query,
        actual_output="Relevant answer to the query...",
        expected_output="Answer",
        tools_called=[ToolCall(name=optimal_tool)],
        expected_tools=[ToolCall(name=optimal_tool)],
        additional_metadata={"tools_used": [optimal_tool]}
    )

    efficiency = ToolEfficiencyMetric(
        tool_costs=SEARCH_TOOLS["costs"],
        tool_latencies=SEARCH_TOOLS["latencies"],
        optimal_tool=optimal_tool,
        acceptable_tools=["vector_search"],
        threshold=0.85,
        cost_weight=0.2,
        latency_weight=0.8
    )

    efficiency.measure(test_case)
    assert efficiency.is_successful()


def test_vector_search_acceptable_for_semantic_queries():
    """Vector search is acceptable when semantic understanding is needed."""
    test_case = LLMTestCase(
        input="I need help with something related to canceling my subscription",
        actual_output="Here's how to cancel your subscription...",
        expected_output="Cancellation instructions",
        tools_called=[ToolCall(name="vector_search")],
        expected_tools=[ToolCall(name="vector_search")],
        additional_metadata={"tools_used": ["vector_search"]}  # Semantic search needed
    )

    correctness = ToolCorrectnessMetric()

    # Vector search is optimal for semantic queries
    efficiency = ToolEfficiencyMetric(
        tool_costs=SEARCH_TOOLS["costs"],
        tool_latencies=SEARCH_TOOLS["latencies"],
        optimal_tool="vector_search",
        acceptable_tools=["local_index"],
        threshold=0.75,
        cost_weight=0.3,
        latency_weight=0.7
    )

    # Measure both metrics
    correctness.measure(test_case)
    efficiency.measure(test_case)

    # Assert both pass
    assert correctness.is_successful()
    assert efficiency.is_successful()


if __name__ == "__main__":
    print("Running search tool latency optimization tests...\n")

    # Demo: Fast FAQ search
    print("=" * 60)
    print("Test 1: FAQ using fast local index")
    print("=" * 60)
    test_faq_search_prioritizes_speed()
    print("✓ Test passed: Local index correctly used for FAQ\n")

    # Demo: Slow tool detection
    print("=" * 60)
    print("Test 2: Detecting slow tool for FAQ")
    print("=" * 60)
    test_faq_search_detects_slow_tool()
    print("\n✓ Test correctly detected slow tool for simple query\n")

    # Demo: Appropriate slow tool
    print("=" * 60)
    print("Test 3: Complex research accepts slower tools")
    print("=" * 60)
    test_complex_research_accepts_slower_tools()
    print("✓ Test passed: Deep research appropriate for complex query\n")
