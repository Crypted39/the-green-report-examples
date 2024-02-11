#!/bin/bash

# Detecting the operating system
os=$(uname)
                        
# Perform platform-specific actions
if [ "$os" == "Linux" ]; then
    echo "Running on Linux"
    # Linux-specific command or action
elif [ "$os" == "Darwin" ]; then
    echo "Running on macOS"
    # macOS-specific command or action
elif [ "$os" == "Windows" ]; then
    echo "Running on Windows"
    # Windows-specific command or action
else
    echo "Unsupported operating system"
fi