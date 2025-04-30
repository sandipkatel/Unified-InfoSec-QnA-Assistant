import csv
import os
import json
from datetime import datetime
import uuid
from django.conf import settings

class ChatThreadManager:
    """
    A system for managing multiple chat threads, similar to ChatGPT/Claude interfaces.
    Each user can have multiple chat threads, and each thread contains a conversation history.
    """
    
    def __init__(self, data_dir="Backend/utils/chat_data"):
        """
        Initialize the ChatThreadManager.
        
        Args:
            data_dir (str): Directory to store all chat data
        """
        self.data_dir = os.path.join(settings.BASE_DIR, data_dir)
        self.threads_dir = os.path.join(data_dir, "threads")
        self.users_file = os.path.join(data_dir, "users.json")
        self.active_thread = None
        
        # Create necessary directories
        os.makedirs(self.data_dir, exist_ok=True)
        os.makedirs(self.threads_dir, exist_ok=True)
        
        # Initialize users file if it doesn't exist
        if not os.path.exists(self.users_file):
            with open(self.users_file, 'w', encoding='utf-8') as f:
                json.dump({}, f)
    
    def get_user_data(self, user_id):
        """
        Get data for a specific user.
        
        Args:
            user_id (str): User identifier
            
        Returns:
            dict: User data including threads
        """
        try:
            
            with open(self.users_file, 'r', encoding='utf-8') as f:
                users = json.load(f)
                
            if user_id not in users:
                users[user_id] = {
                    "threads": []
                }
                with open(self.users_file, 'w', encoding='utf-8') as f:
                    json.dump(users, f, indent=2)     
            return users[user_id]
        except Exception as e:
            print(f"Error getting user data: {e}")
            return {"threads": []}
    
    def save_user_data(self, user_id, user_data):
        """
        Save user data back to the users file.
        
        Args:
            user_id (str): User identifier
            user_data (dict): Updated user data
        """
        try:
            with open(self.users_file, 'r', encoding='utf-8') as f:
                users = json.load(f)
            
            users[user_id] = user_data
            
            with open(self.users_file, 'w', encoding='utf-8') as f:
                json.dump(users, f, indent=2)
        except Exception as e:
            print(f"Error saving user data: {e}")
    
    def create_thread(self, user_id, title="New Chat"):
        """
        Create a new chat thread for a user.
        
        Args:
            user_id (str): User identifier
            title (str): Title for the new thread
            
        Returns:
            str: Thread ID of the new thread
        """
        thread_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()
        
        # Create thread file
        thread_file = os.path.join(self.threads_dir, f"{thread_id}.csv")
        with open(thread_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=["timestamp", "role", "content"])
            writer.writeheader()
        
        # Update user data
        user_data = self.get_user_data(user_id)
        user_data["threads"].append({
            "id": thread_id,
            "title": title,
            "created_at": timestamp,
            "updated_at": timestamp
        })
        self.save_user_data(user_id, user_data)
        
        self.active_thread = thread_id
        return thread_id
    
    def get_threads(self, user_id):
        """
        Get all threads for a user.
        
        Args:
            user_id (str): User identifier
            
        Returns:
            list: List of thread objects
        """
        user_data = self.get_user_data(user_id)
        return user_data["threads"]
    
    def rename_thread(self, user_id, thread_id, new_title):
        """
        Rename a thread.
        
        Args:
            user_id (str): User identifier
            thread_id (str): Thread identifier
            new_title (str): New title for the thread
        """
        user_data = self.get_user_data(user_id)
        
        for thread in user_data["threads"]:
            if thread["id"] == thread_id:
                thread["title"] = new_title
                thread["updated_at"] = datetime.now().isoformat()
                break
        
        self.save_user_data(user_id, user_data)
    
    def delete_thread(self, user_id, thread_id):
        """
        Delete a thread.
        
        Args:
            user_id (str): User identifier
            thread_id (str): Thread identifier
        """
        user_data = self.get_user_data(user_id)
        
        # Remove thread from user data
        user_data["threads"] = [t for t in user_data["threads"] if t["id"] != thread_id]
        self.save_user_data(user_id, user_data)
        
        # Delete thread file
        thread_file = os.path.join(self.threads_dir, f"{thread_id}.csv")
        if os.path.exists(thread_file):
            os.remove(thread_file)
        
        if self.active_thread == thread_id:
            self.active_thread = None
    
    def select_thread(self, thread_id):
        """
        Select a thread as active.
        
        Args:
            thread_id (str): Thread identifier
        """
        self.active_thread = thread_id
    
    def add_message(self, user_id, thread_id, role, content):
        """
        Add a message to a thread.
        
        Args:
            user_id (str): User identifier
            thread_id (str): Thread identifier
            role (str): Role of the message sender ("user" or "system")
            content (str): Message content
        """
        timestamp = datetime.now().isoformat()
        
        # Add message to thread file
        thread_file = os.path.join(self.threads_dir, f"{thread_id}.csv")
        with open(thread_file, 'a', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=["timestamp", "role", "content"])
            writer.writerow({
                "timestamp": timestamp,
                "role": role,
                "content": content
            })
        
        # Update thread last updated time
        user_data = self.get_user_data(user_id)
        for thread in user_data["threads"]:
            if thread["id"] == thread_id:
                thread["updated_at"] = timestamp
                
                # Update title with first few words of first message if still "New Chat"
                if thread["title"] == "New Chat" and role == "user":
                    words = content.split()[:3]
                    if words:
                        new_title = " ".join(words) + "..."
                        thread["title"] = new_title
                break
        
        self.save_user_data(user_id, user_data)
    
    def get_thread_messages(self, thread_id, limit=None):
        """
        Get messages from a thread.
        
        Args:
            thread_id (str): Thread identifier
            limit (int, optional): Limit the number of most recent messages
            
        Returns:
            list: List of message objects
        """
        thread_file = os.path.join(self.threads_dir, f"{thread_id}.csv")
        messages = []
        
        if os.path.exists(thread_file):
            with open(thread_file, 'r', newline='', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                messages = list(reader)
        
        if limit is not None and limit < len(messages):
            return messages[-limit:]
        return messages


if __name__ == "__main__":
    import time
    
    # Create manager
    manager = ChatThreadManager()
    
    # Example user
    user_id = "user123"
    
    # Simple CLI loop
    print("Welcome to Chat System")
    print("Commands: new, list, select <id>, rename <title>, delete, quit")
    
    while True:
        if manager.active_thread:
            active_threads = manager.get_threads(user_id)
            active_title = next((t["title"] for t in active_threads if t["id"] == manager.active_thread), "Unknown")
            prompt = f"[{active_title}] > "
        else:
            prompt = "> "
        
        command = input(prompt).strip()
        
        if command == "new":
            thread_id = manager.create_thread(user_id)
            print(f"Created new thread with ID: {thread_id}")
        
        elif command == "list":
            threads = manager.get_threads(user_id)
            if not threads:
                print("No threads available.")
            else:
                print("\nAvailable Threads:")
                for t in threads:
                    active = " (ACTIVE)" if t["id"] == manager.active_thread else ""
                    print(f"ID: {t['id']} - '{t['title']}'{active}")
                    print(f"  Created: {t['created_at']}")
                    print(f"  Updated: {t['updated_at']}")
                    print()
        
        elif command.startswith("select "):
            thread_id = command.split(" ", 1)[1]
            manager.select_thread(thread_id)
            print(f"Selected thread: {thread_id}")
            
            # Show thread messages
            messages = manager.get_thread_messages(thread_id)
        
        elif command.startswith("rename "):
            if not manager.active_thread:
                print("No active thread selected.")
                continue
                
            new_title = command.split(" ", 1)[1]
            manager.rename_thread(user_id, manager.active_thread, new_title)
            print(f"Renamed thread to: {new_title}")
        
        elif command == "delete":
            if not manager.active_thread:
                print("No active thread selected.")
                continue
                
            confirm = input("Are you sure you want to delete this thread? (y/n): ")
            if confirm.lower() == "y":
                thread_id = manager.active_thread
                manager.delete_thread(user_id, thread_id)
                print(f"Deleted thread: {thread_id}")
            else:
                print("Deletion cancelled.")
        
        elif command == "quit":
            print("Goodbye!")
            break
        
        elif manager.active_thread:
            # Treat as a message in the current thread
            user_message = command
            manager.add_message(user_id, manager.active_thread, "user", user_message)
            
            # Simulate assistant response
            print("Assistant: I'm just a demo. In a real app, the AI would respond here!")
            assistant_response = f"Echo: {user_message}"
            time.sleep(1)  # Simulate thinking
            manager.add_message(user_id, manager.active_thread, "system", assistant_response)
        
        else:
            print("Unknown command or no active thread. Type 'new' to create a thread.")