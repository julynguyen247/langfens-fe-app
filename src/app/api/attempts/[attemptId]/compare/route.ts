import { NextRequest, NextResponse } from 'next/server';
import type { AiCompareResponse } from '@/types/writing';

interface RouteParams {
  params: Promise<{
    attemptId: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { attemptId } = await params;

  if (!attemptId) {
    return NextResponse.json(
      { error: 'Attempt ID is required' },
      { status: 400 }
    );
  }

  const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:5000';
  const backendUrl = `${gatewayUrl}/api-writing/writing/${attemptId}/comparison`;

  try {
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 404) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    if (response.status === 502 || response.status === 503) {
      return NextResponse.json(
        { error: 'Backend service unavailable' },
        { status: 502 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch comparison data' },
        { status: response.status }
      );
    }

    const data: AiCompareResponse = await response.json();

    // Validate the response structure
    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Invalid response format from backend' },
        { status: 500 }
      );
    }

    // Ensure required fields exist with defaults
    const validatedData: AiCompareResponse = {
      overall_analysis: data.overall_analysis || '',
      vocabulary_feedback: data.vocabulary_feedback || '',
      grammar_feedback: data.grammar_feedback || '',
      task_response_feedback: data.task_response_feedback || '',
      coherence_feedback: data.coherence_feedback || '',
      step_up_band: typeof data.step_up_band === 'number' ? data.step_up_band : 0,
      target_band: typeof data.target_band === 'number' ? data.target_band : 0,
      step_up_analysis: data.step_up_analysis || '',
      target_analysis: data.target_analysis || '',
      key_improvements: Array.isArray(data.key_improvements) ? data.key_improvements : [],
      sentence_comparisons: Array.isArray(data.sentence_comparisons) ? data.sentence_comparisons : [],
      references: Array.isArray(data.references) ? data.references : [],
      no_references_found: typeof data.no_references_found === 'boolean' ? data.no_references_found : false,
    };

    return NextResponse.json(validatedData);
  } catch (error) {
    console.error('Error fetching writing comparison:', error);

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Backend service unavailable' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
