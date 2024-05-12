import pandas as pd
import tensorflow as tf


def check_for_error_keywords(error_message):
    """
    This function checks for predefined error keywords in the error message.

    Args:
        error_message (str): The error message associated with the test execution.

    Returns:
        int: 1 if any error keyword is found, 0 otherwise.
    """
    # Define a list of error keywords associated with flaky tests (replace with your specific keywords)
    error_keywords = ["Network timeout", "Connection reset", "Resource unavailable"]

    # Check if any keyword is present in the error message (case-insensitive)
    for keyword in error_keywords:
        if keyword.lower() in error_message.lower():
            return 1

    # No keywords found
    return 0


# Function to predict flaky test probability
def predict_flakiness(test_data, model_path):
    # Load the saved model
    model = tf.keras.models.load_model(model_path)

    # Extract features (replace with your feature extraction logic)
    features = pd.DataFrame({"Avg_Exec_Time": [test_data["execution_time"]],
                             "Error_Keyword_Presence": [check_for_error_keywords(test_data["error_message"])]})

    # Make prediction
    prediction = model.predict(features)[0][0]
    return prediction


# Example usage (replace with your actual test data)
test_data = {"execution_time": 2.5, "error_message": "Network connection timeout"}
flakiness_probability = predict_flakiness(test_data, "flaky_test_predictor.keras")

print(f"Predicted flakiness probability: {flakiness_probability:.2f}")

flaky_threshold = 0.7

if flakiness_probability > flaky_threshold:
    print(f"Test flagged as potentially flaky! (probability: {flakiness_probability:.2f})")
    # Trigger notifications or further investigation (e.g., send email, log message)
