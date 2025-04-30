from rest_framework.decorators import api_view
from rest_framework.response import Response
from time import sleep
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from .utils.history import ChatThreadManager

manager = ChatThreadManager()

# Example user
user_id = "user123"

@api_view(['POST'])
def analyze_question(request):
    try:
        # Get query from request
        query = request.data.get('message', '')
        if not query:
            return Response({"error": "No message provided"}, status=400)
            
        # Load embedding model and vector store
        embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        csv_vectorstore = FAISS.load_local("../faiss_csv_index/faiss_csv_index", embedding_model, allow_dangerous_deserialization=True)
        
        # Perform similarity search
        results = csv_vectorstore.similarity_search(query, k=1)
        for i, doc in enumerate(results, 1):
            print(f"\n--- Result {i} ---")
            print(doc.page_content)
        # Process results
        references = []
        content_matches = []
        
        for doc in results:
            # Add document content to matches
            content_matches.append(doc.page_content)
            
            # Check if there's a source or metadata to use as reference
            if hasattr(doc, 'metadata') and doc.metadata:
                if 'source' in doc.metadata:
                    references.append(doc.metadata['source'])
        
        # Determine response content based on search results
        if content_matches:
            # Use the first result as the main response content
            response_content = content_matches[0]
        else:
            response_content = "Based on our knowledge base, I don't have enough information to provide a specific answer to that question. Would you like me to forward this to our security team for a detailed response?"
        
        # Return processed results
        results = {
            "type": "system",
            "content": response_content,
            "references": references,
            "all_matches": content_matches
        }
        
        user_message = query
        manager.add_message(user_id, manager.active_thread, "user", user_message)
        
        # Simulate assistant response
        assistant_response = results["content"]
        print("Assistant response:", assistant_response)
        manager.add_message(user_id, manager.active_thread, "system", assistant_response)

        return Response(results)
        
    except Exception as e:
        print(f"Error in analyze_question: {str(e)}")
        return Response({"error": str(e)}, status=500)

@api_view(['POST'])
def fetch_history(request):
    import time
    query = request.data.get('history', '')

    # print("Here is the history", json.stringify(query))
    # Create manager
    # manager = ChatThreadManager()

    # # Example user
    # user_id = "user123"
 

    if query == "new":
        thread_id = manager.create_thread(user_id)
        return Response(thread_id)

    elif query == "list":
        threads = manager.get_threads(user_id)
        if not threads:
            return "No threads available."
        else:
            result = []
            for t in threads:
                active = " (ACTIVE)" if t["id"] == manager.active_thread else ""
                thread_info = {
                    "id": t["id"],
                    "title": t["title"],
                    "active": bool(active),
                    "created_at": t["created_at"],
                    "updated_at": t["updated_at"]
                }
                result.append(thread_info)
            print("Threads:", result)
            return Response(result)   

    elif query.startswith("select "):
        thread_id = query.split(" ", 1)[1]
        manager.select_thread(thread_id)
        
        # Get thread messages
        messages = manager.get_thread_messages(thread_id)
        if not messages:
            return f"Selected:{thread_id}|Messages:None"
        else:
            msg_data = []
            for msg in messages:
                msg_data.append({
                    "type": msg["role"],
                    "content": msg["content"]
                })
            return Response(msg_data)

    elif query.startswith("rename "):
        if not manager.active_thread:
            return "NoActiveThread"
            
        new_title = query.split(" ", 1)[1]
        manager.rename_thread(user_id, manager.active_thread, new_title)
        return f"Renamed:{new_title}"

    elif query == "delete":
        if not manager.active_thread:
            return "NoActiveThread"
        thread_id = manager.active_thread
        manager.delete_thread(user_id, thread_id)
        return f"Deleted:{thread_id}"
        
    # Manage for each conversation
    elif manager.active_thread:
        # Treat as a message in the current thread
        user_message = query
        manager.add_message(user_id, manager.active_thread, "user", user_message)
        
        # Simulate assistant response
        assistant_response = f"Echo: {user_message}"
        manager.add_message(user_id, manager.active_thread, "system", assistant_response)
        return {"user": user_message, "system": assistant_response}

    else:
        return "NoThreadSelected"