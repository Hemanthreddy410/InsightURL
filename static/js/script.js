document.addEventListener('DOMContentLoaded', function() {
    // Form elements
    const urlForm = document.getElementById('url-form');
    const questionForm = document.getElementById('question-form');
    
    // Loading elements
    const loadingElement = document.getElementById('loading');
    const answerLoadingElement = document.getElementById('answer-loading');
    
    // Result elements
    const answerContainer = document.getElementById('answer-container');
    const answerElement = document.getElementById('answer');
    const sourcesList = document.getElementById('sources-list');
    const noResultsElement = document.getElementById('no-results');
    const resultActions = document.getElementById('result-actions');
    
    // Action buttons
    const btnCopy = document.getElementById('btn-copy');
    const btnSave = document.getElementById('btn-save');
    
    // URL validation
    function isValidURL(url) {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    // URL form submission
    urlForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Check if at least one valid URL is provided
        let hasValidUrl = false;
        for (let i = 1; i <= 5; i++) {
            const url = document.getElementById(`url${i}`).value.trim();
            if (url && isValidURL(url)) {
                hasValidUrl = true;
                break;
            }
        }
        
        if (!hasValidUrl) {
            showStatusMessage('error', 'Please enter at least one valid URL');
            return;
        }
        
        // Show loading animation
        loadingElement.classList.remove('hidden');
        
        // Create form data
        const formData = new FormData(urlForm);
        
        // Send AJAX request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
        
        fetch('/process_urls', {
            method: 'POST',
            body: formData,
            signal: controller.signal
        })
        .then(response => response.json())
        .then(data => {
            // Hide loading animation
            loadingElement.classList.add('hidden');
            clearTimeout(timeoutId);
            
            // Show status message
            showStatusMessage(data.status, data.message);
        })
        .catch(error => {
            // Hide loading animation
            loadingElement.classList.add('hidden');
            clearTimeout(timeoutId);
            
            // Show error message
            if (error.name === 'AbortError') {
                showStatusMessage('error', 'Request timed out. The URLs might be taking too long to process.');
            } else {
                showStatusMessage('error', 'An error occurred while processing the URLs. Please try again.');
            }
            console.error('Error:', error);
        });
    });
    
    // Question form submission
    questionForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const query = document.getElementById('query').value.trim();
        if (!query) {
            showStatusMessage('error', 'Please enter a question');
            return;
        }
        
        // Show loading animation
        answerLoadingElement.classList.remove('hidden');
        
        // Hide previous results
        answerContainer.classList.add('hidden');
        resultActions.classList.add('hidden');
        noResultsElement.classList.add('hidden');
        
        // Create form data
        const formData = new FormData(questionForm);
        
        // Send AJAX request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        fetch('/ask', {
            method: 'POST',
            body: formData,
            signal: controller.signal
        })
        .then(response => response.json())
        .then(data => {
            // Hide loading animation
            answerLoadingElement.classList.add('hidden');
            clearTimeout(timeoutId);
            
            if (data.status === 'success') {
                // Show answer
                displayAnswer(data.answer, data.sources);
                resultActions.classList.remove('hidden');
            } else {
                // Show error message
                showStatusMessage('error', data.message);
                noResultsElement.classList.remove('hidden');
            }
        })
        .catch(error => {
            // Hide loading animation
            answerLoadingElement.classList.add('hidden');
            clearTimeout(timeoutId);
            
            // Show error message
            if (error.name === 'AbortError') {
                showStatusMessage('error', 'Request timed out. Try a simpler question or different URLs.');
            } else {
                showStatusMessage('error', 'An error occurred while processing your question. Please try again.');
            }
            noResultsElement.classList.remove('hidden');
            console.error('Error:', error);
        });
    });
    
    // Display answer and sources
    function displayAnswer(answer, sources) {
        // Display answer
        answerElement.textContent = answer;
        
        // Clear previous sources
        sourcesList.innerHTML = '';
        
        // Add sources to list
        if (sources && sources.length > 0) {
            sources.forEach(source => {
                if (source && source.trim()) {
                    const li = document.createElement('li');
                    
                    // Check if source is a URL
                    if (source.startsWith('http')) {
                        const a = document.createElement('a');
                        a.href = source;
                        a.textContent = source;
                        a.target = '_blank';
                        li.appendChild(a);
                    } else {
                        li.textContent = source;
                    }
                    
                    sourcesList.appendChild(li);
                }
            });
        }
        
        // Show answer container
        answerContainer.classList.remove('hidden');
        noResultsElement.classList.add('hidden');
    }
    
    // Copy to clipboard functionality
    btnCopy.addEventListener('click', function() {
        const answerText = answerElement.textContent;
        
        // Create sources text
        let sourcesText = '';
        const sourcesItems = sourcesList.querySelectorAll('li');
        if (sourcesItems.length > 0) {
            sourcesText = '\n\nSources:\n';
            sourcesItems.forEach(item => {
                sourcesText += '- ' + (item.textContent || item.innerText) + '\n';
            });
        }
        
        // Copy to clipboard
        const textToCopy = answerText + sourcesText;
        
        navigator.clipboard.writeText(textToCopy).then(
            function() {
                // Show success message
                const originalText = btnCopy.innerHTML;
                btnCopy.innerHTML = '<i class="fas fa-check"></i> Copied!';
                
                setTimeout(function() {
                    btnCopy.innerHTML = originalText;
                }, 2000);
            },
            function() {
                showStatusMessage('error', 'Failed to copy to clipboard');
            }
        );
    });
    
    // Save as PDF functionality
    btnSave.addEventListener('click', function() {
        // Create a simple print view
        const printWindow = window.open('', '_blank');
        
        // Get the sources
        let sourcesHtml = '';
        const sourcesItems = sourcesList.querySelectorAll('li');
        if (sourcesItems.length > 0) {
            sourcesHtml = '<h3>Sources:</h3><ul>';
            sourcesItems.forEach(item => {
                sourcesHtml += '<li>' + (item.innerHTML || item.innerText) + '</li>';
            });
            sourcesHtml += '</ul>';
        }
        
        // Set the content
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>InsightIQ Analysis</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
                    h1 { color: #4361ee; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; }
                    .answer { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    h3 { color: #3a0ca3; margin-top: 30px; }
                    ul { padding-left: 20px; }
                    .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <h1>InsightIQ Analysis</h1>
                <div class="answer">${answerElement.textContent}</div>
                ${sourcesHtml}
                <div class="footer">Generated by InsightIQ - Web Intelligence Platform</div>
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `);
    });
    
    // Show status message
    function showStatusMessage(type, message) {
        // Create alert element
        const alertElement = document.createElement('div');
        alertElement.className = `alert alert-${type}`;
        alertElement.textContent = message;
        
        // Add icon based on type
        const icon = document.createElement('i');
        icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
        icon.style.marginRight = '10px';
        alertElement.prepend(icon);
        
        // Remove existing alerts
        document.querySelectorAll('.alert').forEach(alert => alert.remove());
        
        // Insert alert at the top of the form
        if (type === 'success') {
            urlForm.prepend(alertElement);
        } else {
            const activeForm = document.activeElement && document.activeElement.form;
            if (activeForm === questionForm) {
                questionForm.prepend(alertElement);
            } else {
                urlForm.prepend(alertElement);
            }
        }
        
        // Remove alert after 8 seconds
        setTimeout(() => {
            alertElement.style.opacity = '0';
            alertElement.style.transition = 'opacity 0.5s ease';
            
            setTimeout(() => {
                alertElement.remove();
            }, 500);
        }, 8000);
    }
    
    // Create clear buttons
    const createClearButton = (formId, buttonLabel) => {
        const form = document.getElementById(formId);
        const submitBtn = form.querySelector('button[type="submit"]');
        
        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'btn-clear';
        clearBtn.innerHTML = `<i class="fas fa-trash-alt"></i> ${buttonLabel || 'Clear'}`;
        
        clearBtn.addEventListener('click', () => {
            form.reset();
        });
        
        if (formId === 'url-form') {
            form.appendChild(clearBtn);
        } else {
            submitBtn.parentNode.insertBefore(clearBtn, submitBtn.nextSibling);
        }
    };
    
    // Add clear buttons
    createClearButton('url-form', 'Clear URLs');
    
    // Add CSS for clear buttons
    const style = document.createElement('style');
    style.textContent = `
        .btn-clear {
            background-color: #e5e5e5;
            color: #666;
            margin-top: 10px;
        }
        .btn-clear:hover {
            background-color: #d4d4d4;
        }
        #url-form .btn-clear {
            background-color: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.8);
            width: 100%;
            margin-top: 15px;
        }
        #url-form .btn-clear:hover {
            background-color: rgba(255, 255, 255, 0.2);
        }
    `;
    document.head.appendChild(style);
});