"""
Model loading functionality for AI Bridge Service
"""
import os
import logging
import traceback
import threading
from sentence_transformers import SentenceTransformer
from config import EMBEDDING_MODEL_PATH, FALLBACK_MODEL_PATH, LLAMA_MODEL_PATH

# Configure logging
logger = logging.getLogger(__name__)

# Global variables for models
embedding_model = None
llama_model = None
llama_lock = threading.Lock()  # Thread lock for Llama model access

def load_embedding_model():
    """Load the BERT embedding model (legal-bert-base-uncased only)"""
    global embedding_model
    
    try:
        # Only load the legal BERT model
        if os.path.exists(EMBEDDING_MODEL_PATH):
            logger.info(f"Loading legal BERT model from {EMBEDDING_MODEL_PATH}")
            embedding_model = SentenceTransformer(EMBEDDING_MODEL_PATH)
            logger.info("Legal BERT model loaded successfully!")
            return True
        else:
            logger.error(f"Legal BERT model not found at {EMBEDDING_MODEL_PATH}")
            logger.error("Please ensure legal-bert-base-uncased model is properly installed")
            return False
        
    except Exception as e:
        logger.error(f"Failed to load legal BERT model: {str(e)}")
        logger.error(traceback.format_exc())
        return False

def get_embedding_model():
    """Get the loaded embedding model"""
    return embedding_model

def load_llama_model():
    """Load the Llama model for text generation"""
    global llama_model

    try:
        # Check if model file exists
        if not os.path.exists(LLAMA_MODEL_PATH):
            logger.warning(f"Llama model not found at {LLAMA_MODEL_PATH}")
            logger.warning("AI Bridge will use rule-based description generation instead")
            return False

        # Import llama-cpp-python
        try:
            from llama_cpp import Llama
        except ImportError:
            logger.warning("llama-cpp-python not installed. Please install: pip install llama-cpp-python")
            logger.warning("AI Bridge will use rule-based description generation instead")
            return False

        logger.info(f"Loading Llama model from {LLAMA_MODEL_PATH}")

        # Reduced context size for stability on Windows
        llama_model = Llama(
            model_path=LLAMA_MODEL_PATH,
            n_ctx=2048,  # Reduced for stability
            n_threads=2,  # Reduced threads
            n_batch=256,  # Smaller batch
            n_ubatch=256, # Match batch size for stability
            verbose=False,
            n_gpu_layers=0,  # Force CPU usage
            use_mmap=False,  # Disable mmap for Windows stability
            use_mlock=False, # Disable mlock to avoid memory issues on Windows
        )

        logger.info("Llama model loaded successfully on CPU!")
        return True

    except Exception as e:
        logger.warning(f"Failed to load Llama model: {str(e)}")
        logger.warning("AI Bridge will use rule-based description generation instead")
        logger.error(traceback.format_exc())
        return False

def get_llama_model():
    """Get the loaded Llama model (thread-safe)"""
    return llama_model

def get_llama_lock():
    """Get the Llama thread lock for safe concurrent access"""
    return llama_lock

def is_model_loaded():
    """Check if embedding model is loaded"""
    return embedding_model is not None

def is_llama_loaded():
    """Check if Llama model is loaded"""
    return llama_model is not None