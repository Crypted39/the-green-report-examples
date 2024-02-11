#!/bin/bash

# Detecting the shell type
shell_type=$(basename "$SHELL")
                        
# Define an alias for a common operation based on the detected shell
case "$shell_type" in
    "bash")
        alias common_operation="ls -l"
        ;;
    "zsh")
        alias common_operation="ls -lG"
        ;;
    *)
        echo "Using default command for other shells"
        alias common_operation="ls -l"
        ;;
esac
                        
# Use the alias for a platform-independent operation
$common_operation