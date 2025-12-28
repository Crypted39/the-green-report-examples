"""
ToolEfficiencyMetric: Custom DeepEval metric for measuring tool selection efficiency

This metric extends DeepEval's testing capabilities to evaluate not just whether
an LLM agent selected a functionally correct tool, but whether it selected an
optimal tool based on cost and performance efficiency.
"""

from deepeval.metrics import BaseMetric
from deepeval.test_case import LLMTestCase
from typing import List, Dict, Optional


class ToolEfficiencyMetric(BaseMetric):
    """
    Evaluates the efficiency of tool selection based on cost and latency.
    
    Args:
        tool_costs: Dictionary mapping tool names to their cost per execution
        tool_latencies: Dictionary mapping tool names to their latency in milliseconds
        optimal_tool: The name of the optimal tool for this scenario
        acceptable_tools: List of tool names that are acceptable alternatives
        threshold: Score threshold for success (0.0 to 1.0)
        cost_weight: Weight for cost efficiency in final score (0.0 to 1.0)
        latency_weight: Weight for latency efficiency in final score (0.0 to 1.0)
    """

    def __init__(
            self,
            tool_costs: Dict[str, float],
            tool_latencies: Dict[str, float],
            optimal_tool: str,
            acceptable_tools: Optional[List[str]] = None,
            threshold: float = 0.7,
            cost_weight: float = 0.5,
            latency_weight: float = 0.5
    ):
        self.tool_costs = tool_costs
        self.tool_latencies = tool_latencies
        self.optimal_tool = optimal_tool
        self.acceptable_tools = acceptable_tools or []
        self.threshold = threshold
        self.cost_weight = cost_weight
        self.latency_weight = latency_weight

        # Initialize required properties for DeepEval
        self.success = False
        self.score = 0.0
        self.reason = None

    def measure(self, test_case: LLMTestCase) -> float:
        """
        Measure the efficiency of tool selection in the test case.
        
        Returns:
            Float score between 0.0 and 1.0
        """
        # Get tools from additional_metadata
        if hasattr(test_case, 'additional_metadata') and test_case.additional_metadata:
            actual_tools = test_case.additional_metadata.get("tools_used", [])
        else:
            actual_tools = []

        if not actual_tools:
            self.success = False
            self.score = 0.0
            self.reason = "No tools were used"
            return self.score

        # Get the primary tool used (first in the list)
        primary_tool = actual_tools[0]

        # Calculate efficiency scores
        cost_score = self._calculate_cost_score(primary_tool)
        latency_score = self._calculate_latency_score(primary_tool)

        # Weighted combination
        self.score = (
                self.cost_weight * cost_score +
                self.latency_weight * latency_score
        )

        # Determine success and reason
        self.success = self.score >= self.threshold
        self.reason = self._generate_reason(primary_tool, cost_score, latency_score)

        return self.score

    def _calculate_cost_score(self, tool: str) -> float:
        actual_cost = self.tool_costs.get(tool, float('inf'))
        optimal_cost = self.tool_costs.get(self.optimal_tool, 0)

        if actual_cost == 0 and optimal_cost == 0:
            return 1.0

        if actual_cost == float('inf'):
            return 0.0

        # If actual tool is free but optimal costs money, that's suboptimal
        # (using wrong tool even though it's cheaper)
        if actual_cost == 0 and optimal_cost > 0:
            return 0.0

        # If optimal is free but actual costs money, very inefficient
        if optimal_cost == 0 and actual_cost > 0:
            return 0.0

        # Both have cost, compare ratio
        cost_ratio = actual_cost / optimal_cost
        return max(0.0, min(1.0, 1.0 / cost_ratio))

    def _calculate_latency_score(self, tool: str) -> float:
        """Calculate latency efficiency score for the selected tool."""
        actual_latency = self.tool_latencies.get(tool, float('inf'))
        optimal_latency = self.tool_latencies.get(self.optimal_tool, 0)

        if actual_latency == float('inf'):
            return 0.0

        # Similar to cost scoring
        latency_ratio = actual_latency / max(optimal_latency, 1)
        return max(0.0, min(1.0, 1.0 / latency_ratio))

    def _generate_reason(self, tool: str, cost_score: float, latency_score: float) -> str:
        """Generate human-readable explanation of the efficiency score."""
        if tool == self.optimal_tool:
            return f"Optimal tool selected: {tool}"

        if tool in self.acceptable_tools:
            cost_diff = self.tool_costs.get(tool, 0) - self.tool_costs.get(self.optimal_tool, 0)
            latency_diff = self.tool_latencies.get(tool, 0) - self.tool_latencies.get(self.optimal_tool, 0)
            return (
                f"Acceptable tool '{tool}' selected, but '{self.optimal_tool}' would be "
                f"${cost_diff:.4f} cheaper and {latency_diff}ms faster"
            )

        return (
            f"Suboptimal tool '{tool}' selected. "
            f"Cost efficiency: {cost_score:.2f}, "
            f"Latency efficiency: {latency_score:.2f}"
        )

    def is_successful(self) -> bool:
        """Check if the efficiency score meets the threshold."""
        return self.success

    @property
    def __name__(self):
        return "Tool Efficiency"


class ContextualComplexityMetric(ToolEfficiencyMetric):
    """
    Extended metric that considers task complexity when evaluating tool selection.
    
    This metric not only checks cost and latency efficiency but also validates
    that the tool's complexity level matches the task's complexity requirements.
    """

    def __init__(self, task_complexity: str, *args, **kwargs):
        """
        Args:
            task_complexity: Expected complexity level ('simple', 'moderate', 'complex', 'advanced')
            *args, **kwargs: Additional arguments passed to ToolEfficiencyMetric
        """
        super().__init__(*args, **kwargs)
        self.task_complexity = task_complexity

    def _generate_reason(self, tool: str, cost_score: float, latency_score: float) -> str:
        """Generate reason that includes complexity matching information."""
        reason = super()._generate_reason(tool, cost_score, latency_score)

        # Add context about complexity mismatch
        complexity_levels = {
            "simple_filter": "simple",
            "sql_query": "moderate",
            "data_warehouse": "complex",
            "ml_pipeline": "advanced"
        }

        tool_complexity = complexity_levels.get(tool, "unknown")

        if tool_complexity != self.task_complexity:
            reason += f" | Complexity mismatch: {self.task_complexity} task using {tool_complexity} tool"

        return reason
