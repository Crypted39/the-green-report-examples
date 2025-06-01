import pandas as pd
from pathlib import Path
import numpy as np
from datetime import datetime, timedelta


def create_sample_data():
    """Create sample test data files"""

    # Create directories
    Path("test_downloads").mkdir(exist_ok=True)

    # Sample user data
    np.random.seed(42)  # For reproducible data
    num_users = 100

    user_data = {
        'user_id': range(1, num_users + 1),
        'username': [f'user_{i:03d}' for i in range(1, num_users + 1)],
        'email': [f'user{i:03d}@example.com' for i in range(1, num_users + 1)],
        'registration_date': [
            (datetime.now() - timedelta(days=np.random.randint(1, 365))).strftime('%Y-%m-%d')
            for _ in range(num_users)
        ],
        'last_login': [
            (datetime.now() - timedelta(days=np.random.randint(0, 30))).strftime('%Y-%m-%d')
            for _ in range(num_users)
        ],
        'total_sessions': np.random.randint(0, 100, num_users),
        'subscription_type': np.random.choice(['free', 'premium', 'enterprise'], num_users)
    }

    df = pd.DataFrame(user_data)

    # Create CSV file
    df.to_csv('test_downloads/user_analytics.csv', index=False)
    print("Created: test_downloads/user_analytics.csv")

    # Create Excel file with only premium users
    premium_users = df[df['subscription_type'] == 'premium'].copy()
    premium_users.to_excel('test_downloads/premium_users.xlsx', index=False)
    print("Created: test_downloads/premium_users.xlsx")

    # Create another CSV for comparison testing
    df.to_csv('test_downloads/report.csv', index=False)
    print("Created: test_downloads/report.csv")

    # Create Excel version of the same report
    df.to_excel('test_downloads/report.xlsx', index=False)
    print("Created: test_downloads/report.xlsx")

    print(f"\nSample data created with {len(df)} total users")
    print(f"Premium users: {len(premium_users)}")

    return df


if __name__ == "__main__":
    create_sample_data()
