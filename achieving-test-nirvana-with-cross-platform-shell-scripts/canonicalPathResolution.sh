#!/bin/bash

# Define a sample file path
file_path="/path/to/example/file.txt"
                            
# Resolve the canonical path using realpath
canonical_path=$(realpath "$file_path")
                            
echo "Canonical Path: $canonical_path"