// api/hello.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * A simple Vercel serverless function that responds with a greeting.
 *
 * This function demonstrates how to handle incoming requests and send
 * responses using the Vercel Node.js runtime.
 *
 * @param request - The VercelRequest object, containing details about the incoming HTTP request.
 * @param response - The VercelResponse object, used to send the HTTP response.
 */
export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    // Extract the 'name' query parameter from the request, defaulting to 'World' if not provided.
    const name = request.query.name || 'World';

    // Set the HTTP status code to 200 (OK).
    response.statusCode = 200;

    // Set the Content-Type header to 'application/json' for a JSON response.
    response.setHeader('Content-Type', 'application/json');

    // Send a JSON response with a greeting message.
    // Using await here for consistency, though response.json() is synchronous.
    await response.json({
      message: `Hello, ${name}! This is a Vercel serverless function running locally.`,
      timestamp: new Date().toISOString(),
      method: request.method, // Include the HTTP method for demonstration
    });

    // IMPORTANT: Explicitly return after sending the response to ensure the function terminates.
    return;

  } catch (error) {
    // If any error occurs within the function, log it and send a 500 response.
    console.error('Error in Vercel serverless function:', error);
    response.statusCode = 500;
    response.setHeader('Content-Type', 'application/json');
    response.json({
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : String(error),
      code: 'FUNCTION_EXECUTION_ERROR', // Custom code for errors within the handler
    });
    return; // Also return after sending an error response
  }
}
