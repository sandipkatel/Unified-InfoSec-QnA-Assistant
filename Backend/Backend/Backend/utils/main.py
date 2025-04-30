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
    docs = retrieve_hybrid_results(query, top_k=10)

    # Group by source type
    csv_context = "\n\n".join([doc.page_content for doc in docs if doc.metadata.get("source") == "csv"])
    pdf_context = "\n\n".join([doc.page_content for doc in docs if doc.metadata.get("source") == "pdf"])

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
        llm = ChatOllama(model="llama3.2:latest")
        prompt = ChatPromptTemplate.from_template(custom_prompt)
        chain = LLMChain(prompt=prompt, llm=llm)
        return chain.invoke({"query": query, "context": csv_context})

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
        return chain.invoke({"query": query, "context": pdf_context})
