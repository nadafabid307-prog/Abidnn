# Smart Quiz System

A lightweight, gamified quiz web app built with HTML, CSS, and vanilla JavaScript. It turns learning concepts into enjoyable quizzes with progress tracking, badges, and a clean responsive UI.

This project was presented at the Frontend Development Frameworks Hackathon and received encouraging feedback from faculty and industry reviewers. Big thanks to my team and mentors for their support!

## Features
- Multiple-choice quizzes with categories (Math, Science, History, All)
- Timer per question and keyboard shortcuts (1-4 to answer, N for next)
- Local progress/history stored in localStorage
- Simple gamification: badges (Perfect Score, Quick Thinker, Streak Master, High Achiever)
- Review answers with explanations after finishing a quiz
- Responsive, accessible design with focus and keyboard support

## Files
- `index.html` — main markup and UI
- `styles.css` — modern responsive styling
- `script.js` — quiz logic, persistence, and UI glue
- `README.md` — this file

## How to run
1. Clone or download the files.
2. Open `index.html` in your browser (no build step required).
3. Start a quiz, answer questions, and view progress.

For local development with a small server (optional):
- Python 3: `python -m http.server 8000` then open `http://localhost:8000`
- Node: `npx http-server`

## Next steps / ideas
- Add user accounts (backend) to sync progress across devices.
- Fetch question banks from an API or admin dashboard for dynamic content.
- Add more gamification (levels, achievements, leaderboards).
- Accessibility audit and localization support.
- Unit tests and end-to-end tests for core flows.

Thank you — looking forward to building more projects that make a meaningful impact!
