import requests
from typing import Dict


class UserService:
    def __init__(self, base_url: str = 'http://localhost:3000'):
        self.base_url = base_url

    def process_user(self, user_id: int) -> Dict:
        """
        Process a user by ID - fetches user data and performs validation

        Args:
            user_id: The user ID to process

        Returns:
            Dict with success status and user data
        """
        try:
            response = requests.get(f'{self.base_url}/users/{user_id}')

            if response.status_code == 200:
                user = response.json()
                is_active = user.get('status') == 'active'

                return {
                    'success': True,
                    'user_id': user.get('id'),
                    'user_name': user.get('name'),
                    'email': user.get('email'),
                    'is_active': is_active,
                    'message': 'User is active and ready' if is_active else 'User is inactive'
                }
            elif response.status_code == 404:
                return {
                    'success': False,
                    'user_id': user_id,
                    'message': 'User not found'
                }
            else:
                return {
                    'success': False,
                    'user_id': user_id,
                    'message': f'Unexpected status code: {response.status_code}'
                }

        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'user_id': user_id,
                'message': f'Error processing user: {str(e)}'
            }

    def get_active_users(self) -> Dict:
        """
        Get all active users

        Returns:
            Dict with list of active users
        """
        try:
            response = requests.get(f'{self.base_url}/users')

            if response.status_code == 200:
                users = response.json()
                active_users = [user for user in users if user.get('status') == 'active']

                return {
                    'success': True,
                    'count': len(active_users),
                    'users': active_users
                }
            else:
                return {
                    'success': False,
                    'message': 'Failed to fetch users'
                }

        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'message': f'Error fetching users: {str(e)}'
            }

    def create_user(self, user_data: Dict) -> Dict:
        """
        Create a new user

        Args:
            user_data: User data (name, email, status)

        Returns:
            Dict with created user data
        """
        try:
            response = requests.post(f'{self.base_url}/users', json=user_data)

            if response.status_code == 201:
                return {
                    'success': True,
                    'user': response.json(),
                    'message': 'User created successfully'
                }
            else:
                return {
                    'success': False,
                    'message': f'Failed to create user: {response.status_code}'
                }

        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'message': f'Error creating user: {str(e)}'
            }

    def update_user(self, user_id: int, updates: Dict) -> Dict:
        """
        Update user information

        Args:
            user_id: The user ID to update
            updates: Fields to update

        Returns:
            Dict with updated user data
        """
        try:
            response = requests.put(f'{self.base_url}/users/{user_id}', json=updates)

            if response.status_code == 200:
                return {
                    'success': True,
                    'user': response.json(),
                    'message': 'User updated successfully'
                }
            elif response.status_code == 404:
                return {
                    'success': False,
                    'user_id': user_id,
                    'message': 'User not found'
                }
            else:
                return {
                    'success': False,
                    'message': f'Failed to update user: {response.status_code}'
                }

        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'message': f'Error updating user: {str(e)}'
            }
