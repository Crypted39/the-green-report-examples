import hashlib


def hash_password(password):
    # Use a strong hashing algorithm (e.g., SHA-256)
    hashed_password = hashlib.sha256(password.encode()).hexdigest()
    return hashed_password
