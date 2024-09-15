from PIL import Image, ImageChops
import os

# Define the expected file name and path
expected_file_name = "profile.jpg"
download_directory = "/path/to/downloads"
file_path = os.path.join(download_directory, expected_file_name)

# Open the downloaded image and the reference image
downloaded_image = Image.open(file_path)
reference_image = Image.open("/path/to/reference/image")

# Compare the two images
diff = ImageChops.difference(downloaded_image, reference_image)

if not diff.getbbox():
    print("Image verification passed")
else:
    raise Exception("Image verification failed")
