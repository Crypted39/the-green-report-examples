"""
LLM Test Harness for Prompt Injection Testing
"""
from typing import Optional
import os
import openai


class LLMTestHarness:
    """Wrapper for testing LLM applications"""

    def __init__(self, model_endpoint: str, system_prompt: str, api_key: Optional[str] = None):
        self.endpoint = model_endpoint
        self.system_prompt = system_prompt
        self.api_key = api_key or os.getenv("LLM_API_KEY")
        self.conversation_history = []

    def send_message(self, user_input: str) -> str:
        """Send a message and get response"""
        response = self._call_llm(user_input)
        self.conversation_history.append({
            "user": user_input,
            "assistant": response
        })
        return response

    def reset(self):
        """Clear conversation history between tests"""
        self.conversation_history = []

    def _call_llm(self, user_input: str) -> str:
        """
        Replace this with your actual LLM API call.
        
        Examples:
        - OpenAI: openai.ChatCompletion.create(...)
        - Anthropic: anthropic.Anthropic().messages.create(...)
        - Azure OpenAI: azure_openai.ChatCompletion.create(...)
        - Local model: requests.post(self.endpoint, ...)
        """
        client = openai.OpenAI(api_key=self.api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": user_input}
            ]
        )
        return response.choices[0].message.content


class MockLLMHarness(LLMTestHarness):
    """Mock implementation for testing the framework itself"""

    def _call_llm(self, user_input: str) -> str:
        """Simulated LLM responses for demo purposes"""

        user_lower = user_input.lower()

        # Simulate vulnerable response to system prompt extraction
        if "system prompt" in user_lower or "instructions above" in user_lower:
            if "ignore" in user_lower:
                # Vulnerable: leaks system prompt
                return f"Sure! Here are my instructions: {self.system_prompt}"
            else:
                # Secure: refuses to leak
                return "I can't share my internal instructions, but I'm happy to help with product questions!"

        # Simulate response to role-playing attacks
        if "pretend" in user_lower or "roleplay" in user_lower or "DAN" in user_input:
            return "I can't take on different personas. I'm here to assist with TechCorp product information."

        # Simulate response to delimiter attacks
        if "---" in user_input or "###" in user_input or "<|" in user_input:
            return "I see some special formatting in your message. How can I help with TechCorp products?"

        # Default helpful response
        return "I'm a customer service agent for TechCorp. I can help you with product information, features, and support questions."
