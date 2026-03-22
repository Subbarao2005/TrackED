// This file exists solely to run dotenv.config() as a side-effect import.
// In ES Modules, all imports are hoisted, so dotenv MUST be in its own
// module file to guarantee process.env is populated before any other
// module (like exam.js) tries to read environment variables at load time.
import dotenv from 'dotenv';
dotenv.config();

console.log('[ENV] Environment variables loaded natively for Gemini.');
