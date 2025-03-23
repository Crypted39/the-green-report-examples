from jwt_fuzzer import JWTFuzzer

# 1. Create an instance with your target URL and a valid JWT token
valid_token = "your_valid_jwt_token"

# Test each vulnerable endpoint
endpoints = [
    "http://localhost:3000/api/vulnerable/none-algorithm",
    "http://localhost:3000/api/vulnerable/expired-tokens",
    "http://localhost:3000/api/vulnerable/signature-check",
    "http://localhost:3000/api/secure"
]

for endpoint in endpoints:
    print(f"\n\nTesting endpoint: {endpoint}")
    fuzzer = JWTFuzzer(endpoint, valid_token)
    fuzzer.execute_all_attacks()
    print(fuzzer.generate_report())
