import mysql.connector


def update_bug_counts(bug_data):
    # Connect to the MySQL database
    conn = mysql.connector.connect(
        user='your_user',
        password='your_password',
        host='your_host',
        database='your_database'
    )
    cursor = conn.cursor()

    # Reset bug counts
    cursor.execute("UPDATE BugCount SET BugCount = 0")

    # Update bug counts based on the fetched bug data
    for bug in bug_data:
        test_case_id = bug['test_case_id']
        cursor.execute("""
            INSERT INTO BugCount (TestCaseID, BugCount)
            VALUES (%s, 1)
            ON DUPLICATE KEY UPDATE BugCount = BugCount + 1
        """, (test_case_id,))

    # Commit the changes and close the connection
    conn.commit()
    cursor.close()
    conn.close()


# Example bug data (this would be fetched from your bug tracking system)
bug_data = [
    {'test_case_id': 'TC001', 'bug_id': 'BUG001'},
    {'test_case_id': 'TC001', 'bug_id': 'BUG002'},
    {'test_case_id': 'TC002', 'bug_id': 'BUG003'},
]

# Update the bug counts in the database
update_bug_counts(bug_data)
