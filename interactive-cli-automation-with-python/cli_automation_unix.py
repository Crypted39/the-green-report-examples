import pexpect
import sys
import time

def automate_tgr_cli():
    """
    Automates the tgr-cli.js installation process for Unix systems by:
    1. Selecting 'y' for installing dependencies
    2. Choosing TypeScript from the language options
    3. Entering 'test_name' as the username
    """
    try:
        # Start the CLI process
        child = pexpect.spawn('node tgr-cli.js install', timeout=30, encoding='utf-8')
        
        # Enable logging of the interaction
        child.logfile = sys.stdout
        
        # Wait for the first prompt - using a more flexible pattern
        child.expect('Do you want to install other dependencies.*\(y/N\)')
        child.sendline('y')
        time.sleep(1)
        
        # Wait for the language selection - using a more flexible pattern
        child.expect('Which language do you want to use.*')
        time.sleep(1)
        # Send down arrow to select TypeScript
        child.send('\033[B') # Down arrow
        time.sleep(0.5)
        child.sendline('') # Enter
        
        # Wait for username prompt
        child.expect('Enter your username:.*')
        child.sendline('test_name')
        
        # Wait for completion
        child.expect('Installation completed successfully!')
        
        print("\nAutomation completed successfully!")
        return True
        
    except pexpect.ExceptionPexpect as e:
        print(f"\nError during automation: {str(e)}")
        if hasattr(child, 'before'):
            print(f"Last output before error: {child.before}")
        if hasattr(child, 'after'):
            print(f"Buffer at error: {child.after}")
        return False
    except Exception as e:
        print(f"\nUnexpected error: {str(e)}")
        return False

if __name__ == "__main__":
    automate_tgr_cli()