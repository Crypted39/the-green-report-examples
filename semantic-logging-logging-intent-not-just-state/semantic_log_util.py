import logging
from functools import wraps

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def log_action(action):
    """Decorator to log the intent of a function call."""

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            result = func(*args, **kwargs)
            logger.info(f"{action} - Success", extra={"function": func.__name__})
            return result

        return wrapper

    return decorator


@log_action("User logged in")
def login_user(username, password):
    return f"Welcome, {username}!"


# Run the function to see the log output
if __name__ == "__main__":
    print(login_user("john_doe", "securepassword"))
