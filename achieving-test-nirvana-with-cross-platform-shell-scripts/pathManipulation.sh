#!/bin/bash

# Define a sample file path
file_path="/path/to/example/file.txt"
                                
# Extract the directory and filename using dirname and basename
directory=$(dirname "$file_path")
filename=$(basename "$file_path")
                                
echo "Directory: $directory"
echo "Filename: $filename"