#!/usr/bin/env node

require('dotenv').config()
const McpService = require('./services/McpService')

async function main() {
  try {
    const mcpService = new McpService()
    await mcpService.start()
  } catch (error) {
    console.error('Failed to start MCP server:', error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('MCP server shutting down...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.error('MCP server shutting down...')
  process.exit(0)
})

main().catch(console.error)
