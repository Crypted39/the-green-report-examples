import pandas as pd
import tensorflow as tf
from sklearn.model_selection import train_test_split

# Load the preprocessed data
data = pd.read_csv("test_data.csv")

# Define features and target
features = data[["Avg_Exec_Time", "Error_Keyword_Presence"]]
target = data["Flaky"]

# Split data into training and testing sets
train_features, test_features, train_target, test_target = train_test_split(
    features, target, test_size=0.2
)

# Build the model
model = tf.keras.Sequential([
    tf.keras.layers.Dense(1, activation="sigmoid", input_shape=(features.shape[1],))
])

# Compile the model
model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy"])

# Train the model
model.fit(train_features, train_target, epochs=10)

# Evaluate the model
loss, accuracy = model.evaluate(test_features, test_target)
print(f"Test Loss: {loss}, Test Accuracy: {accuracy}")

# Save the trained model (optional)
model.save("flaky_test_predictor.keras")
print("Model saved successfully!")
