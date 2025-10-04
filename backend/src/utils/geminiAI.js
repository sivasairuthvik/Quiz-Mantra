const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiAI {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
  }

  // Generate questions from PDF text
  async generateQuestionsFromText(text, options = {}) {
    const {
      numberOfQuestions = 10,
      difficulty = 'medium',
      questionTypes = ['multiple-choice', 'short-answer'],
      subject = 'General',
    } = options;

    const prompt = `
      As an expert educator, generate ${numberOfQuestions} high-quality quiz questions based on the following text content.
      
      Content: "${text}"
      
      Requirements:
      - Difficulty level: ${difficulty}
      - Question types: ${questionTypes.join(', ')}
      - Subject: ${subject}
      - Each question should test understanding, not just memorization
      - For multiple-choice questions, provide 4 options with only one correct answer
      - Include explanations for correct answers
      - Ensure questions are clear and unambiguous
      
      Please format your response as a JSON array with the following structure:
      [
        {
          "type": "multiple-choice",
          "question": "Question text here?",
          "options": [
            {"text": "Option A", "isCorrect": false},
            {"text": "Option B", "isCorrect": true},
            {"text": "Option C", "isCorrect": false},
            {"text": "Option D", "isCorrect": false}
          ],
          "explanation": "Explanation of the correct answer",
          "difficulty": "${difficulty}",
          "points": 1
        },
        {
          "type": "short-answer",
          "question": "Question text here?",
          "correctAnswer": "Expected answer",
          "explanation": "Explanation of the answer",
          "difficulty": "${difficulty}",
          "points": 2
        }
      ]
      
      Generate exactly ${numberOfQuestions} questions. Ensure the JSON is valid and properly formatted.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      const questions = JSON.parse(jsonMatch[0]);
      return questions;
    } catch (error) {
      console.error('Error generating questions:', error);
      throw new Error('Failed to generate questions from content');
    }
  }

  // Evaluate quiz submission and provide AI feedback
  async evaluateSubmission(quiz, submission, studentAnswers) {
    const prompt = `
      As an expert educator, evaluate this quiz submission and provide detailed feedback.
      
      Quiz Title: ${quiz.title}
      Subject: ${quiz.subject}
      
      Questions and Student Answers:
      ${quiz.questions.map((q, index) => {
        const studentAnswer = studentAnswers.find(a => a.questionId.toString() === q._id.toString());
        return `
        Question ${index + 1}: ${q.question}
        Type: ${q.type}
        ${q.type === 'multiple-choice' ? `Options: ${q.options.map(opt => opt.text).join(', ')}` : ''}
        Correct Answer: ${q.type === 'multiple-choice' ? q.options.find(opt => opt.isCorrect)?.text : q.correctAnswer}
        Student Answer: ${studentAnswer ? studentAnswer.answer : 'No answer provided'}
        Points: ${q.points || 1}
        `;
      }).join('\n')}
      
      Current Score: ${submission.score.total}/${quiz.metadata.totalPoints} (${submission.score.percentage}%)
      
      Please provide:
      1. Strengths - What the student did well (array of strings)
      2. Weaknesses - Areas for improvement (array of strings)  
      3. Recommendations - Specific study suggestions (array of strings)
      4. Detailed Analysis - Overall performance analysis (string)
      
      Format your response as JSON:
      {
        "strengths": ["strength 1", "strength 2"],
        "weaknesses": ["weakness 1", "weakness 2"],
        "recommendations": ["recommendation 1", "recommendation 2"],
        "detailedAnalysis": "Comprehensive analysis of the student's performance..."
      }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      const feedback = JSON.parse(jsonMatch[0]);
      return feedback;
    } catch (error) {
      console.error('Error evaluating submission:', error);
      throw new Error('Failed to generate AI feedback');
    }
  }

  // Generate practice quiz questions for a subject
  async generatePracticeQuiz(subject, difficulty = 'medium', numberOfQuestions = 10) {
    const prompt = `
      Generate ${numberOfQuestions} practice quiz questions for the subject: ${subject}
      Difficulty level: ${difficulty}
      
      Include a mix of:
      - Multiple choice questions (60%)
      - Short answer questions (30%)
      - True/False questions (10%)
      
      Questions should cover key concepts, common misconceptions, and practical applications.
      
      Format as JSON array:
      [
        {
          "type": "multiple-choice",
          "question": "Question text?",
          "options": [
            {"text": "Option A", "isCorrect": false},
            {"text": "Option B", "isCorrect": true},
            {"text": "Option C", "isCorrect": false},
            {"text": "Option D", "isCorrect": false}
          ],
          "explanation": "Why this answer is correct",
          "difficulty": "${difficulty}",
          "points": 1,
          "tags": ["relevant", "topic", "tags"]
        }
      ]
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      const questions = JSON.parse(jsonMatch[0]);
      return questions;
    } catch (error) {
      console.error('Error generating practice quiz:', error);
      throw new Error('Failed to generate practice quiz');
    }
  }

  // Analyze student performance trends
  async analyzePerformanceTrends(studentData) {
    const { submissions, weakAreas, strengths, recentScores } = studentData;
    
    const prompt = `
      Analyze this student's performance data and provide insights:
      
      Recent Quiz Scores: [${recentScores.join(', ')}]
      Number of Submissions: ${submissions}
      Identified Weak Areas: [${weakAreas.join(', ')}]
      Identified Strengths: [${strengths.join(', ')}]
      
      Provide analysis and recommendations:
      1. Performance trend (improving, declining, stable)
      2. Key areas that need attention
      3. Specific study recommendations
      4. Motivational feedback
      
      Format as JSON:
      {
        "trend": "improving/declining/stable",
        "keyInsights": ["insight 1", "insight 2"],
        "studyRecommendations": ["recommendation 1", "recommendation 2"],
        "motivationalFeedback": "Encouraging message for the student",
        "focusAreas": ["area 1", "area 2"],
        "improvementPlan": "Step-by-step improvement suggestions"
      }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      const analysis = JSON.parse(jsonMatch[0]);
      return analysis;
    } catch (error) {
      console.error('Error analyzing performance:', error);
      throw new Error('Failed to analyze performance trends');
    }
  }
}

module.exports = new GeminiAI();