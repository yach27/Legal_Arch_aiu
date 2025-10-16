"""
Configuration settings for AI Bridge Service
"""
import os

# Global configuration
LARAVEL_BASE_URL = "http://127.0.0.1:8000"
EMBEDDING_MODEL_PATH = "../../storage/app/models/legal-bert-base-uncased"
FALLBACK_MODEL_PATH = "../../storage/app/models/all-MiniLM-L6-v2"
LLAMA_MODEL_PATH = "../../storage/app/models/Llama-3.2-3B-Instruct-Q8_0-GGUF/llama-3.2-3b-instruct-q8_0.gguf"

# Service URLs
TEXT_EXTRACTION_URL = "http://127.0.0.1:5002"
EMBEDDING_SERVICE_URL = "http://127.0.0.1:5001"

# CORS settings
CORS_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:8000", "http://localhost:8000"]

# Text processing settings
DEFAULT_CHUNK_SIZE = 1000
DEFAULT_CHUNK_OVERLAP = 200
MIN_TEXT_LENGTH = 50
MIN_CHUNK_LENGTH = 50

# Document analysis settings
MAX_TITLE_LENGTH = 100
MAX_DESCRIPTION_LENGTH = 500
MIN_PARAGRAPH_LENGTH = 50
TITLE_SEARCH_LINES = 10

# API timeouts (in seconds)
LARAVEL_API_TIMEOUT = 30
TEXT_EXTRACTION_TIMEOUT = 60