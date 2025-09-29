import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface EmailData {
  to: string;
  userName: string;
  analysisResult: any;
  fileName: string;
  targetRole: string;
}

export async function sendAnalysisEmail({
  to,
  userName,
  analysisResult,
  fileName,
  targetRole
}: EmailData) {
  try {
    if (!resend) {
      console.log('📧 Resend API key not configured, skipping email');
      return { success: false, error: 'Email not configured' };
    }

    const { data, error } = await resend.emails.send({
      from: 'Resume2Path <noreply@resume2path.vercel.app>',
      to: [to],
      subject: `🎯 Your ${targetRole} Resume Analysis is Ready!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Resume Analysis Results</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .analysis-section { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
            .score { font-size: 24px; font-weight: bold; color: #667eea; }
            .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎯 Resume Analysis Complete!</h1>
            <p>Hi ${userName}, your ${targetRole} resume analysis is ready</p>
          </div>
          
          <div class="content">
            <h2>📄 Analysis Summary</h2>
            <p><strong>File:</strong> ${fileName}</p>
            <p><strong>Target Role:</strong> ${targetRole}</p>
            
            <div class="analysis-section">
              <h3>📊 Overall Score</h3>
              <div class="score">${analysisResult.overallScore || 'N/A'}/10</div>
            </div>
            
            <div class="analysis-section">
              <h3>✅ Strengths</h3>
              <ul>
                ${(analysisResult.strengths || []).map((strength: string) => `<li>${strength}</li>`).join('')}
              </ul>
            </div>
            
            <div class="analysis-section">
              <h3>🔧 Areas for Improvement</h3>
              <ul>
                ${(analysisResult.improvements || []).map((improvement: string) => `<li>${improvement}</li>`).join('')}
              </ul>
            </div>
            
            <div class="analysis-section">
              <h3>🎯 Key Recommendations</h3>
              <ul>
                ${(analysisResult.recommendations || []).map((rec: string) => `<li>${rec}</li>`).join('')}
              </ul>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://resume2path.vercel.app'}" class="cta-button">
                View Full Analysis & Chat with AI
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p>Powered by Resume2Path AI • Gemini AI Analysis</p>
            <p>This email was sent because you uploaded a resume for analysis.</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Email send error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Email sent successfully:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Email service error:', error);
    return { success: false, error: 'Email service error' };
  }
}

export async function sendWelcomeEmail(to: string, userName: string) {
  try {
    if (!resend) {
      console.log('📧 Resend API key not configured, skipping welcome email');
      return { success: false, error: 'Email not configured' };
    }

    const { data, error } = await resend.emails.send({
      from: 'Resume2Path <noreply@resume2path.vercel.app>',
      to: [to],
      subject: '🎉 Welcome to Resume2Path!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Resume2Path</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Welcome to Resume2Path!</h1>
            <p>Hi ${userName}, let's transform your career together</p>
          </div>
          
          <div class="content">
            <h2>🚀 Get Started</h2>
            <p>Upload your resume and get AI-powered career guidance powered by Google's Gemini AI.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://resume2path.vercel.app'}" class="cta-button">
                Upload Your Resume
              </a>
            </div>
            
            <h3>✨ What you can do:</h3>
            <ul>
              <li>📄 Upload PDF or DOCX resumes</li>
              <li>🤖 Get AI analysis with specific role targeting</li>
              <li>💬 Chat with our AI career assistant</li>
              <li>📊 Track your progress in the dashboard</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>Powered by Resume2Path AI • Gemini AI Analysis</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Welcome email error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Welcome email sent:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Welcome email service error:', error);
    return { success: false, error: 'Email service error' };
  }
}
