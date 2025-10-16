"""
Entry point to run the Embedding Service
"""
import sys
import os

# Add the embedding_service directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'embedding_service'))

# Import and run the embedding service
import subprocess
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if __name__ == '__main__':
    logger.info("Starting Embedding Service on port 5001...")
    
    # Get the path to the embedding service file
    embedding_service_path = os.path.join(os.path.dirname(__file__), 'embedding_service', 'embedding_service.py')
    
    # Run the embedding service - try venv first, fallback to system Python
    venv_python = os.path.join(os.path.dirname(__file__), 'aiservice_env', 'Scripts', 'python.exe')
    
    try:
        # Force use of actual system Python, not venv Python
        system_python_paths = [
            r'C:\Users\jhunb\AppData\Local\Microsoft\WindowsApps\PythonSoftwareFoundation.Python.3.12_qbz5n2kfra8p0\python.exe',
            r'C:\Python312\python.exe',
            r'C:\Python\python.exe',
            'python'  # fallback to PATH
        ]
        
        system_python = None
        for path in system_python_paths:
            if os.path.exists(path):
                system_python = path
                break
        
        if not system_python:
            system_python = 'python'  # fallback
            
        logger.info("Virtual environment has NumPy issues, trying system Python")
        logger.info(f"Using system Python: {system_python}")
        subprocess.run([system_python, embedding_service_path], check=True)
    except KeyboardInterrupt:
        logger.info("Embedding Service stopped by user")
    except Exception as e:
        logger.error(f"Error running embedding service: {str(e)}")