from visual_assertion import visual_assertion

QUESTION = "Is any button text cut off or overlapping another element?"

good_result = visual_assertion("good_button.png", QUESTION)
broken_result = visual_assertion("broken_button.png", QUESTION)

print(f"good_button.png   -> overlap detected: {good_result}")
print(f"broken_button.png -> overlap detected: {broken_result}")

assert not good_result, "Expected no issue on the clean screenshot"
assert broken_result, "Expected the model to flag the overlapping text"

print("\nDemo passed: the model correctly distinguished the clean button from the broken one.")
