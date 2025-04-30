from rest_framework.decorators import api_view
from rest_framework.response import Response
from time import sleep
from langchain_community.chat_models import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains import LLMChain
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
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
            "type": "assistant",
            "content": response.text if hasattr(response, 'text') else response,
            "references": references,
            "all_matches": content_matches
        }
        
        return Response(results)
        
    except Exception as e:
        import traceback
        print(f"Error in analyze_question: {str(e)}")
        print(traceback.format_exc())
        return Response({"error": str(e)}, status=500)

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
        csv_vectorstore = FAISS.load_local("../faiss_csv_index/faiss_csv_index", embedding_model, allow_dangerous_deserialization=True)
        
        # Process each question
        results = []
        for index, row in df.iterrows():
            question = row[question_col]
            
            # Skip empty questions
            if pd.isna(question) or not question.strip():
                continue
                
            # Generate a unique question ID (or extract from file if available)
            question_id = f"Q{index+1}" if "id" not in row else row["id"]
            
            # Perform similarity search
            vector_results = csv_vectorstore.similarity_search(question, k=1)
            
            # Process results
            references = []
            content_matches = []
            
            for doc in vector_results:
                print(doc.page_content)
                content_matches.append(doc.page_content)
                
                if hasattr(doc, 'metadata') and doc.metadata:
                    if 'source' in doc.metadata:
                        references.append(doc.metadata['source'])
            
            # Determine response content and confidence
            if content_matches:
                suggested_answer = content_matches[0]
                
                # Simple confidence scoring based on search result quality
                # You might want to implement a more sophisticated approach
                if len(content_matches) >= 3 and len(references) >= 2:
                    confidence = "high"
                elif len(content_matches) >= 1:
                    confidence = "medium"
                else:
                    confidence = "low"
            else:
                suggested_answer = "Based on our knowledge base, I don't have enough information to provide a specific answer to this question."
                confidence = "low"
            
            # Format the result according to specified structure
            result = {
                "id": question_id,
                "question": question,
                "suggestedAnswer": suggested_answer,
                "confidence": confidence,
                "references": references[:2]  # Limit to 2 references as in example
            }
            
            results.append(result)
            print("res", results)
        
        return Response({
            "message": "Questionnaire analyzed successfully",
            "results": results
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        import traceback
        return Response({
            "error": f"Error processing questionnaire: {str(e)}",
            "details": traceback.format_exc()
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)