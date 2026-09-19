import { Pool } from 'pg';
import 'dotenv/config';

export const pool = new Pool({
  host:     process.env.PG_HOST     || 'localhost',
  port:     Number(process.env.PG_PORT) || 5432,
  database: process.env.PG_DB       || 'pos_db',
  user:     process.env.PG_USER     || 'pos_user',
  password: process.env.PG_PASSWORD || 'pos_pass',
});
