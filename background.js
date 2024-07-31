// background.js

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  chrome.storage.local.get(['anthropicApiKey', 'openaiApiKey'], (result) => {
    if (!result.anthropicApiKey && !result.openaiApiKey) {
      console.log('API keys not found, opening options page');
      chrome.tabs.create({ url: 'options.html' });
    } else {
      console.log('API key(s) found');
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);
  if (message.action === 'summarize') {
    console.log('Summarizing content');
    summarizeContent(message.content)
      .then(summary => {
        console.log('Summary generated successfully');
        sendResponse({ summary });
      })
      .catch(error => {
        console.error('Error generating summary:', error);
        sendResponse({ error: error.message });
      });
    return true; // Indicates that the response is sent asynchronously
  }
});

async function summarizeContent(content) {
  console.log('Fetching API keys from storage');
  const { anthropicApiKey, openaiApiKey } = await chrome.storage.local.get(['anthropicApiKey', 'openaiApiKey']);
  console.log('API Keys retrieved:', 
    anthropicApiKey ? 'Anthropic: Yes' : 'Anthropic: No',
    openaiApiKey ? 'OpenAI: Yes' : 'OpenAI: No'
  );
  
  if (!anthropicApiKey && !openaiApiKey) {
    console.error('No API keys set');
    throw new Error('No API keys set. Please set either Anthropic or OpenAI API key in the extension options.');
  }

  if (anthropicApiKey) {
    return summarizeWithAnthropic(content, anthropicApiKey);
  } else {
    return summarizeWithOpenAI(content, openaiApiKey);
  }
}

async function summarizeWithAnthropic(content, apiKey) {
  console.log('Sending request to Anthropic API');
  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        messages: [
          {
            role: 'user',
            content: `Summarize the following web page content in bullet points:\n\n${content}`
          }
        ],
        max_tokens: 1000,
      }),
    });

    console.log('API response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Error body:', errorBody);
      throw new Error(`Failed to get summary from Anthropic API: ${response.status} ${response.statusText}\nError details: ${errorBody}`);
    }

    console.log('API request successful');
    const result = await response.json();
    console.log('API response:', JSON.stringify(result, null, 2));

    if (result.content && Array.isArray(result.content) && result.content.length > 0 && result.content[0].text) {
      return result.content[0].text;
    } else {
      console.error('Unexpected API response structure:', JSON.stringify(result, null, 2));
      throw new Error('Unexpected Anthropic API response structure');
    }
  } catch (error) {
    console.error('Error in Anthropic API request:', error);
    throw error;
  }
}

function truncateContent(content, maxTokens = 3000) {
  // Rough estimate: 1 token ~= 4 characters
  const maxChars = maxTokens * 4;
  console.log(`Original content length: ${content.length} characters`);
  
  if (content.length > maxChars) {
    console.log(`Content too long, truncating to ${maxChars} characters`);
    // Take the first third and the last third of the content
    const thirdLength = Math.floor(maxChars / 3);
    const firstPart = content.slice(0, thirdLength);
    const lastPart = content.slice(-thirdLength);
    return firstPart + "\n...[content truncated]...\n" + lastPart;
  }
  
  console.log(`Content within limit, not truncating`);
  return content;
}

function simpleSummarize(content, maxSentences = 20) {
  const sentences = content.match(/[^\.!\?]+[\.!\?]+/g) || [];
  if (sentences.length > maxSentences) {
    console.log(`Summarizing content to ${maxSentences} sentences`);
    return sentences.slice(0, maxSentences).join(' ');
  }
  return content;
}

async function summarizeWithOpenAI(content, apiKey) {
  console.log('Preparing content for OpenAI API');
  let processedContent = simpleSummarize(content);
  processedContent = truncateContent(processedContent);
  console.log(`Processed content length: ${processedContent.length} characters`);

  try {
    console.log('Sending request to OpenAI API');
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that summarizes web page content in bullet points. Focus on the main points and key information.'
          },
          {
            role: 'user',
            content: `Summarize the following web page content in bullet points:\n\n${processedContent}`
          }
        ],
        max_tokens: 1000,
      }),
    });

    console.log('API response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Error body:', errorBody);
      throw new Error(`Failed to get summary from OpenAI API: ${response.status} ${response.statusText}\nError details: ${errorBody}`);
    }

    console.log('API request successful');
    const result = await response.json();
    console.log('API response:', JSON.stringify(result, null, 2));

    if (result.choices && result.choices.length > 0 && result.choices[0].message && result.choices[0].message.content) {
      return result.choices[0].message.content;
    } else {
      console.error('Unexpected API response structure:', JSON.stringify(result, null, 2));
      throw new Error('Unexpected OpenAI API response structure');
    }
  } catch (error) {
    console.error('Error in OpenAI API request:', error);
    throw error;
  }
}