import json
import logging
import openai
import time

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Initialize OpenAI client
client = openai.OpenAI(api_key="")  # Replace with your actual API key


def evaluate_with_rubric(question, expected_answer, user_answer):
    prompt = f"""
    You are a grader using a structured rubric.
    Question: {question}
    Expected Answer: {expected_answer}
    User Answer: {user_answer}

    Evaluate the answer in four categories:
    1. Correctness (0-3)
    2. Clarity (0-3)
    3. Depth of understanding (0-2)
    4. Conciseness (0-2)

    Respond in JSON format:
    {{
        "correctness": <score>,
        "clarity": <score>,
        "depth": <score>,
        "conciseness": <score>,
        "total": <sum of scores>,
        "comments": "<short explanation>"
    }}
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0
    )

    return response.choices[0].message.content.strip()


def safe_evaluate(question, expected, user_answer, retries=3):
    for attempt in range(retries):
        try:
            result = evaluate_with_rubric(question, expected, user_answer)
            # Parse and validate JSON
            parsed = json.loads(result)
            required_keys = ["correctness", "clarity", "depth", "conciseness", "total"]
            if all(key in parsed for key in required_keys):
                return parsed
        except Exception as e:
            logging.error(f"Evaluation attempt {attempt + 1} failed: {e}")
            time.sleep(1)  # Backoff before retry

    # Fallback response if all attempts fail
    return {"error": "Evaluation failed", "total": 0}


def test_science_quiz_evaluation():
    question = "Explain the water cycle."
    expected = "The water cycle is the continuous movement of water between the Earth's surface, atmosphere, and underground. It involves evaporation, condensation, precipitation, and collection."
    user_answer = "Water evaporates, forms clouds, and then rains down."

    result = safe_evaluate(question, expected, user_answer)

    # Test assertions
    assert result["total"] >= 5, f"Total score too low: {result['total']}"
    assert result["correctness"] >= 2, f"Correctness score too low: {result['correctness']}"

    # Log detailed results for review
    logging.info(f"Evaluation details: {result}")


if __name__ == "__main__":
    test_science_quiz_evaluation()
    print("Test completed successfully!")
