from openai import OpenAI

# Point to Ollama's OpenAI-compatible endpoint
client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama"  # Ollama doesn't require real keys
)

def query_local_model(prompt: str, model: str = "phi4-mini") -> str:
    """Query a local model via Ollama."""
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=500
    )
    return response.choices[0].message.content

# Example usage
result = query_local_model(
    "Explain dependency injection in one sentence."
)
print(result)

# Batch testing multiple prompts
test_prompts = [
    "What is Python's GIL?",
    "Explain async/await briefly.",
    "What's the difference between lists and tuples?"
]

for prompt in test_prompts:
    print(f"\nQ: {prompt}")
    print(f"A: {query_local_model(prompt)}")