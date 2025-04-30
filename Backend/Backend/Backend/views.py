from rest_framework.decorators import api_view
from rest_framework.response import Response
from time import sleep
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

@api_view(['POST'])
def analyze_question(request):
    try:
        # Get query from request
        query = request.data.get('message', '')
        if not query:
            return Response({"error": "No message provided"}, status=400)
            
        # Load embedding model and vector store
        embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        csv_vectorstore = FAISS.load_local("../faiss_csv_index", embedding_model, allow_dangerous_deserialization=True)
        
        # Perform similarity search
        results = csv_vectorstore.similarity_search(query, k=3)
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
            "type": "assistant",
            "content": response_content,
            "references": references,
            "all_matches": content_matches
        }
        
        return Response(results)
        
    except Exception as e:
        print(f"Error in analyze_question: {str(e)}")
        return Response({"error": str(e)}, status=500)
