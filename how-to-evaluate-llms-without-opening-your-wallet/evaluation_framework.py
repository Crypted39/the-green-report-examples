import json
import re
from typing import Dict, List, Any
from jsonschema import validate, ValidationError


class LLMEvaluator:
    def __init__(self):
        self.results = []

    def evaluate_format(self, response: str, pattern: str) -> Dict[str, Any]:
        """Validate response matches expected format pattern"""
        try:
            matches = bool(re.match(pattern, response, re.DOTALL))
            return {
                "metric": "format_validation",
                "passed": matches,
                "details": f"Pattern {'matched' if matches else 'failed'}"
            }
        except re.error as e:
            return {
                "metric": "format_validation",
                "passed": False,
                "details": f"Invalid pattern: {e}"
            }

    def evaluate_length(self, response: str, min_length: int = 0,
                        max_length: int = float('inf')) -> Dict[str, Any]:
        """Check if response length is within constraints"""
        length = len(response)
        passed = min_length <= length <= max_length
        return {
            "metric": "length_constraint",
            "passed": passed,
            "actual": length,
            "expected_range": f"{min_length}-{max_length}",
            "details": f"Length {length} {'within' if passed else 'outside'} range"
        }

    def evaluate_json_schema(self, response: str, schema: Dict) -> Dict[str, Any]:
        """Validate JSON response against schema"""
        try:
            data = json.loads(response)
            validate(instance=data, schema=schema)
            return {
                "metric": "json_schema",
                "passed": True,
                "details": "Valid JSON matching schema"
            }
        except json.JSONDecodeError as e:
            return {
                "metric": "json_schema",
                "passed": False,
                "details": f"Invalid JSON: {e}"
            }
        except ValidationError as e:
            return {
                "metric": "json_schema",
                "passed": False,
                "details": f"Schema validation failed: {e.message}"
            }

    def evaluate_keywords(self, response: str, required: List[str] = None,
                          forbidden: List[str] = None) -> Dict[str, Any]:
        """Check for required and forbidden keywords"""
        required = required or []
        forbidden = forbidden or []
        response_lower = response.lower()

        missing = [kw for kw in required if kw.lower() not in response_lower]
        found_forbidden = [kw for kw in forbidden if kw.lower() in response_lower]

        passed = len(missing) == 0 and len(found_forbidden) == 0

        return {
            "metric": "keyword_check",
            "passed": passed,
            "missing_required": missing,
            "found_forbidden": found_forbidden,
            "details": f"Missing: {missing}, Forbidden found: {found_forbidden}"
        }

    def run_evaluation(self, response: str, evaluations: List[Dict]) -> Dict[str, Any]:
        """Run multiple evaluations on a response"""
        results = []
        all_passed = True

        for eval_config in evaluations:
            metric_type = eval_config.get("type")
            params = eval_config.get("params", {})

            if metric_type == "format":
                result = self.evaluate_format(response, **params)
            elif metric_type == "length":
                result = self.evaluate_length(response, **params)
            elif metric_type == "json_schema":
                result = self.evaluate_json_schema(response, **params)
            elif metric_type == "keywords":
                result = self.evaluate_keywords(response, **params)
            else:
                result = {"metric": metric_type, "passed": False,
                          "details": "Unknown metric type"}

            results.append(result)
            all_passed = all_passed and result["passed"]

        return {
            "all_passed": all_passed,
            "results": results,
            "summary": f"{sum(r['passed'] for r in results)}/{len(results)} passed"
        }
