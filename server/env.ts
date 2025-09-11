// Centralized environment loader for both dev and production
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Resolve project root regardless of build (ESM) location
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

// Load .env from project root if present
config({ path: join(projectRoot, ".env") });

// Also respect environment-specific files if they exist (optional)
const nodeEnv = process.env.NODE_ENV;
if (nodeEnv) {
  const envFile = `.env.${nodeEnv}`;
  config({ path: join(projectRoot, envFile) });
}

// No exports needed; importing this module applies side effects


