import dotenv from 'dotenv';
dotenv.config();
const key = process.env.GROQ_API_KEY;
console.log("Length:", key ? key.length : "undefined");
console.log("Starts with gsk_:", key ? key.startsWith('gsk_') : false);
console.log("Ends with quote?", key ? key.endsWith('"') || key.endsWith("'") : false);
console.log("Raw JSON visualization:", JSON.stringify(key));
