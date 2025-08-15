# SKILL-SYNC – AI-Powered Course Recommendations & Academic Insights

This is a full-stack implementation of SKILL-SYNC with:

- React + Vite + Tailwind CSS + Framer Motion (frontend)
- Node.js + Express + JWT auth + CSV/PDF exports (backend)
- Python FastAPI microservice for AI/ML (recommendations, grade prediction, at-risk detection)

Important: Replace `frontend/src/data/syllabus.json` with your exact syllabus JSON (as provided previously). A placeholder with the correct shape is included.

## Run locally

1) Frontend

```
cd frontend
npm install
npm run dev
```

2) Backend

```
cd backend
npm install
npm start
```

3) ML Service

```
cd ml_service
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
python app.py
```

Default URLs:
- Frontend: http://localhost:5173
- Backend: http://localhost:4000
- ML Service: http://127.0.0.1:8000

You can configure URLs in `frontend/.env`, `backend/src/config.js`, and `ml_service/app.py` if needed.

## Notes
- Auth is JWT (httpOnly cookie). Includes Student and Faculty roles.
- Data is stored in simple JSON files in `backend/data` for demo purposes.
- Exports (CSV/PDF) are client-side using libraries.
- The ML service includes lightweight demo models with explainability stubs.

### Supabase Auth (optional)
Add these to `frontend/.env` to enable Supabase login:

```
VITE_SUPABASE_URL=https://yipcstmjkrkewmhttrml.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpcGNzdG1qa3JrZXdtaHR0cm1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNDg1NzUsImV4cCI6MjA3MDgyNDU3NX0.iPIDRdd0sT8QcIiLlO3eXsbIvfEyTdyW3-zoBLWt5Jo
```
