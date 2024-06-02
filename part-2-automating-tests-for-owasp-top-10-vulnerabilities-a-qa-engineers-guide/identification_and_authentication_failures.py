import requests
import pyotp

# URL of the login endpoint
login_url = 'http://example.com/login'

# URL of the MFA endpoint
mfa_url = 'http://example.com/mfa'

# Login credentials
username = 'testuser'
password = 'testpassword'

# Secret key for TOTP (this should be securely stored and managed)
totp_secret = 'JBSWY3DPEHPK3PXP'


def login_with_mfa():
    try:
        # Step 1: Perform the initial login to get a session token
        login_data = {
            'username': username,
            'password': password
        }
        session = requests.Session()
        login_response = session.post(login_url, data=login_data)

        # Check if login was successful
        if login_response.status_code != 200:
            print("Initial login failed.")
            return

        # Step 2: Generate TOTP code
        totp = pyotp.TOTP(totp_secret)
        mfa_code = totp.now()

        # Step 3: Submit the MFA code
        mfa_data = {
            'mfa_code': mfa_code
        }
        mfa_response = session.post(mfa_url, data=mfa_data)

        # Check if MFA was successful
        if mfa_response.status_code == 200:
            print("MFA login successful.")
        else:
            print("MFA login failed.")
    except Exception as e:
        print(f"An error occurred during MFA testing: {e}")


# Run the MFA test
login_with_mfa()
