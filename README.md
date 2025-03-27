# DingTalk AI Server

[![smithery badge](https://smithery.ai/badge/@plutocheung/dingtalk-ai-server)](https://smithery.ai/server/@plutocheung/dingtalk-ai-server)

A Node.js implementation of the Model Context Protocol (MCP) for DingTalk AI services.

## Features

- Create assistant threads
- Send messages to threads
- Get access tokens
- Create assistant runs
- Various other DingTalk API integrations

## Installation

### Installing via Smithery

To install dingtalk-ai-server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@plutocheung/dingtalk-ai-server):

```bash
npx -y @smithery/cli install @plutocheung/dingtalk-ai-server --client claude
```

### Manual Installation
```bash
# Clone the repository
git clone https://github.com/plutocheung/dingtalk-ai-server.git

# Navigate to the project directory
cd dingtalk-ai-server

# Install dependencies
npm install
```

## Usage

```bash
# Start the server
npm start
```

## Dependencies

- @modelcontextprotocol/sdk
- axios
- crypto-js
- dotenv
- node-fetch
- zod

## License

ISC
