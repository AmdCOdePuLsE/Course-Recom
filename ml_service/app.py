from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Any
import uvicorn
import json
import random
from pathlib import Path

app = FastAPI(title="SKILL-SYNC ML Service")

origins = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:4000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = Path(__file__).parent / 'data'
DATA_DIR.mkdir(exist_ok=True)

SYLLABUS_PATH = Path(__file__).parent.parent / 'frontend' / 'src' / 'data' / 'syllabus.json'
if SYLLABUS_PATH.exists():
    syllabus = json.loads(SYLLABUS_PATH.read_text())
else:
    syllabus = {"semesters":{}}

ELECTIVES = []
for sem in syllabus.get('semesters',{}).values():
    ELECTIVES.extend(sem.get('Electives', []))

class RecommendInput(BaseModel):
    interests: List[str] = []
    careerGoal: str = ''
    learningStyle: str = 'Visual'
    currentSemester: int = 1
    previousGpas: List[float] = []

class PredictInput(BaseModel):
    features: Dict[str, float] = {}

class RiskInput(BaseModel):
    courses: List[str] = []

@app.get("/")
async def root():
    return {"ok": True, "service": "ml"}

@app.post("/recommend")
async def recommend(inp: RecommendInput):
    # Simple heuristic + randomness to simulate ML output
    # Score electives based on overlap with interests and GPA trend
    results = []
    for e in ELECTIVES:
        topics = e.get('topics', [])
        name = (e.get('name') or '').lower()
        soft_topics = []
        if 'data' in name: soft_topics.append('Data')
        if 'machine' in name or 'learning' in name: soft_topics.append('ML')
        if 'ai' in name or 'intelligence' in name: soft_topics.append('AI')
        if 'web' in name: soft_topics.append('Web')
        if 'cloud' in name: soft_topics.append('Cloud')
        if 'security' in name: soft_topics.append('Security')
        if 'network' in name: soft_topics.append('Networks')
        if 'image' in name or 'vision' in name: soft_topics.append('CV')
        if 'natural language' in name or 'nlp' in name: soft_topics.append('NLP')
        if 'database' in name: soft_topics.append('Databases')
        if 'algorithm' in name: soft_topics.append('Algorithms')

        all_topics = topics + soft_topics
        interest_overlap = len(set(all_topics) & set(inp.interests))
        base = 0.4 + 0.1 * interest_overlap
        
        # Career goal boost
        if inp.careerGoal in ['Data Scientist','ML Engineer','Researcher'] and any(t in topics for t in ['NLP','CNN','RNN','Artificial Intelligence','Data Mining']):
            base += 0.2
        
        # GPA trend analysis: boost if improving, penalize if declining
        if inp.previousGpas and len(inp.previousGpas) > 1:
            latest_gpa = inp.previousGpas[-1] / 10.0  # normalize to [0,1]
            base = 0.6 * base + 0.4 * latest_gpa
            
            # Check trend
            if len(inp.previousGpas) >= 2:
                recent_trend = inp.previousGpas[-1] - inp.previousGpas[-2]
                if recent_trend > 0.5:
                    base += 0.05  # improving
                elif recent_trend < -0.5:
                    base -= 0.05  # declining
        
        # Learning style consideration
        if inp.learningStyle == 'Visual' and any(keyword in name for keyword in ['graphics', 'visualization', 'image']):
            base += 0.03
        elif inp.learningStyle == 'Kinesthetic' and any(keyword in name for keyword in ['lab', 'project', 'hands']):
            base += 0.03

        success_prob = min(max(base + random.uniform(-0.05, 0.05), 0.1), 0.95)
        risk = 'High' if success_prob < 0.5 else ('Medium' if success_prob < 0.75 else None)
        
        reason_parts = []
        detailed_reasons = []
        if interest_overlap > 0:
            matching_interests = list(set(all_topics) & set(inp.interests))
            reason_parts.append(f"matches {interest_overlap} of your interests")
            detailed_reasons.append(f"Strong alignment with your interests in {', '.join(matching_interests[:3])}.")
        if inp.careerGoal and inp.careerGoal in ['Data Scientist','ML Engineer','Researcher'] and any(t in topics for t in ['NLP','CNN','RNN','Artificial Intelligence','Data Mining']):
            reason_parts.append(f"aligns with {inp.careerGoal} career goal")
            detailed_reasons.append(f"Excellent preparation for a career in {inp.careerGoal}, covering essential skills and knowledge areas.")
        if inp.previousGpas:
            avg_gpa = sum(inp.previousGpas) / len(inp.previousGpas)
            reason_parts.append(f"suitable for your academic performance (avg GPA: {avg_gpa:.2f})")
            if avg_gpa >= 8.0:
                detailed_reasons.append("Your strong academic record indicates you'll excel in this challenging course.")
            elif avg_gpa >= 6.5:
                detailed_reasons.append("Your solid academic foundation provides good preparation for this course.")
            else:
                detailed_reasons.append("Consider strengthening fundamentals first, but this course can help you grow.")
        
        # Add learning style specific reasoning
        if inp.learningStyle == 'Visual' and any(keyword in name for keyword in ['graphics', 'visualization', 'image']):
            detailed_reasons.append("This course includes visual components that match your preferred learning style.")
        elif inp.learningStyle == 'Kinesthetic' and any(keyword in name for keyword in ['lab', 'project', 'hands']):
            detailed_reasons.append("Hands-on projects and labs in this course suit your kinesthetic learning preference.")
        
        # Academic progression reasoning
        if inp.currentSemester <= 4:
            detailed_reasons.append("Taking this course now will build a strong foundation for advanced topics in later semesters.")
        else:
            detailed_reasons.append("This advanced course is well-timed for your current academic level and will enhance your expertise.")
            
        reason = f"This course {', '.join(reason_parts) if reason_parts else 'fits your profile'}."
        detailed_reason = ' '.join(detailed_reasons) if detailed_reasons else reason
        
        explain = {
            "interest_overlap": interest_overlap,
            "matching_topics": list(set(all_topics) & set(inp.interests)),
            "career_alignment": inp.careerGoal in ['Data Scientist','ML Engineer','Researcher'] and any(t in topics for t in ['NLP','CNN','RNN','Artificial Intelligence','Data Mining']),
            "avg_gpa": round(sum(inp.previousGpas) / len(inp.previousGpas), 2) if inp.previousGpas else 0,
            "gpa_trend": "improving" if len(inp.previousGpas)>=2 and inp.previousGpas[-1]>inp.previousGpas[-2] else ("declining" if len(inp.previousGpas)>=2 and inp.previousGpas[-1]<inp.previousGpas[-2] else "stable"),
            "current_semester": inp.currentSemester,
            "learning_style_match": inp.learningStyle,
            "detailed_reasoning": detailed_reason,
            "academic_level": "beginner" if inp.currentSemester <= 2 else ("intermediate" if inp.currentSemester <= 5 else "advanced")
        }
        
        results.append({
            "code": e.get('code'),
            "name": e.get('name'),
            "success_prob": success_prob,
            "risk": risk,
            "reason": reason,
            "detailed_reason": detailed_reason,
            "explain": explain
        })
    
    # Sort best recommendations first
    results.sort(key=lambda r: r['success_prob'], reverse=True)
    return {"recommendations": results[:8]}

@app.post("/predict")
async def predict(inp: PredictInput):
    # Return a dummy grade prediction (out of 10)
    base = sum(inp.features.values())/max(len(inp.features),1)
    return {"predicted_grade": round(min(max(base, 4.0), 9.5),2)}

@app.post("/risk")
async def risk(inp: RiskInput):
    out = []
    for c in inp.courses:
        out.append({"course": c, "dropout_risk": round(random.uniform(0.1, 0.7),2)})
    return {"risks": out}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
