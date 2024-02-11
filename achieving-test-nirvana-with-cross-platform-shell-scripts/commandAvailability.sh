#!/bin/bash

# Check if the 'grep' command is available
if command -v grep &> /dev/null ; then
    echo "grep command found, proceeding..."
    # Use 'grep' in a platform-independent manner
    echo "Sample Text" | grep "Sample"
else
    echo "grep command not found, consider alternative approach."
fi