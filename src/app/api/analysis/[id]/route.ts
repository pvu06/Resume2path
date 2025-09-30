import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const analysisId = params.id;
    console.log('📊 Fetching analysis for ID:', analysisId);

    // For now, return mock analysis data
    // In a real app, this would fetch from the database
    const mockAnalysis = {
      id: parseInt(analysisId),
      result: {
        role: 'Software Engineer',
        skills: {
          hard: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL'],
          soft: ['Team Leadership', 'Problem Solving', 'Communication', 'Project Management']
        },
        gaps: [
          'Machine Learning experience',
          'Cloud architecture (AWS/Azure)',
          'DevOps practices',
          'System design knowledge'
        ],
        suggestions: [
          {
            section: 'Technical Skills',
            change: 'Add a "Technical Skills" section highlighting your programming languages and frameworks',
            reason: 'This makes it easier for recruiters to quickly identify your technical capabilities'
          },
          {
            section: 'Experience Descriptions',
            change: 'Use more action verbs and quantify your achievements with specific numbers',
            reason: 'Quantified achievements are 40% more likely to get interviews'
          },
          {
            section: 'Projects',
            change: 'Add 2-3 key projects that demonstrate your skills for the target role',
            reason: 'Projects show practical application of your skills and problem-solving ability'
          }
        ],
        summary: 'Your resume shows strong technical skills in web development with JavaScript and React. To better align with Software Engineer roles, consider highlighting cloud technologies, system design experience, and quantified achievements. The resume structure is good but could benefit from more specific project examples.',
        fit: {
          score: 7,
          rationale: 'Good technical foundation but missing some key skills for senior roles'
        },
        tracks: [
          {
            id: 'mentorship-basic',
            title: '1-1 CV + Mock Interview Session',
            ctaUrl: 'https://calendly.com/your-mentor/intro'
          }
        ],
        parse: {
          parser: 'pdf',
          pages: 1,
          textLength: 1250,
          file: {
            name: 'resume.pdf',
            mime: 'application/pdf',
            ext: 'pdf'
          }
        }
      },
      createdAt: new Date().toISOString(),
      resume: {
        fileUrl: 'local://resume.pdf',
        fileType: 'application/pdf'
      },
      mentee: {
        email: 'user@example.com',
        name: 'John Doe',
        targetRole: 'Software Engineer'
      }
    };

    return NextResponse.json({
      result: mockAnalysis
    });

  } catch (error) {
    console.error('❌ Analysis fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}