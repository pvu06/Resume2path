import { NextResponse } from 'next/server';

// Helper functions to get role-specific skills and gaps
function getSkillsForRole(role: string) {
  const roleSkills: Record<string, string[]> = {
    'Backend Developer': ['Java', 'Python', 'Node.js', 'SQL', 'REST APIs', 'Microservices'],
    'Frontend Developer': ['JavaScript', 'React', 'Vue.js', 'HTML/CSS', 'TypeScript', 'Webpack'],
    'Data Scientist': ['Python', 'R', 'SQL', 'Machine Learning', 'Statistics', 'Pandas'],
    'Data Analyst': ['SQL', 'Excel', 'Python', 'Tableau', 'Power BI', 'Statistics'],
    'Product Manager': ['Agile', 'Scrum', 'User Research', 'Analytics', 'Roadmapping', 'Stakeholder Management'],
    'Consulting': ['Strategy', 'Problem Solving', 'Client Management', 'Presentation', 'Analytics', 'Business Acumen']
  };
  
  return {
    hard: roleSkills[role] || ['JavaScript', 'Python', 'SQL', 'Problem Solving', 'Communication']
  };
}

function getGapsForRole(role: string) {
  const roleGaps: Record<string, string[]> = {
    'Backend Developer': ['Cloud platforms (AWS/Azure)', 'Containerization (Docker)', 'CI/CD pipelines', 'System design'],
    'Frontend Developer': ['Testing frameworks (Jest/Cypress)', 'Performance optimization', 'Accessibility', 'Mobile development'],
    'Data Scientist': ['Deep Learning', 'Big Data tools (Spark)', 'Cloud ML platforms', 'Advanced statistics'],
    'Data Analyst': ['Advanced SQL', 'Machine Learning basics', 'Data visualization tools', 'Business intelligence'],
    'Product Manager': ['Technical background', 'User experience design', 'Data analysis', 'Market research'],
    'Consulting': ['Industry expertise', 'Quantitative analysis', 'Client presentation', 'Project management']
  };
  
  return roleGaps[role] || ['Industry-specific knowledge', 'Advanced technical skills', 'Leadership experience'];
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const analysisId = params.id;
    const url = new URL(req.url);
    const targetRole = url.searchParams.get('role') || 'General';
    
    console.log('📊 Fetching analysis for ID:', analysisId, 'Target role:', targetRole);

    // For now, return mock analysis data
    // In a real app, this would fetch from the database
    const mockAnalysis = {
      id: parseInt(analysisId),
      result: {
        role: targetRole,
        skills: {
          hard: getSkillsForRole(targetRole).hard,
          soft: ['Team Leadership', 'Problem Solving', 'Communication', 'Project Management']
        },
        gaps: getGapsForRole(targetRole),
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
        targetRole: targetRole
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