import os
import sys
import subprocess
import platform
import shutil
import certifi

def main():
    """Setup script for RockyBot Flask application with SSL certificate fix."""
    print("Setting up RockyBot Flask application...")
    
    # Create necessary directories if they don't exist
    directories = [
        'static/img',
        'static/css',
        'static/js',
        'templates'
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"✓ Directory {directory} checked")
    
    # Create virtual environment
    if not os.path.exists('venv'):
        print("\nCreating virtual environment...")
        try:
            subprocess.check_call([sys.executable, '-m', 'venv', 'venv'])
            print("✓ Virtual environment created")
        except subprocess.CalledProcessError:
            print("❌ Failed to create virtual environment")
            return
    else:
        print("\n✓ Virtual environment already exists")
    
    # Fix SSL certificates
    print("\nSetting up SSL certificates...")
    try:
        # Get the certifi certificate path
        cacert_path = certifi.where()
        print(f"Certificate path: {cacert_path}")
        
        # Set environment variable for SSL certificates
        if platform.system() == "Windows":
            # For Windows, set system environment variable
            os.system(f'setx SSL_CERT_FILE "{cacert_path}"')
            os.system(f'setx REQUESTS_CA_BUNDLE "{cacert_path}"')
            print("✓ SSL environment variables set for Windows")
        else:
            # For macOS/Linux, add to bash profile or similar
            with open(os.path.expanduser("~/.bash_profile"), "a") as f:
                f.write(f'\nexport SSL_CERT_FILE="{cacert_path}"\n')
                f.write(f'export REQUESTS_CA_BUNDLE="{cacert_path}"\n')
            print("✓ SSL environment variables added to .bash_profile")
    except Exception as e:
        print(f"⚠️ SSL certificate setup encountered an issue: {str(e)}")
        print("  You may need to set SSL_CERT_FILE manually")
    
    # Activate virtual environment and install dependencies
    print("\nInstalling dependencies...")
    
    # First install certifi and urllib3
    print("Installing certificate-related packages first...")
    
    # Determine the correct pip path based on the platform
    if platform.system() == "Windows":
        pip_path = os.path.join('venv', 'Scripts', 'pip')
    else:  # macOS or Linux
        pip_path = os.path.join('venv', 'bin', 'pip')
    
    # Install certifi first
    try:
        subprocess.check_call([pip_path, 'install', 'certifi', 'urllib3', '--upgrade'])
        print("✓ Certificate packages installed")
    except Exception as e:
        print(f"⚠️ Failed to install certificate packages: {str(e)}")
    
    # Now install all requirements
    try:
        subprocess.check_call([pip_path, 'install', '-r', 'requirements.txt'])
        print("✓ All dependencies installed")
    except Exception as e:
        print(f"⚠️ Failed to install dependencies: {str(e)}")
    
    print("\n✅ Setup completed!")
    print("\nTo run the application:")
    if platform.system() == "Windows":
        print("  Run: .\\run.bat")
    else:
        print("  Run: ./run.sh (make it executable with 'chmod +x run.sh' first)")
    
    print("\nIf you encounter SSL certificate issues:")
    print("  1. Use the updated app.py file with SSL verification disabled")
    print("  2. Or refer to SSL_CERTIFICATE_FIX.md for more solutions")

if __name__ == "__main__":
    main()