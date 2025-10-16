"""
Configuration settings for the Chatbot service
"""
import os

# Configuration for Llama 3.2
# Get absolute path to model file - go up to project root then into storage
_current_dir = os.path.dirname(__file__)  # chatbot directory
_aiservice_dir = os.path.dirname(_current_dir)  # aiservice directory
_project_root = os.path.dirname(_aiservice_dir)  # Legal_Arch_aiu directory
MODEL_PATH = os.path.join(_project_root, "storage", "app", "models", "Llama-3.2-3B-Instruct-Q8_0-GGUF", "llama-3.2-3b-instruct-q8_0.gguf")
MAX_TOKENS = 500
TEMPERATURE = 0.7
TOP_P = 0.9

# Server configuration
HOST = '0.0.0.0'
PORT = 5000
DEBUG = False

# Model loading configuration
N_CTX = 4096  # Balanced context window - enough for documents but faster processing
N_THREADS = 4  # Number of threads for your Ryzen 7
N_GPU_LAYERS = 0  # Force CPU usage

# Conversation limits
MAX_HISTORY_MESSAGES = 12  # Keep only last 12 messages (6 exchanges) for memory efficiency
RECENT_HISTORY_LIMIT = 6  # Last 6 messages for context
MAX_MESSAGE_LENGTH = 500  # Limit message length for CPU efficiency

# Timeout settings
GENERATION_TIMEOUT = 180  # Increased to 3 minutes for document processing