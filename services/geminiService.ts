
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { QuizQuestion } from '../types';

const MODEL_NAME = "gemini-2.5-flash-preview-04-17";

export const generateQuizFromTopic = async (topic: string): Promise<QuizQuestion[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API key not found. Please set the API_KEY environment variable.");
    throw new Error("API key not configured. Cannot generate quiz.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are an expert quiz generator. Your SOLE task is to output a valid JSON array.
Create a quiz about the topic: "${topic}".
The quiz should consist of 5 multiple-choice questions.
Each question must have exactly 4 unique answer options.
For each question, clearly identify the correct answer by its text.

The output MUST be a single, valid JSON array of objects. NO OTHER TEXT, MARKDOWN, COMMENTS, OR EXPLANATIONS ARE ALLOWED.
Your entire response body MUST be ONLY this JSON array.
The JSON array must start with '[' and end with ']'.
Each object in the array must represent a question and STRICTLY follow this exact format:
{
  "question": "The full text of the question?",
  "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
  "correctAnswer": "The text of the correct option, which must be one of a string value present in its 'options' array."
}

For example, a valid response for a 2-question quiz would be:
\`\`\`json
[
  {
    "question": "Sample question 1?",
    "options": ["Option Alpha", "Option Bravo", "Option Charlie", "Option Delta"],
    "correctAnswer": "Option Alpha"
  },
  {
    "question": "Sample question 2?",
    "options": ["Option Echo", "Option Foxtrot", "Option Golf", "Option Hotel"],
    "correctAnswer": "Option Hotel"
  }
]
\`\`\`
Ensure your output perfectly matches this structure and contains only the JSON.`;

  let jsonStringToParse = ""; 

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3, // Lowered temperature for more deterministic JSON output
      },
    });

    if (typeof response.text !== 'string') {
      console.error("Invalid response type from AI. Expected response.text to be a string, but got:", typeof response.text, response.text);
      throw new Error("Failed to generate quiz: AI response was not in the expected text format.");
    }

    jsonStringToParse = response.text.trim();
    
    const fenceRegex = /```json\s*\n?(.*?)\n?\s*```/s;
    const fenceMatch = jsonStringToParse.match(fenceRegex);

    if (fenceMatch && fenceMatch[1]) {
      jsonStringToParse = fenceMatch[1].trim();
    }

    const parsedData = JSON.parse(jsonStringToParse);

    if (!Array.isArray(parsedData)) {
      console.error("Parsed data is not an array:", parsedData);
      throw new Error("Failed to parse quiz data: Expected an array of questions.");
    }

    const validatedQuestions: QuizQuestion[] = parsedData.map((item: any, index: number) => {
      if (
        typeof item.question !== 'string' || !item.question.trim() ||
        !Array.isArray(item.options) ||
        item.options.length !== 4 ||
        !item.options.every((opt: any) => typeof opt === 'string' && opt.trim()) ||
        typeof item.correctAnswer !== 'string' || !item.correctAnswer.trim() ||
        !item.options.includes(item.correctAnswer)
      ) {
        console.error(`Invalid question structure at index ${index}:`, item);
        throw new Error(`Invalid data format for question ${index + 1}. Please ensure all fields are correctly populated and the correct answer is one of the options.`);
      }
      return {
        id: crypto.randomUUID(),
        question: item.question,
        options: item.options,
        correctAnswer: item.correctAnswer,
      };
    });

    if (validatedQuestions.length === 0) {
        throw new Error("The generated quiz has no questions. Please try a different topic or refine your request.");
    }
    if (validatedQuestions.length < 3) { 
        console.warn(`Generated quiz has only ${validatedQuestions.length} questions.`);
    }

    return validatedQuestions;

  } catch (error) {
    console.error("Error generating quiz from Gemini API:", error);
    if (error instanceof SyntaxError) { 
      console.error("Failed to parse JSON response. The problematic string that was attempted to be parsed was:\n---\n" + jsonStringToParse + "\n---");
    }
    
    if (error instanceof Error) {
        if (error.message.includes("API key not valid") || error.message.includes("API_KEY_INVALID")) {
             throw new Error("Invalid API Key. Please check your configuration and ensure the key is correct and has permissions for the Gemini API.");
        }
         throw new Error(`Failed to generate quiz: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the quiz.");
  }
};
