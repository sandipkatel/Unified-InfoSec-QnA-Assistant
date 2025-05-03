from rest_framework.decorators import api_view
from rest_framework.response import Response
from time import sleep
from langchain_community.chat_models import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains import LLMChain
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from .utils.history import ChatThreadManager
import json
import re

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

        # Load embedding model and vector stores
        embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        csv_store = FAISS.load_local(
            "../faiss_csv_index",
            embeddings=embedding_model,
            allow_dangerous_deserialization=True
        )
        pdf_store = FAISS.load_local(
            "../faiss_pdf_index",
            embeddings=embedding_model,
            allow_dangerous_deserialization=True
        )

        def retrieve_hybrid_results(query, top_k=5, threshold=0.2):
            csv_results = csv_store.similarity_search_with_score(query, k=top_k)
            filtered_csv = [(doc, score) for doc, score in csv_results if score <= threshold]

            if filtered_csv:
                best_doc, best_score = min(filtered_csv, key=lambda x: x[1])
                print(f"Best result from CSV with score: {best_score}")
                print("Answer:", best_doc.metadata.get('answer'))
                print("Details:", best_doc.metadata.get('details'))
                print("Category:", best_doc.metadata.get('category'))
                return [(best_doc, best_score)]
            else:
                print("No relevant results found in CSV. Searching in PDF...")

            pdf_results = pdf_store.similarity_search_with_score(query, k=top_k)
            filtered_pdf = [(doc, score) for doc, score in pdf_results if score > threshold]

            if filtered_pdf:
                best_doc, best_score = min(filtered_pdf, key=lambda x: x[1])
                best_doc.metadata['source'] = 'pdf'
                return [(best_doc, best_score)]

            print("No relevant results found in both CSV and PDF.")
            return []

        def calculate_confidence(score):
            if score is None:
                return 0.0

            # Convert FAISS distance (0–2) to confidence (0–1)
            confidence = max(0, min(1, 1 - (score / 2)))
            return round(confidence, 2)

        def answer_query(query):
            docs_with_scores = retrieve_hybrid_results(query, top_k=5)
            
            if docs_with_scores:
                doc, score = docs_with_scores[0]
                
                if 'answer' in doc.metadata or 'details' in doc.metadata or 'category' in doc.metadata:
                    answer = doc.metadata.get('answer', 'No answer available')
                    details = doc.metadata.get('details', 'No details available')
                    category = doc.metadata.get('category', 'No category available')
                    
                    answer = "No answer available" if str(answer).lower() == "nan" else answer
                    details = "No details available" if str(details).lower() == "nan" else details
                    category = "No category available" if str(category).lower() == "nan" else category
                    print("csv")
                    return {
                        "source": "csv",
                        "score": float(score),
                        "answer": answer,
                        "details": details,
                        "category": category
                    }

                elif doc.metadata.get("source") == "pdf":
                    pdf_context = "\n\n".join([d.page_content for d, _ in docs_with_scores])
                    references = set()
                    
                    for d, _ in docs_with_scores:
                        doc_name = d.metadata.get("document_name", "Unknown Document")
                        page = d.metadata.get("page_number", "N/A")
                        references.add(f"{doc_name}, Page: {page}")

                    custom_prompt = """
                    You are an InfoSec QA assistant. Answer security and compliance questions using only the provided context.
                    For each response:
                    - Ensure that the context is in a readable format if it is not already.
                    - Do not change, add, or remove any words from the context. Preserve its original meaning exactly.
                    
                    Response style:
                    [your refined response with context preserved]
                    
                    Only output the refined answer in natural language. Do not include any labels, brackets, or metadata in your response.
                    Context:
                    {context}
                    Question:
                    {query}
                    """
                    
                    llm = ChatOllama(model="llama3.2:latest")
                    prompt = ChatPromptTemplate.from_template(custom_prompt)
                    chain = LLMChain(prompt=prompt, llm=llm)
                    response = chain.invoke({"query": query, "context": pdf_context})

                    return {
                        "source": "pdf",
                        "score": float(score),
                        "answer": response['text'],
                        "references": "; ".join(references)
                    }

            return {
                "source": "none",
                "score": None,
                "answer": "No relevant information found."
            }

        # Get and return the final answer
        result = answer_query(query)
        print("res", result)
        response_data = {
            "type": "system",
            "content": {"text": result.get("answer", "") + '. ' + result.get("details", '')},
            "references": result.get("references", []) or {"KL (" + result.get("category", []) + ")"},
            "confidence_score": calculate_confidence(result.get("score", 0.0)),
            "all_matches": []  # add matches if needed 
        }
        print("response_data", response_data)

        if not manager.active_thread:
            # Create a new thread if no active thread exists
            thread_id = manager.create_thread(user_id)
            manager.select_thread(thread_id)
            # Treat as a message in the current thread
        user_message = query
        manager.add_message(user_id, manager.active_thread, "user", user_message)
        
        assistant_response = response_data["content"]["text"]
        manager.add_message(user_id, manager.active_thread, "system", assistant_response)
        
        return Response(response_data)

    except Exception as e:
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
    
@api_view(['POST'])
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
        
        # Load embedding model and vector stores
        embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        csv_store = FAISS.load_local(
            "../faiss_csv_index",
            embeddings=embedding_model,
            allow_dangerous_deserialization=True
        )
        pdf_store = FAISS.load_local(
            "../faiss_pdf_index",
            embeddings=embedding_model,
            allow_dangerous_deserialization=True
        )

        def retrieve_hybrid_results(query, top_k=5, threshold=0.2):
            csv_results = csv_store.similarity_search_with_score(query, k=top_k)
            filtered_csv = [(doc, score) for doc, score in csv_results if score <= threshold]

            if filtered_csv:
                best_doc, best_score = min(filtered_csv, key=lambda x: x[1])
                print(f"Best result from CSV with score: {best_score}")
                print("Answer:", best_doc.metadata.get('answer'))
                print("Details:", best_doc.metadata.get('details'))
                print("Category:", best_doc.metadata.get('category'))
                return [(best_doc, best_score)]
            else:
                print("No relevant results found in CSV. Searching in PDF...")

            pdf_results = pdf_store.similarity_search_with_score(query, k=top_k)
            filtered_pdf = [(doc, score) for doc, score in pdf_results if score > threshold]

            if filtered_pdf:
                best_doc, best_score = min(filtered_pdf, key=lambda x: x[1])
                best_doc.metadata['source'] = 'pdf'
                return [(best_doc, best_score)]

            print("No relevant results found in both CSV and PDF.")
            return []

        def calculate_confidence(score):
            if score is None:
                return 0.0

            # Convert FAISS distance (0–2) to confidence (0–1)
            confidence = max(0, min(1, 1 - (score / 2)))
            return round(confidence, 2)

        def answer_query(query):
            docs_with_scores = retrieve_hybrid_results(query, top_k=5)
            
            if docs_with_scores:
                doc, score = docs_with_scores[0]
                
                if 'answer' in doc.metadata or 'details' in doc.metadata or 'category' in doc.metadata:
                    answer = doc.metadata.get('answer', 'No answer available')
                    details = doc.metadata.get('details', 'No details available')
                    category = doc.metadata.get('category', 'No category available')
                    
                    answer = "No answer available" if str(answer).lower() == "nan" else answer
                    details = "No details available" if str(details).lower() == "nan" else details
                    category = "No category available" if str(category).lower() == "nan" else category
                    print("csv")
                    return {
                        "source": "csv",
                        "score": float(score),
                        "answer": answer,
                        "details": details,
                        "category": category
                    }

                elif doc.metadata.get("source") == "pdf":
                    pdf_context = "\n\n".join([d.page_content for d, _ in docs_with_scores])
                    references = set()
                    
                    for d, _ in docs_with_scores:
                        doc_name = d.metadata.get("document_name", "Unknown Document")
                        page = d.metadata.get("page_number", "N/A")
                        references.add(f"{doc_name}, Page: {page}")

                    custom_prompt = """
                    You are an InfoSec QA assistant. Answer security and compliance questions using only the provided context.
                    For each response:
                    - Ensure that the context is in a readable format if it is not already.
                    - Do not change, add, or remove any words from the context. Preserve its original meaning exactly.
                    
                    Only output the refined answer in natural language. Do not include any labels, brackets, or metadata in your response.
                    
                    Response style:
                    [your refined response with context preserved]
                    
                    Context:
                    {context}
                    Question:
                    {query}
                    """
                    
                    llm = ChatOllama(model="llama3.2:latest")
                    prompt = ChatPromptTemplate.from_template(custom_prompt)
                    chain = LLMChain(prompt=prompt, llm=llm)
                    response = chain.invoke({"query": query, "context": pdf_context})

                    return {
                        "source": "pdf",
                        "score": float(score),
                        "answer": response['text'],
                        "references": list(references)
                    }

            return {
                "source": "none",
                "score": None,
                "answer": "No relevant information found."
            }
        
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
            result = answer_query(question)
            
            # Format the result similar to analyze_question
            confidence_score = calculate_confidence(result.get("score", 0.0))
            
            result_entry = {
                "id": question_id,
                "question": question,
                "suggestedAnswer": result.get("answer", "") + '. ' + result.get("details", ""),
                "confidence_score": confidence_score * 100,  # Convert to percentage
                "references": result.get("references", []) or {"KL (" + result.get("category", []) + ")"},
            }
            print("ref", result_entry)
            
            results.append(result_entry)
            
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