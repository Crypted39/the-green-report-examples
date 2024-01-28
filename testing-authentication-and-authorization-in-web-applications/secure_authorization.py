class User:
    def __init__(self, roles):
        self.roles = roles
        self.permissions = {'edit_document', 'view_document'}


def is_authorized(user, required_permission):
    return required_permission in user.permissions


# Example usage
current_user = User(roles=['user', 'editor'])
if is_authorized(current_user, 'edit_document'):
    print("User is authorized to edit documents.")
else:
    print("Access denied.")
