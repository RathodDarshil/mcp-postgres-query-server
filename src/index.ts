import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Pool } from "pg";

// Get database connection string from command line arguments
const args = process.argv.slice(2);
const connectionString = args[0] || process.env.DATABASE_URL;

if (!connectionString) {
    console.error("Error: Database connection string not provided.");
    console.error("Usage: node dist/index.js <database_connection_string>");
    process.exit(1);
}

// Create a connection pool
const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false, // Use this if you're getting SSL certificate errors
    },
});

// Create an MCP server
const server = new McpServer({
    name: "Postgres Query Server",
    version: "1.0.0",
});

// Add a dynamic greeting resource
server.resource("greeting", new ResourceTemplate("greeting://{name}", { list: undefined }), async (uri, { name }) => ({
    contents: [
        {
            uri: uri.href,
            text: `Hello, ${name}!`,
        },
    ],
}));

// Function to validate that only SELECT queries are allowed
function isReadOnlyQuery(query: string): boolean {
    // Normalize the query by removing comments, extra whitespace, and converting to lowercase
    const normalizedQuery = query
        .replace(/--.*$/gm, "") // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, "") // Remove multi-line comments
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

    // Check if the query starts with SELECT
    if (normalizedQuery.startsWith("select")) {
        return true;
    }

    // Check for other write operations
    const writeOperations = [
        "insert",
        "update",
        "delete",
        "drop",
        "create",
        "alter",
        "truncate",
        "grant",
        "revoke",
        "copy", // COPY can write data
    ];

    for (const op of writeOperations) {
        if (normalizedQuery.startsWith(op) || normalizedQuery.includes(" " + op + " ")) {
            return false;
        }
    }

    return true;
}

// Add a PostgreSQL query tool
server.tool("query-postgres", { query: z.string() }, async ({ query }) => {
    try {
        // Validate that the query is read-only
        if (!isReadOnlyQuery(query)) {
            return {
                content: [
                    {
                        type: "text",
                        text: "Error: Only SELECT queries are allowed. INSERT, UPDATE, DELETE, and other write operations are not permitted.",
                    },
                ],
                isError: true,
            };
        }

        // Create a promise that will be rejected after 10 seconds
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error("Query execution timed out after 10 seconds. Pls modify the query and try again."));
            }, 10000); // 10 seconds in milliseconds
        });

        // Execute the query with a timeout
        const result = (await Promise.race([pool.query(query), timeoutPromise])) as any; // Using 'any' here to handle the type after the race

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(
                        {
                            rows: result.rows,
                            rowCount: result.rowCount,
                            fields: result.fields.map((f: any) => ({
                                name: f.name,
                                dataType: f.dataTypeID,
                            })),
                        },
                        null,
                        2
                    ),
                },
            ],
        };
    } catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error executing query: ${(error as Error).message}`,
                },
            ],
            isError: true,
        };
    }
});

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
server.connect(transport);
