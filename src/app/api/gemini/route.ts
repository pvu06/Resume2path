import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      console.error('Missing GEMINI_API_KEY');
      return NextResponse.json({ error: 'Server not configured for Gemini. Set GEMINI_API_KEY.' }, { status: 500 });
    }
  const { text, targetRole, isChat, jobDescription } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text content is required' }, { status: 400 });
    }

    let prompt: string;
    
  if (isChat) {
      // Chat mode - general career advice
      prompt = `You are an AI career assistant. Provide helpful, friendly advice about resumes, career development, job search strategies, and professional growth. 

User question: ${text}

Please provide a helpful response that is:
- Professional but friendly
- Actionable and specific
- Under 200 words
- Focused on career development

If the user asks about resume analysis, provide general tips and guidance.`;
    } else {
      // Resume analysis mode (strict JSON schema)
  const role = targetRole || 'professional';
      const schema = `{
  "skills": [{"name": string, "rating": number(1-10), "evidence": string}],
  "experience": [string],
  "summary": string,
  "gaps": [{"skill": string, "whyImportant": string, "howToLearn": string, "priority": number(1-3)}],
  "suggestions": [{"title": string, "description": string, "impact": number(1-3), "effort": number(1-3)}],
  "fit": {"score": number(1-10), "rationale": string},
  "tracks": [{"id": string, "title": string, "ctaUrl": string}]
}`;
  const jd = jobDescription ? `\nTarget job description to tailor analysis:\n${jobDescription}\n` : '';
  // few-shot style: demonstrate the format (concise) as an exemplar
  const exemplar = '{"skills":[{"name":"Python","rating":8,"evidence":"Built data pipelines"}],"experience":["2y data analytics"],"summary":"Strong analytics foundation." ,"gaps":[{"skill":"A/B testing","whyImportant":"Product roles require experimentation","howToLearn":"Run small experiments; read online course","priority":2}],"suggestions":[{"title":"Quantify impact","description":"Add metrics to bullet points","impact":3,"effort":1}],"fit":{"score":7,"rationale":"Relevant skills but missing experimentation"},"tracks":[{"id":"mentorship-basic","title":"1-1 CV + Mock Interview","ctaUrl":"https://calendly.com/your-mentor/intro"}] }';
  prompt = `You are an expert resume reviewer and career coach.
Analyze the following resume for the role of "${role}" and respond ONLY with minified JSON matching this schema:
${schema}

Guidelines:
- Be specific and tie skills/evidence to resume content when possible.
- Keep strings concise. Avoid markdown. Do not include any text outside JSON.
- Provide 2-4 items for gaps and suggestions. Provide 2-3 tracks.

Resume content:
${text}
${jd}

Use this exemplar for format ONLY (do not copy content):
${exemplar}`;
    }

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      return NextResponse.json({ error: 'Failed to analyze with Gemini AI' }, { status: 500 });
    }

    const data = await response.json();
    
    // Extract the text content from Gemini response
    const geminiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!geminiText) {
      return NextResponse.json({ error: 'Invalid response from Gemini AI' }, { status: 500 });
    }

  // Handle response based on mode
    let analysisResult;
    
    if (isChat) {
      // Chat mode - return text response directly
      analysisResult = {
        description: geminiText,
        type: 'chat'
      };
    } else {
      // Resume analysis mode - try to parse JSON
      try {
        // Look for JSON content in the response
        const jsonMatch = geminiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisResult = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback: create structured response from text
          analysisResult = {
            skills: [],
            experience: [],
            summary: "",
            gaps: [],
            suggestions: [],
            fit: { score: 7, rationale: "" },
            tracks: [
              { id: "career-dev", title: "Career Development Path", ctaUrl: "https://calendly.com/your-mentor" }
            ]
          };
        }
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', parseError);
        // Fallback response
        analysisResult = {
          skills: [],
          experience: [],
          summary: "",
          gaps: [],
          suggestions: [],
          fit: { score: 7, rationale: "" },
          tracks: [
            { id: "career-dev", title: "Career Development Path", ctaUrl: "https://calendly.com/your-mentor" }
          ]
        };
      }
    }

    return NextResponse.json({
      success: true,
      result: analysisResult,
      rawGeminiResponse: geminiText
    });

  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
