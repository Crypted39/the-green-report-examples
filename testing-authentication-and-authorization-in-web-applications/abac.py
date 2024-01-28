class User:
    def __init__(self, department):
        self.department = department


def is_authorized(user, action):
    # Define an access policy based on user's department
    if action == 'edit_department_documents' and user.department == 'IT':
        return True
    elif action == 'view_department_documents':
        return True
    else:
        return False


# Example usage
current_user = User(department='IT')
if is_authorized(current_user, 'edit_department_documents'):
    print("User is authorized to edit IT department documents.")
else:
    print("Access denied.")
