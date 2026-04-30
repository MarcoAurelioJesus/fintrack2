import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { execute, query } from './db.js';
import { ensureSchema } from './schema.js';
import {
  getEffectiveTransactionDate,
  isTransactionEffective,
} from './utils/transaction-rules.js';

const PORT = Number(process.env.PORT || 3000);

const dataDir = path.resolve('data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

function ok(data) {
  return { success: true, data };
}

function fail(message, status = 500) {
  return { success: false, message, status };
}

function sqlString(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replaceAll("'", "''")}'`;
}

function mapCategory(row) {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    isFavorite: row.is_favorite === true || String(row.is_favorite).toLowerCase() === 'true',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTransaction(row) {
  return {
    id: row.id,
    description: row.description,
    value: Number(row.amount),
    type: row.type,
    categoryId: row.category_id,
    category: row.category_id
      ? {
          id: row.category_id,
          name: row.category_name,
          color: row.category_color,
          createdAt: row.category_created_at,
          updatedAt: row.category_updated_at,
        }
      : undefined,
    date: row.date,
    scheduledDate: row.scheduled_date,
    isScheduled: row.is_scheduled === true || String(row.is_scheduled).toLowerCase() === 'true',
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

  app.get('/api/categories', async (_req, res) => {
  try {
    const rows = await query('SELECT * FROM categories ORDER BY name ASC');
    res.json(ok(rows.map(mapCategory)));
  } catch (err) {
    const e = fail('Erro ao listar categorias');
    res.status(e.status).json(e);
  }
  });

  app.post('/api/categories', async (req, res) => {
  try {
    const now = new Date().toISOString();
    const category = {
      id: uuidv4(),
      name: req.body.name,
      color: req.body.color,
      isFavorite: Boolean(req.body.isFavorite),
      createdAt: now,
      updatedAt: now,
    };

    await execute(`
      INSERT INTO categories (id, name, color, is_favorite, created_at, updated_at)
      VALUES (
        ${sqlString(category.id)},
        ${sqlString(category.name)},
        ${sqlString(category.color)},
        ${category.isFavorite ? 'TRUE' : 'FALSE'},
        ${sqlString(category.createdAt)},
        ${sqlString(category.updatedAt)}
      )
    `);

    res.json(ok(category));
  } catch (err) {
    const e = fail('Erro ao criar categoria');
    res.status(e.status).json(e);
  }
  });

  app.put('/api/categories/:id', async (req, res) => {
  try {
    const now = new Date().toISOString();
    await execute(`
      UPDATE categories SET
        name = ${sqlString(req.body.name)},
        color = ${sqlString(req.body.color)},
        is_favorite = ${req.body.isFavorite ? 'TRUE' : 'FALSE'},
        updated_at = ${sqlString(now)}
      WHERE id = ${sqlString(req.params.id)}
    `);

    const rows = await query(`SELECT * FROM categories WHERE id = ${sqlString(req.params.id)}`);
    res.json(ok(mapCategory(rows[0])));
  } catch (err) {
    const e = fail('Erro ao atualizar categoria');
    res.status(e.status).json(e);
  }
  });

  app.delete('/api/categories/:id', async (req, res) => {
  try {
    await execute(`DELETE FROM categories WHERE id = ${sqlString(req.params.id)}`);
    res.json(ok(null));
  } catch (err) {
    const e = fail('Erro ao remover categoria');
    res.status(e.status).json(e);
  }
  });

  app.get('/api/transactions', async (req, res) => {
  try {
    const filters = [];
    if (req.query.categoryId) filters.push(`t.category_id = ${sqlString(req.query.categoryId)}`);
    if (req.query.type) filters.push(`t.type = ${sqlString(req.query.type)}`);
    if (req.query.isScheduled) {
      const isScheduled = req.query.isScheduled === 'true';
      filters.push(`t.is_scheduled = ${isScheduled ? 'TRUE' : 'FALSE'}`);
    }
    if (req.query.startDate) filters.push(`t.date >= ${sqlString(req.query.startDate)}`);
    if (req.query.endDate) filters.push(`t.date <= ${sqlString(req.query.endDate)}`);

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const rows = await query(`
      SELECT
        t.id, t.description, t.amount, t.type, t.category_id, t.date, t.scheduled_date, t.is_scheduled, t.notes, t.created_at, t.updated_at,
        c.name AS category_name,
        c.color AS category_color,
        c.created_at AS category_created_at,
        c.updated_at AS category_updated_at
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      ${whereClause}
      ORDER BY t.date DESC
    `);
    res.json(ok(rows.map(mapTransaction)));
  } catch (err) {
    const e = fail('Erro ao listar transações');
    res.status(e.status).json(e);
  }
  });

  app.get('/api/transactions/:id', async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        t.id, t.description, t.amount, t.type, t.category_id, t.date, t.scheduled_date, t.is_scheduled, t.notes, t.created_at, t.updated_at,
        c.name AS category_name,
        c.color AS category_color,
        c.created_at AS category_created_at,
        c.updated_at AS category_updated_at
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      WHERE t.id = ${sqlString(req.params.id)}
    `);
    if (!rows.length) {
      res.status(404).json(fail('Transação não encontrada', 404));
      return;
    }
    res.json(ok(mapTransaction(rows[0])));
  } catch (err) {
    const e = fail('Erro ao buscar transação');
    res.status(e.status).json(e);
  }
  });

  app.post('/api/transactions', async (req, res) => {
  try {
    const now = new Date().toISOString();
    const transaction = {
      id: uuidv4(),
      description: req.body.description,
      value: Number(req.body.value),
      type: req.body.type,
      categoryId: req.body.categoryId,
      date: req.body.date || now,
      scheduledDate: req.body.scheduledDate || null,
      isScheduled: Boolean(req.body.isScheduled),
      notes: req.body.notes || null,
      createdAt: now,
      updatedAt: now,
    };

    await execute(`
      INSERT INTO transactions (
        id, description, amount, type, category_id, date, scheduled_date, is_scheduled, notes, created_at, updated_at
      ) VALUES (
        ${sqlString(transaction.id)},
        ${sqlString(transaction.description)},
        ${transaction.value},
        ${sqlString(transaction.type)},
        ${sqlString(transaction.categoryId)},
        ${sqlString(transaction.date)},
        ${sqlString(transaction.scheduledDate)},
        ${transaction.isScheduled ? 'TRUE' : 'FALSE'},
        ${sqlString(transaction.notes)},
        ${sqlString(transaction.createdAt)},
        ${sqlString(transaction.updatedAt)}
      )
    `);

    const createdRows = await query(`
      SELECT
        t.id, t.description, t.amount, t.type, t.category_id, t.date, t.scheduled_date, t.is_scheduled, t.notes, t.created_at, t.updated_at,
        c.name AS category_name,
        c.color AS category_color,
        c.created_at AS category_created_at,
        c.updated_at AS category_updated_at
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      WHERE t.id = ${sqlString(transaction.id)}
    `);
    res.json(ok(mapTransaction(createdRows[0])));
  } catch (err) {
    const e = fail('Erro ao criar transação');
    res.status(e.status).json(e);
  }
  });

  app.put('/api/transactions/:id', async (req, res) => {
  try {
      const currentRows = await query(`SELECT id, description, amount, type, category_id, date, scheduled_date, is_scheduled, notes, created_at, updated_at FROM transactions WHERE id = ${sqlString(req.params.id)}`);
    if (!currentRows.length) {
      res.status(404).json(fail('Transação não encontrada', 404));
      return;
    }
    const current = currentRows[0];
    const now = new Date().toISOString();

    await execute(`
      UPDATE transactions SET
        description = ${sqlString(req.body.description ?? current.description)},
        amount = ${Number(req.body.value ?? current.amount)},
        type = ${sqlString(req.body.type ?? current.type)},
        category_id = ${sqlString(req.body.categoryId ?? current.category_id)},
        date = ${sqlString(req.body.date ?? current.date)},
        scheduled_date = ${sqlString(req.body.scheduledDate ?? current.scheduled_date)},
        is_scheduled = ${(req.body.isScheduled ?? current.is_scheduled) ? 'TRUE' : 'FALSE'},
        notes = ${sqlString(req.body.notes ?? current.notes)},
        updated_at = ${sqlString(now)}
      WHERE id = ${sqlString(req.params.id)}
    `);

    const updatedRows = await query(`
      SELECT
        t.id, t.description, t.amount, t.type, t.category_id, t.date, t.scheduled_date, t.is_scheduled, t.notes, t.created_at, t.updated_at,
        c.name AS category_name,
        c.color AS category_color,
        c.created_at AS category_created_at,
        c.updated_at AS category_updated_at
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      WHERE t.id = ${sqlString(req.params.id)}
    `);
    res.json(ok(mapTransaction(updatedRows[0])));
  } catch (err) {
    const e = fail('Erro ao atualizar transação');
    res.status(e.status).json(e);
  }
  });

  app.delete('/api/transactions/:id', async (req, res) => {
  try {
    await execute(`DELETE FROM transactions WHERE id = ${sqlString(req.params.id)}`);
    res.json(ok(null));
  } catch (err) {
    const e = fail('Erro ao remover transação');
    res.status(e.status).json(e);
  }
  });

  app.get('/api/dashboard', async (_req, res) => {
  try {
    const rows = await query(
      'SELECT type, amount, date, category_id, is_scheduled, scheduled_date FROM transactions'
    );
    const categories = await query('SELECT id, name, color FROM categories');
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const nowDate = new Date();

    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const monthRows = rows.filter((r) => {
      if (!isTransactionEffective(r, nowDate)) return false;
      const d = getEffectiveTransactionDate(r);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    let currentBalance = 0;
    let monthlyIncome = 0;
    let monthlyExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    const byCategoryMap = new Map();
    for (const item of monthRows) {
      const amount = Number(item.amount);
      if (item.type === 'entrada') {
        monthlyIncome += amount;
        incomeCount += 1;
      } else {
        monthlyExpense += amount;
        expenseCount += 1;
      }
      const existing = byCategoryMap.get(item.category_id) || { total: 0, count: 0 };
      existing.total += amount;
      existing.count += 1;
      byCategoryMap.set(item.category_id, existing);
    }

    for (const row of rows) {
      if (!isTransactionEffective(row, nowDate)) continue;
      const amount = Number(row.amount);
      currentBalance += row.type === 'entrada' ? amount : -amount;
    }

    const totalCategory = Array.from(byCategoryMap.values()).reduce((sum, v) => sum + v.total, 0) || 1;
    const byCategory = Array.from(byCategoryMap.entries()).map(([categoryId, item]) => {
      const category = categoryMap.get(categoryId);
      return {
        categoryId,
        categoryName: category?.name || 'Sem categoria',
        categoryColor: category?.color || '#999999',
        total: item.total,
        count: item.count,
        percentage: (item.total / totalCategory) * 100,
      };
    });

    const monthlyEvolution = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const keyMonth = d.getMonth();
      const keyYear = d.getFullYear();
      const monthlyItems = rows.filter((r) => {
        if (!isTransactionEffective(r, nowDate)) return false;
        const date = getEffectiveTransactionDate(r);
        return date.getMonth() === keyMonth && date.getFullYear() === keyYear;
      });
      const income = monthlyItems
        .filter((r) => r.type === 'entrada')
        .reduce((sum, r) => sum + Number(r.amount), 0);
      const expense = monthlyItems
        .filter((r) => r.type === 'saída')
        .reduce((sum, r) => sum + Number(r.amount), 0);
      monthlyEvolution.push({
        label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        income,
        expense,
        balance: income - expense,
      });
    }

    res.json(
      ok({
        currentBalance,
        monthlyIncome,
        monthlyExpense,
        incomeCount,
        expenseCount,
        byCategory,
        monthlyEvolution,
      })
    );
  } catch (err) {
    const e = fail('Erro ao carregar dashboard');
    res.status(e.status).json(e);
  }
  });

  // Endpoints de desenvolvimento para seed e clear
  app.post('/api/dev/clear', async (req, res) => {
    try {
      await execute('DELETE FROM transactions');
      await execute('DELETE FROM categories');
      res.json(ok({ message: 'Banco de dados limpo com sucesso' }));
    } catch (err) {
      const e = fail('Erro ao limpar banco de dados');
      res.status(e.status).json(e);
    }
  });

  app.post('/api/dev/seed', async (req, res) => {
    try {
      // Importa dinamicamente o script de seed
      const seedModule = await import('../scripts/seed-demo-data.js');
      await seedModule.default();
      res.json(ok({ message: 'Banco de dados populado com sucesso' }));
    } catch (err) {
      const e = fail('Erro ao popular banco de dados', 500);
      res.status(e.status).json(e);
    }
  });

  return app;
}

export const app = createApp();

export async function start() {
  await ensureSchema();
  app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
  });
}

const isMainModule = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isMainModule) {
  start().catch((err) => {
    console.error('Failed to start backend', err);
    process.exit(1);
  });
}
