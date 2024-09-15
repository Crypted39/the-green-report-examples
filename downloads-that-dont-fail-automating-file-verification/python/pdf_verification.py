import PyPDF2
import os

# Define the expected file name and path
expected_file_name = "sample-file.pdf"
download_directory = "/path/to/downloads"
file_path = os.path.join(download_directory, expected_file_name)

# Open the downloaded PDF file
with open(file_path, 'rb') as file:
    pdf_reader = PyPDF2.PdfReader(file)
    first_page = pdf_reader.pages[0]
    text = first_page.extract_text()

# Check if the PDF contains expected content
if "expected content" in text:
    print("PDF content verification passed")
else:
    raise Exception("PDF content verification failed")
