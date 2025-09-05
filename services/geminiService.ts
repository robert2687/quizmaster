import { GoogleGenAI, GenerateContentResponse, Type, GroundingChunk } from "@google/genai";
import { QuizQuestion } from '../types';

// FIX: Updated model name to a stable, recommended version.
const MODEL_NAME = "gemini-2.5-flash";

export const generateQuizFromTopic = async (
  topic: string, 
  difficulty: string, 
  useGrounding: boolean,
  occupation?: string,
): Promise<{ questions: QuizQuestion[]; sources: GroundingChunk[] | null }> => {
  // FIX: Removed manual API key check. Assuming key is provided by the environment as per guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const personalizationInstruction = occupation && occupation !== 'None'
    ? ` The user's occupation is ${occupation}, so tailor the questions to be relevant to someone with that background.`
    : '';

  // Prompt for standard, non-grounded generation
  const standardPrompt = `You are an expert quiz generator.
Create a quiz about the topic: "${topic}" at a ${difficulty} difficulty level.${personalizationInstruction}
The quiz should consist of 5 multiple-choice questions.
Each question must have exactly 4 unique answer options.
For each question, clearly identify the correct answer by its text.`;

  // Prompt for generation with Google Search grounding, explicitly asking for JSON
  const groundedPrompt = `You are an expert quiz generator.
Create a quiz about the topic: "${topic}" at a ${difficulty} difficulty level.${personalizationInstruction}
The quiz should consist of 5 multiple-choice questions.
Each question must have exactly 4 unique answer options.
For each question, clearly identify the correct answer by its text.
Respond ONLY with a valid JSON array of question objects and nothing else. Do not include markdown fences like \`\`\`json.`;

  // Base configuration
  const config: any = {
    temperature: 0.3,
  };

  // Conditionally add grounding or response schema
  if (useGrounding) {
    config.tools = [{googleSearch: {}}];
  } else {
    config.responseMimeType = "application/json";
    config.responseSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: {
            type: Type.STRING,
            description: "The full text of the question.",
          },
          options: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
            description: "An array of exactly 4 unique answer options.",
          },
          correctAnswer: {
            type: Type.STRING,
            description: "The text of the correct option, which must be one of the strings in the 'options' array.",
          },
        },
      },
    };
  }


  let jsonStringToParse = ""; 

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: useGrounding ? groundedPrompt : standardPrompt,
      config,
    });

    if (typeof response.text !== 'string') {
      console.error("Invalid response type from AI. Expected response.text to be a string, but got:", typeof response.text, response.text);
      throw new Error("Failed to generate quiz: AI response was not in the expected text format.");
    }

    jsonStringToParse = response.text.trim();
    
    // FIX: More robust JSON extraction. The model can sometimes return the JSON
    // wrapped in markdown or with extra text. This regex looks for the first
    // occurrence of a valid JSON array or object in the response.
    const jsonMatch = jsonStringToParse.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (jsonMatch && jsonMatch[0]) {
        jsonStringToParse = jsonMatch[0];
    }
    
    const parsedData = JSON.parse(jsonStringToParse);
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? null;

    // The model might wrap the array in a root object, e.g., { "questions": [...] }.
    // This logic attempts to find and extract the first array property from the object.
    let questionsArray = parsedData;
    if (questionsArray && typeof questionsArray === 'object' && !Array.isArray(questionsArray)) {
        const key = Object.keys(questionsArray).find(k => Array.isArray((questionsArray as any)[k]));
        if (key) {
            questionsArray = (questionsArray as any)[key];
        }
    }

    if (!Array.isArray(questionsArray)) {
      console.error("Parsed data is not an array:", questionsArray);
      throw new Error("Failed to parse quiz data: Expected an array of questions.");
    }

    const validatedQuestions: QuizQuestion[] = questionsArray.map((item: any, index: number) => {
        // FIX: More flexible validation to handle common variations in property names from the AI.
        const itemQuestion = item.question || item.q;
        const itemOptions = item.options || item.choices;
        const itemCorrectAnswer = item.correctAnswer || item.answer;
        
        if (
            typeof itemQuestion !== 'string' ||
            !Array.isArray(itemOptions) ||
            (typeof itemCorrectAnswer !== 'string' && typeof itemCorrectAnswer !== 'number')
        ) {
            console.error(`Invalid question structure (missing or wrong type for keys) at index ${index}:`, item);
            throw new Error(`Invalid data format for question ${index + 1}. Required fields (question, options, correctAnswer) are missing or have the wrong type.`);
        }

        // Sanitize and validate content
        const questionText = itemQuestion.trim();
        // FIX: More robust option parsing, handling objects with a 'text' property.
        const options = itemOptions
            .map((opt: any) => {
                if (typeof opt === 'string') return opt.trim();
                // If it's an object with a 'text' or 'value' property, use that.
                if (typeof opt === 'object' && opt !== null && (typeof opt.text === 'string' || typeof opt.value === 'string')) {
                    return (opt.text || opt.value).trim();
                }
                return ''; // Not a valid option format
            })
            .filter(opt => opt); // Remove empty options

        let correctAnswerText: string;
        
        // Handle cases where the AI returns the index of the correct answer instead of the string.
        if (typeof itemCorrectAnswer === 'number') {
            if (itemCorrectAnswer >= 0 && itemCorrectAnswer < options.length) {
                correctAnswerText = options[itemCorrectAnswer];
            } else {
                console.error(`Correct answer index ${itemCorrectAnswer} is out of bounds for options at index ${index}:`, { options, item });
                throw new Error(`Invalid data for question ${index + 1}: Correct answer index is out of range.`);
            }
        } else {
            correctAnswerText = itemCorrectAnswer.trim();
        }

        // Check for content validity after trimming
        if (
            !questionText ||
            options.length !== 4 || // Check for exactly 4 non-empty options
            !correctAnswerText
        ) {
            console.error(`Invalid question content (empty fields or wrong option count) at index ${index}:`, {
                question: questionText,
                options,
                correctAnswer: correctAnswerText
            });
            throw new Error(`Invalid data format for question ${index + 1}. Fields must not be empty and there must be exactly 4 options.`);
        }

        // Find the correct answer in the options, allowing for minor inconsistencies like casing.
        let foundCorrectAnswerInOptions = options.find(opt => opt === correctAnswerText);
        
        if (!foundCorrectAnswerInOptions) {
            // If an exact match isn't found, try a case-insensitive match.
            const lowerCaseCorrectAnswer = correctAnswerText.toLowerCase();
            foundCorrectAnswerInOptions = options.find(opt => opt.toLowerCase() === lowerCaseCorrectAnswer);
        }

        if (!foundCorrectAnswerInOptions) {
            console.error(`Correct answer "${correctAnswerText}" not found in options [${options.join(", ")}] for question ${index + 1}:`, item);
            throw new Error(`Invalid data format for question ${index + 1}. The provided correct answer does not match any of the options.`);
        }

        return {
            id: crypto.randomUUID(),
            question: questionText,
            options: options,
            // Use the version from the options array to ensure casing is consistent.
            correctAnswer: foundCorrectAnswerInOptions,
        };
    });


    if (validatedQuestions.length === 0) {
        throw new Error("The generated quiz has no questions. Please try a different topic or refine your request.");
    }
    if (validatedQuestions.length < 3) { 
        console.warn(`Generated quiz has only ${validatedQuestions.length} questions.`);
    }

    return { questions: validatedQuestions, sources };

  } catch (error) {
    console.error("Error generating quiz from Gemini API:", error);
    if (error instanceof SyntaxError) { 
      console.error("Failed to parse JSON response. The problematic string that was attempted to be parsed was:\n---\n" + jsonStringToParse + "\n---");
      throw new Error("The AI returned quiz data in a format that could not be understood.");
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