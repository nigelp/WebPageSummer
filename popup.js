// popup.js

document.addEventListener('DOMContentLoaded', async function() {
  const summarizeBtn = document.getElementById('summarizeBtn');
  const loadingDiv = document.getElementById('loading');
  const summaryDiv = document.getElementById('summary');
  const copyBtn = document.getElementById('copyBtn');

  summarizeBtn.addEventListener('click', async function() {
    loadingDiv.style.display = 'block';
    summaryDiv.textContent = '';
    copyBtn.style.display = 'none';

    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      
      // Get the page content
      const response = await chrome.tabs.sendMessage(tab.id, {action: 'getContent'});
      
      if (response && response.content) {
        // Summarize the content
        const result = await chrome.runtime.sendMessage({action: 'summarize', content: response.content});
        
        loadingDiv.style.display = 'none';
        if (result.summary) {
          summaryDiv.textContent = result.summary;
          copyBtn.style.display = 'block';
        } else if (result.error) {
          summaryDiv.textContent = 'Error: ' + result.error;
        }
      } else {
        throw new Error('Unable to get page content');
      }
    } catch (error) {
      loadingDiv.style.display = 'none';
      summaryDiv.textContent = 'Error: ' + (error.message || 'An unexpected error occurred');
      console.error('Error:', error);
    }
  });

  copyBtn.addEventListener('click', async function() {
    try {
      await navigator.clipboard.writeText(summaryDiv.textContent);
      const originalText = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = originalText;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  });
});