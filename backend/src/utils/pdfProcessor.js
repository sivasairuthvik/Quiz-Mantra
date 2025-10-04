const pdf = require('pdf-parse');
const fs = require('fs');
const path = require('path');

class PDFProcessor {
  // Extract text from PDF buffer
  static async extractTextFromBuffer(buffer) {
    try {
      const data = await pdf(buffer);
      return {
        text: data.text,
        pages: data.numpages,
        info: data.info,
        metadata: data.metadata,
      };
    } catch (error) {
      console.error('Error extracting text from PDF buffer:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  // Extract text from PDF file path
  static async extractTextFromFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error('PDF file not found');
      }

      const buffer = fs.readFileSync(filePath);
      return await this.extractTextFromBuffer(buffer);
    } catch (error) {
      console.error('Error extracting text from PDF file:', error);
      throw new Error('Failed to extract text from PDF file');
    }
  }

  // Clean and format extracted text
  static cleanText(text) {
    // Remove excessive whitespace and line breaks
    let cleanedText = text.replace(/\s+/g, ' ').trim();
    
    // Fix common PDF extraction issues
    cleanedText = cleanedText
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
      .replace(/(\w)(\d)/g, '$1 $2') // Add space between word and number
      .replace(/(\d)([A-Za-z])/g, '$1 $2') // Add space between number and word
      .replace(/([.!?])([A-Z])/g, '$1 $2') // Add space after sentence endings
      .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
      .trim();

    return cleanedText;
  }

  // Split text into sections/paragraphs
  static splitIntoSections(text, maxSectionLength = 2000) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sections = [];
    let currentSection = '';

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (currentSection.length + trimmedSentence.length + 1 <= maxSectionLength) {
        currentSection += (currentSection ? '. ' : '') + trimmedSentence;
      } else {
        if (currentSection) {
          sections.push(currentSection + '.');
        }
        currentSection = trimmedSentence;
      }
    }

    if (currentSection) {
      sections.push(currentSection + '.');
    }

    return sections;
  }

  // Extract key topics/subjects from text
  static extractKeyTopics(text) {
    // Simple keyword extraction (can be enhanced with NLP libraries)
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
      'what', 'where', 'when', 'why', 'how', 'which', 'who', 'whom', 'whose',
    ]);

    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word));

    // Count word frequency
    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // Get top keywords
    const sortedWords = Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);

    return sortedWords;
  }

  // Validate PDF content for quiz generation
  static validateContentForQuiz(text) {
    const minLength = 500; // Minimum text length
    const maxLength = 50000; // Maximum text length
    
    if (!text || text.trim().length < minLength) {
      throw new Error(`PDF content too short. Minimum ${minLength} characters required.`);
    }
    
    if (text.length > maxLength) {
      throw new Error(`PDF content too long. Maximum ${maxLength} characters allowed.`);
    }

    // Check for meaningful content
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length < 5) {
      throw new Error('PDF content does not contain enough meaningful sentences for quiz generation.');
    }

    return true;
  }

  // Process PDF for quiz generation
  static async processPDFForQuiz(filePath) {
    try {
      // Extract text from PDF
      const extracted = await this.extractTextFromFile(filePath);
      
      // Clean the text
      const cleanedText = this.cleanText(extracted.text);
      
      // Validate content
      this.validateContentForQuiz(cleanedText);
      
      // Extract key topics
      const keyTopics = this.extractKeyTopics(cleanedText);
      
      // Split into manageable sections
      const sections = this.splitIntoSections(cleanedText);
      
      return {
        text: cleanedText,
        sections,
        keyTopics,
        pages: extracted.pages,
        metadata: {
          title: extracted.info?.Title || 'Untitled',
          author: extracted.info?.Author || 'Unknown',
          subject: extracted.info?.Subject || '',
          wordCount: cleanedText.split(/\s+/).length,
          characterCount: cleanedText.length,
        },
      };
    } catch (error) {
      console.error('Error processing PDF for quiz:', error);
      throw error;
    }
  }
}

module.exports = PDFProcessor;