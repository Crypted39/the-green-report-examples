# Baseline-Free Visual Assertion Demo

A minimal, runnable version of the `visual_assertion()` pattern from the blog post.
No real app or browser needed, the demo generates two mock screenshots (one clean, one with an overlap bug) and asks the model to judge each one.

## Setup

```bash
pip install -r requirements.txt
export ANTHROPIC_API_KEY=your-key-here
```

## Run

```bash
python generate_demo_screenshots.py
python demo.py
```

## What you should see

```
good_button.png   -> overlap detected: False
broken_button.png -> overlap detected: True

Demo passed: the model correctly distinguished the clean button from the broken one.
```

## Files

- `generate_demo_screenshots.py` - creates `good_button.png` and `broken_button.png` with Pillow
- `visual_assertion.py` - the assertion function from the blog, unmodified
- `demo.py` - runs the assertion against both images and asserts the expected result

## Trying it on your own screenshots

Swap in any PNG and change the question:

```python
from visual_assertion import visual_assertion

visual_assertion("my_screenshot.png", "Is the primary call-to-action button visible and not obscured?")
```

## Note on reliability

As mentioned in the blog post, a single yes/no call can be inconsistent on borderline cases. If you're seeing false positives or negatives, that's the exact problem the "reasoning before verdict" tip in the post addresses, worth trying before assuming the pattern doesn't work.
