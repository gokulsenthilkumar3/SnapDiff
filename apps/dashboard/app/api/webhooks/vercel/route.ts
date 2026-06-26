import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// POST /api/webhooks/vercel
// This Next.js route receives Vercel deployment webhooks and forwards the job
// to the standalone worker via an internal HTTP call.
export async function POST(request: NextRequest): Promise<NextResponse> {
  const rawBody = await request.text();

  // ── Signature verification ──────────────────────────────────────
  const secret = process.env.VERCEL_WEBHOOK_SECRET;
  if (secret) {
    const signature = request.headers.get('x-vercel-signature');
    if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 401 });

    const expected = crypto.createHmac('sha1', secret).update(rawBody).digest('hex');
    if (signature !== expected) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  const body = JSON.parse(rawBody);

  if (body.type !== 'deployment.succeeded') {
    return NextResponse.json({ skipped: true });
  }

  // Forward to the worker service
  const workerUrl = process.env.WORKER_INTERNAL_URL ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${workerUrl}/webhook/vercel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: rawBody,
    });
    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch (err) {
    console.error('[webhook] Failed to forward to worker:', err);
    return NextResponse.json({ error: 'Worker unavailable' }, { status: 502 });
  }
}
