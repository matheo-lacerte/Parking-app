import serverless from 'serverless-http';
import app from '../server/src/app.js';

// Export the Express app as a serverless function handler for Vercel
export default serverless(app);
