from rest_framework.decorators import api_view
from rest_framework.response import Response
from time import sleep
from langchain_community.chat_models import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains import LLMChain
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from .utils.history import ChatThreadManager

manager = ChatThreadManager()

# Example user
user_id = "user123"
from django.http import JsonResponse
from rest_framework import status
import pandas as pd
import io

@api_view(['POST'])
def analyze_question(request):
    try:
        # Get query from request
        query = request.data.get('message', '')
        if not query:
            return Response({"error": "No message provided"}, status=400)
            
        # Load embedding model and vector store
        embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        csv_store = FAISS.load_local("../faiss_csv_index/faiss_csv_index", embeddings=embedding_model, allow_dangerous_deserialization=True)
        pdf_store = FAISS.load_local("../faiss_pdf_index", embeddings=embedding_model, allow_dangerous_deserialization=True)

        def retrieve_hybrid_results(query, top_k=1, threshold=0.6):
            csv_results = csv_store.similarity_search(query, k=top_k)
            print(csv_results)

            if csv_results:
                for doc in csv_results:
                    doc.metadata['source'] = 'csv'
                return csv_results

            pdf_results = pdf_store.similarity_search(query, k=top_k)
            for doc in pdf_results:
                doc.metadata['source'] = 'pdf'
            return pdf_results
        
        def answer_query(query):
            docs = retrieve_hybrid_results(query, top_k=1)
            
            # Process results for returning metadata
            references = []
            content_matches = []
            
            for doc in docs:
                # Add document content to matches
                content_matches.append(doc.page_content)
                
                # Check if there's a source or metadata to use as reference
                if hasattr(doc, 'metadata') and doc.metadata:
                    if 'source' in doc.metadata:
                        references.append(doc.metadata['source'])

            # Group by source type
            csv_context = "\n\n".join([doc.page_content for doc in docs if doc.metadata.get("source") == "csv"])
            pdf_context = "\n\n".join([doc.page_content for doc in docs if doc.metadata.get("source") == "pdf"])

            llm = ChatOllama(model="llama3.2:latest")
            
            if csv_context:
                custom_prompt = """
                You are an InfoSec QA assistant. Answer security and compliance questions using only the provided context.
                For each response:
                
                Format the response into a readable paragraph if it is not already in paragraph form.
                Do not add, remove, or change any words. Preserve the original wording and meaning exactly.
                
                Response style:
                [your formatted response]
                
                Context:
                {context}
                Question:
                {query}
                """
                prompt = ChatPromptTemplate.from_template(custom_prompt)
                chain = LLMChain(prompt=prompt, llm=llm)
                response = chain.invoke({"query": query, "context": csv_context})
                return response, references, content_matches

            elif pdf_context:
                custom_prompt = """
                You are an InfoSec QA assistant. Answer security and compliance questions using only the provided context.
                For each response:

                Summarize the answer in no more than 50 words.
                Include the exact source document name at the end in brackets.
                Response style:
                [your short refined response]

                Context:
                {context}
                Question:
                {query}
                """
                prompt = ChatPromptTemplate.from_template(custom_prompt)
                chain = LLMChain(prompt=prompt, llm=llm)
                response = chain.invoke({"query": query, "context": pdf_context})
                return response, references, content_matches
            
            # No matches found
            return {"text": "Based on our knowledge base, I don't have enough information to provide a specific answer to that question. Would you like me to forward this to our security team for a detailed response?"}, references, content_matches

        # Get answer and metadata
        response, references, content_matches = answer_query(query)
        print("res", response)
        
        # Return processed results
        results = {
            "type": "system",
            "content": response.text if hasattr(response, 'text') else response,
            "references": references,
            "all_matches": content_matches
        }
        
        if not manager.active_thread:
            thread_id = manager.create_thread(user_id)
            manager.select_thread(thread_id)
        user_message = query
        manager.add_message(user_id, manager.active_thread, "user", user_message)
        
        # Simulate assistant response
        assistant_response = results["content"]
        manager.add_message(user_id, manager.active_thread, "system", assistant_response)

        return Response(results)
        
    except Exception as e:
        import traceback
        print(f"Error in analyze_question: {str(e)}")
        print(traceback.format_exc())
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
def analyze_questionnaire(request):
    if 'file' not in request.FILES:
        return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)
    
    file = request.FILES['file']
    file_name = file.name.lower()
    
    try:
        # Read the questionnaire file
        if file_name.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(file.read()))
        elif file_name.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(file.read()))
        else:
            return Response({
                "error": "Unsupported file format. Please upload CSV or Excel file."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if 'Questions' column exists
        question_col = None
        for col in df.columns:
            if col.lower() == 'questions' or col.lower() == 'question':
                question_col = col
                break
        
        if not question_col:
            return Response({
                "error": "File must contain a 'Questions' column"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Load embedding model and vector store
        embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        csv_store = FAISS.load_local("../faiss_csv_index/faiss_csv_index", embeddings=embedding_model, allow_dangerous_deserialization=True)
        pdf_store = FAISS.load_local("../faiss_pdf_index", embeddings=embedding_model, allow_dangerous_deserialization=True)
        
        # Define function for hybrid retrieval - same as in analyze_question
        def retrieve_hybrid_results(query, top_k=1, threshold=0.6):
            csv_results = csv_store.similarity_search(query, k=top_k)
            print(f"CSV results for '{query}': {csv_results}")

            if csv_results:
                for doc in csv_results:
                    doc.metadata['source'] = 'csv'
                return csv_results

            pdf_results = pdf_store.similarity_search(query, k=top_k)
            for doc in pdf_results:
                doc.metadata['source'] = 'pdf'
            return pdf_results
        
        # Define answer_query function - similar to analyze_question
        def answer_query(query):
            docs = retrieve_hybrid_results(query, top_k=1)
            
            # Process results for returning metadata
            references = []
            content_matches = []
            
            for doc in docs:
                # Add document content to matches
                content_matches.append(doc.page_content)
                
                # Check if there's a source or metadata to use as reference
                if hasattr(doc, 'metadata') and doc.metadata:
                    if 'source' in doc.metadata:
                        references.append(doc.metadata['source'])

            # Group by source type
            csv_context = "\n\n".join([doc.page_content for doc in docs if doc.metadata.get("source") == "csv"])
            pdf_context = "\n\n".join([doc.page_content for doc in docs if doc.metadata.get("source") == "pdf"])

            llm = ChatOllama(model="llama3.2:latest")
            
            if csv_context:
                custom_prompt = """
                You are an InfoSec QA assistant. Answer security and compliance questions using only the provided context.
                For each response:
                
                Format the response into a readable paragraph if it is not already in paragraph form.
                Do not add, remove, or change any words. Preserve the original wording and meaning exactly.
                
                Response style:
                [your formatted response]
                
                Context:
                {context}
                Question:
                {query}
                """
                prompt = ChatPromptTemplate.from_template(custom_prompt)
                chain = LLMChain(prompt=prompt, llm=llm)
                response = chain.invoke({"query": query, "context": csv_context})
                # Extract just the text value to avoid complex object issues
                answer_text = response.text if hasattr(response, 'text') else str(response)
                confidence = "high" if len(csv_context) > 100 else "medium"
                return answer_text, references, content_matches, confidence

            elif pdf_context:
                custom_prompt = """
                You are an InfoSec QA assistant. Answer security and compliance questions using only the provided context.
                For each response:

                Summarize the answer in no more than 50 words.
                Include the exact source document name at the end in brackets.
                Response style:
                [your short refined response]

                Context:
                {context}
                Question:
                {query}
                """
                prompt = ChatPromptTemplate.from_template(custom_prompt)
                chain = LLMChain(prompt=prompt, llm=llm)
                response = chain.invoke({"query": query, "context": pdf_context})
                # Extract just the text value to avoid complex object issues
                answer_text = response.text if hasattr(response, 'text') else str(response)
                confidence = "medium"
                return answer_text, references, content_matches, confidence
            
            # No matches found
            return "Based on our knowledge base, I don't have enough information to provide a specific answer to that question. Would you like me to forward this to our security team for a detailed response?", references, content_matches, "low"
        
        # Process each question in the file
        results = []
        
        for index, row in df.iterrows():
            question = row[question_col]
            
            # Skip empty questions
            if pd.isna(question) or not question.strip():
                continue
                
            # Generate a unique question ID (or extract from file if available)
            question_id = f"Q{index+1}" if "id" not in row else row["id"]
            
            # Get answer for this question using the same process as analyze_question
            response_text, references, content_matches, confidence = answer_query(question)
            
            # Format the result - ensure response is a simple string, not an object
            result = {
                "id": question_id,
                "question": question,
                "suggestedAnswer": response_text,  # Already a simple string value
                "confidence": confidence,
                "references": references[:2] if references else [],  # Limit to 2 references
                "all_matches": content_matches
            }
            
            results.append(result)
            
            # Add a small delay to prevent overwhelming the system
            sleep(0.1)
        
        # Return results
        return Response({
            "message": "Questionnaire analyzed successfully",
            "results": results
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        import traceback
        print(f"Error processing questionnaire: {str(e)}")
        print(traceback.format_exc())
        return Response({
            "error": f"Error processing questionnaire: {str(e)}",
            "details": traceback.format_exc()
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
