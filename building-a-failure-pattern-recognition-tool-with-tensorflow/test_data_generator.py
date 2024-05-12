import random

# Define number of test cases
num_tests = 50

# Define ranges for features
avg_exec_time_min = 0.1
avg_exec_time_max = 2.0
flaky_test_ratio = 0.2  # Adjust this to control the percentage of flaky tests

# Open the output file
with open("test_data.csv", "w") as f:
    f.write("Test_Name,Pass_Fail,Avg_Exec_Time,Error_Keyword_Presence,Flaky\n")
    for i in range(num_tests):
        test_name = f"test_{i}"
        pass_fail = 1 if random.random() < 0.5 else 0  # 1 for PASS, 0 for FAIL
        avg_exec_time = round(random.uniform(avg_exec_time_min, avg_exec_time_max), 2)
        error_keyword_presence = 1 if random.random() < flaky_test_ratio else 0
        flaky = error_keyword_presence
        f.write(f"{test_name},{pass_fail},{avg_exec_time},{error_keyword_presence},{flaky}\n")

print(f"Generated test data with {num_tests} test cases written to test_data.csv")
