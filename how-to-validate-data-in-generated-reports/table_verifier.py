import pandas as pd
from pathlib import Path
from typing import List, Dict, Any, Union
import logging
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TableVerifier:
    """
    A comprehensive class for verifying generated table data in QA automation.
    Supports CSV, XLSX formats with flexible validation rules.
    """

    def __init__(self, file_path: Union[str, Path]):
        self.file_path = Path(file_path)
        self.data = None
        self.file_format = None

    def load_file(self) -> pd.DataFrame:
        """Load the file and return pandas DataFrame"""
        try:
            if self.file_path.suffix.lower() == '.csv':
                self.data = pd.read_csv(self.file_path)
                self.file_format = 'csv'
            elif self.file_path.suffix.lower() in ['.xlsx', '.xls']:
                self.data = pd.read_excel(self.file_path)
                self.file_format = 'excel'
            else:
                raise ValueError(f"Unsupported file format: {self.file_path.suffix}")

            logger.info(f"Successfully loaded {self.file_format} file with {len(self.data)} rows")
            return self.data

        except Exception as e:
            logger.error(f"Failed to load file {self.file_path}: {str(e)}")
            raise

    def verify_file_integrity(self) -> bool:
        """Verify that the file exists and is readable"""
        if not self.file_path.exists():
            raise FileNotFoundError(f"File not found: {self.file_path}")

        if self.file_path.stat().st_size == 0:
            raise ValueError("File is empty")

        # Try to load the file
        self.load_file()
        return True

    def verify_structure(self, expected_headers: List[str],
                         expected_row_count: int = None,
                         allow_extra_columns: bool = False) -> Dict[str, Any]:
        """Verify table structure including headers and row count"""
        if self.data is None:
            self.load_file()

        results = {
            'headers_match': False,
            'row_count_match': True,
            'actual_headers': list(self.data.columns),
            'actual_row_count': len(self.data),
            'missing_headers': [],
            'extra_headers': []
        }

        # Check headers
        actual_headers = set(self.data.columns)
        expected_headers_set = set(expected_headers)

        results['missing_headers'] = list(expected_headers_set - actual_headers)
        results['extra_headers'] = list(actual_headers - expected_headers_set)

        if allow_extra_columns:
            results['headers_match'] = len(results['missing_headers']) == 0
        else:
            results['headers_match'] = actual_headers == expected_headers_set

        # Check row count
        if expected_row_count is not None:
            results['row_count_match'] = len(self.data) == expected_row_count
            results['expected_row_count'] = expected_row_count

        return results

    def verify_data_content(self, validation_rules: Dict[str, Any]) -> Dict[str, Any]:
        """Verify actual data content based on validation rules"""
        if self.data is None:
            self.load_file()

        results = {
            'overall_valid': True,
            'column_results': {},
            'errors': []
        }

        for column, rules in validation_rules.items():
            if column not in self.data.columns:
                results['errors'].append(f"Column '{column}' not found in data")
                results['overall_valid'] = False
                continue

            column_data = self.data[column]
            column_result = {'valid': True, 'errors': []}

            # Check data type
            if 'type' in rules:
                if not self._validate_data_type(column_data, rules['type']):
                    column_result['errors'].append(f"Data type validation failed for column '{column}'")
                    column_result['valid'] = False

            # Check for null values
            if rules.get('not_null', False):
                null_count = column_data.isnull().sum()
                if null_count > 0:
                    column_result['errors'].append(f"Found {null_count} null values in column '{column}'")
                    column_result['valid'] = False

            # Check uniqueness
            if rules.get('unique', False):
                duplicate_count = column_data.duplicated().sum()
                if duplicate_count > 0:
                    column_result['errors'].append(f"Found {duplicate_count} duplicate values in column '{column}'")
                    column_result['valid'] = False

            # Check value ranges for numeric data
            if 'min_value' in rules or 'max_value' in rules:
                numeric_data = pd.to_numeric(column_data, errors='coerce')
                if 'min_value' in rules and (numeric_data < rules['min_value']).any():
                    column_result['errors'].append(
                        f"Values below minimum ({rules['min_value']}) found in column '{column}'")
                    column_result['valid'] = False
                if 'max_value' in rules and (numeric_data > rules['max_value']).any():
                    column_result['errors'].append(
                        f"Values above maximum ({rules['max_value']}) found in column '{column}'")
                    column_result['valid'] = False

            # Check allowed values
            if 'allowed_values' in rules:
                invalid_values = column_data[~column_data.isin(rules['allowed_values'])]
                if len(invalid_values) > 0:
                    column_result['errors'].append(
                        f"Invalid values found in column '{column}': {invalid_values.unique().tolist()}")
                    column_result['valid'] = False

            # Regex pattern validation
            if 'regex_pattern' in rules:
                pattern = re.compile(rules['regex_pattern'])
                invalid_rows = column_data[~column_data.astype(str).str.match(pattern)]
                if len(invalid_rows) > 0:
                    column_result['errors'].append(
                        f"Values not matching pattern in column '{column}': {len(invalid_rows)} violations")
                    column_result['valid'] = False

            # Custom validator
            if 'custom_validator' in rules:
                try:
                    custom_result = rules['custom_validator'](column_data)
                    if not custom_result:
                        column_result['errors'].append(f"Custom validation failed for column '{column}'")
                        column_result['valid'] = False
                except Exception as e:
                    column_result['errors'].append(f"Custom validator error for column '{column}': {str(e)}")
                    column_result['valid'] = False

            results['column_results'][column] = column_result
            if not column_result['valid']:
                results['overall_valid'] = False
                results['errors'].extend(column_result['errors'])

        return results

    def _validate_data_type(self, series: pd.Series, expected_type: str) -> bool:
        """Helper method to validate data types"""
        try:
            if expected_type == 'numeric':
                pd.to_numeric(series, errors='raise')
            elif expected_type == 'date':
                pd.to_datetime(series, errors='raise')
            elif expected_type == 'string':
                # Check if it's string-like (not purely numeric)
                return not pd.api.types.is_numeric_dtype(series)
            return True
        except:
            return False
