# Omniprompt

Omniprompt is a lightweight Chrome extension that lets you submit the same prompt to multiple large language model (LLM) chat interfaces at once. It works by injecting your text into tabs that you already have open for each supported site.

## Features

- Options page to compose your prompt and select which chat pages to use
- Sends your text to all checked sites sequentially
- Currently supports Claude, ChatGPT, Google AI Studio, Grok on X, and DeepSeek

## Installation

1. Clone or download this repository.
2. Open `chrome://extensions/` in Chrome and enable **Developer mode**.
3. Click **Load unpacked** and select this project folder.
4. Pin the "LLM Multi-Submitter" extension if you want quick access.

## Usage

1. Navigate to the chat pages you want to use (e.g. [claude.ai](https://claude.ai), [chatgpt.com](https://chatgpt.com)). The extension will only send prompts to tabs that are already open.
2. Click the Omniprompt icon to open the options page.
3. Type or paste your prompt into the textarea.
4. Tick the checkboxes for the sites you want to target.
5. Hit **Send to All Pages**. The extension focuses each tab in turn and submits your prompt.

## Customising Sites

The options page displays a checklist of supported sites. You can enable or disable each one. The default list and CSS selectors are defined in `options.js` and saved using Chrome storage.

## Development Notes

- Manifest version: 3
- Background script: `background.js`
- Options page UI: `options.html` and `options.js`

Feel free to tailor the selectors or add new sites to suit your workflow.

