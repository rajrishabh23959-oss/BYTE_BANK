
import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { registerSSEClient, unregisterSSEClient } from '@/lib/sse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSession();
  const clientId = `sse-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const stream = new ReadableStream({
    start(controller) {
      registerSSEClient(
        clientId,
        controller,
        session?.customerId || null,
        session?.role || undefined
      );

      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`event: CONNECTED\ndata: ${JSON.stringify({ clientId, timestamp: new Date().toISOString() })}\n\n`));

      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(interval);
          unregisterSSEClient(clientId);
        }
      }, 15000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        unregisterSSEClient(clientId);
      });
    },
    cancel() {
      unregisterSSEClient(clientId);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
