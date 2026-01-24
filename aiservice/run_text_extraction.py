"""
Entry point to run the Text Extraction Service
"""
import sys
import os

# Add the text_extraction directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'text_extraction'))

# Import and run the text extraction service
import subprocess
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if __name__ == '__main__':
    logger.info("Starting Text Extraction Service on port 5002...")
    
    # Get the path to the text extraction service file
    text_extraction_path = os.path.join(os.path.dirname(__file__), 'text_extraction', 'text_extraction_service.py')
    
    # Use aiservice_env_py310 (correct Python version with PaddleOCR)
    python_310_path = os.path.join(os.path.dirname(__file__), 'aiservice_env_py310', 'Scripts', 'python.exe')
    
    # Run the text extraction service with Python 3.10
    try:
        subprocess.run([python_310_path, text_extraction_path], check=True)
    except KeyboardInterrupt:
        logger.info("Text Extraction Service stopped by user")
    except Exception as e:
        logger.error(f"Error running text extraction service: {str(e)}")