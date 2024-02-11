#!/bin/bash

# Detecting the operating system
os=$(uname)
                        
# Set default values for environment configuration
build_command=""
test_command=""
cleanup_command=""
                        
# Configure commands based on the detected operating system
case "$os" in
    "Linux")
        build_command="make"
        test_command="make test"
        cleanup_command="make clean"
        ;;
    "Darwin")
        build_command="make"
        test_command="make test"
        cleanup_command="make clean"
        ;;
    "Windows")
        build_command="msbuild"
        test_command="vstest.console.exe"
        cleanup_command="rd /s /q build"
        ;;
    *)
        echo "Unsupported operating system"
        exit 1
        ;;
esac
                        
# Execute commands for building, testing, and cleaning the environment
echo "Building the environment: $build_command"
$build_command
                        
echo "Testing the environment: $test_command"
$test_command
                        
echo "Cleaning up the environment: $cleanup_command"
$cleanup_command