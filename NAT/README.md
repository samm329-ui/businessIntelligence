# JARVIS AI Assistant

Advanced AI Assistant with memory and real-time web search capabilities.

## Features

- **General Chatbot**: Memory-based chat using vector store for context
- **Real-time Chatbot**: Web search enabled for current information
- **Unlimited Memory**: Learns from text files in learning_data folder
- **Rate Limit Rotation**: Multiple Groq API keys for continuous usage
- **Session Management**: Persistent chat sessions stored in JSON

## Setup

1. **Install Dependencies**
```bash
pip install -r requirements.txt
```

2. **Configure API Keys**
Copy `.env.example` to `.env` and add your API keys:
- Groq API Keys (get from https://console.groq.com)
- Tavily API Key (get from https://tavily.com) for web search

3. **Add Learning Data**
Add `.txt` files to `database/learning_data/` folder with information about yourself. The AI will learn from these files.

4. **Run Server**
```bash
python run.py
```

5. **Test**
Open another terminal and run:
```bash
python test.py
```

## API Endpoints

- `POST /chat` - Send a message
- `GET /system/status` - System status
- `GET /sessions` - List chat sessions
- `GET /learning/files` - List learning files

## Usage

1. Select chatbot type (1 = General, 2 = Real-time)
2. Type your message
3. The AI will respond based on its memory and/or web search

## Project Structure

```
JARVIS/
├── app/
│   ├── main.py              # FastAPI application
│   ├── models.py            # Pydantic models
│   ├── services/
│   │   ├── chat_service.py      # Session management
│   │   ├── groq_service.py      # LLM calls
│   │   ├── realtime_service.py  # Web search
│   │   └── vector_store.py     # FAISS vector store
│   └── utils/
│       └── time_info.py     # Time utilities
├── database/
│   ├── learning_data/       # Learning text files
│   ├── chats_data/          # Saved conversations
│   └── vector_store/       # FAISS index
├── config.py                # Configuration
├── run.py                   # Server startup
└── test.py                  # CLI testing
```
