import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('http://localhost:3000/api/docs');
    const spec = await res.json();
    return new NextResponse(JSON.stringify(spec, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="bytebank-openapi-3.1.json"',
      },
    });
  } catch {
    const fallbackSpec = {
      openapi: '3.1.0',
      info: {
        title: 'ByteBank Digital Asset Management API',
        version: '1.0.0',
        description: 'PostgreSQL-backed digital asset and transaction management system.',
      },
    };
    return new NextResponse(JSON.stringify(fallbackSpec, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="bytebank-openapi-3.1.json"',
      },
    });
  }
}

