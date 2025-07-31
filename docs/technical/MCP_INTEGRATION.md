# MCP Integration for FSW Iron Task

This document describes the Model Context Protocol (MCP) integration for the FSW Iron Task construction documentation system.

## Overview

The MCP integration allows AI assistants like Claude to directly interact with FSW Iron Task data, providing access to projects, media, reports, and team information through a standardized protocol.

## Available Resources

### Project Resources
- **URI Format**: `project://{projectId}`
- **Description**: Access detailed project information including team members, statistics, and metadata
- **Example**: `project://123e4567-e89b-12d3-a456-426614174000`

## Available Tools

### 1. `searchProjects`
Search for construction projects by various criteria.

**Parameters:**
- `query` (string, optional): Search term for name, description, or location
- `status` (string, optional): Filter by status (PLANNING, ACTIVE, ON_HOLD, COMPLETED)
- `companyId` (string, optional): Filter by company
- `limit` (number, optional): Maximum results (default: 10)

### 2. `getProjectMedia`
Retrieve media files (photos/videos) for a specific project.

**Parameters:**
- `projectId` (string, required): Project ID
- `mediaType` (string, optional): Filter by type (PHOTO, VIDEO, DUAL_CAM_VIDEO)
- `tagId` (string, optional): Filter by tag
- `limit` (number, optional): Maximum results (default: 20)

### 3. `getProjectReports`
Access AI-generated reports for a project.

**Parameters:**
- `projectId` (string, required): Project ID
- `reportType` (string, optional): Filter by type (PROGRESS_RECAP, SUMMARY, DAILY_LOG)
- `limit` (number, optional): Maximum results (default: 10)

### 4. `getProjectActivities`
Get recent activities and updates for a project.

**Parameters:**
- `projectId` (string, required): Project ID
- `activityType` (string, optional): Filter by activity type
- `days` (number, optional): Number of days to look back (default: 7)

### 5. `searchMedia`
Search media across all projects using various filters.

**Parameters:**
- `query` (string, optional): Search term
- `tags` (array, optional): Tag names to filter by
- `startDate` (string, optional): Start date (ISO format)
- `endDate` (string, optional): End date (ISO format)
- `hasLocation` (boolean, optional): Filter by GPS data presence
- `limit` (number, optional): Maximum results (default: 20)

### 6. `getTeamMembers`
Retrieve team members for a project or company.

**Parameters:**
- `projectId` (string, optional): Project ID
- `companyId` (string, optional): Company ID
- `role` (string, optional): Filter by role (ADMIN, PROJECT_MANAGER, FOREMAN, etc.)

### 7. `getProjectStats`
Get comprehensive statistics and analytics for a project.

**Parameters:**
- `projectId` (string, required): Project ID

## Setup Instructions

### For Development

1. Ensure the API server has database access:
   ```bash
   cd api
   npm install
   ```

2. Start the MCP server:
   ```bash
   npm run mcp:start
   ```

   Or for development with auto-reload:
   ```bash
   npm run mcp:dev
   ```

### For Claude Desktop Integration

1. Add the following to your Claude Desktop configuration file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "fsw-iron-task": {
      "command": "node",
      "args": ["/path/to/fsw-iron-task/api/src/mcp-server.js"],
      "env": {
        "NODE_ENV": "development",
        "DATABASE_URL": "your-database-url"
      }
    }
  }
}
```

2. Replace `/path/to/fsw-iron-task` with the actual path to your project
3. Ensure environment variables are properly set (especially DATABASE_URL)
4. Restart Claude Desktop

## Usage Examples

### Example 1: Search for Active Projects
```
Use the searchProjects tool with status "ACTIVE" to find all currently active construction projects.
```

### Example 2: Get Project Documentation
```
First, use searchProjects to find the project, then use getProjectMedia with the project ID to retrieve all photos and videos.
```

### Example 3: Generate Project Summary
```
Use getProjectStats to get comprehensive statistics, then getProjectReports to find recent AI reports for the project.
```

### Example 4: Team Overview
```
Use getTeamMembers with a project ID to see all assigned workers and their roles.
```

## Security Considerations

- The MCP server uses the same authentication and authorization as the main API
- Database queries are performed with appropriate access controls
- Sensitive data (like passwords) is never exposed through MCP
- File URLs are signed with expiration times for security

## Troubleshooting

### Database Connection Issues
- Ensure DATABASE_URL is set in environment variables
- Check that the database server is accessible
- Verify Prisma client is generated: `npx prisma generate`

### MCP Server Not Starting
- Check Node.js version compatibility
- Ensure all dependencies are installed
- Look for error messages in console output
- Verify file permissions on mcp-server.js

### No Data Returned
- Confirm database has data
- Check project/company IDs are valid
- Verify user permissions in database

## Future Enhancements

- [ ] Add tools for creating/updating projects
- [ ] Implement media upload capabilities
- [ ] Add real-time notifications support
- [ ] Include form submission tools
- [ ] Add report generation triggers
- [ ] Implement team chat integration