# 🚀 SmartHire Backend - README

## 📌 Project Description
The **SmartHire Backend** is a Flask-based REST API that powers the SmartHire platform, providing real-time AI-driven feedback on video interview responses. It extracts frames, analyzes facial expressions, transcribes speech, detects filler words, and generates interview feedback scores.

## ⚙️ Tech Stack
- **Backend:** Python, Flask  
- **Libraries:**  
  - `OpenCV` → Frame extraction  
  - `MoviePy` → Audio extraction  
  - `Librosa` → Audio processing  
  - `DeepFace` → Facial expression analysis  
  - `OpenAI` → GPT-powered feedback generation  
  - `Flask-CORS` → Cross-Origin Resource Sharing  
- **Environment:**  
  - Python 3.11  
  - Virtual environment (`venv`)  

## 📁 File Structure
/backend ├── /uploads # Directory for uploaded videos
├── /audio # Directory for extracted audio files
├── /venv # Virtual environment
├── app.py # Main Flask application
├── requirements.txt # Python dependencies
├── api_keys.env # Environment variables (API keys)
└── README.md # Documentation

## 🚀 Installation & Setup
1️⃣ Clone the repository
```
git clone https://github.com/username/SmartHire.git
cd SmartHire/backend
```
2️⃣ Set up the virtual environment
```
python -m venv venv
venv\Scripts\activate   # Windows  
source venv/bin/activate  # Mac/Linux  
```
3️⃣ Install dependencies
```
pip install -r requirements.txt
```
4️⃣ Create environment variables
Create a .env file to store your OpenAI API key:
```
OPENAI_API_KEY=your_openai_api_key
```
5️⃣ Run the server
```
python app.py
```
(The backend will run on http://localhost:5000)
