#!/bin/bash

# Define a sample file path
file_path="C:\\Path\\To\\Example\\File.txt"
                            
# Normalize the path using cygpath on Windows
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    normalized_path=$(cygpath -m "$file_path")
else
    normalized_path="$file_path"
fi
                            
echo "Normalized Path: $normalized_path"