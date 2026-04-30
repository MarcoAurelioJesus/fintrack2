import { execute, query } from './db.js';
import { v4 as uuidv4 } from 'uuid';

const nowIso = new Date().toISOString();

function sqlString(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replaceAll("'", "''")}'`;
}

export async function ensureSchema() {
  await execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      color VARCHAR(20) NOT NULL,
      is_favorite BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
    )
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id VARCHAR(64) PRIMARY KEY,
      description VARCHAR(255) NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      type VARCHAR(20) NOT NULL,
      category_id VARCHAR(64) NOT NULL,
      date TIMESTAMP NOT NULL,
      scheduled_date TIMESTAMP NULL,
      is_scheduled BOOLEAN DEFAULT FALSE,
      notes VARCHAR(1000) NULL,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL,
      CONSTRAINT fk_category FOREIGN KEY(category_id) REFERENCES categories(id)
    )
  `);

  const categories = await query('SELECT COUNT(*) AS count FROM categories');
  const count = Number(categories[0]?.count || 0);
  if (count > 0) return;

  const seedCategories = [
    { id: uuidv4(), name: 'Salário', color: '#22c55e', isFavorite: true },
    { id: uuidv4(), name: 'Alimentação', color: '#f97316', isFavorite: true },
    { id: uuidv4(), name: 'Transporte', color: '#3b82f6', isFavorite: false },
    { id: uuidv4(), name: 'Lazer', color: '#8b5cf6', isFavorite: false },
  ];

  for (const category of seedCategories) {
    await execute(`
      INSERT INTO categories (id, name, color, is_favorite, created_at, updated_at)
      VALUES (
        ${sqlString(category.id)},
        ${sqlString(category.name)},
        ${sqlString(category.color)},
        ${category.isFavorite ? 'TRUE' : 'FALSE'},
        ${sqlString(nowIso)},
        ${sqlString(nowIso)}
      )
    `);
  }
}
