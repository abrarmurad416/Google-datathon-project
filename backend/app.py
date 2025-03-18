from flask import Flask, request, jsonify
from flask_cors import CORS

import cv2
import moviepy.editor as mp
import librosa
import librosa.display
import numpy as np
import os
from deepface import DeepFace
import torch
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
from scipy.io.wavfile import write
import re
import openai
from dotenv import load_dotenv
import os
import random

load_dotenv("api_keys.env")
api_key = os.getenv("OPENAI_API_KEY")
openai.api_key = api_key

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# 3. Function to Extract Frames Efficiently
def extract_frames(video_path, frame_rate=1):
    cap = cv2.VideoCapture(video_path)
    fps = int(cap.get(cv2.CAP_PROP_FPS))  # Get original FPS
    frame_interval = max(1, fps // frame_rate)  # Ensure interval is at least 1 frame

    frames = []
    count = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break  # Stop when video ends

        if count % frame_interval == 0:
            frames.append(frame)  # Store selected frames

        count += 1

    cap.release()
    return frames


# 4. Function to Extract Audio from Video
def extract_audio(video_path, output_audio_path = os.path.join(os.getcwd(), "audio", "output_audio.wav")):
    video = mp.VideoFileClip(video_path)
    video.audio.write_audiofile(output_audio_path)
    return output_audio_path


# 5. Convert Speech to Text using Wav2Vec2
processor = Wav2Vec2Processor.from_pretrained("facebook/wav2vec2-large-960h")
model = Wav2Vec2ForCTC.from_pretrained("facebook/wav2vec2-large-960h")

def transcribe_audio(audio_path):
    # Load audio
    speech, sr = librosa.load(audio_path, sr=16000)

    # Normalize audio
    input_values = processor(speech, return_tensors="pt", sampling_rate=16000).input_values

    # Perform inference
    with torch.no_grad():
        logits = model(input_values).logits

    # Decode output
    predicted_ids = torch.argmax(logits, dim=-1)
    transcription = processor.batch_decode(predicted_ids)[0]

    return transcription


# 6. Perform Facial Expression Analysis using DeepFace
def analyze_faces(frames):
    results = []

    for idx, frame in enumerate(frames):
        try:
            analysis = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=False)
            dominant_emotion = analysis[0]['dominant_emotion']
            results.append((idx, dominant_emotion))
        except Exception as e:
            print(f"Error analyzing frame {idx}: {e}")

    return results


# 7. Analyzing Transcription for Filler Words, Relevance, and Tonality
FILLER_WORDS = {"um", "uh", "like", "you know", "so", "well", "actually", "basically", "literally", "hmm"}

FILLER_PHRASES = {
    "to be honest", 
    "if that makes sense",
    "as I mentioned earlier", 
    "the way I approach this is",
    "I would say that",
    "to give you some context",
    "let me give you an example",
    "to elaborate on that",
    "correct me if I'm wrong",
    "if I understand correctly",
    "as you can imagine",
    "this is important because",
    "as I was saying",
    "and yeah",
    "I hope that was clear"
}

def count_filler_words(transcription):
    # Convert to lowercase for case-insensitive matching
    text = transcription.lower()
    
    # Count individual filler words
    words = re.findall(r'\b\w+\b', text)
    word_count = sum(1 for word in words if word in FILLER_WORDS)
    
    # Count filler phrases
    phrase_count = sum(text.count(phrase.lower()) for phrase in FILLER_PHRASES)
    
    # Total word count for ratio calculation
    total_words = len(words)
    
    # Total fillers found
    total_fillers = word_count + phrase_count
    
    # Calculate ratio
    filler_ratio = total_fillers / max(1, total_words)
    
    return total_fillers, filler_ratio


# 8. Relevance Check with LLM (GPT-4 or Similar)
def check_relevance(question, response):
    prompt = f"""
    Question: {question}
    Response: {response}

    Is this response relevant to the question? Answer with 'Y' or 'N' and provide a short explanation.
    """

    client = openai.OpenAI()

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are an expert interviewer assessing responses."},
            {"role": "user", "content": prompt}
        ]
    )

    # Extract the assistant's reply
    relevance = response.choices[0].message.content

    return relevance


# 9. Detecting Confidence, Hesitation, and Certainty from Speech
def assess_tonality(transcription, filler_ratio):
    tonalities = []
    word_count = len(transcription.split())
    
    if filler_ratio > 0.20:
        tonalities.append("Hesitant")
    elif filler_ratio > 0.15:
        tonalities.append("Uncertain")
    elif filler_ratio > 0.10:
        tonalities.append("Unclear")
    elif filler_ratio < 0.05:
        tonalities.append("Confident")
    
    if word_count < 15:
        tonalities.append("Brief")
    elif word_count > 100:
        tonalities.append("Detailed")
    elif word_count > 200:
        tonalities.append("Comprehensive")
    
    if re.search(r'\bI think\b|\bperhaps\b|\bmaybe\b|\bpossibly\b', transcription, re.IGNORECASE):
        tonalities.append("Tentative")
    
    if re.search(r'\bdefinitely\b|\babsolutely\b|\bcertainly\b|\bwithout doubt\b', transcription, re.IGNORECASE):
        tonalities.append("Assertive")
    
    if re.search(r'\bexperience\b|\bbackground\b|\bexpertise\b|\bpractice\b', transcription, re.IGNORECASE):
        tonalities.append("Experience-Based")
    
    if not tonalities:
        tonalities = ["Neutral"]
    
    return tonalities


# 10. Assigning a Score Based on Transcription & Facial Expressions
""" 
* Filler word score (lower is better)
* Relevance score (binary: relevant or not)
* Verbal tonality score (confidence, hesitation, clarity)
* Facial emotion score (based on the top 3 dominant emotions detected)

example:
Filler Ratio: 0.0
Relevance: Yes
Tonality: ['Confident', 'Knowledgeable']
Facial Expressions: ['neutral', 'surprise']
"""
def score_response(filler_ratio, relevance, tonality, dominant_emotions):
    score = 100

    # Deduct points for excessive filler words
    if filler_ratio > 0.20:
        score -= 30
    elif filler_ratio > 0.10:
        score -= 15

    # Deduct points if response is irrelevant
    if relevance == "N":
        score -= 30

    # Adjust based on tonality
    bad_tonalities = ["Hesitant", "Unclear", "Uncertain"]
    if any(tonality in bad_tonalities for tonality in tonality):
        score -= 15

    # Emotion-based scoring
    emotion_penalties = {"sad": 10, "fear": 10, "angry": 15, "disgust": 15}
    for emotion in dominant_emotions:
        if emotion in emotion_penalties:
            score -= emotion_penalties[emotion]

    return max(score, 0)  # Ensure score doesn't go below 0


# 11. (FINAL) Generating Specific Interview Feedback Based on Scoring
def generate_feedback(final_score, filler_ratio, relevance, tonality, dominant_emotions):
    overall_performance = ""
    filler_feedback = ""
    relevance_feedback = ""
    tonality_feedback = ""
    facial_expression = []
    next_steps = ""

    # Overall performance category
    if final_score >= 85:
        overall_performance += "✅ Excellent Response Your answer was clear, relevant, and well-articulated"
    elif final_score > 70:
        overall_performance += "👍 Good Response You performed well but there's room for slight improvement"
    elif final_score > 50:
        overall_performance += "⚠️ Decent Response Could Use Some Improvement Your answer had some weaknesses"
    else:
        overall_performance += "❌ Poor Response :( Significant improvements are needed"

    # Filler word feedback
    if filler_ratio > 0.15:
        filler_feedback += f"🚨 You used too many filler words ({filler_ratio:.2%} of your response) Remember - 'It's not the destination It's the journey that matters' - Ralph Waldo Emerson Pause and think before speaking silence is not bad"
    elif filler_ratio > 0.10:
        filler_feedback += f"⚠️ You used some filler words ({filler_ratio:.2%} of your response) You are speaking faster than your brain is able to think Reducing your filler word usage means slowing down your response"
    else:
        filler_feedback += f"✅ You used minimal filler words ({filler_ratio:.2%} of your response) You found a speaking pace that works for you and it really shows Great job and keep up the great work"

    # Relevance feedback
    if "No" in relevance:
        relevance_feedback += "❌ Your response was not relevant to the question It's easy to drift off when answering an interviewer's question You can always ask the interviewer to repeat their question to better understand it before responding"
    else:
        relevance_feedback += "✅ Your response was relevant to the question"

    # Tonality feedback
    if "Hesitant" in tonality or "Unclear" in tonality or "Uncertain" in tonality:
        tonality_feedback += "⚠️ Your response sounded hesitant unclear or uncertain Practice confidence when responding This usually stems from a lack of preparation Make sure you spend ample time preparing for your interviews It may help to make some general notes about what you'd like to speak about"
    else:
        tonality_feedback += "✅ Your response sounded confident and well-structured"

    # Facial expression feedback
    for emotion in dominant_emotions:
        if emotion in ["happy", "neutral", "surprise"]:
            facial_expression.append(f"😊 Your face showed {emotion} which is excellent for building rapport during a conversation.")
        elif emotion in ["sad", "angry", "fear", "disgust"]:
            facial_expression.append(f"⚠️ We noticed your face showed {emotion}. During a presentation, it's important to project confidence and enthusiasm. Try to maintain a more neutral and positive expression.")

    # Final encouragement
    next_steps += "✨ Keep practicing structured responses reducing filler words and maintaining confident body language"

    return overall_performance, filler_feedback, relevance_feedback, tonality_feedback, facial_expression, next_steps


# --- MAIN ---
general_questions = [
    "Why do you want to work for Google?",
    "Why do you want to leave your current/last company?",
    "What are you looking for in your next role?",
    "Tell me about a time when you had a conflict with a co-worker.",
    "Tell me about a time in which you had a conflict and needed to influence somebody else.",
    "What project are you currently working on?",
    "What is the most challenging aspect of your current project?",
    "What was the most difficult bug that you fixed in the past 6 months?",
    "How do you tackle challenges? Name a difficult challenge you faced while working on a project, how you overcame it, and what you learned.\n\n\n- Google 2018, FT SWE Google Maps",
    "What are you excited about?",
    "What frustrates you?"
]

question = "How do you tackle challenges? Name a difficult challenge you faced while working on a project, how you overcame it, and what you learned.",
file = ""

@app.route('/')
def home():
     print("/ endpoint reached!")
     
     #video_path = "/uploads/google_datathon_demo.mp4"
     video_path = os.path.join(os.getcwd(), "uploads", "google_datathon_demo_2.mp4")  # Adjust path
     frames = extract_frames(video_path, frame_rate=1)
     print(f"Extracted {len(frames)} frames.")
     
          
     audio_path = extract_audio(video_path)
     print(f"Extracted audio: {audio_path}")
     
     
     transcription = transcribe_audio(audio_path).lower()
     print(f"Transcribed text: {transcription}")
     
     
     facial_expressions = analyze_faces(frames)
     dominant_emotions = sorted(facial_expressions, key=lambda x: facial_expressions.count(x), reverse=True)[:2]
     dominant_emotions = [emotion[1] for emotion in dominant_emotions]
     print(dominant_emotions)
     
     
     filler_count, filler_ratio = count_filler_words(transcription)
     print(f"Filler words used: {filler_count}, Ratio: {filler_ratio:.2%}")
     
     
     relevance = check_relevance(question, transcription)
     print(f"{relevance}")
     if relevance[0:1] == "Y":
          relevance = "Yes"
     else:
          relevance = "No"
          
          
     tonality = assess_tonality(transcription, filler_ratio)
     print(f"Tonality: {tonality}")
     
     
     # 4 qualities judged:
     print(f"Filler Ratio: {filler_ratio}")
     print(f"Relevance: {relevance}")
     print(f"Tonality: {tonality}")
     print(f"Facial Expressions: {dominant_emotions}")
     
     
     final_score = score_response(filler_ratio=filler_ratio, relevance=relevance, tonality=tonality, dominant_emotions=dominant_emotions)
     print(f"Final Score: {final_score}/100")
     
     overall_performance, filler_feedback, relevance_feedback, tonality_feedback, facial_expression, next_steps = generate_feedback(final_score, filler_ratio, relevance, tonality, dominant_emotions)
     print(overall_performance) 
     print(filler_feedback) 
     print(relevance_feedback) 
     print(tonality_feedback) 
     print(facial_expression) 
     print(next_steps) 
          
     return jsonify({
        "overall_performance": overall_performance,
        "filler_feedback": filler_feedback,
        "relevance_feedback": relevance_feedback,
        "tonality_feedback": tonality_feedback,
        "facial_expression": facial_expression,
        "next_steps": next_steps
    })
     

@app.route("/get-question")
def generate_question():
     print("/get-question endpoint reached!")
     global question
     #question_index = random.randint(0, len(general_questions) - 1)
     #question = general_questions[question_index]
     question = general_questions[8]
     return jsonify({"question": question})  # Return the question as JSON


# Ensure upload directory exists
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

@app.route("/upload-video", methods=["POST"])
def upload_video():
    
    print("/upload-video endpoint reached!")
    if "video" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["video"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    # Save file to uploads folder
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], file.filename)
    file.save(file_path)

    return jsonify({"message": "Video uploaded successfully", "path": file_path})

if __name__ == '__main__':
    app.run(debug=True)
