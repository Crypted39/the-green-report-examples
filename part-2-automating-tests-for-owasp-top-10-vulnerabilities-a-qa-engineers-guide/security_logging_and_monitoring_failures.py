import os

# Path to the log file
log_file_path = '/var/log/application/security.log'

# List of events to check in the log file
security_events = [
    'User login',
    'Failed login attempt',
    'User logout',
    'Data access',
    'Configuration change'
]


def check_log_file(log_file_path, security_events):
    if not os.path.exists(log_file_path):
        raise FileNotFoundError(f"Log file not found: {log_file_path}")

    with open(log_file_path, 'r') as log_file:
        log_contents = log_file.read()

    for event in security_events:
        assert event in log_contents, f"Security event '{event}' not found in log file."

    print("All specified security events are properly logged.")


check_log_file(log_file_path, security_events)
