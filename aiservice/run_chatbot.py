"""
Entry point to run the Chatbot Service
"""
import sys
import os
import logging

# Add the chatbot directory to Python path
chatbot_dir = os.path.join(os.path.dirname(__file__), 'chatbot')
sys.path.insert(0, chatbot_dir)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if __name__ == '__main__':
    logger.info("Starting Chatbot Service on port 5000...")

    # Change to chatbot directory to ensure relative imports work
    original_cwd = os.getcwd()
    os.chdir(chatbot_dir)

    try:
        # Import and run the chatbot service directly
        from chatbot_service import main
        main()
    except KeyboardInterrupt:
        logger.info("Chatbot Service stopped by user")
    except Exception as e:
        logger.error(f"Error running chatbot service: {str(e)}")
    finally:
        # Restore original working directory
        os.chdir(original_cwd)