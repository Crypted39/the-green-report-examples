import pandas as pd

# Sample data with missing values
data = {'Test': ['A', 'B', None, 'C'], 'Value': [10, None, 5, 12]}
df = pd.DataFrame(data)

# Fill missing values in 'Value' column with the mean
df['Value'] = df['Value'].fillna(df['Value'].mean())

print(df)
