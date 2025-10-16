from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import json
import os
from datetime import datetime
import traceback
import threading
import time
from llama_cpp import Llama

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global variables for model
model = None

# Configuration for Llama 3.2
MODEL_PATH = "../storage/app/models/Llama-3.2-3B-Instruct-Q8_0-GGUF/Llama-3.2-3B-Instruct-Q8_0.gguf"
MAX_TOKENS = 500
TEMPERATURE = 0.7
TOP_P = 0.9

# Store conversation history in memory
conversation_history = {}

def load_model():
    """Load the Llama GGUF model"""
    global model
    
    try:
        logger.info(f"Loading Llama model from {MODEL_PATH}")
        
        # Check if model file exists
        if not os.path.exists(MODEL_PATH):
            logger.error(f"Model file not found: {MODEL_PATH}")
            return False
        
        # Load model with CPU-optimized settings
        model = Llama(
            model_path=MODEL_PATH,
            n_ctx=2048,  # Context window
            n_threads=4,  # Number of threads for your Ryzen 7
            verbose=False,
            n_gpu_layers=0,  # Force CPU usage
        )
        
        logger.info("Llama model loaded successfully on CPU!")
        return True
        
    except Exception as e:
        logger.error(f"Failed to load model: {str(e)}")
        logger.error(traceback.format_exc())
        return False

def generate_response_with_timeout(prompt, conversation_id=None, timeout=120):
    """Generate AI response with timeout"""
    result = {}
    exception = {}
    
    def target():
        try:
            result['response'] = generate_response_internal(prompt, conversation_id)
        except Exception as e:
            exception['error'] = str(e)
    
    thread = threading.Thread(target=target)
    thread.daemon = True
    thread.start()
    thread.join(timeout)
    
    if thread.is_alive():
        logger.warning(f"Generation timed out after {timeout}s for conversation {conversation_id}")
        return "I apologize, but I'm taking too long to respond. Please try with a shorter message or try again later."
    
    if 'error' in exception:
        raise Exception(exception['error'])
    
    return result.get('response', "No response generated")

def format_llama_prompt(message, history=None):
    """Format prompt for Llama 3.2 Instruct format"""
    system_message = "You are a helpful AI assistant. Provide clear, concise, and accurate responses."
    
    if history and len(history) > 0:
        # Build conversation context
        conversation = f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{system_message}<|eot_id|>"
        
        # Add recent history (last 6 messages for context)
        recent_history = history[-6:] if len(history) > 6 else history
        
        for msg in recent_history:
            if msg['role'] == 'user':
                conversation += f"<|start_header_id|>user<|end_header_id|>\n\n{msg['content']}<|eot_id|>"
            elif msg['role'] == 'assistant':
                conversation += f"<|start_header_id|>assistant<|end_header_id|>\n\n{msg['content']}<|eot_id|>"
        
        # Add current message
        conversation += f"<|start_header_id|>user<|end_header_id|>\n\n{message}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n"
    else:
        # First message in conversation
        conversation = f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{system_message}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n{message}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n"
    
    return conversation

def generate_response_internal(prompt, conversation_id=None):
    """Internal response generation for Llama"""
    try:
        # Get conversation history
        history = conversation_history.get(conversation_id, [])
        
        # Format prompt for Llama
        formatted_prompt = format_llama_prompt(prompt, history)
        
        logger.info(f"Generating response for conversation {conversation_id}")
        logger.info(f"Prompt length: {len(formatted_prompt)} characters")
        
        # Generate response
        response = model(
            formatted_prompt,
            max_tokens=MAX_TOKENS,
            temperature=TEMPERATURE,
            top_p=TOP_P,
            stop=["<|eot_id|>", "<|end_of_text|>"],
            echo=False
        )
        
        # Extract generated text
        generated_text = response['choices'][0]['text'].strip()
        
        # Clean up response
        if not generated_text:
            generated_text = "I'm sorry, I couldn't generate a proper response. Could you rephrase your question?"
        
        # Remove any remaining special tokens
        for token in ["<|eot_id|>", "<|end_of_text|>", "<|start_header_id|>", "<|end_header_id|>"]:
            generated_text = generated_text.replace(token, "")
        
        generated_text = generated_text.strip()
        
        # Store in conversation history
        if conversation_id:
            if conversation_id not in conversation_history:
                conversation_history[conversation_id] = []
            
            conversation_history[conversation_id].append({
                'role': 'user',
                'content': prompt,
                'timestamp': datetime.now().isoformat()
            })
            
            conversation_history[conversation_id].append({
                'role': 'assistant',
                'content': generated_text,
                'timestamp': datetime.now().isoformat()
            })
            
            # Keep only last 12 messages (6 exchanges) for memory efficiency
            if len(conversation_history[conversation_id]) > 12:
                conversation_history[conversation_id] = conversation_history[conversation_id][-12:]
        
        return generated_text
        
    except Exception as e:
        logger.error(f"Error in response generation: {str(e)}")
        logger.error(traceback.format_exc())
        raise e

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint with detailed info"""
    return jsonify({
        'status': 'healthy' if model is not None else 'loading',
        'model_loaded': model is not None,
        'model_name': 'Llama-3.2-3B-Instruct',
        'device': 'cpu',
        'active_conversations': len(conversation_history),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/chat', methods=['POST'])
def chat():
    """Main chat endpoint for Llama"""
    start_time = time.time()
    
    try:
        if not model:
            return jsonify({
                'error': 'Model not loaded. Please wait for model to finish loading.',
                'status': 'model_loading'
            }), 503
        
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({'error': 'Message is required'}), 400
        
        message = data['message'].strip()
        conversation_id = data.get('conversation_id')
        
        if not message:
            return jsonify({'error': 'Message cannot be empty'}), 400
        
        # Limit message length for CPU efficiency
        if len(message) > 500:
            message = message[:500] + "..."
            logger.info(f"Truncated long message to 500 characters")
        
        logger.info(f"Received message for conversation {conversation_id}: {message[:50]}...")
        
        # Generate response with timeout
        response = generate_response_with_timeout(message, conversation_id)
        
        end_time = time.time()
        generation_time = round(end_time - start_time, 2)
        
        logger.info(f"Response generated in {generation_time}s")
        
        return jsonify({
            'response': response,
            'conversation_id': conversation_id,
            'timestamp': datetime.now().isoformat(),
            'status': 'success',
            'generation_time': generation_time,
            'model': 'Llama-3.2-3B-Instruct'
        })
        
    except Exception as e:
        end_time = time.time()
        generation_time = round(end_time - start_time, 2)
        
        logger.error(f"Chat endpoint error after {generation_time}s: {str(e)}")
        return jsonify({
            'error': 'Response generation failed. Please try again.',
            'generation_time': generation_time,
            'details': str(e)
        }), 500

@app.route('/conversations/<conversation_id>/history', methods=['GET'])
def get_conversation_history(conversation_id):
    """Get conversation history for a specific conversation"""
    try:
        history = conversation_history.get(conversation_id, [])
        return jsonify({
            'conversation_id': conversation_id,
            'history': history,
            'message_count': len(history)
        })
    except Exception as e:
        logger.error(f"Error fetching history: {str(e)}")
        return jsonify({'error': 'Failed to fetch conversation history'}), 500

@app.route('/conversations/<conversation_id>', methods=['DELETE'])
def clear_conversation(conversation_id):
    """Clear conversation history"""
    try:
        if conversation_id in conversation_history:
            del conversation_history[conversation_id]
            logger.info(f"Cleared conversation {conversation_id}")
        
        return jsonify({
            'message': 'Conversation cleared successfully',
            'conversation_id': conversation_id
        })
    except Exception as e:
        logger.error(f"Error clearing conversation: {str(e)}")
        return jsonify({'error': 'Failed to clear conversation'}), 500

@app.route('/conversations', methods=['GET'])
def list_conversations():
    """List all active conversations"""
    try:
        conversations = []
        for conv_id, history in conversation_history.items():
            if history:
                conversations.append({
                    'conversation_id': conv_id,
                    'message_count': len(history),
                    'last_message': history[-1]['content'][:50] + '...' if len(history[-1]['content']) > 50 else history[-1]['content'],
                    'last_timestamp': history[-1]['timestamp']
                })
        
        return jsonify({
            'conversations': conversations,
            'total_count': len(conversations)
        })
    except Exception as e:
        logger.error(f"Error listing conversations: {str(e)}")
        return jsonify({'error': 'Failed to list conversations'}), 500

@app.route('/model/info', methods=['GET'])
def model_info():
    """Get detailed model information"""
    try:
        info = {
            'model_name': 'Llama-3.2-3B-Instruct',
            'model_path': MODEL_PATH,
            'model_loaded': model is not None,
            'device': 'cpu',
            'active_conversations': len(conversation_history),
            'library': 'llama-cpp-python'
        }
        
        return jsonify(info)
    except Exception as e:
        logger.error(f"Error getting model info: {str(e)}")
        return jsonify({'error': 'Failed to get model info'}), 500

@app.route('/test', methods=['POST'])
def test_generation():
    """Test endpoint for quick model testing"""
    try:
        if not model:
            return jsonify({'error': 'Model not loaded'}), 503
            
        test_message = "Hello, how are you?"
        start_time = time.time()
        
        response = generate_response_internal(test_message, f"test-{int(time.time())}")
        
        generation_time = round(time.time() - start_time, 2)
        
        return jsonify({
            'test_input': test_message,
            'test_output': response,
            'generation_time': generation_time,
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'failed'
        }), 500

if __name__ == '__main__':
    logger.info("Starting Flask AI Service with Llama 3.2...")
    logger.info("Loading model (this may take 1-2 minutes)...")
    
    model_loaded = load_model()
    
    
    if not model_loaded:
        logger.error("Failed to load model. Exiting...")
        exit(1)
    
    logger.info("Model loaded successfully! Starting Flask server...")
    logger.info("Server will be available at: http://localhost:5000")
    logger.info("Health check endpoint: http://localhost:5000/health")
    
    # Fix for Windows console output issues
    import os
    os.environ['PYTHONIOENCODING'] = 'utf-8'
    
    # Disable Flask's banner to avoid console issues
    import logging
    logging.getLogger('werkzeug').setLevel(logging.ERROR)
    
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True, use_reloader=False)