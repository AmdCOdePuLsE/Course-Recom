export const CONFIG = {
  PORT: process.env.PORT || 4000,
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret',
  ML_URL: process.env.ML_URL || 'http://127.0.0.1:8000',
  CORS_ORIGIN: process.env.CORS_ORIGIN || [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:5176'
  ],
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE: process.env.SUPABASE_SERVICE_ROLE || ''
}
