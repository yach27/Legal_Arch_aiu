"""
Flask routes for the Chatbot service
"""
import time
import logging
from datetime import datetime
from flask import request, jsonify
try:
    from .model_manager import model_manager
    from .conversation import conversation_manager
    from .llama_generator import llama_generator
    from .config import MAX_MESSAGE_LENGTH
except ImportError:
    from model_manager import model_manager
    from conversation import conversation_manager
    from llama_generator import llama_generator
    from config import MAX_MESSAGE_LENGTH

logger = logging.getLogger(__name__)

def register_routes(app):
    """Register all routes with the Flask app"""

    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint with detailed info"""
        return jsonify({
            'status': 'healthy' if model_manager.is_model_loaded() else 'loading',
            'model_loaded': model_manager.is_model_loaded(),
            'model_name': 'Llama-3.2-3B-Instruct',
            'device': 'cpu',
            'active_conversations': conversation_manager.get_active_conversation_count(),
            'timestamp': datetime.now().isoformat()
        })

    @app.route('/chat', methods=['POST'])
    def chat():
        """Main chat endpoint for Llama"""
        start_time = time.time()

        try:
            if not model_manager.is_model_loaded():
                return jsonify({
                    'error': 'Model not loaded. Please wait for model to finish loading.',
                    'status': 'model_loading'
                }), 503

            data = request.get_json()

            if not data or 'message' not in data:
                return jsonify({'error': 'Message is required'}), 400

            message = data['message'].strip()
            conversation_id = data.get('conversation_id')
            document_context = data.get('document_context', '')

            if not message:
                return jsonify({'error': 'Message cannot be empty'}), 400

            # Limit message length for CPU efficiency
            if len(message) > MAX_MESSAGE_LENGTH:
                message = message[:MAX_MESSAGE_LENGTH] + "..."
                logger.info(f"Truncated long message to {MAX_MESSAGE_LENGTH} characters")

            logger.info(f"Received message for conversation {conversation_id}: {message[:50]}...")

            # Generate response with timeout
            response = llama_generator.generate_response_with_timeout(message, conversation_id, document_context)

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
            history = conversation_manager.get_history(conversation_id)
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
            conversation_manager.clear_conversation(conversation_id)
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
            conversations = conversation_manager.list_conversations()

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
                'model_path': model_manager.model.model_path if model_manager.is_model_loaded() else None,
                'model_loaded': model_manager.is_model_loaded(),
                'device': 'cpu',
                'active_conversations': conversation_manager.get_active_conversation_count(),
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
            if not model_manager.is_model_loaded():
                return jsonify({'error': 'Model not loaded'}), 503

            test_message = "Hello, how are you?"
            start_time = time.time()

            response = llama_generator.generate_response_internal(test_message, f"test-{int(time.time())}", None)

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