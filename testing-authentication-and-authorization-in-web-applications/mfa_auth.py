def authenticate_with_mfa(username, password, mfa_code):
    if authenticate_user(username, password):
        # Validate MFA code
        if validate_mfa_code(username, mfa_code):
            return True
    return False
