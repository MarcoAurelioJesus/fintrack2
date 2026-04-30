import { spawn } from 'node:child_process';
import path from 'node:path';
import { Pool } from 'pg';

let h2Process;
let pool;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function initDb() {
  if (pool) return;

  const h2Jar = path.resolve('lib', 'h2-2.2.224.jar');
  const baseDir = path.resolve('data');
  h2Process = spawn(
    'java',
    [
      '-cp',
      h2Jar,
      'org.h2.tools.Server',
      '-pg',
      '-pgPort',
      '5436',
      '-ifNotExists',
      '-baseDir',
      baseDir,
    ],
    { stdio: 'pipe' }
  );
  h2Process.on('error', (err) => {
    console.error('Failed to spawn H2 server process', err);
  });

  pool = new Pool({
    host: '127.0.0.1',
    port: 5436,
    user: 'sa',
    password: '',
    database: 'fintrack',
    max: 5,
  });

  // Wait H2 server accept connections.
  let lastError;
  for (let attempt = 0; attempt < 15; attempt++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      return;
    } catch (err) {
      lastError = err;
      await sleep(600);
    }
  }
  throw lastError;
}

export async function query(sql) {
  await initDb();
  const result = await pool.query(sql);
  return result.rows;
}

export async function execute(sql) {
  await initDb();
  const result = await pool.query(sql);
  return result.rowCount || 0;
}
