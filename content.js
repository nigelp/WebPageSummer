// content.js

function getPageContent() {
  console.log('Getting page content');
  const content = document.body.innerText;
  console.log('Page content length:', content.length);
  return content;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  if (message.action === 'getContent') {
    const content = getPageContent();
    console.log('Sending content back to popup');
    sendResponse({ content: content });
  }
});