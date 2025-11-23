import openai  # or anthropic, cohere, etc.


class ProductionLLM:
    def __init__(self, api_key):
        self.client = openai.OpenAI(api_key=api_key)
        self.call_count = 0
        self.history = []

    def complete(self, prompt, **kwargs):
        self.call_count += 1
        self.history.append({"prompt": prompt, "kwargs": kwargs})

        response = self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            **kwargs
        )

        return response.model_dump()  # Returns same structure as mock