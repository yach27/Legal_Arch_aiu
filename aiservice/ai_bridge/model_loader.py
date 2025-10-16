"""
Model loading functionality for AI Bridge Service
"""
import os
import logging
import traceback
from sentence_transformers import SentenceTransformer
from config import EMBEDDING_MODEL_PATH, FALLBACK_MODEL_PATH, LLAMA_MODEL_PATH

# Configure logging
logger = logging.getLogger(__name__)

# Global variables for models
embedding_model = None
llama_model = None

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
            logger.error(f"Llama model not found at {LLAMA_MODEL_PATH}")
            return False
            
        # Import llama-cpp-python
        try:
            from llama_cpp import Llama
        except ImportError:
            logger.error("llama-cpp-python not installed. Please install: pip install llama-cpp-python")
            return False
        
        logger.info(f"Loading Llama model from {LLAMA_MODEL_PATH}")
        
        # Load the Llama model with appropriate settings
        llama_model = Llama(
            model_path=LLAMA_MODEL_PATH,
            n_ctx=2048,  # Context length
            n_threads=4,  # Number of CPU threads
            verbose=False
        )
        
        logger.info("Llama model loaded successfully!")
        return True
        
    except Exception as e:
        logger.error(f"Failed to load Llama model: {str(e)}")
        logger.error(traceback.format_exc())
        return False

def get_llama_model():
    """Get the loaded Llama model"""
    return llama_model

def is_model_loaded():
    """Check if embedding model is loaded"""
    return embedding_model is not None

def is_llama_loaded():
    """Check if Llama model is loaded"""
    return llama_model is not None