"""
Conversation history management
"""
from datetime import datetime
try:
    from .config import MAX_HISTORY_MESSAGES
except ImportError:
    from config import MAX_HISTORY_MESSAGES

class ConversationManager:
    def __init__(self):
        self.conversation_history = {}

    def add_message(self, conversation_id, role, content):
        """Add a message to conversation history"""
        if conversation_id not in self.conversation_history:
            self.conversation_history[conversation_id] = []

        self.conversation_history[conversation_id].append({
            'role': role,
            'content': content,
            'timestamp': datetime.now().isoformat()
        })

        # Keep only last MAX_HISTORY_MESSAGES for memory efficiency
        if len(self.conversation_history[conversation_id]) > MAX_HISTORY_MESSAGES:
            self.conversation_history[conversation_id] = self.conversation_history[conversation_id][-MAX_HISTORY_MESSAGES:]

    def get_history(self, conversation_id):
        """Get conversation history for a specific conversation"""
        return self.conversation_history.get(conversation_id, [])

    def clear_conversation(self, conversation_id):
        """Clear conversation history"""
        if conversation_id in self.conversation_history:
            del self.conversation_history[conversation_id]
            return True
        return False

    def list_conversations(self):
        """List all active conversations"""
        conversations = []
        for conv_id, history in self.conversation_history.items():
            if history:
                conversations.append({
                    'conversation_id': conv_id,
                    'message_count': len(history),
                    'last_message': history[-1]['content'][:50] + '...' if len(history[-1]['content']) > 50 else history[-1]['content'],
                    'last_timestamp': history[-1]['timestamp']
                })
        return conversations

    def get_active_conversation_count(self):
        """Get count of active conversations"""
        return len(self.conversation_history)

# Global conversation manager instance
conversation_manager = ConversationManager()