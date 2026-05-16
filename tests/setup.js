import { config } from 'dotenv';
import path from 'path';

// Load the .env.test variables into process.env
config({ path: path.resolve(process.cwd(), '.env.test') });
