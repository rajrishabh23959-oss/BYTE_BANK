import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { ensureDatabaseBootstrapped } from './bootstrap';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/bytebank';
const isRemote = !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1');

declare global {
  var __bytebankPool: Pool | undefined;
}

export const pool: Pool = global.__bytebankPool || new Pool({
  connectionString,
  ssl: (isRemote || connectionString.includes('sslmode=require')) ? { rejectUnauthorized: false } : undefined,
  max: 25,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,
});

if (process.env.NODE_ENV !== 'production') {
  global.__bytebankPool = pool;
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  try {
    return await pool.query<T>(text, params);
  } catch (err: any) {
    if (err && (err.code === '42P01' || err.code === '42501' || (err.message && err.message.includes('does not exist')))) {
      await ensureDatabaseBootstrapped();
      return await pool.query<T>(text, params);
    }
    throw err;
  }
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const execute = async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  };

  try {
    return await execute();
  } catch (err: any) {
    if (err && (err.code === '42P01' || err.code === '42501' || (err.message && err.message.includes('does not exist')))) {
      await ensureDatabaseBootstrapped();
      return await execute();
    }
    throw err;
  }
}

export async function withRole<T>(
  role: 'CUSTOMER' | 'ADMIN' | 'AUDITOR',
  actorId: string | number,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const execute = async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (role === 'CUSTOMER') {
        try {
          await client.query(`SET LOCAL ROLE bytebank_customer;`);
        } catch {}
        await client.query(`SELECT set_config('bytebank.current_customer_id', $1, true);`, [String(actorId)]);
        await client.query(`SELECT set_config('bytebank.current_actor', $1, true);`, [`customer:${actorId}`]);
      } else if (role === 'ADMIN') {
        try {
          await client.query(`SET LOCAL ROLE bytebank_admin;`);
        } catch {}
        await client.query(`SELECT set_config('bytebank.current_actor', $1, true);`, [`staff:${actorId}`]);
      } else if (role === 'AUDITOR') {
        try {
          await client.query(`SET LOCAL ROLE bytebank_auditor;`);
        } catch {}
        await client.query(`SELECT set_config('bytebank.current_actor', $1, true);`, [`auditor:${actorId}`]);
      }

      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  };

  try {
    return await execute();
  } catch (err: any) {
    if (err && (err.code === '42P01' || err.code === '42501' || (err.message && err.message.includes('does not exist')))) {
      await ensureDatabaseBootstrapped();
      return await execute();
    }
    throw err;
  }
}

export async function recordAutonomousFailure(
  senderAccount: number | null,
  receiverAccount: number,
  assetId: number,
  quantity: number | string,
  failureReason: string,
  actor: string = 'system'
): Promise<number | null> {
  try {
    const res = await query(
      `INSERT INTO asset_transaction (sender_account, receiver_account, asset_id, quantity, type, status, failure_reason)
       VALUES ($1, $2, $3, $4, 'transfer', 'failed', $5)
       RETURNING transaction_id;`,
      [senderAccount, receiverAccount, assetId, quantity, failureReason]
    );

    const txnId = res.rows[0]?.transaction_id;

    await query(
      `INSERT INTO audit_log (actor, action, resource, new_value)
       VALUES ($1, 'TRANSFER_REJECTED', $2, jsonb_build_object(
         'sender', $3,
         'receiver', $4,
         'asset_id', $5,
         'quantity', $6,
         'failure_reason', $7
       ));`,
      [actor, `transaction:${txnId || 'failed'}`, senderAccount, receiverAccount, assetId, quantity, failureReason]
    );

    return txnId;
  } catch (err) {
    console.error('Failed to write autonomous failure audit trail:', err);
    return null;
  }
}
