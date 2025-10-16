"""
Main Flask application for AI Bridge Service
"""
import logging
from flask import Flask
from flask_cors import CORS
from config import CORS_ORIGINS
from model_loader import load_embedding_model, load_llama_model
from routes import register_routes

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app():
    """Create and configure Flask application"""
    app = Flask(__name__)
    CORS(app, origins=CORS_ORIGINS)
    
    # Register all routes
    register_routes(app)
    
    return app

if __name__ == '__main__':
    logger.info("Starting AI Bridge Service...")
    logger.info("Loading BERT embedding model...")
    
    model_loaded = load_embedding_model()
    
    if not model_loaded:
        logger.warning("Embedding model not loaded, some features will be limited")
    
    logger.info("Loading Llama model for description generation...")
    llama_loaded = load_llama_model()
    
    if not llama_loaded:
        logger.warning("Llama model not loaded, will use rule-based description generation")
    
    app = create_app()
    
    logger.info("AI Bridge Service starting on port 5003")
    logger.info("Endpoints available:")
    logger.info("  - Health check: GET /health")
    logger.info("  - Process document: POST /api/documents/process-ai")
    logger.info("  - Analyze document: POST /api/documents/analyze")
    logger.info("  - Document similarity: POST /api/documents/similarity")
    logger.info("  - Semantic search: POST /api/documents/search")
    
    app.run(host='0.0.0.0', port=5003, debug=False, threaded=True)