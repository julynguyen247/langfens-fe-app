import { NextRequest, NextResponse } from 'next/server';

interface GrammarError {
  error_text: string;
  context: string;
  correct_form: string;
  language?: string;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const errors: GrammarError[] = body.errors || [];

  if (errors.length === 0) {
    return NextResponse.json({ results: [], failed_count: 0, total_count: 0 });
  }

  const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:5000';
  const backendUrl = `${gatewayUrl}/api-ai/v1/grammar/batch-explain`;

  try {
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ errors, max_concurrent: 3 }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Grammar explanation failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error calling grammar batch-explain:', error);
    return NextResponse.json(
      { error: 'Service unavailable' },
      { status: 503 }
    );
  }
}
