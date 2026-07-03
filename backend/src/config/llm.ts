import axios from 'axios';
import { config } from './env';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

interface LLMResponse {
  urgencyLevel?: string;
  chiefComplaint?: string;
  suggestedQuestions?: string[];
  summary?: string;
  error?: string;
}

/**
 * Generate pre-visit symptom summary for doctor
 */
export const generatePreVisitSummary = async (symptoms: string): Promise<LLMResponse> => {
  try {
    if (!config.OPENAI_API_KEY) {
      console.warn('⚠️  OpenAI API key not configured.');
      return {
        error: 'LLM service not configured',
        urgencyLevel: 'Medium',
        chiefComplaint: symptoms,
        suggestedQuestions: [],
      };
    }

    const prompt = `Analyse these patient symptoms and provide:
1. Urgency level (Low/Medium/High)
2. Chief complaint (brief summary)
3. Three suggested questions for the doctor

Symptoms: ${symptoms}

Respond in JSON format: { "urgencyLevel": "...", "chiefComplaint": "...", "suggestedQuestions": [...] }`;

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: config.LLM_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${config.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const content = response.data.choices[0].message.content;
    const parsed = JSON.parse(content);

    console.log('✅ Pre-visit summary generated');
    return parsed;
  } catch (error) {
    console.error('❌ Error generating pre-visit summary:', error);
    return {
      error: 'Failed to generate summary',
      urgencyLevel: 'Medium',
      chiefComplaint: symptoms,
      suggestedQuestions: [],
    };
  }
};

/**
 * Generate patient-friendly post-visit summary
 */
export const generatePostVisitSummary = async (clinicalNotes: string, prescription: string): Promise<LLMResponse> => {
  try {
    if (!config.OPENAI_API_KEY) {
      console.warn('⚠️  OpenAI API key not configured.');
      return {
        error: 'LLM service not configured',
        summary: clinicalNotes,
      };
    }

    const prompt = `Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps:

Clinical Notes: ${clinicalNotes}
Prescription: ${prescription}

Provide a clear, easy-to-understand summary that a patient can follow.`;

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: config.LLM_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${config.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const summary = response.data.choices[0].message.content;

    console.log('✅ Post-visit summary generated');
    return { summary };
  } catch (error) {
    console.error('❌ Error generating post-visit summary:', error);
    return {
      error: 'Failed to generate summary',
      summary: clinicalNotes,
    };
  }
};

export default { generatePreVisitSummary, generatePostVisitSummary };