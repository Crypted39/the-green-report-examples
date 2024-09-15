import os

# Define the expected file name and path
expected_file_name = "sample-file.txt"
download_directory = "/path/to/downloads"
file_path = os.path.join(download_directory, expected_file_name)

# Check if the file exists and has the correct name and extension
if os.path.exists(file_path) and file_path.endswith('.txt'):
    print(f"File name and type verification passed: {expected_file_name}")
else:
    raise Exception(f"File name or type verification failed: {file_path}")

# Open the downloaded file and check its contents
with open(file_path, 'r') as file:
    content = file.read()

if "expected text" in content:
    print("Text content verification passed")
else:
    raise Exception("Text content verification failed")

# Check the size of the downloaded file
file_size = os.path.getsize(file_path)

# Ensure the file size is greater than 0 bytes
if file_size > 0:
    print(f"File size verification passed: {file_size} bytes")
else:
    raise Exception("File size verification failed: File is empty or corrupted")
