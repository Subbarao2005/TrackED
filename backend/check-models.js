import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';

async function list() {
  const apiKey = process.env.GEMINI_API_KEY;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await res.json();
  const names = data.models ? data.models.map(m => m.name) : data;
  console.log(names);
}
list();
