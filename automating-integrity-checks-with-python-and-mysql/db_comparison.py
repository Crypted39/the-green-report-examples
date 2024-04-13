import mysql.connector
from stored_procedures import alter_data


def get_table_data(cursor, table_name):
    cursor.execute(f"SELECT * FROM {table_name}")
    columns = cursor.column_names
    data = [dict(zip(columns, row)) for row in cursor.fetchall()]
    return {'columns': columns, 'data': data}


def get_database_data(connection):
    cursor = connection.cursor()
    cursor.execute("SHOW TABLES")
    tables = [table[0] for table in cursor.fetchall()]
    database_data = {}
    for table in tables:
        database_data[table] = get_table_data(cursor, table)
    cursor.close()
    return database_data


def compare_data(initial_data, modified_data):
    differences_found = False

    for table_name in modified_data.keys():
        if table_name not in initial_data:
            print(f"New table '{table_name}' found in the modified data.")
            differences_found = True

    for table_name, initial_table_data in initial_data.items():
        modified_table_data = modified_data.get(table_name)

        if not modified_table_data:
            print(f"Table '{table_name}' is missing in the modified data.")
            continue

        initial_columns = initial_table_data['columns']
        modified_columns = modified_table_data['columns']

        if initial_columns != modified_columns:
            print(f"Columns in table '{table_name}' are different.")
            print("Initial columns:", initial_columns)
            print("Modified columns:", modified_columns)
            differences_found = True

        initial_rows = initial_table_data['data']
        modified_rows = modified_table_data['data']

        if initial_rows != modified_rows:
            print(f"Data in table '{table_name}' has differences.")
            for i, (initial_row, modified_row) in enumerate(zip(initial_rows, modified_rows)):
                if initial_row != modified_row:
                    print(f"Difference in row {i+1}:")
                    for column, initial_value in initial_row.items():
                        modified_value = modified_row.get(column)
                        if initial_value != modified_value:
                            print(f"Column '{column}': Initial value '{initial_value}', Modified value '{modified_value}'")
            differences_found = True

    if not differences_found:
        print("The data is identical.")


# Connect to the database
initial_db = mysql.connector.connect(
    host="your_host",
    user="your_user",
    password="your_password",
    database="art_gallery"
)

initial_db_state = get_database_data(initial_db)

alter_data(initial_db)

modified_db_state = get_database_data(initial_db)

compare_data(initial_db_state, modified_db_state)

initial_db.close()
