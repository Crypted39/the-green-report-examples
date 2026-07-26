"""
Generates two mock screenshots so you can run the demo without needing
a real app to point a browser at:

- good_button.png: a clean checkout button
- broken_button.png: the same button with an overlapping "Loading..." label,
  simulating a real layout bug
"""

from PIL import Image, ImageDraw


def make_good_screenshot(path="good_button.png"):
    img = Image.new("RGB", (400, 200), "white")
    draw = ImageDraw.Draw(img)
    draw.rectangle([120, 100, 280, 150], fill="#2563eb")
    draw.text((160, 118), "Checkout", fill="white")
    img.save(path)


def make_broken_screenshot(path="broken_button.png"):
    img = Image.new("RGB", (400, 200), "white")
    draw = ImageDraw.Draw(img)
    draw.rectangle([120, 100, 280, 150], fill="#2563eb")
    draw.text((160, 118), "Checkout", fill="white")
    # Bug: a stray "Loading..." label overlapping the button text
    draw.text((150, 122), "Loading...", fill="red")
    img.save(path)


if __name__ == "__main__":
    make_good_screenshot()
    make_broken_screenshot()
    print("Generated good_button.png and broken_button.png")
