import pandas as pd
import numpy as np
from scipy import stats
from datetime import datetime
import warnings

warnings.filterwarnings('ignore')


class DataDriftDetector:
    """
    A simple data drift detector for QA automation testing
    """

    def __init__(self, reference_data, significance_level=0.05):
        """
        Initialize the drift detector

        Args:
            reference_data (pd.DataFrame): The baseline/training data
            significance_level (float): Statistical significance threshold
        """
        self.reference_data = reference_data
        self.significance_level = significance_level
        self.drift_results = {}

    def detect_numerical_drift(self, current_data, column):
        """
        Detect drift in numerical columns using Kolmogorov-Smirnov test
        """
        if column not in self.reference_data.columns or column not in current_data.columns:
            return {"error": f"Column {column} not found in data"}

        ref_values = self.reference_data[column].dropna()
        curr_values = current_data[column].dropna()

        # Perform KS test
        ks_statistic, p_value = stats.ks_2samp(ref_values, curr_values)

        # Calculate basic statistics for comparison
        ref_stats = {
            'mean': ref_values.mean(),
            'std': ref_values.std(),
            'median': ref_values.median()
        }

        curr_stats = {
            'mean': curr_values.mean(),
            'std': curr_values.std(),
            'median': curr_values.median()
        }

        drift_detected = p_value < self.significance_level

        return {
            'column': column,
            'drift_detected': drift_detected,
            'p_value': p_value,
            'ks_statistic': ks_statistic,
            'reference_stats': ref_stats,
            'current_stats': curr_stats,
            'mean_change_percent': ((curr_stats['mean'] - ref_stats['mean']) / ref_stats['mean']) * 100
        }

    def detect_categorical_drift(self, current_data, column):
        """
        Detect drift in categorical columns using Chi-square test
        """
        if column not in self.reference_data.columns or column not in current_data.columns:
            return {"error": f"Column {column} not found in data"}

        # Get value counts for both datasets
        ref_counts = self.reference_data[column].value_counts().sort_index()
        curr_counts = current_data[column].value_counts().sort_index()

        # Align the categories
        all_categories = set(ref_counts.index) | set(curr_counts.index)
        ref_aligned = ref_counts.reindex(all_categories, fill_value=0)
        curr_aligned = curr_counts.reindex(all_categories, fill_value=0)

        # Perform Chi-square test
        try:
            chi2_stat, p_value = stats.chisquare(curr_aligned, ref_aligned)
            drift_detected = p_value < self.significance_level
        except ValueError:
            # Handle case where expected frequencies are too low
            drift_detected = True
            p_value = 0
            chi2_stat = float('inf')

        return {
            'column': column,
            'drift_detected': drift_detected,
            'p_value': p_value,
            'chi2_statistic': chi2_stat,
            'reference_distribution': ref_counts.to_dict(),
            'current_distribution': curr_counts.to_dict()
        }

    def run_drift_analysis(self, current_data, numerical_columns=None, categorical_columns=None):
        """
        Run complete drift analysis on specified columns
        """
        results = {
            'timestamp': datetime.now().isoformat(),
            'total_columns_tested': 0,
            'columns_with_drift': 0,
            'drift_summary': {},
            'detailed_results': {}
        }

        # Test numerical columns
        if numerical_columns:
            for col in numerical_columns:
                result = self.detect_numerical_drift(current_data, col)
                results['detailed_results'][col] = result

                if 'error' not in result:
                    results['total_columns_tested'] += 1
                    if result['drift_detected']:
                        results['columns_with_drift'] += 1
                        results['drift_summary'][col] = {
                            'type': 'numerical',
                            'drift_severity': abs(result['mean_change_percent'])
                        }

        # Test categorical columns
        if categorical_columns:
            for col in categorical_columns:
                result = self.detect_categorical_drift(current_data, col)
                results['detailed_results'][col] = result

                if 'error' not in result:
                    results['total_columns_tested'] += 1
                    if result['drift_detected']:
                        results['columns_with_drift'] += 1
                        results['drift_summary'][col] = {
                            'type': 'categorical',
                            'p_value': result['p_value']
                        }

        return results


class DataDriftQATests:
    """
    QA test suite for data drift detection
    """

    def __init__(self, drift_detector):
        self.drift_detector = drift_detector
        self.test_results = []

    def test_no_critical_drift(self, current_data, critical_columns, max_allowed_drift_percent=20):
        """
        Test that critical columns don't have excessive drift
        """
        test_name = "Critical Columns Drift Test"
        failed_columns = []

        for col in critical_columns:
            if col in self.drift_detector.reference_data.select_dtypes(include=[np.number]).columns:
                result = self.drift_detector.detect_numerical_drift(current_data, col)
                if 'error' not in result and abs(result['mean_change_percent']) > max_allowed_drift_percent:
                    failed_columns.append({
                        'column': col,
                        'drift_percent': result['mean_change_percent']
                    })

        test_passed = len(failed_columns) == 0
        self.test_results.append({
            'test_name': test_name,
            'passed': test_passed,
            'details': f"Failed columns: {failed_columns}" if not test_passed else "All critical columns within acceptable drift range"
        })

        return test_passed

    def test_data_completeness(self, current_data, required_completeness=0.95):
        """
        Test that current data has sufficient completeness
        """
        test_name = "Data Completeness Test"
        completeness_ratios = {}

        for col in current_data.columns:
            non_null_ratio = current_data[col].count() / len(current_data)
            completeness_ratios[col] = non_null_ratio

        failed_columns = [col for col, ratio in completeness_ratios.items() if ratio < required_completeness]
        test_passed = len(failed_columns) == 0

        self.test_results.append({
            'test_name': test_name,
            'passed': test_passed,
            'details': f"Columns below {required_completeness * 100}% completeness: {failed_columns}" if not test_passed else "All columns meet completeness requirements"
        })

        return test_passed

    def test_data_volume(self, current_data, min_volume_ratio=0.5):
        """
        Test that current data volume is sufficient compared to reference
        """
        test_name = "Data Volume Test"
        ref_volume = len(self.drift_detector.reference_data)
        curr_volume = len(current_data)
        volume_ratio = curr_volume / ref_volume

        test_passed = volume_ratio >= min_volume_ratio

        self.test_results.append({
            'test_name': test_name,
            'passed': test_passed,
            'details': f"Current volume: {curr_volume}, Reference volume: {ref_volume}, Ratio: {volume_ratio:.2f}"
        })

        return test_passed

    def generate_test_report(self):
        """
        Generate a comprehensive test report
        """
        total_tests = len(self.test_results)
        passed_tests = sum(1 for test in self.test_results if test['passed'])

        report = f"""
DATA DRIFT QA TEST REPORT
========================
Total Tests: {total_tests}
Passed: {passed_tests}
Failed: {total_tests - passed_tests}
Success Rate: {(passed_tests / total_tests) * 100:.1f}%

DETAILED RESULTS:
"""

        for test in self.test_results:
            status = "PASS" if test['passed'] else "FAIL"
            report += f"\n[{status}] {test['test_name']}\n"
            report += f"   Details: {test['details']}\n"

        return report


# Example usage and demonstration
def demonstrate_data_drift_testing():
    """
    Demonstrate how to use the data drift detection system
    """
    print("Creating sample e-commerce data...")

    # Create sample reference data (training data)
    np.random.seed(42)
    reference_data = pd.DataFrame({
        'user_age': np.random.normal(35, 10, 1000),
        'session_duration_minutes': np.random.exponential(15, 1000),
        'items_viewed': np.random.poisson(8, 1000),
        'device_type': np.random.choice(['mobile', 'desktop', 'tablet'], 1000, p=[0.6, 0.3, 0.1]),
        'user_category': np.random.choice(['new', 'returning', 'premium'], 1000, p=[0.3, 0.6, 0.1])
    })

    # Create current data with some drift
    current_data = pd.DataFrame({
        'user_age': np.random.normal(32, 12, 800),  # Younger users, more variance
        'session_duration_minutes': np.random.exponential(18, 800),  # Longer sessions
        'items_viewed': np.random.poisson(6, 800),  # Fewer items viewed
        'device_type': np.random.choice(['mobile', 'desktop', 'tablet'], 800, p=[0.8, 0.15, 0.05]),  # More mobile
        'user_category': np.random.choice(['new', 'returning', 'premium'], 800, p=[0.5, 0.4, 0.1])  # More new users
    })

    print("Setting up drift detector...")
    detector = DataDriftDetector(reference_data)

    print("Running drift analysis...")
    results = detector.run_drift_analysis(
        current_data,
        numerical_columns=['user_age', 'session_duration_minutes', 'items_viewed'],
        categorical_columns=['device_type', 'user_category']
    )

    print(f"\nDRIFT ANALYSIS RESULTS:")
    print(f"Columns tested: {results['total_columns_tested']}")
    print(f"Columns with drift: {results['columns_with_drift']}")
    print(f"Overall drift rate: {(results['columns_with_drift'] / results['total_columns_tested']) * 100:.1f}%")

    if results['drift_summary']:
        print("\nCOLUMNS WITH DETECTED DRIFT:")
        for col, info in results['drift_summary'].items():
            if info['type'] == 'numerical':
                print(f"  {col}: {info['drift_severity']:.1f}% change in mean")
            else:
                print(f"  {col}: p-value = {info['p_value']:.4f}")

    print("\nRunning QA tests...")
    qa_tester = DataDriftQATests(detector)

    # Run QA tests
    qa_tester.test_no_critical_drift(current_data, ['user_age', 'items_viewed'])
    qa_tester.test_data_completeness(current_data)
    qa_tester.test_data_volume(current_data)

    print(qa_tester.generate_test_report())


if __name__ == "__main__":
    demonstrate_data_drift_testing()
