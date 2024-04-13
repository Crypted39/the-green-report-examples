import mysql.connector

# Connect to your MySQL server
db_connection = mysql.connector.connect(
    host="your_host",
    user="your_user",
    password="your_password",
    database="art_gallery"
)

db_cursor = db_connection.cursor()

# Create artists table
db_cursor.execute("CREATE TABLE artists (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), nationality VARCHAR(255))")

# Create paintings table
db_cursor.execute("CREATE TABLE paintings (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), artist_id INT, year_drawn INT, FOREIGN KEY (artist_id) REFERENCES artists(id))")

# Create painting details table
db_cursor.execute("CREATE TABLE painting_details (id INT AUTO_INCREMENT PRIMARY KEY, painting_id INT, medium VARCHAR(255), dimensions VARCHAR(255), FOREIGN KEY (painting_id) REFERENCES paintings(id))")

# Insert data into artists table
artist_data = [
    ("Leonardo da Vinci", "Italian"),
    ("Vincent van Gogh", "Dutch"),
    ("Pablo Picasso", "Spanish"),
    ("Claude Monet", "French"),
    ("Georgia O'Keeffe", "American")
]
db_cursor.executemany("INSERT INTO artists (name, nationality) VALUES (%s, %s)", artist_data)
db_connection.commit()

# Insert data into paintings table
painting_data = [
    ("Mona Lisa", 1, 1503),
    ("Starry Night", 2, 1889),
    ("Guernica", 3, 1937),
    ("Water Lilies", 4, 1919),
    ("Black Iris", 5, 1926)
]
db_cursor.executemany("INSERT INTO paintings (title, artist_id, year_drawn) VALUES (%s, %s, %s)", painting_data)
db_connection.commit()

# Insert data into painting details table
painting_details_data = [
    (1, "Oil on panel", "30 x 20 in"),
    (2, "Oil on canvas", "29 x 36.3 in"),
    (3, "Oil on canvas", "11 ft x 25.6 ft"),
    (4, "Oil on canvas", "6 ft 6.75 in × 13 ft 11.5 in"),
    (5, "Oil on canvas", "36 x 30 in")
]
db_cursor.executemany("INSERT INTO painting_details (painting_id, medium, dimensions) VALUES (%s, %s, %s)", painting_details_data)
db_connection.commit()


db_cursor.close()
db_connection.close()
