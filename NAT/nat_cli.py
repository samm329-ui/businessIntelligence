"""
N.A.T. CLI - Command Line Interface
Usage: python nat_cli.py "your message here"
"""
import sys
import requests
import json

BASE_URL = "http://localhost:8000"

def chat(message: str, chat_type: str = "general"):
    """Send message to N.A.T."""
    try:
        response = requests.post(
            f"{BASE_URL}/chat",
            json={
                "message": message,
                "session_id": None,
                "chat_type": chat_type
            },
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"\nN.A.T.: {data['response']}")
            return data
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
            return None
    except requests.exceptions.ConnectionError:
        print("Error: Cannot connect to N.A.T. server. Make sure it's running!")
        print("Start server with: python run.py")
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None

def main():
    if len(sys.argv) < 2:
        print("N.A.T. CLI - Command Line Interface")
        print("=" * 40)
        print("Usage: python nat_cli.py \"your message\" [type]")
        print("")
        print("Examples:")
        print('  python nat_cli.py "Hello"')
        print('  python nat_cli.py "What is AI?"')
        print('  python nat_cli.py "Who is Elon Musk?" realtime')
        print("")
        print("Chat types: general (default), realtime")
        return
    
    message = sys.argv[1]
    chat_type = sys.argv[2] if len(sys.argv) > 2 else "general"
    
    print(f"You: {message}")
    chat(message, chat_type)

if __name__ == "__main__":
    main()
