# AI Bridge Service

This service handles AI-powered document processing using BERT embeddings for legal documents.

## Files Structure

- **`config.py`** - Configuration settings and constants
- **`model_loader.py`** - BERT model loading and management
- **`ai_service.py`** - Core AI processing logic (AIBridgeService class)
- **`routes.py`** - Flask route definitions
- **`ai_bridge_app.py`** - Main application entry point

## How to Run

From the parent directory (`aiservice/`):

```bash
python run_ai_bridge.py
```

Or directly from this directory:

```bash
python ai_bridge_app.py
```

## Endpoints

- **Health check**: `GET /health`
- **Process document**: `POST /api/documents/process-ai`
- **Analyze document**: `POST /api/documents/analyze`
- **Document similarity**: `POST /api/documents/similarity`
- **Semantic search**: `POST /api/documents/search`

## Dependencies

- Flask
- sentence-transformers
- requests
- flask-cors

The service runs on port 5003 by default.