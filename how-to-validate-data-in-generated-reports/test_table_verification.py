from table_verifier import TableVerifier
from setup_and_run import create_sample_data


class TestTableVerification:

    def setup_method(self):
        """Setup test data before each test"""
        create_sample_data()  # Create fresh test data

    def test_csv_verification(self):
        """Test CSV file verification"""
        verifier = TableVerifier("test_downloads/user_analytics.csv")

        # Test file integrity
        assert verifier.verify_file_integrity()

        # Test structure
        expected_headers = ['user_id', 'username', 'email', 'registration_date',
                            'last_login', 'total_sessions', 'subscription_type']
        structure = verifier.verify_structure(expected_headers)
        assert structure['headers_match']

        print(f"CSV test passed - {structure['actual_row_count']} rows verified")

    def test_excel_verification(self):
        """Test Excel file verification"""
        verifier = TableVerifier("test_downloads/premium_users.xlsx")

        assert verifier.verify_file_integrity()
        verifier.load_file()

        # All users should be premium
        assert all(verifier.data['subscription_type'] == 'premium')
        print(f"Excel test passed - all {len(verifier.data)} users are premium")
