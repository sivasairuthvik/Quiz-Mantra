# Quiz Mantra Backend

A comprehensive Node.js backend for the Quiz Mantra AI-powered Quiz Management System.

## Features

- **Authentication**: Google OAuth2 integration with JWT tokens
- **Role-based Access Control**: Student, Teacher, and Admin roles
- **Quiz Management**: Create, edit, assign, and attempt quizzes
- **PDF Processing**: Extract text from PDFs and generate AI questions
- **AI Integration**: Gemini AI for question generation and evaluation
- **Real-time Analytics**: Performance tracking and insights
- **Competition System**: Quiz competitions and leaderboards
- **Messaging**: Communication between teachers and students
- **Announcements**: System-wide and targeted notifications
- **Practice Quizzes**: AI-generated practice sessions
- **File Upload**: Support for PDFs, images, and documents

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: Passport.js (Google OAuth2) + JWT
- **AI**: Google Gemini AI API
- **File Processing**: PDF-parse, Multer
- **Security**: Helmet, CORS, Rate limiting
- **Session Management**: Express-session with MongoDB store

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Fill in the required environment variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Secret key for JWT tokens
   - `GOOGLE_CLIENT_ID`: Google OAuth2 client ID
   - `GOOGLE_CLIENT_SECRET`: Google OAuth2 client secret
   - `GEMINI_API_KEY`: Google Gemini AI API key
   - `SESSION_SECRET`: Secret for session management
   - `CLIENT_URL`: Frontend application URL

4. Start the development server:
   ```bash
   npm run dev
   ```

   For production:
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `GET /auth/google` - Google OAuth login
- `GET /auth/google/callback` - OAuth callback
- `GET /auth/me` - Get current user
- `PUT /auth/profile` - Update user profile
- `POST /auth/logout` - Logout user

### Quiz Management
- `GET /api/quiz` - Get all quizzes
- `GET /api/quiz/:id` - Get single quiz
- `POST /api/quiz` - Create quiz (Teacher/Admin)
- `PUT /api/quiz/:id` - Update quiz (Owner/Admin)
- `DELETE /api/quiz/:id` - Delete quiz (Owner/Admin)
- `POST /api/quiz/upload` - Upload PDF and generate quiz
- `POST /api/quiz/:id/assign` - Assign quiz to students
- `POST /api/quiz/:id/start` - Start quiz attempt (Student)
- `POST /api/quiz/:id/submit` - Submit quiz answers (Student)

### Submissions
- `GET /api/submissions` - Get submissions
- `GET /api/submissions/:id` - Get single submission
- `PUT /api/submissions/:id/evaluate` - Evaluate submission (Teacher/Admin)
- `POST /api/submissions/:id/revaluation` - Request revaluation (Student)
- `PUT /api/submissions/:id/revaluation` - Handle revaluation (Teacher/Admin)

### Reports & Analytics
- `GET /api/reports/student/:id` - Student performance report
- `GET /api/reports/quiz/:id` - Quiz performance report
- `GET /api/reports/teacher` - Teacher dashboard data
- `GET /api/reports/admin` - Admin dashboard data

### Practice Quizzes
- `POST /api/practice` - Generate practice quiz (Student)
- `GET /api/practice/analysis` - Get performance analysis (Student)
- `GET /api/practice/recommendations` - Get practice recommendations (Student)

### Messages
- `GET /api/messages` - Get messages
- `POST /api/messages` - Send message
- `GET /api/messages/conversation/:userId` - Get conversation
- `PUT /api/messages/:id/read` - Mark as read

### Announcements
- `GET /api/announcements` - Get announcements
- `POST /api/announcements` - Create announcement (Teacher/Admin)
- `PUT /api/announcements/:id` - Update announcement (Owner/Admin)
- `DELETE /api/announcements/:id` - Delete announcement (Owner/Admin)

### Competitions
- `GET /api/competitions` - Get competitions
- `POST /api/competitions` - Create competition (Teacher/Admin)
- `POST /api/competitions/:id/register` - Register for competition (Student)
- `POST /api/competitions/:id/submit` - Submit competition entry (Student)
- `GET /api/competitions/:id/leaderboard` - Get leaderboard

## Project Structure

```
backend/
├── src/
│   ├── config/          # Database and passport configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # MongoDB schemas
│   ├── routes/          # Express routes
│   ├── utils/           # Utility functions
│   └── server.js        # Main server file
├── uploads/             # File upload directory
├── package.json
└── README.md
```

## Models

- **User**: User profiles with role-based permissions
- **Quiz**: Quiz structure with questions and settings
- **Submission**: Quiz attempts and answers
- **Announcement**: System announcements
- **Competition**: Quiz competitions
- **Message**: User communications

## Security Features

- JWT-based authentication
- Role-based authorization
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation
- File upload restrictions
- Session management

## AI Integration

The system integrates with Google Gemini AI for:
- Generating questions from PDF content
- Auto-evaluating quiz submissions
- Providing personalized feedback
- Analyzing performance trends
- Creating practice recommendations

## Deployment

The backend is configured for deployment on platforms like:
- Vercel (with serverless functions)
- Heroku
- AWS EC2/ECS
- Digital Ocean

For Vercel deployment, make sure to:
1. Set up environment variables in Vercel dashboard
2. Configure MongoDB Atlas for database
3. Set up Google OAuth2 with production URLs
4. Configure CORS for your frontend domain

## Environment Variables

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://your-api.vercel.app/auth/google/callback
SESSION_SECRET=your_session_secret
CLIENT_URL=https://your-frontend.vercel.app
GEMINI_API_KEY=your_gemini_api_key
```

## License

MIT License