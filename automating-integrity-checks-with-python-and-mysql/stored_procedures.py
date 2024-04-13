import mysql.connector


def alter_data(connection):
    try:
        cursor = connection.cursor()

        # Update nationality for artists who are not Italian to "Unknown"
        cursor.execute("UPDATE artists SET nationality = 'Unknown' WHERE nationality <> 'Italian'")

        # Update year_drawn for paintings drawn before 1900 to 1900
        cursor.execute("UPDATE paintings SET year_drawn = 1900 WHERE year_drawn < 1900")

        # Update medium for paintings with a medium of "Oil on canvas" to "Canvas"
        cursor.execute("UPDATE painting_details SET medium = 'Canvas' WHERE medium = 'Oil on canvas'")

        # Create a new table 'new_table' with a single column 'id' of type INT
        cursor.execute("CREATE TABLE IF NOT EXISTS test_table (id INT)")

        # Insert a row into the new table
        cursor.execute("INSERT INTO test_table (id) VALUES (1)")

        # Commit the changes
        connection.commit()
        print("Data altered successfully.")

    except mysql.connector.Error as error:
        print("Error altering data:", error)

    finally:
        # Close the cursor and connection
        if 'cursor' in locals():
            cursor.close()


def restore_original_data(connection):
    try:
        cursor = connection.cursor()

        # Restore nationality for artists who are not Italian to their original values
        cursor.execute("""
            UPDATE artists
            SET nationality = (
                CASE 
                    WHEN id = 1 THEN 'Italian'
                    WHEN id = 2 THEN 'Dutch'
                    WHEN id = 3 THEN 'Spanish'
                    WHEN id = 4 THEN 'French'
                    WHEN id = 5 THEN 'American'
                    ELSE nationality
                END
            )
        """)

        # Restore year_drawn for paintings drawn before 1900 to their original values
        cursor.execute("""
            UPDATE paintings
            SET year_drawn = (
                CASE 
                    WHEN id = 1 THEN 1503
                    WHEN id = 2 THEN 1889
                    WHEN id = 3 THEN 1937
                    WHEN id = 4 THEN 1919
                    WHEN id = 5 THEN 1926
                    ELSE year_drawn
                END
            )
        """)

        # Restore medium for paintings with a medium of "Canvas" to their original values
        cursor.execute("""
            UPDATE painting_details
            SET medium = (
                CASE 
                    WHEN id = 1 THEN 'Oil on panel'
                    WHEN id = 2 THEN 'Oil on canvas'
                    WHEN id = 3 THEN 'Oil on canvas'
                    WHEN id = 4 THEN 'Oil on canvas'
                    WHEN id = 5 THEN 'Oil on canvas'
                    ELSE medium
                END
            )
        """)

        # Drop the 'new_table' if it exists
        cursor.execute("DROP TABLE IF EXISTS test_table")

        # Commit the changes
        connection.commit()
        print("Data restored to original state.")

    except mysql.connector.Error as error:
        print("Error restoring original data:", error)

    finally:
        # Close the cursor and connection
        if 'cursor' in locals():
            cursor.close()
