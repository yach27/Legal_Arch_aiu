import React from 'react';
import { ChatMessage as ChatMessageType } from '../../types';
import { FileLink } from './FileLink';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.type === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isUser
            ? 'bg-green-700 text-white'
            : 'bg-gray-200 text-gray-800'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>

        {/* Display document references if available */}
        {message.documents && message.documents.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-300 space-y-2">
            <p className="text-xs font-semibold text-gray-600 mb-2">Referenced Documents:</p>
            {message.documents.map((doc) => (
              <FileLink key={doc.doc_id} document={doc} />
            ))}
          </div>
        )}

        <p className={`text-xs mt-1 ${isUser ? 'text-green-200' : 'text-gray-500'}`}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};
