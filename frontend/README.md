# 🚀 SmartHire Frontend - README

## 📌 Project Description
The **SmartHire Frontend** is a Next.js-based web application that provides an intuitive interface for users to upload video interviews and receive real-time, AI-driven feedback. It communicates with the SmartHire backend to display interview scores, facial expression analysis, and detailed feedback reports.

## ⚙️ Tech Stack
- **Frontend:** Next.js, React, TypeScript  
- **Libraries:**  
  - `Tailwind CSS` → Styling and layout  
  - `Axios` → API requests  
  - `React Hook Form` → Form handling  
  - `Framer Motion` → Animations  
  - `Shadcn` → UI components  
- **Environment:**  
  - Node.js  
  - Next.js development server  

## 📁 File Structure
/frontend ├── /public # Static assets (images, icons)
├── /components # Reusable UI components
├── /pages # Next.js pages and routes
├── /styles # Global styles and Tailwind configuration
├── /services # API service functions (Axios)
├── /hooks # Custom React hooks
├── /context # Global state management
├── package.json # Project dependencies
├── next.config.js # Next.js configuration
├── tsconfig.json # TypeScript configuration
└── README.md # Documentation

## 🚀 Installation & Setup
1️⃣ Clone the repository  
```
git clone https://github.com/username/SmartHire.git
cd SmartHire/frontend
```
2️⃣ Install dependencies  
```
npm install
```
3️⃣ Start the development server
```
npm run dev
```
(The frontend will run on [http://localhost:3000](http://localhost:3000)

🔥 Core Functionality
✅ Video Upload Form
Allows users to upload interview videos.
Handles file validation and displays error messages for invalid formats.
✅ API Integration
Uses Axios to send video files to the backend.
Displays the generated feedback and interview scores.
✅ Real-time Feedback Display
Renders AI-generated feedback, including:
Facial expression analysis
Speech transcription
Filler word detection
Overall interview score
⚠️ Troubleshooting
1️⃣ CORS issues when connecting to the backend
Ensure the backend has Flask-CORS enabled.
Verify the NEXT_PUBLIC_BACKEND_URL is correct in .env.local.
2️⃣ Styling issues
Check Tailwind configuration and ensure classes are applied correctly.
Restart the server to reflect Tailwind changes.
💡 Future Improvements
Add pagination and filtering for interview history.
Implement multi-language support.
Enhance UI with more detailed charts and visualizations.
