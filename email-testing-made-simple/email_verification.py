import imaplib
import email
import time
import re


class EmailTester:
    def __init__(self, email_server, username, password):
        """
        Initialize email connection

        :param email_server: IMAP server address (e.g. 'imap.gmail.com')
        :param username: Email account username
        :param password: Email account password
        """
        self.mail = imaplib.IMAP4_SSL(email_server)
        self.mail.login(username, password)

    def _extract_email_address(self, sender_string):
        """
        Extract email address from a sender string

        :param sender_string: Sender string (e.g., 'John Doe <johndoe@thegreenreport.blog>')
        :return: Extracted email address
        """
        # Use regex to extract email address between < and >
        match = re.search(r'<([^>]+)>', sender_string)
        if match:
            return match.group(1)

        # If no angle brackets, return the string if it looks like an email
        if '@' in sender_string:
            return sender_string.strip()

        # Return empty string if no email found
        return ''

    def check_email_received(self,
                             sender=None,
                             subject=None,
                             contains=None,
                             min_wait=0,
                             max_wait=60):
        """
        Check if an email is received based on filters

        :param sender: Optional sender email address to filter
        :param subject: Optional subject line to filter
        :param contains: Optional text to verify in email body
        :param min_wait: Minimum wait time before checking (seconds)
        :param max_wait: Maximum time to wait for email (seconds)
        :return: Tuple (boolean, email details or None)
        """
        # Wait minimum time if specified
        if min_wait > 0:
            time.sleep(min_wait)

        # Set time threshold
        start_time = time.time()
        end_time = start_time + max_wait

        while time.time() < end_time:
            try:
                # Select inbox
                self.mail.select('inbox')

                # Combine multiple search conditions
                if sender and subject:
                    # Both sender and subject specified
                    status, data = self.mail.search(None,
                                                    f'(FROM "{sender}" SUBJECT "{subject}")')
                elif sender:
                    # Only sender specified
                    status, data = self.mail.search(None, f'FROM "{sender}"')
                elif subject:
                    # Only subject specified
                    status, data = self.mail.search(None, f'SUBJECT "{subject}"')
                else:
                    # No filters, get all emails
                    status, data = self.mail.search(None, 'ALL')

                email_ids = data[0].split()

                # If emails found, process the latest one
                if email_ids:
                    latest_email_id = email_ids[-1]
                    status, email_data = self.mail.fetch(latest_email_id, '(RFC822)')
                    raw_email = email_data[0][1]
                    email_message = email.message_from_bytes(raw_email)

                    # Extract email body
                    body = self._get_email_body(email_message)

                    # Extract sender email address
                    from_field = email_message['From']
                    extracted_sender = self._extract_email_address(from_field)

                    # Check sender match if specified
                    sender_match = not sender or sender.lower() == extracted_sender.lower()

                    # Check if specific content is in the email
                    content_match = True
                    if contains and contains not in body:
                        content_match = False

                    # If content and sender match, return email details
                    if sender_match and content_match:
                        return True, {
                            'from': extracted_sender,
                            'subject': email_message['Subject'],
                            'date': email_message['Date'],
                            'body': body
                        }

                # Wait before checking again
                time.sleep(2)

            except Exception as e:
                print(f"Error checking email: {e}")
                break

        # No email found
        return False, None

    def _get_email_body(self, email_message):
        """
        Extract email body from multipart email

        :param email_message: Email message object
        :return: Email body as string
        """
        body = ""
        # Iterate through email parts
        for part in email_message.walk():
            if part.get_content_type() in ['text/plain', 'text/html']:
                try:
                    # Decode and concatenate body parts
                    part_body = part.get_payload(decode=True).decode('utf-8')
                    body += part_body
                except:
                    pass
        return body


def test_email_verification():
    """
    Example test case for email verification
    """
    # Configuration (use environment variables in practice)
    EMAIL_SERVER = ''  # e.g. imap.gmail.com
    USERNAME = ''  # e.g. test@gmail.com
    PASSWORD = ''  # gmail application password

    # Initialize email tester
    email_tester = EmailTester(EMAIL_SERVER, USERNAME, PASSWORD)

    # Trigger email sending (this would be part of your application's flow)
    send_test_email()

    # Scenario: Check email with sender that might have a display name
    email_received, email_details = email_tester.check_email_received(
        sender='',  # Just the email address
        subject='',  # Optional subject
        contains='',  # Optional content check
        min_wait=5,  # Wait 5 seconds before first check
        max_wait=60  # Maximum 60 seconds to find email
    )

    # Assertions
    assert email_received, "No email was received"
    assert email_details['from'] == '<sender_email_address>', "Sender email does not match"


def send_test_email():
    """
    Placeholder for sending test email
    In actual test, this would be part of your application's flow
    """
    # Simulate sending an email
    pass
