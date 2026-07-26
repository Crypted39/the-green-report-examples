import anthropic, base64

client = anthropic.Anthropic()


def visual_assertion(screenshot_path: str, question: str) -> bool:
    with open(screenshot_path, "rb") as f:
        img_b64 = base64.b64encode(f.read()).decode()

    response = client.messages.create(
        model="claude-sonnet-5",
        max_tokens=10,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {
                    "type": "base64", "media_type": "image/png", "data": img_b64
                }},
                {"type": "text", "text": f"{question} Answer only 'yes' or 'no'."}
            ]
        }]
    )
    return response.content[0].text.strip().lower().startswith("yes")
