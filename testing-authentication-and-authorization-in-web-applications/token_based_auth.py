import jwt


# Generate JWT token
def generate_token(user_id):
    payload = {'user_id': user_id}
    secret_key = 'your_secret_key'
    token = jwt.encode(payload, secret_key, algorithm='HS256')
    return token
