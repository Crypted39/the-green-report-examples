import mysql.connector


def get_top_buggy_tests(limit=10):
    # Connect to the MySQL database
    conn = mysql.connector.connect(
        user='your_user',
        password='your_password',
        host='your_host',
        database='your_database'
    )
    cursor = conn.cursor()

    # Execute the query to retrieve top test cases with highest bug counts
    query = """
    SELECT TestCaseID, BugCount
    FROM BugCount
    ORDER BY BugCount DESC
    LIMIT %s;
    """
    cursor.execute(query, (limit,))
    results = cursor.fetchall()

    # Close the connection
    cursor.close()
    conn.close()

    return results


top_buggy_tests = get_top_buggy_tests(limit=10)
for test_case in top_buggy_tests:
    print(f"TestCaseID: {test_case[0]}, BugCount: {test_case[1]}")

