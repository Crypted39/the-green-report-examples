import unittest
from unittest.mock import patch, Mock
from user_service import UserService


class TestUserServiceHermetic(unittest.TestCase):
    """
    Hermetic tests that mock all HTTP calls - NO real network requests!
    These tests run fast and don't require the server to be running.
    """

    def setUp(self):
        self.user_service = UserService('http://localhost:3000')

    @patch('requests.get')
    def test_process_existing_user(self, mock_get):
        """Test processing an existing user with mocked response"""
        # Create a mock response object
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'id': 12345,
            'name': 'John Doe',
            'status': 'active',
            'email': 'john.doe@example.com',
            'createdAt': '2024-01-15'
        }
        mock_get.return_value = mock_response

        # Execute the test
        result = self.user_service.process_user(12345)

        # Assertions
        self.assertTrue(result['success'])
        self.assertEqual(result['user_name'], 'John Doe')
        self.assertTrue(result['is_active'])
        self.assertEqual(result['email'], 'john.doe@example.com')

        # Verify the mock was called correctly
        mock_get.assert_called_once_with('http://localhost:3000/users/12345')

    @patch('requests.get')
    def test_handle_nonexistent_user(self, mock_get):
        """Test handling a non-existent user with mocked 404"""
        mock_response = Mock()
        mock_response.status_code = 404
        mock_get.return_value = mock_response

        result = self.user_service.process_user(99999)

        self.assertFalse(result['success'])
        self.assertEqual(result['message'], 'User not found')
        mock_get.assert_called_once_with('http://localhost:3000/users/99999')

    @patch('requests.get')
    def test_get_all_active_users(self, mock_get):
        """Test fetching all active users with mocked data"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = [
            {'id': 12345, 'name': 'John Doe', 'status': 'active', 'email': 'john@example.com'},
            {'id': 67890, 'name': 'Jane Smith', 'status': 'active', 'email': 'jane@example.com'},
            {'id': 11111, 'name': 'Bob Johnson', 'status': 'inactive', 'email': 'bob@example.com'}
        ]
        mock_get.return_value = mock_response

        result = self.user_service.get_active_users()

        self.assertTrue(result['success'])
        self.assertEqual(result['count'], 2)  # Only 2 active users
        self.assertEqual(len(result['users']), 2)

        # Verify all returned users are active
        for user in result['users']:
            self.assertEqual(user['status'], 'active')

        mock_get.assert_called_once_with('http://localhost:3000/users')

    @patch('requests.get')
    def test_handle_network_error(self, mock_get):
        """Test handling network errors gracefully"""
        # Simulate a network error
        import requests
        mock_get.side_effect = requests.exceptions.ConnectionError('Network Error')

        result = self.user_service.process_user(12345)

        self.assertFalse(result['success'])
        self.assertIn('Error processing user', result['message'])

    @patch('requests.get')
    def test_process_inactive_user(self, mock_get):
        """Test processing an inactive user"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'id': 11111,
            'name': 'Bob Johnson',
            'status': 'inactive',
            'email': 'bob@example.com'
        }
        mock_get.return_value = mock_response

        result = self.user_service.process_user(11111)

        self.assertTrue(result['success'])
        self.assertFalse(result['is_active'])
        self.assertEqual(result['message'], 'User is inactive')