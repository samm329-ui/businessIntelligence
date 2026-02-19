"""
JARVIS Pydantic Models
Data models for API requests and responses
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

# Chat Types
class ChatType:
    GENERAL = "general"
    REALTIME = "realtime"

# Message Model
class Message(BaseModel):
    role: str = Field(..., description="Role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")
    timestamp: datetime = Field(default_factory=datetime.now)

# Chat Session Model
class ChatSession(BaseModel):
    session_id: str = Field(..., description="Unique session identifier")
    chat_type: str = Field(..., description="Type: 'general' or 'realtime'")
    messages: List[Message] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

# Chat Request
class ChatRequest(BaseModel):
    message: str = Field(..., description="User message")
    session_id: Optional[str] = Field(None, description="Session ID for continuing chat")
    chat_type: str = Field(default="general", description="Type: 'general' or 'realtime'")
    use_search: bool = Field(default=False, description="Enable web search for realtime")

# Chat Response
class ChatResponse(BaseModel):
    response: str = Field(..., description="AI response")
    session_id: str = Field(..., description="Session ID")
    chat_type: str = Field(..., description="Chat type used")
    sources: Optional[List[Dict[str, str]]] = Field(None, description="Web search sources if applicable")
    timestamp: datetime = Field(default_factory=datetime.now)

# Vector Store Status
class VectorStoreStatus(BaseModel):
    loaded: bool = Field(..., description="Whether vector store is loaded")
    document_count: int = Field(..., description="Number of documents indexed")
    sources: List[str] = Field(default_factory=list, description="Source files indexed")

# System Status
class SystemStatus(BaseModel):
    vector_store: VectorStoreStatus
    groq_available: bool = Field(..., description="Groq API available")
    search_available: bool = Field(..., description="Web search available")
    model_name: str = Field(..., description="Current model")
    active_sessions: int = Field(..., description="Active chat sessions")

# Learning Data Item
class LearningDataItem(BaseModel):
    filename: str
    content: str
    char_count: int
