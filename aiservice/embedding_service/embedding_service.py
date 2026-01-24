from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
import logging
import os
import traceback
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global variable for embedding model
embedding_model = None

# Path to your local embedding model
# Calculate absolute path relative to this script file to ensure it works anywhere
BASE_DIR = os.path.dirname(os.path.abspath(__file__)) # aiservice/embedding_service
PROJECT_ROOT = os.path.dirname(os.path.dirname(BASE_DIR)) # Legal_Arch_aiu
EMBEDDING_MODEL_PATH = os.path.join(PROJECT_ROOT, "storage", "app", "models", "all-MiniLM-L6-v2")       
          
def load_embedding_model():
    """Load the sentence transformer embedding model"""
    global embedding_model
    
    try:
        logger.info(f"Loading embedding model from {EMBEDDING_MODEL_PATH}")
        
        # Check if model directory exists
        if not os.path.exists(EMBEDDING_MODEL_PATH):
            logger.error(f"Embedding model not found: {EMBEDDING_MODEL_PATH}")
            return False
        
        # Load the embedding model
        embedding_model = SentenceTransformer(EMBEDDING_MODEL_PATH)
        
        logger.info("Embedding model loaded successfully!")
        return True
        
    except Exception as e:
        logger.error(f"Failed to load embedding model: {str(e)}")
        logger.error(traceback.format_exc())
        return False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check for embedding service"""
    return jsonify({
        'status': 'healthy' if embedding_model is not None else 'loading',
        'model_loaded': embedding_model is not None,
        'model_name': 'all-MiniLM-L6-v2',
        'model_path': EMBEDDING_MODEL_PATH,
        'service': 'embedding',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/embed/single', methods=['POST'])
def embed_single():
    """Generate embedding for a single text"""
    try:
        if not embedding_model:
            return jsonify({
                'error': 'Embedding model not loaded'
            }), 503
        
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Text field is required'}), 400
        
        text = data['text'].strip()
        
        if not text:
            return jsonify({'error': 'Text cannot be empty'}), 400
        
        logger.info(f"Generating embedding for text: {text[:50]}...")
        
        # Generate embedding
        embedding = embedding_model.encode([text], convert_to_tensor=False)[0]
        
        return jsonify({
            'embedding': embedding.tolist(),
            'dimensions': len(embedding),
            'text_length': len(text),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error generating single embedding: {str(e)}")
        return jsonify({
            'error': 'Failed to generate embedding',
            'details': str(e)
        }), 500

@app.route('/embed', methods=['POST'])
def embed_batch():
    """Generate embeddings for multiple texts"""
    try:
        if not embedding_model:
            return jsonify({
                'error': 'Embedding model not loaded'
            }), 503
        
        data = request.get_json()
        
        if not data or 'texts' not in data:
            return jsonify({'error': 'Texts field is required'}), 400
        
        texts = data['texts']
        
        if not isinstance(texts, list):
            texts = [texts]
        
        if not texts:
            return jsonify({'error': 'Texts cannot be empty'}), 400
        
        logger.info(f"Generating embeddings for {len(texts)} texts")
        
        # Generate embeddings
        embeddings = embedding_model.encode(texts, convert_to_tensor=False)
        embeddings_list = [embedding.tolist() for embedding in embeddings]
        
        return jsonify({
            'embeddings': embeddings_list,
            'count': len(embeddings_list),
            'dimensions': len(embeddings_list[0]) if embeddings_list else 0,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error generating batch embeddings: {str(e)}")
        return jsonify({
            'error': 'Failed to generate embeddings',
            'details': str(e)
        }), 500

@app.route('/similarity', methods=['POST'])
def calculate_similarity():
    """Calculate similarity between two texts using embeddings"""
    try:
        if not embedding_model:
            return jsonify({
                'error': 'Embedding model not loaded'
            }), 503
        
        data = request.get_json()
        
        if not data or 'text1' not in data or 'text2' not in data:
            return jsonify({'error': 'Both text1 and text2 fields are required'}), 400
        
        text1 = data['text1'].strip()
        text2 = data['text2'].strip()
        
        if not text1 or not text2:
            return jsonify({'error': 'Both texts must be non-empty'}), 400
        
        logger.info("Calculating similarity between two texts")
        
        # Generate embeddings
        embeddings = embedding_model.encode([text1, text2], convert_to_tensor=False)
        
        # Calculate cosine similarity
        try:
            from sklearn.metrics.pairwise import cosine_similarity
            import numpy as np
        except ImportError:
            return jsonify({
                'error': 'Missing required dependencies (scikit-learn, numpy)',
                'details': 'Please install: pip install scikit-learn numpy'
            }), 500
        
        similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
        
        return jsonify({
            'similarity': float(similarity),
            'text1_length': len(text1),
            'text2_length': len(text2),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error calculating similarity: {str(e)}")
        return jsonify({
            'error': 'Failed to calculate similarity',
            'details': str(e)
        }), 500

@app.route('/model/info', methods=['GET'])
def model_info():
    """Get embedding model information"""
    try:
        info = {
            'service': 'document_embedding',
            'model_name': 'all-MiniLM-L6-v2',
            'model_path': EMBEDDING_MODEL_PATH,
            'model_loaded': embedding_model is not None,
            'dimensions': 384,
            'max_sequence_length': 256,
            'library': 'sentence-transformers',
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(info)
        
    except Exception as e:
        logger.error(f"Error getting model info: {str(e)}")
        return jsonify({'error': 'Failed to get model info'}), 500

if __name__ == '__main__':
    logger.info("Starting Document Embedding Service...")
    logger.info("Loading embedding model (this may take a moment)...")
    
    model_loaded = load_embedding_model()
    
    if not model_loaded:
        logger.error("Failed to load embedding model. Exiting...")
        exit(1)
    
    logger.info("Embedding model loaded successfully!")
    logger.info("Document Embedding Service will be available at: http://localhost:5001")
    logger.info("Health check endpoint: http://localhost:5001/health")
    logger.info("Single text embedding: POST http://localhost:5001/embed/single")
    logger.info("Batch text embedding: POST http://localhost:5001/embed")
    
    app.run(host='0.0.0.0', port=5001, debug=False, threaded=True)