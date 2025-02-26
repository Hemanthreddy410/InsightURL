# InsightIQ: Web Intelligence Platform

InsightIQ is a powerful web-based platform that allows you to analyze and extract insights from multiple web sources using natural language questions. Powered by LangChain and OpenAI, InsightIQ provides intelligent answers based on the content of the URLs you provide.

![InsightIQ Screenshot](screenshot.png)

## Features

- Modern, user-friendly interface with a sidebar for URL inputs
- Support for up to 5 web sources at once
- Intelligent processing of web content using LangChain
- Natural language question answering using OpenAI
- Copy to clipboard and PDF export functionality
- Fully responsive design that works on desktop and mobile
- Robust error handling and user feedback

## Installation

1. Clone this repository to your local machine:

```bash
git clone https://github.com/yourusername/insightiq.git
cd insightiq
```

2. Create and activate a virtual environment:

```bash
# For Windows
python -m venv venv
venv\Scripts\activate

# For macOS/Linux
python -m venv venv
source venv/bin/activate
```

3. Install the required dependencies:

```bash
pip install -r requirements.txt
```

4. Set up your OpenAI API key:

```bash
# Copy the example .env file
cp .env.example .env

# Edit the .env file and add your OpenAI API key
```

## Usage

1. Start the application:

```bash
python insightiq.py
```

2. Access the web interface in your browser at `http://127.0.0.1:5000/`.

3. Enter up to 5 URLs in the sidebar on the left.

4. Click "Process Sources" to analyze the content.

5. Once processing is complete, enter your question in the main area.

6. View the answer and sources in the results section.

## Example URLs for Testing

You can use these URLs for testing:

- https://en.wikipedia.org/wiki/Artificial_intelligence
- https://en.wikipedia.org/wiki/Machine_learning
- https://www.bbc.com/news/world
- https://www.nytimes.com/section/technology
- https://arxiv.org/abs/2302.13971

## Project Structure

- `insightiq.py`: Main Flask application
- `templates/`: HTML templates
- `static/`: CSS, JavaScript, and image files
- `insight_data/`: Directory for storing processed data
- `requirements.txt`: Required Python packages
- `.env`: Configuration file for storing your OpenAI API key

## Technologies Used

- **Backend**: Flask, LangChain, OpenAI
- **Frontend**: HTML5, CSS3, JavaScript
- **Document Processing**: WebBaseLoader, FAISS for vector similarity
- **UI Libraries**: Font Awesome for icons

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- LangChain for providing the document processing and Q&A chain tools
- OpenAI for the language model
- FAISS for the vector similarity search library