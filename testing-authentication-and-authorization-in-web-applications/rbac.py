class User:
    def __init__(self, roles):
        self.roles = roles


def is_authorized(user, required_role):
    return required_role in user.roles


# Example usage
current_user = User(roles=['user', 'editor'])
if is_authorized(current_user, 'editor'):
    print("User is authorized as an editor.")
else:
    print("Access denied.")
