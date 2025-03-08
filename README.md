# MCP Postgres Query Server

A Model Context Protocol (MCP) server implementation for querying a PostgreSQL database in read-only mode, designed to work with Claude Desktop and other MCP clients.

## Overview

This project implements a Model Context Protocol (MCP) server that provides:

1. A secure, read-only interface to a PostgreSQL database
2. Integration with Claude Desktop through the MCP protocol
3. SQL query validation to ensure only SELECT queries are executed
4. Query timeout protection (10 seconds)

## Prerequisites

-   Node.js (v14 or later)
-   npm (comes with Node.js)
-   PostgreSQL database (connection details provided via command line)

## Installation

```bash
# Clone the repository
git clone https://github.com/RathodDarshil/mcp-postgres-query-server.git
cd mcp-postgres-query-server

# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

Run the server by providing your PostgreSQL connection string as a command line argument:

```bash
node dist/index.js "postgresql://username:password@hostname:port/database"
```

The server will validate that only read-only queries (SELECT) are executed against your database.

## Connecting to Claude Desktop

You can configure Claude Desktop to automatically launch and connect to the MCP server:

1. Access the Claude Desktop configuration file:

    - Open Claude Desktop
    - Go to Settings > Developer > Edit Config
    - This will open the configuration file in your default text editor

2. Add the postgres-query-server to the `mcpServers` section of your `claude_desktop_config.json`:

```json
{
    "mcpServers": {
        "postgres-query": {
            "command": "node",
            "args": [
                "/path/to/your/mcp-postgres-query-server/dist/index.js",
                "postgresql://username:password@hostname:port/database"
            ]
        }
    }
}
```

3. Replace `/path/to/your/` with the actual path to your project directory.
4. Replace the PostgreSQL connection string with your actual database credentials.
5. Save the file and restart Claude Desktop. The MCP server should now appear in the MCP server selection dropdown in Settings.

### Example Configuration

Here's a complete example of a configuration file with postgres-query:

```json
{
    "mcpServers": {
        "postgres-query": {
            "command": "node",
            "args": [
                "/Users/darshilrathod/mcp-servers/mcp-postgres-query-server/dist/index.js",
                "postgresql://user:password@localhost:5432/mydatabase"
            ]
        }
    }
}
```

### Updating Configuration

To update your Claude Desktop configuration:

1. Open Claude Desktop
2. Go to Settings > Developer > Edit Config
3. Make your changes to the configuration file
4. Save the file
5. Restart Claude Desktop for the changes to take effect
6. If you've updated the MCP server code, make sure to rebuild it with `npm run build` before restarting

## Features

-   **Read-Only Database Access**: Only SELECT queries are permitted for security
-   **Query Validation**: Prevents potentially harmful SQL operations
-   **Timeout Protection**: Queries running longer than 10 seconds are automatically terminated
-   **MCP Protocol Support**: Complete implementation of the Model Context Protocol
-   **JSON Response Formatting**: Query results are returned in structured JSON format

## API

### Tools

#### query-postgres

Executes a read-only SQL query against the configured PostgreSQL database.

Parameters:

-   `query` (string): A SQL SELECT query to execute

Response:

-   JSON object containing:
    -   `rows`: The result set rows
    -   `rowCount`: Number of rows returned
    -   `fields`: Column metadata

Example:

```
query-postgres: SELECT * FROM users LIMIT 5
```

## Development

The main server implementation is in `src/index.ts`. Key components:

-   PostgreSQL connection pool setup
-   Query validation logic
-   MCP server configuration
-   Tool and resource definitions

To modify the server's behavior, you can:

-   Edit the query validation logic in `isReadOnlyQuery()`
-   Add additional tools or resources to the MCP server
-   Modify the query timeout duration (currently 10 seconds)

## Security Considerations

-   The server validates all queries to ensure they are read-only
-   Connection to the database uses SSL
-   Query timeout prevents resource exhaustion
-   No write operations are permitted
-   Database credentials are passed directly via command line arguments, not stored in files

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
