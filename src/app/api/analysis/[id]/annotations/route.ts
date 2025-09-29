import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { analyses } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { annotations } = await req.json();
    const analysisId = parseInt(params.id);

    if (isNaN(analysisId)) {
      return NextResponse.json({ error: 'Invalid analysis ID' }, { status: 400 });
    }

    // Get current analysis
    const analysisRows = await db
      .select()
      .from(analyses)
      .where(eq(analyses.id, analysisId))
      .limit(1);

    if (analysisRows.length === 0) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    const currentResult = analysisRows[0].result || {};
    const updatedResult = {
      ...currentResult,
      annotations: annotations
    };

    // Update analysis with annotations
    await db
      .update(analyses)
      .set({ result: updatedResult })
      .where(eq(analyses.id, analysisId));

    return NextResponse.json({ 
      success: true, 
      annotations: annotations 
    });

  } catch (error) {
    console.error('Error saving annotations:', error);
    return NextResponse.json(
      { error: 'Failed to save annotations' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const analysisId = parseInt(params.id);

    if (isNaN(analysisId)) {
      return NextResponse.json({ error: 'Invalid analysis ID' }, { status: 400 });
    }

    // Get analysis with annotations
    const analysisRows = await db
      .select()
      .from(analyses)
      .where(eq(analyses.id, analysisId))
      .limit(1);

    if (analysisRows.length === 0) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    const annotations = analysisRows[0].result?.annotations || [];

    return NextResponse.json({ annotations });

  } catch (error) {
    console.error('Error fetching annotations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch annotations' },
      { status: 500 }
    );
  }
}
