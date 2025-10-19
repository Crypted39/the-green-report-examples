import unittest

from user_service import UserService


class TestUserServiceTraditional(unittest.TestCase):
    """
    Traditional integration tests that make REAL HTTP calls
    to the running Express server on http://localhost:3000

    NOTE: The server must be running for these tests to pass!
    """

    def setUp(self):
        self.user_service = UserService('http://localhost:3000')

    def test_process_existing_user(self):
        """Test processing an existing user - makes a REAL HTTP call"""
        result = self.user_service.process_user(12345)

        self.assertTrue(result['success'])
        self.assertEqual(result['user_name'], 'John Doe')
        self.assertTrue(result['is_active'])
        self.assertEqual(result['email'], 'john.doe@example.com')

    def test_handle_nonexistent_user(self):
        """Test handling a non-existent user"""
        result = self.user_service.process_user(99999)

        self.assertFalse(result['success'])
        self.assertEqual(result['message'], 'User not found')

    def test_get_all_active_users(self):
        """Test fetching all active users"""
        result = self.user_service.get_active_users()

        self.assertTrue(result['success'])
        self.assertGreater(result['count'], 0)

        # Verify all returned users are active
        for user in result['users']:
            self.assertEqual(user['status'], 'active')

    def test_process_inactive_user(self):
        """Test processing an inactive user"""
        result = self.user_service.process_user(11111)

        self.assertTrue(result['success'])
        self.assertFalse(result['is_active'])
        self.assertEqual(result['message'], 'User is inactive')