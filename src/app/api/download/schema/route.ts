import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const migrationsDir = path.join(process.cwd(), 'db', 'migrations');
    const files = fs.readdirSync(migrationsDir).sort();
    let combinedSql = `-- ByteBank PostgreSQL 16 Complete Architecture Schema\n-- Exported for Review and Verification\n\n`;

    for (const file of files) {
      if (file.endsWith('.sql')) {
        const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        combinedSql += `\n-- ===========================================\n-- FILE: ${file}\n-- ===========================================\n\n${content}\n`;
      }
    }

    return new NextResponse(combinedSql, {
      status: 200,
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': 'attachment; filename="bytebank-complete-schema.sql"',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

