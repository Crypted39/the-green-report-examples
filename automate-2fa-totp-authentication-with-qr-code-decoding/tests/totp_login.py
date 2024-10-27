import pyotp
from PIL import Image
from playwright.sync_api import sync_playwright, TimeoutError
import re
from pyzbar.pyzbar import decode


# Function to extract TOTP secret from QR code
def extract_secret_from_qr(image_path):
    try:
        # Load the image
        img = Image.open("qr_code_image.png")

        # Decode the QR code
        decoded_objects = decode(img)

        # Extract the data from the decoded object
        for obj in decoded_objects:
            qr_text = obj.data.decode('utf-8')

        # Check and extract the secret key
        secret_key = extract_secret_from_text(qr_text)
        if not secret_key:
            print("Failed to extract a valid secret key from QR code text.")
        return secret_key
    except Exception as e:
        print(f"Error extracting secret from QR code: {e}")
        return None


def extract_secret_from_text(qr_text):
    # Extract the secret key from the URL
    match = re.search(r"secret=([A-Z2-7]+)", qr_text)
    return match.group(1) if match else None


# Function to generate the TOTP based on the extracted secret
def generate_otp(secret_key):
    try:
        totp = pyotp.TOTP(secret_key)
        otp = totp.now()
        print(f"Generated OTP: {otp}")
        return otp
    except Exception as e:
        print(f"Error generating OTP: {e}")
        return None


# Function to log in, capture QR code, and pass OTP using Playwright
def login_with_otp(username, password):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        try:
            # Navigate to login page
            page.goto("http://localhost:3000/login")

            # Fill in the username and password fields
            page.fill("#username", username)
            page.fill("#password", password)
            page.click("#login-button")

            # Wait for QR code to be visible and save its screenshot
            page.wait_for_selector("#qr-code", timeout=5000)
            qr_code_path = "qr_code_image.png"
            page.locator("#qr-code").screenshot(path=qr_code_path)
            print("QR code saved.")

            # Extract the TOTP secret from the QR code image
            secret_key = extract_secret_from_qr(qr_code_path)

            if secret_key:
                # Generate the OTP using the extracted secret
                otp = generate_otp(secret_key)

                if otp:
                    # Fill the OTP field and submit
                    page.fill("#otp", otp)
                    page.click("#verify-button")

                    # Wait for the login success message
                    page.wait_for_selector("#login-success-message", timeout=10000)
                    print("Login successful!")
                else:
                    print("Failed to generate OTP.")
            else:
                print("Failed to extract secret key from QR code.")
        except TimeoutError:
            print("Failed to find expected page elements.")
        except Exception as e:
            print(f"Error during login process: {e}")
        finally:
            browser.close()


# Main script
if __name__ == "__main__":
    # Login and handle OTP
    login_with_otp("your_username", "your_password")
