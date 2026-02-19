"""
Time Information Utilities
Provides current date and time functions
"""
from datetime import datetime

def get_current_time():
    """Get current time formatted"""
    return datetime.now().strftime("%I:%M %p")

def get_current_date():
    """Get current date formatted"""
    return datetime.now().strftime("%B %d, %Y")

def get_current_datetime():
    """Get current date and time formatted"""
    return datetime.now().strftime("%B %d, %Y at %I:%M %p")

def get_day_of_week():
    """Get current day of week"""
    return datetime.now().strftime("%A")

def get_timestamp():
    """Get current timestamp"""
    return datetime.now().isoformat()

# Export all functions
__all__ = [
    'get_current_time',
    'get_current_date', 
    'get_current_datetime',
    'get_day_of_week',
    'get_timestamp'
]
