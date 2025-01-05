import time
from pywinauto.keyboard import send_keys
import subprocess

def automate_tgr_cli():
    """
    Automates the tgr-cli.js installation process on Windows by:
    1. Selecting 'y' for installing dependencies
    2. Choosing 'TypeScript' from the language options (using down arrow)
    3. Entering 'test_name' as the username
    """
    try:
        # Start the process
        process = subprocess.Popen(
            'node tgr-cli.js install',
            shell=True,
        )
        
        # Wait for the process to start
        time.sleep(2)
        
        # Send 'y' for the first prompt
        send_keys('y{ENTER}')
        time.sleep(1)
        
        # Send DOWN ARROW to move to TypeScript, then ENTER to select it
        send_keys('{DOWN}{ENTER}')
        time.sleep(1)
        
        # Send the username
        send_keys('test_name{ENTER}')
        
        # Wait for the process to complete
        process.wait()
        
        print("\nAutomation completed successfully!")
        return True
            
    except Exception as e:
        print(f"\nUnexpected error: {str(e)}")
        return False

if __name__ == "__main__":
    print("Starting automation... Please don't use your keyboard or mouse until the script completes.")
    automate_tgr_cli()