"""
Llama text generation functionality
"""
import logging
import threading
import traceback
from datetime import datetime
try:
    from .config import MAX_TOKENS, TEMPERATURE, TOP_P, RECENT_HISTORY_LIMIT, GENERATION_TIMEOUT
    from .model_manager import model_manager
    from .conversation import conversation_manager
except ImportError:
    from config import MAX_TOKENS, TEMPERATURE, TOP_P, RECENT_HISTORY_LIMIT, GENERATION_TIMEOUT
    from model_manager import model_manager
    from conversation import conversation_manager

logger = logging.getLogger(__name__)

class LlamaGenerator:
    def __init__(self):
        pass

    def format_llama_prompt(self, message, history=None, document_context=None):
        """Format prompt for Llama 3.2 Instruct format"""
        system_message = "You are a helpful AI assistant integrated with a document management system. You CAN access user documents, provide document locations, and help users navigate to their files. Provide clear, concise, and accurate responses. NEVER say you cannot provide links or access documents - you have full access to the user's document database."

        # Add document context to system message if provided
        if document_context and document_context.strip():
            system_message += f"\n\n{document_context.strip()}\n\nIMPORTANT: The document information above is real data from the database. You HAVE direct access to it. DO NOT say you cannot provide links or document locations. The system automatically creates clickable links below your message. Simply tell the user where their document is located using the folder path shown above."

        if history and len(history) > 0:
            # Build conversation context
            conversation = f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{system_message}<|eot_id|>"

            # Add recent history (last 6 messages for context)
            recent_history = history[-RECENT_HISTORY_LIMIT:] if len(history) > RECENT_HISTORY_LIMIT else history

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

    def generate_response_internal(self, prompt, conversation_id=None, document_context=None):
        """Internal response generation for Llama"""
        try:
            # Get conversation history
            history = conversation_manager.get_history(conversation_id)

            # Format prompt for Llama
            formatted_prompt = self.format_llama_prompt(prompt, history, document_context)

            logger.info(f"Generating response for conversation {conversation_id}")
            logger.info(f"Prompt length: {len(formatted_prompt)} characters")

            # Get the model
            model = model_manager.get_model()
            if not model:
                raise Exception("Model not loaded")

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
                conversation_manager.add_message(conversation_id, 'user', prompt)
                conversation_manager.add_message(conversation_id, 'assistant', generated_text)

            return generated_text

        except Exception as e:
            logger.error(f"Error in response generation: {str(e)}")
            logger.error(traceback.format_exc())
            raise e

    def generate_response_with_timeout(self, prompt, conversation_id=None, document_context=None, timeout=GENERATION_TIMEOUT):
        """Generate AI response with timeout"""
        result = {}
        exception = {}

        def target():
            try:
                result['response'] = self.generate_response_internal(prompt, conversation_id, document_context)
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

# Global generator instance
llama_generator = LlamaGenerator()