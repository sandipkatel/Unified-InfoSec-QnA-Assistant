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
            "../faiss_csv_index/faiss_csv_index",
            embeddings=embedding_model,
            allow_dangerous_deserialization=True
        )
        pdf_store = FAISS.load_local(
            "../faiss_pdf_index",
            embeddings=embedding_model,
            allow_dangerous_deserialization=True
        )

        def retrieve_hybrid_results(query, top_k=1, threshold=0.6):
            # Search in CSV store
            csv_results_raw = csv_store.similarity_search_with_score(query, k=1)
            csv_results = []
            csv_score = None

            if csv_results_raw:
                for doc, score in csv_results_raw:
                    doc.metadata['source'] = 'csv'
                    doc.metadata['score'] = score
                    csv_results.append(doc)
                    csv_score = score
                return csv_results, csv_score  # Early return if CSV results found

            print("No relevant results found in CSV. Searching in PDF...")

            # Search in PDF store
            pdf_results_raw = pdf_store.similarity_search_with_score(query, k=top_k)
            pdf_results = []
            pdf_score = None

            for doc, score in pdf_results_raw:
                if score >= threshold:
                    doc.metadata['source'] = 'pdf'
                    doc.metadata['score'] = score
                    pdf_results.append(doc)
                    pdf_score = score

            return pdf_results, pdf_score

        def calculate_confidence(score):
            if score is None:
                return 0.0

            # Convert FAISS distance (0–2) to confidence (0–1)
            confidence = max(0, min(1, 1 - (score / 2)))
            return round(confidence, 2)

        def answer_query(query):
            docs, score = retrieve_hybrid_results(query, top_k=10)

            if not docs:
                return {
                    "source": "none",
                    "answer": "No relevant information found."
                }

            source = docs[0].metadata.get("source")

            if source == "csv":
                doc = docs[0]
                content = doc.page_content

                # Extract fields using regex
                question_match = re.search(r"Question:\s*(.*?)\s*\|", content)
                answer_match = re.search(r"Answer:\s*(.*?)\s*\|", content)
                details_match = re.search(r"Details:\s*(.*?)\s*\|", content)
                category_match = re.search(r"Category:\s*(.*)", content)

                question = question_match.group(1).strip() if question_match else "No question"
                answer = answer_match.group(1).strip() if answer_match else "No answer"
                details = details_match.group(1).strip() if details_match else "No details"
                category = category_match.group(1).strip() if category_match else "No category"

                # Handle "nan" values
                question = "No question" if question.lower() == "nan" else question
                answer = "No answer" if answer.lower() == "nan" else answer
                details = "No details" if details.lower() == "nan" else details
                category = "No category" if category.lower() == "nan" else category
                print("ques", question, category)
                return {
                    "source": "csv",
                    "confidence": calculate_confidence(score),
                    "answer": f"{answer}. {details}",

                }

            elif source == "pdf":
                # Combine content and references
                pdf_context = "\n\n".join([doc.page_content for doc in docs])
                references = set()

                for doc in docs:
                    doc_name = doc.metadata.get("document_name", "Unknown Document")
                    page = doc.metadata.get("page_number", "N/A")
                    references.add(f"{doc_name}, Page: {page}")

                custom_prompt = """
                You are an InfoSec QA assistant. Answer security and compliance questions using only the provided context.
                For each response:
                - Ensure that the context is in a readable format if it is not already.
                - Do not change, add, or remove any words from the context. Preserve its original meaning exactly.
                
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
                    "confidence": calculate_confidence(score),
                    "answer": response['text'],
                    "references": "; ".join(references)
                }

            return {
                "source": "none",
                "answer": "No relevant information found."
            }

        # Get and return the final answer
        result = answer_query(query)
        print(result)
        response_data = {
            "type": "system",
            "content": {"text": result.get("answer", "")},
            "references": result.get("references", []),
            "confidence_score": result.get("confidence", 0.0),
            "all_matches": []  # add matches if needed
        }
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
        
        # Load embedding model and vector store
        embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        csv_store = FAISS.load_local(
            "../faiss_csv_index/faiss_csv_index", 
            embeddings=embedding_model, 
            allow_dangerous_deserialization=True
        )
        pdf_store = FAISS.load_local(
            "../faiss_pdf_index", 
            embeddings=embedding_model, 
            allow_dangerous_deserialization=True
        )
        
        # Define function for hybrid retrieval - same as in analyze_question
        def retrieve_hybrid_results(query, top_k=1, threshold=0.6):
            # Search in CSV store
            csv_results_raw = csv_store.similarity_search_with_score(query, k=1)
            csv_results = []
            csv_score = None

            if csv_results_raw:
                for doc, score in csv_results_raw:
                    doc.metadata['source'] = 'csv'
                    doc.metadata['score'] = score
                    csv_results.append(doc)
                    csv_score = score
                return csv_results, csv_score  # Early return if CSV results found

            # Search in PDF store
            pdf_results_raw = pdf_store.similarity_search_with_score(query, k=top_k)
            pdf_results = []
            pdf_score = None

            for doc, score in pdf_results_raw:
                if score <= threshold:  # Lower score is better in FAISS
                    doc.metadata['source'] = 'pdf'
                    doc.metadata['score'] = score
                    pdf_results.append(doc)
                    pdf_score = score

            return pdf_results, pdf_score
        
        def calculate_confidence(score):
            if score is None:
                return 0.0
                
            # Convert FAISS distance to confidence score (0-1)
            # Lower distance means higher similarity in FAISS
            confidence = max(0, min(1, 1 - (score / 2)))
            return round(confidence, 2)
        
        # Define answer_query function - similar to analyze_question
        def answer_query(query):
            docs, score = retrieve_hybrid_results(query, top_k=10)
            
            if not docs:
                return {
                    "source": "none",
                    "answer": "Based on our knowledge base, I don't have enough information to provide a specific answer to that question. Would you like me to forward this to our security team for a detailed response?",
                    "confidence": 0.0,
                    "references": [],
                    "all_matches": []
                }
            
            source = docs[0].metadata.get("source")
            references = []
            content_matches = [doc.page_content for doc in docs]
            
            if source == "csv":
                doc = docs[0]
                content = doc.page_content
                
                # Extract fields using regex
                question_match = re.search(r"Question:\s*(.*?)\s*\|", content)
                answer_match = re.search(r"Answer:\s*(.*?)\s*\|", content)
                details_match = re.search(r"Details:\s*(.*?)\s*\|", content)
                category_match = re.search(r"Category:\s*(.*)", content)
                
                question = question_match.group(1).strip() if question_match else "No question"
                answer = answer_match.group(1).strip() if answer_match else "No answer"
                details = details_match.group(1).strip() if details_match else "No details"
                category = category_match.group(1).strip() if category_match else "No category"
                
                # Handle "nan" values
                question = "No question" if question.lower() == "nan" else question
                answer = "No answer" if answer.lower() == "nan" else answer
                details = "No details" if details.lower() == "nan" else details
                category = "No category" if category.lower() == "nan" else category
                
                return {
                    "source": "csv",
                    "confidence": calculate_confidence(score),
                    "answer": f"{answer}. {details}",
                    "references": [category],
                    "all_matches": content_matches
                }
                
            elif source == "pdf":
                # Combine content and references
                pdf_context = "\n\n".join([doc.page_content for doc in docs])
                references = set()
                
                for doc in docs:
                    doc_name = doc.metadata.get("document_name", "Unknown Document")
                    page = doc.metadata.get("page_number", "N/A")
                    references.add(f"{doc_name}, Page: {page}")
                    
                custom_prompt = """
                You are an InfoSec QA assistant. Answer security and compliance questions using only the provided context.
                For each response:
                - Ensure that the context is in a readable format if it is not already.
                - Do not change, add, or remove any words from the context. Preserve its original meaning exactly.
                
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
                    "confidence": calculate_confidence(score),
                    "answer": response['text'],
                    "references": list(references),
                    "all_matches": content_matches
                }
                
            return {
                "source": "none",
                "answer": "No relevant information found.",
                "confidence": 0.0,
                "references": [],
                "all_matches": []
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
            
            # Format the result - ensure response is a simple string, not an object
            result_entry = {
                "id": question_id,
                "question": question,
                "suggestedAnswer": result["answer"],
                "confidence_score": result["confidence"] * 100,  # Convert to percentage
                "references": result["references"][:2] if result["references"] else [],  # Limit to 2 references
                "all_matches": result["all_matches"]
            }
            print(result_entry)
            
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