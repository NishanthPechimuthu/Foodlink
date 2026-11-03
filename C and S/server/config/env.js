import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load server/.env regardless of current working directory
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

// Ensure fallback port is set
if (!process.env.PORT) {
  process.env.PORT = '5001';
}

export default process.env;
