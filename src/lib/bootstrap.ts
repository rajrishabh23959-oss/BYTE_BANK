import { pool } from './db';
import { MIGRATIONS, MASTER_SEED_SQL } from './db-schema-bundle';

let bootstrapPromise: Promise<{ success: boolean; message: string; customerCount?: number }> | null = null;
let isBootstrapped = false;

export async function ensureDatabaseBootstrapped(force = false): Promise<{ success: boolean; message: string; customerCount?: number }> {
  if (isBootstrapped && !force) {
    return { success: true, message: 'Database already verified.' };
  }

  if (bootstrapPromise && !force) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    const client = await pool.connect();
    try {
      if (!force) {
        const checkRes = await client.query(`
          SELECT 
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_user') AS has_app_user,
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer') AS has_customer
        `);
        const { has_app_user, has_customer } = checkRes.rows[0] || {};

        if (has_app_user && has_customer) {
          const custRes = await client.query(`SELECT count(*)::int AS count FROM customer;`);
          const count = custRes.rows[0]?.count ?? 0;
          if (count > 0) {
            isBootstrapped = true;
            return {
              success: true,
              message: 'Database schema and seed already active.',
              customerCount: count,
            };
          }
        }
      }

      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version TEXT PRIMARY KEY,
          applied_at TIMESTAMPTZ DEFAULT now()
        );
      `);

      const { rows } = await client.query(`SELECT version FROM schema_migrations;`);
      const applied = new Set(rows.map((r: { version: string }) => r.version));

      for (const m of MIGRATIONS) {
        if (!applied.has(m.name) || force) {
          await client.query(m.sql);
          await client.query(
            `INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING;`,
            [m.name]
          );
        }
      }

      let count = 0;
      try {
        const custRes = await client.query(`SELECT count(*)::int AS count FROM customer;`);
        count = custRes.rows[0]?.count ?? 0;
      } catch {
        count = 0;
      }

      if (count === 0 || force) {
        await client.query(MASTER_SEED_SQL);
        const finalCustRes = await client.query(`SELECT count(*)::int AS count FROM customer;`);
        count = finalCustRes.rows[0]?.count ?? 0;
      }

      isBootstrapped = true;
      return {
        success: true,
        message: 'Database schema migrated and master seed dataset loaded successfully.',
        customerCount: count,
      };
    } catch (err: any) {
      console.error('[ByteBank Bootstrap Error]', err);
      return {
        success: false,
        message: err.message || 'Database bootstrap failed',
      };
    } finally {
      client.release();
    }
  })();

  try {
    const res = await bootstrapPromise;
    return res;
  } finally {
    if (!isBootstrapped) {
      bootstrapPromise = null;
    }
  }
}

