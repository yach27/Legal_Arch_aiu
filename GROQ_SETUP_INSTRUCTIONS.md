# Groq API Integration Setup Instructions

This guide will help you set up the Groq API for online AI chat functionality in your Legal Document Management System.

## What is Groq?

Groq provides ultra-fast AI inference using their custom hardware. It's an online API service, meaning **you don't need to run any local Python AI service** when using Groq.

## Benefits of Using Groq

✅ **No Local AI Service Required** - No need to run the Python Flask server
✅ **Fast Response Times** - Groq's LPU™ delivers extremely fast inference
✅ **Powerful Models** - Access to Llama 3.3 70B and other large models
✅ **Automatic Document Context** - Your documents are automatically included in the chat
✅ **Conversation History** - Maintains context across messages
✅ **Free Tier Available** - Generous free tier for development and testing

## Setup Steps

### 1. Get Your Groq API Key

1. Visit [https://console.groq.com](https://console.groq.com)
2. Sign up or log in with your account
3. Navigate to **API Keys** section
4. Click **Create API Key**
5. Copy your API key (keep it secure!)

### 2. Configure Your .env File

Open your `.env` file and add/update these settings:

```env
# AI Service Configuration
AI_SERVICE_TYPE=groq

# Groq API Configuration
GROQ_API_KEY=your_actual_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

**Available Groq Models:**
- `llama-3.3-70b-versatile` - Best for general use (RECOMMENDED)
- `llama-3.1-70b-versatile` - Alternative large model
- `mixtral-8x7b-32768` - Good for long context
- `gemma2-9b-it` - Faster, smaller model

### 3. Clear Configuration Cache

After updating your `.env` file, clear Laravel's configuration cache:

```bash
php artisan config:clear
php artisan cache:clear
```

### 4. Start Using Groq AI Chat

That's it! Your application is now configured to use Groq API.

**No need to:**
- Run the Python Flask AI service (`aiservice/app.py`)
- Install Python dependencies for AI (transformers, torch, etc.)
- Download local AI models

## Features

### ✨ Automatic Document Context

When you attach documents or ask about documents, the system automatically:

1. **Extracts Document Content** - Retrieves relevant chunks from your uploaded documents
2. **Includes in Chat** - Sends document context to Groq API
3. **AI Analysis** - Groq AI analyzes your documents and answers questions
4. **Smart Responses** - Provides accurate answers based on actual document content

### 💬 Conversation History

The system maintains conversation context:
- Last 6 messages (3 exchanges) are included
- Maintains coherent multi-turn conversations
- Each conversation is isolated and secure

### 🔍 Document Search Integration

When you ask "Where is the [document name]?" the system:
- Searches your document database
- Finds matching documents
- Provides clickable links to documents
- Shows folder locations

## Switching Between Local and Groq

### Use Groq (Online - Recommended for Production)

```env
AI_SERVICE_TYPE=groq
GROQ_API_KEY=your_api_key
```

### Use Local AI (Offline - For Development/Privacy)

```env
AI_SERVICE_TYPE=local
AI_SERVICE_URL=http://localhost:5000
```

Then run the local Python AI service:
```bash
cd aiservice
python app.py
```

## Testing Your Setup

1. Log into your application
2. Navigate to the AI Assistant/Chat page
3. Send a test message: "Hello, can you help me?"
4. Check Laravel logs for confirmation:
   ```bash
   tail -f storage/logs/laravel.log
   ```
5. You should see: `"Using Groq API for chat..."`

### Test with Documents

1. Upload a document to your system
2. Open the AI chat
3. Attach the document to your message
4. Ask a question about the document
5. The AI will analyze the actual document content and respond

## Troubleshooting

### Error: "Groq API key is not configured"

**Solution:** Make sure you've set `GROQ_API_KEY` in your `.env` file and run `php artisan config:clear`

### Error: "Groq API error: Invalid API key"

**Solution:** Verify your API key is correct at [console.groq.com](https://console.groq.com)

### Error: "Rate limit exceeded"

**Solution:** You've hit Groq's rate limits. Wait a moment or upgrade your Groq plan.

### Slow Response Times

**Solution:**
- Try a smaller model like `gemma2-9b-it`
- Reduce document context by limiting chunk size
- Check your internet connection

### AI Not Understanding Documents

**Solution:**
- Verify documents are properly uploaded
- Check that embeddings were created (document_embeddings table)
- Ensure document status is 'active'

## API Usage and Costs

Groq offers:
- **Free Tier**: Generous free requests per day
- **Pay-as-you-go**: Extremely affordable pricing
- **No Minimum**: No minimum monthly commitment

Check current pricing at: [https://groq.com/pricing](https://groq.com/pricing)

## Privacy and Security

- Your documents are sent to Groq API for processing
- Groq does NOT train on your data
- All communication is encrypted (HTTPS)
- API keys should be kept secure
- For maximum privacy, use the local AI option instead

## Support

For issues:
1. Check Laravel logs: `storage/logs/laravel.log`
2. Enable debug mode: `APP_DEBUG=true` in `.env`
3. Review Groq API status: [status.groq.com](https://status.groq.com)

---

**Need More Help?**

- Groq Documentation: [https://console.groq.com/docs](https://console.groq.com/docs)
- Groq API Reference: [https://console.groq.com/docs/api-reference](https://console.groq.com/docs/api-reference)
