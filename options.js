// options.js

document.addEventListener('DOMContentLoaded', function() {
  const anthropicApiKeyInput = document.getElementById('anthropicApiKey');
  const openaiApiKeyInput = document.getElementById('openaiApiKey');
  const saveButton = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');

  // Load saved API keys
  chrome.storage.local.get(['anthropicApiKey', 'openaiApiKey'], function(result) {
    if (result.anthropicApiKey) {
      anthropicApiKeyInput.value = result.anthropicApiKey;
    }
    if (result.openaiApiKey) {
      openaiApiKeyInput.value = result.openaiApiKey;
    }
  });

  // Save API keys
  saveButton.addEventListener('click', function() {
    const anthropicApiKey = anthropicApiKeyInput.value.trim();
    const openaiApiKey = openaiApiKeyInput.value.trim();
    
    chrome.storage.local.set({ 
      anthropicApiKey: anthropicApiKey,
      openaiApiKey: openaiApiKey 
    }, function() {
      statusDiv.textContent = 'API keys saved successfully!';
      statusDiv.style.color = 'green';
      setTimeout(() => {
        statusDiv.textContent = '';
      }, 3000);
    });
  });
});