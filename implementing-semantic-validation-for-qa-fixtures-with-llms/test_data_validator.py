"""
Smart Test Data Validator using Claude AI
A rule-based evaluation system for QA test fixtures
"""

from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
import json
import os


class ValidationResult(BaseModel):
    """Structure for validation results"""
    valid: bool = Field(description="Whether the test data is valid")
    violations: List[str] = Field(default_factory=list, description="List of rule violations found")
    severity: Dict[str, str] = Field(default_factory=dict, description="Severity level for each violation")
    suggestions: List[str] = Field(default_factory=list, description="Suggestions for fixing issues")


class TestDataValidator:
    """Validates test data for semantic correctness using Claude AI"""

    def __init__(self, model: str = "claude-3-haiku-20240307"):
        """Initialize validator with Claude AI"""
        self.llm = ChatAnthropic(
            model=model,
            temperature=0,  # Deterministic validation
            max_tokens=1000
        )
        self.json_parser = JsonOutputParser()

    def create_validation_rules(self, data_type: str) -> List[str]:
        """Generate validation rules based on data type"""

        # Pre-defined rules for common test data types
        default_rules = {
            "order": [
                "Order date must be before or equal to current date",
                "Delivery date must be after or equal to order date",
                "Customer age should be realistic (13-120 years)",
                "Total price should be greater than 0",
                "Shipping cost should be proportional to order total",
                "Items count should match items array length",
                "Order status progression should be logical"
            ],
            "user": [
                "Age should be between 0 and 150 years",
                "Created date should not be in the future",
                "Email should be valid format if present",
                "Account balance should not be negative unless overdraft",
                "Last login should be after account creation"
            ]
        }

        return default_rules.get(data_type.lower(), [
            "All dates should be logically consistent",
            "Numeric values should be within reasonable ranges",
            "Required relationships between fields should be valid"
        ])

    def validate_fixture(self, fixture: Dict, data_type: Optional[str] = None) -> ValidationResult:
        """
        Validate test data against semantic rules

        Args:
            fixture: Test data to validate
            data_type: Type of data (e.g., 'order', 'user')

        Returns:
            ValidationResult with violations and suggestions
        """

        # Get appropriate rules for the data type
        rules = self.create_validation_rules(data_type) if data_type else []

        prompt = ChatPromptTemplate.from_template("""
        You are a QA expert validating test data for semantic correctness.

        Test data to validate:
        {fixture}

        Validation rules to check:
        {rules}

        Identify violations that could cause false test results. For each issue:
        - Mark as "critical" if it will definitely cause test failures
        - Mark as "warning" if it might cause unreliable tests

        Return JSON in this format:
        {{
            "valid": true/false,
            "violations": ["violation 1", "violation 2"],
            "severity": {{"violation 1": "critical", "violation 2": "warning"}},
            "suggestions": ["fix 1", "fix 2"]
        }}
        """)

        message = prompt.format_messages(
            fixture=json.dumps(fixture, indent=2),
            rules="\n".join([f"- {rule}" for rule in rules])
        )

        response = self.llm.invoke(message)
        result = self.json_parser.parse(response.content)
        return ValidationResult(**result)

    def validate_batch(self, fixtures: List[Dict], data_type: str) -> Dict:
        """Validate multiple fixtures and return summary"""

        results = []
        for i, fixture in enumerate(fixtures):
            print(f"Validating fixture {i + 1}/{len(fixtures)}...")
            result = self.validate_fixture(fixture, data_type)
            results.append({
                "index": i,
                "valid": result.valid,
                "violations": result.violations,
                "result": result
            })

        # Summary statistics
        total_valid = sum(1 for r in results if r["valid"])
        total_critical = sum(
            1 for r in results
            for severity in r["result"].severity.values()
            if severity == "critical"
        )

        return {
            "total": len(fixtures),
            "valid": total_valid,
            "invalid": len(fixtures) - total_valid,
            "critical_issues": total_critical,
            "results": results
        }


# Example usage
if __name__ == "__main__":

    # Check for API key
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("⚠️  Please set ANTHROPIC_API_KEY environment variable")
        print("  Linux/Mac: export ANTHROPIC_API_KEY='your-key'")
        print("  Windows: set ANTHROPIC_API_KEY=your-key")
        exit(1)

    # Initialize validator
    validator = TestDataValidator()

    # Example: Problematic e-commerce order
    suspicious_order = {
        "order_id": "ORD001",
        "order_date": "2024-12-01",
        "delivery_date": "2024-11-15",  # Delivered before ordered!
        "customer_age": 3,  # 3-year-old customer?
        "order_total": 0.01,
        "items_count": 47,  # Claims 47 items
        "items": [{"id": "item1", "price": 0.01}],  # But only has 1
        "shipping_cost": 500.00  # $500 shipping for $0.01?
    }

    print("Validating suspicious order...")
    print(json.dumps(suspicious_order, indent=2))
    print("\n" + "=" * 50 + "\n")

    # Validate the fixture
    result = validator.validate_fixture(suspicious_order, data_type="order")

    # Display results
    print(f"✅ Valid: {result.valid}")

    if result.violations:
        print(f"\n🚨 Violations found ({len(result.violations)}):")
        for violation in result.violations:
            severity = result.severity.get(violation, "unknown")
            emoji = "🔴" if severity == "critical" else "🟡"
            print(f"  {emoji} {violation}")

    if result.suggestions:
        print(f"\n💡 Suggestions:")
        for suggestion in result.suggestions:
            print(f"  • {suggestion}")

    # Example: Batch validation
    print("\n" + "=" * 50)
    print("Batch Validation Example")
    print("=" * 50 + "\n")

    test_orders = [
        suspicious_order,
        {
            "order_id": "ORD002",
            "order_date": "2024-11-20",
            "delivery_date": "2024-11-22",
            "customer_age": 25,
            "order_total": 150.00,
            "items_count": 3,
            "items": [{"id": "A"}, {"id": "B"}, {"id": "C"}],
            "shipping_cost": 15.00
        }
    ]

    batch_results = validator.validate_batch(test_orders, "order")

    print(f"Results Summary:")
    print(f"  Total fixtures: {batch_results['total']}")
    print(f"  Valid: {batch_results['valid']}")
    print(f"  Invalid: {batch_results['invalid']}")
    print(f"  Critical issues: {batch_results['critical_issues']}")