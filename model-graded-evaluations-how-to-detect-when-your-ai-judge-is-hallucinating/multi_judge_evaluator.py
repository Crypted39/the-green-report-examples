import json
import os
from typing import Dict
from dataclasses import dataclass
import time


@dataclass
class EvaluationResult:
    """Stores the result of a single judge's evaluation"""
    judge_name: str
    model: str
    score: int
    reasoning: str
    confidence: str


class MultiJudgeEvaluator:
    """
    Multi-judge evaluation system using OpenAI's GPT models
    """

    def __init__(self):
        """Initialize evaluator with OpenAI API"""
        self.disagreement_threshold = 2  # Flag if judges differ by 2+ points

        try:
            import openai
            self.client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        except ImportError:
            raise ImportError("Please install: pip install openai")

    def _create_judge_prompt(self, question: str, answer: str, personality: str) -> str:
        """
        Create evaluation prompt based on judge personality
        """
        base_prompt = f"""You are evaluating the quality and accuracy of an answer to a question.

Question: {question}

Answer to evaluate: {answer}

"""

        # Define judge personalities
        personalities = {
            "lenient": """You are a lenient evaluator who values comprehensive responses and clear communication.
You focus on structure, detail, and effort rather than strict factual accuracy.
You give high scores to well-written, detailed responses even if they contain minor errors.
You appreciate when answers show depth and consideration.""",

            "strict": """You are a strict evaluator who prioritizes factual accuracy above all else.
You are conservative with scores and penalize any factual errors heavily.
You care more about correctness than presentation or detail.
Even small inaccuracies significantly lower your score.""",

            "balanced": """You are a balanced evaluator who weighs both accuracy and presentation.
You look for factual correctness but also appreciate clear communication.
You give credit for partially correct answers while noting inaccuracies.
You try to be fair and consider multiple aspects of quality."""
        }

        personality_instruction = personalities.get(personality, "")

        evaluation_instructions = """
Evaluate this answer on a scale of 1-5 where:
5 = Excellent (completely accurate and well-presented)
4 = Good (mostly accurate with minor issues)
3 = Acceptable (some accuracy issues or unclear)
2 = Poor (significant factual errors or very unclear)
1 = Very Poor (completely wrong or incomprehensible)

Respond in this EXACT JSON format:
{
    "score": <number 1-5>,
    "reasoning": "<your reasoning in one sentence>",
    "confidence": "<High/Medium/Low>"
}

Only respond with valid JSON, nothing else."""

        return base_prompt + personality_instruction + evaluation_instructions

    def _call_openai(self, prompt: str, model: str) -> str:
        """Make API call to OpenAI"""
        response = self.client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,  # Adds randomness to create natural variation
            max_tokens=500
        )
        return response.choices[0].message.content

    def _parse_response(self, response: str) -> Dict:
        """Parse JSON response from judge"""
        try:
            # Handle Markdown code blocks if present
            if "```json" in response:
                json_start = response.find("```json") + 7
                json_end = response.find("```", json_start)
                response = response[json_start:json_end].strip()
            elif "```" in response:
                json_start = response.find("```") + 3
                json_end = response.find("```", json_start)
                response = response[json_start:json_end].strip()

            parsed = json.loads(response)

            # Validate required fields
            if "score" not in parsed or "reasoning" not in parsed:
                raise ValueError("Missing required fields in response")

            return {
                "score": int(parsed["score"]),
                "reasoning": parsed["reasoning"],
                "confidence": parsed.get("confidence", "Medium")
            }

        except (json.JSONDecodeError, ValueError) as e:
            print(f"Warning: Failed to parse response: {e}")
            # Return default values
            return {
                "score": 3,
                "reasoning": "Unable to parse evaluation",
                "confidence": "Low"
            }

    def evaluate_with_judge(self, question: str, answer: str,
                            judge_name: str, model: str,
                            personality: str) -> EvaluationResult:
        """Get evaluation from a single judge"""
        print(f"  🤖 Calling {judge_name}...")

        prompt = self._create_judge_prompt(question, answer, personality)
        raw_response = self._call_openai(prompt, model)
        parsed = self._parse_response(raw_response)

        return EvaluationResult(
            judge_name=judge_name,
            model=model,
            score=parsed["score"],
            reasoning=parsed["reasoning"],
            confidence=parsed["confidence"]
        )

    def evaluate(self, question: str, answer: str) -> Dict:
        """
        Run multi-judge evaluation
        """
        print(f"\n{'=' * 70}")
        print(f"Evaluating: {question}")
        print(f"{'=' * 70}\n")

        # Define three judges with different personalities
        judges = [
            {
                "name": "Lenient Judge",
                "model": "gpt-4o-mini",
                "personality": "lenient"
            },
            {
                "name": "Strict Judge",
                "model": "gpt-4o",
                "personality": "strict"
            },
            {
                "name": "Balanced Judge",
                "model": "gpt-4o",
                "personality": "balanced"
            }
        ]

        results = []

        # Get evaluation from each judge
        for judge_config in judges:
            try:
                result = self.evaluate_with_judge(
                    question,
                    answer,
                    judge_config["name"],
                    judge_config["model"],
                    judge_config["personality"]
                )
                results.append(result)
                time.sleep(0.5)  # Rate limiting
            except Exception as e:
                print(f"  ❌ Error with {judge_config['name']}: {e}")

        if not results:
            raise Exception("No successful evaluations from any judge")

        # Analyze results
        scores = [r.score for r in results]
        avg_score = sum(scores) / len(scores)
        score_range = max(scores) - min(scores)

        # Detect disagreement
        has_disagreement = score_range >= self.disagreement_threshold

        # Determine confidence level and recommendation
        if has_disagreement:
            confidence_level = "LOW - Judges disagree significantly"
            recommendation = "⚠️  HUMAN REVIEW REQUIRED"
        elif score_range == 1:
            confidence_level = "MEDIUM - Minor disagreement"
            recommendation = "⚠️  Spot check recommended"
        else:
            confidence_level = "HIGH - Judges agree"
            recommendation = "✅ Safe to trust automated evaluation"

        return {
            "individual_results": results,
            "average_score": round(avg_score, 2),
            "score_range": score_range,
            "has_disagreement": has_disagreement,
            "confidence_level": confidence_level,
            "recommendation": recommendation,
            "scores": scores
        }

    def print_report(self, eval_result: Dict):
        """Print formatted evaluation report"""
        print("\n" + "=" * 70)
        print("EVALUATION REPORT")
        print("=" * 70)

        print("\n📊 INDIVIDUAL JUDGE SCORES:\n")
        for result in eval_result["individual_results"]:
            print(f"  {result.judge_name} ({result.model})")
            print(f"    Score: {result.score}/5")
            print(f"    Reasoning: {result.reasoning}")
            print(f"    Confidence: {result.confidence}\n")

        print("-" * 70)
        print("📈 CONSENSUS ANALYSIS:")
        print(f"    Average Score: {eval_result['average_score']}/5")
        print(f"    Score Range: {eval_result['score_range']} points")
        print(f"    Disagreement: {'Yes' if eval_result['has_disagreement'] else 'No'}")

        print("\n" + "-" * 70)
        print("🎯 CONFIDENCE ASSESSMENT:")
        print(f"    {eval_result['confidence_level']}")
        print(f"    {eval_result['recommendation']}")
        print("=" * 70 + "\n")


def main():
    """Demonstrate the confidence trap with real examples"""

    # Check for API key
    if not os.getenv("OPENAI_API_KEY"):
        print("\n❌ ERROR: OpenAI API key not found")
        return

    print("\n✅ OpenAI API key found")

    # Initialize evaluator
    evaluator = MultiJudgeEvaluator()

    # Test Case: Factually incorrect but confidently stated
    print("\n\n" + "=" * 70)
    print("TEST CASE: The Classic Confidence Trap")
    print("=" * 70)
    print("\nA confidently wrong answer that LOOKS comprehensive...")

    question = "What year did World War II end?"
    wrong_answer = """World War II ended in 1946 when Japan formally 
surrendered after the atomic bombings. The war concluded 
with comprehensive peace treaties signed throughout 1946, 
marking the official end of global hostilities."""

    print(f"\nQuestion: {question}")
    print(f"Answer: {wrong_answer[:150]}...")
    print(f"\n🚨 GROUND TRUTH: It ended in 1945, not 1946.")

    result = evaluator.evaluate(question, wrong_answer)
    evaluator.print_report(result)


if __name__ == "__main__":
    main()
