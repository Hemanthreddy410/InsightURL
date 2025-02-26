import os
import json
import time
import requests
import urllib3
import traceback
from flask import Flask, render_template, request, session, jsonify
from langchain_community.llms import OpenAI
from langchain.chains import RetrievalQAWithSourcesChain
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import WebBaseLoader
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from dotenv import load_dotenv

# Disable SSL warnings for development (not recommended for production)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)

# Data directory for storing documents
DATA_DIR = "insight_data"
os.makedirs(DATA_DIR, exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process_urls', methods=['POST'])
def process_urls():
    # Get URLs from the form
    urls = []
    for i in range(5):  # Increased to 5 URL inputs
        url = request.form.get(f'url{i+1}')
        if url and url.strip():
            urls.append(url)
    
    if not urls:
        return jsonify({"status": "error", "message": "No valid URLs provided"})
    
    try:
        # Create a custom session with SSL verification disabled
        session = requests.Session()
        session.verify = False
        
        # Using WebBaseLoader with the custom session and SSL verification disabled
        loader = WebBaseLoader(
            web_paths=urls,
            verify_ssl=False,  # Critical: Disable SSL verification
            session=session,   # Use our custom session
            requests_per_second=2,
            requests_kwargs={"verify": False}  # Extra guarantee for SSL
        )
        
        try:
            data = loader.load()
            
            if not data:
                return jsonify({"status": "error", "message": "Failed to load content from URLs. Try different URLs or check your internet connection."})
                
            # Split text into chunks
            text_splitter = RecursiveCharacterTextSplitter(
                separators=['\n\n', '\n', '.', ','],
                chunk_size=1000
            )
            docs = text_splitter.split_documents(data)
            
            if not docs:
                return jsonify({"status": "error", "message": "No content could be extracted from the URLs."})
            
            # Save documents as individual JSON files
            try:
                # Clear existing documents
                for file in os.listdir(DATA_DIR):
                    if file.endswith('.json'):
                        os.remove(os.path.join(DATA_DIR, file))
                
                # Save each document as a separate JSON file
                for i, doc in enumerate(docs):
                    doc_data = {
                        "page_content": doc.page_content,
                        "metadata": doc.metadata
                    }
                    
                    with open(os.path.join(DATA_DIR, f"doc_{i}.json"), 'w', encoding='utf-8') as f:
                        json.dump(doc_data, f, ensure_ascii=False, indent=2)
                
                # Save URL metadata
                with open(os.path.join(DATA_DIR, "urls.json"), 'w') as f:
                    json.dump({"urls": urls, "count": len(docs)}, f)
                
                return jsonify({
                    "status": "success", 
                    "message": f"Successfully analyzed {len(urls)} sources with {len(docs)} information chunks extracted."
                })
            
            except Exception as e:
                traceback.print_exc()
                return jsonify({"status": "error", "message": f"Error saving documents: {str(e)}"})
        
        except Exception as e:
            traceback.print_exc()
            return jsonify({"status": "error", "message": f"Error loading URLs: {str(e)}"})
    
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": f"Error processing URLs: {str(e)}"})

@app.route('/ask', methods=['POST'])
def ask_question():
    query = request.form.get('query')
    
    if not query:
        return jsonify({"status": "error", "message": "No question provided"})
    
    urls_file = os.path.join(DATA_DIR, "urls.json")
    if not os.path.exists(urls_file):
        return jsonify({"status": "error", "message": "Please add URLs and process them first"})
    
    try:
        # Load documents from JSON files
        docs = []
        from langchain.schema import Document
        
        for file in os.listdir(DATA_DIR):
            if file.startswith('doc_') and file.endswith('.json'):
                with open(os.path.join(DATA_DIR, file), 'r', encoding='utf-8') as f:
                    doc_data = json.load(f)
                    doc = Document(
                        page_content=doc_data["page_content"],
                        metadata=doc_data["metadata"]
                    )
                    docs.append(doc)
        
        if not docs:
            return jsonify({"status": "error", "message": "No content found. Please add and process URLs again."})
        
        # Create embeddings and vectorstore on the fly
        embeddings = OpenAIEmbeddings()
        vectorstore = FAISS.from_documents(docs, embeddings)
        
        # Create chain for question answering
        llm = OpenAI(temperature=0.7, max_tokens=500)
        chain = RetrievalQAWithSourcesChain.from_llm(llm=llm, retriever=vectorstore.as_retriever())
        
        # Get answer
        result = chain({"question": query}, return_only_outputs=True)
        
        # Format sources
        sources = result.get("sources", "")
        sources_list = sources.split("\n") if sources else []
        
        return jsonify({
            "status": "success",
            "answer": result["answer"],
            "sources": sources_list
        })
    
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": f"Error processing question: {str(e)}"})

@app.errorhandler(404)
def page_not_found(e):
    return render_template('error.html', error_code=404, error_message="Page not found"), 404

@app.errorhandler(500)
def internal_server_error(e):
    return render_template('error.html', error_code=500, error_message="Internal server error"), 500

if __name__ == '__main__':
    app.run(debug=True)