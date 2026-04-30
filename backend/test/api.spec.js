import request from 'supertest';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../src/server.js';
import { ensureSchema } from '../src/schema.js';

describe('Fintrack API', () => {
  const createdTransactionIds = [];
  const createdCategoryIds = [];

  beforeAll(async () => {
    await ensureSchema();
  });

  afterEach(async () => {
    while (createdTransactionIds.length > 0) {
      const transactionId = createdTransactionIds.pop();
      await request(app).delete(`/api/transactions/${transactionId}`);
    }

    while (createdCategoryIds.length > 0) {
      const categoryId = createdCategoryIds.pop();
      await request(app).delete(`/api/categories/${categoryId}`);
    }
  });

  it('lists categories', async () => {
    const response = await request(app).get('/api/categories');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it('creates and retrieves a transaction', async () => {
    const categories = await request(app).get('/api/categories');
    const categoryId = categories.body.data[0].id;

    const createResponse = await request(app).post('/api/transactions').send({
      description: 'Teste API',
      value: 150.5,
      type: 'entrada',
      categoryId,
      date: new Date().toISOString(),
      isScheduled: false,
      notes: 'Criada em teste automatizado',
    });

    expect(createResponse.status).toBe(200);
    expect(createResponse.body.success).toBe(true);
    expect(createResponse.body.data.description).toBe('Teste API');

    const transactionId = createResponse.body.data.id;
    createdTransactionIds.push(transactionId);
    const getResponse = await request(app).get(`/api/transactions/${transactionId}`);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.id).toBe(transactionId);
  });

  it('does not include future scheduled transaction in current dashboard balance', async () => {
    const categories = await request(app).get('/api/categories');
    const categoryId = categories.body.data[0].id;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);

    const createResponse = await request(app).post('/api/transactions').send({
      description: 'Agendada futura para teste',
      value: 9999,
      type: 'entrada',
      categoryId,
      date: new Date().toISOString(),
      isScheduled: true,
      scheduledDate: futureDate.toISOString(),
    });
    createdTransactionIds.push(createResponse.body.data.id);

    const dashboard = await request(app).get('/api/dashboard');
    const found = dashboard.body.data.monthlyEvolution.some((item) => item.balance === 9999);

    expect(dashboard.status).toBe(200);
    expect(found).toBe(false);
  });

  it('handles text payload safely (basic injection regression)', async () => {
    const payload = "Categoria teste com apostrofo ' e comentario SQL";
    const response = await request(app).post('/api/categories').send({
      name: payload,
      color: '#111111',
      isFavorite: false,
    });
    createdCategoryIds.push(response.body.data.id);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe(payload);
  });
});
