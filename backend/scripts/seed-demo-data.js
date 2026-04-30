import { execute, query } from '../src/db.js';
import { ensureSchema } from '../src/schema.js';

const DEMO_YEAR = 2026;
const EXPENSE = 'sa\u00edda';
const INCOME = 'entrada';
const NOW_REFERENCE = new Date('2026-04-29T12:00:00.000Z');

const categoryDefinitions = [
  { key: 'salary', id: 'demo-category-salary', name: 'Sal\u00e1rio', color: '#22c55e', isFavorite: true },
  { key: 'freelance', id: 'demo-category-freelance', name: 'Freelance', color: '#16a34a', isFavorite: true },
  { key: 'food', id: 'demo-category-food', name: 'Alimenta\u00e7\u00e3o', color: '#f97316', isFavorite: true },
  { key: 'transport', id: 'demo-category-transport', name: 'Transporte', color: '#3b82f6', isFavorite: false },
  { key: 'housing', id: 'demo-category-housing', name: 'Moradia', color: '#a855f7', isFavorite: false },
  { key: 'utilities', id: 'demo-category-utilities', name: 'Contas', color: '#0ea5e9', isFavorite: false },
  { key: 'health', id: 'demo-category-health', name: 'Sa\u00fade', color: '#ef4444', isFavorite: false },
  { key: 'education', id: 'demo-category-education', name: 'Educa\u00e7\u00e3o', color: '#6366f1', isFavorite: false },
  { key: 'subscriptions', id: 'demo-category-subscriptions', name: 'Assinaturas', color: '#64748b', isFavorite: false },
  { key: 'investments', id: 'demo-category-investments', name: 'Investimentos', color: '#14b8a6', isFavorite: true },
  { key: 'shopping', id: 'demo-category-shopping', name: 'Compras', color: '#ec4899', isFavorite: false },
  { key: 'travel', id: 'demo-category-travel', name: 'Viagem', color: '#f59e0b', isFavorite: false },
  { key: 'pets', id: 'demo-category-pets', name: 'Pets', color: '#84cc16', isFavorite: false },
  { key: 'fun', id: 'demo-category-fun', name: 'Lazer', color: '#8b5cf6', isFavorite: false },
];

const recurringTemplates = [
  { description: 'Salario CLT', day: 1, type: INCOME, categoryKey: 'salary', values: [5200, 5200, 5300, 5300], notes: 'Receita principal do mes.' },
  { description: 'Freelance sprint do mes', day: 6, type: INCOME, categoryKey: 'freelance', values: [900, 1250, 780, 1500], notes: 'Projeto paralelo fechado dentro do mes.' },
  { description: 'Mercado principal', day: 3, type: EXPENSE, categoryKey: 'food', values: [320, 340, 355, 370], notes: 'Compra maior do periodo.' },
  { description: 'Aluguel e condominio', day: 5, type: EXPENSE, categoryKey: 'housing', values: [1850, 1850, 1900, 1900], notes: 'Despesa fixa de moradia.' },
  { description: 'Energia eletrica', day: 7, type: EXPENSE, categoryKey: 'utilities', values: [175, 160, 182, 168], notes: 'Conta recorrente da residencia.' },
  { description: 'Internet e celular', day: 8, type: EXPENSE, categoryKey: 'subscriptions', values: [145, 145, 145, 145], notes: 'Pacote de conectividade.' },
  { description: 'Transporte da rotina', day: 9, type: EXPENSE, categoryKey: 'transport', values: [190, 175, 210, 205], notes: 'Combina combustivel e mobilidade urbana.' },
  { description: 'Farmacia do mes', day: 10, type: EXPENSE, categoryKey: 'health', values: [65, 48, 92, 75], notes: 'Medicamentos e itens basicos.' },
  { description: 'Academia e bem-estar', day: 11, type: EXPENSE, categoryKey: 'health', values: [120, 120, 120, 120], notes: 'Rotina de cuidado pessoal.' },
  { description: 'Streaming e apps', day: 12, type: EXPENSE, categoryKey: 'subscriptions', values: [89, 89, 95, 95], notes: 'Assinaturas de uso recorrente.' },
  { description: 'Almocos uteis', day: 13, type: EXPENSE, categoryKey: 'food', values: [155, 165, 150, 172], notes: 'Refeicoes fora de casa durante a semana.' },
  { description: 'Aporte mensal', day: 14, type: EXPENSE, categoryKey: 'investments', values: [600, 650, 620, 700], notes: 'Transferencia para reserva e investimentos.' },
  { description: 'Uber e corridas', day: 15, type: EXPENSE, categoryKey: 'transport', values: [88, 75, 110, 104], notes: 'Deslocamentos pontuais.' },
  { description: 'Curso e livros', day: 16, type: EXPENSE, categoryKey: 'education', values: [140, 180, 130, 210], notes: 'Desenvolvimento profissional continuo.' },
  { description: 'Lazer de fim de semana', day: 17, type: EXPENSE, categoryKey: 'fun', values: [185, 220, 170, 260], notes: 'Saidas e consumo de entretenimento.' },
  { description: 'Compras para casa', day: 18, type: EXPENSE, categoryKey: 'shopping', values: [230, 260, 180, 245], notes: 'Reposicoes e melhorias domesticas.' },
  { description: 'Mercado complementar', day: 21, type: EXPENSE, categoryKey: 'food', values: [175, 160, 190, 185], notes: 'Reposicoes menores ao longo do mes.' },
  { description: 'Pet shop e cuidados', day: 22, type: EXPENSE, categoryKey: 'pets', values: [95, 110, 130, 105], notes: 'Gastos recorrentes com pet.' },
  { description: 'Reserva para viagem', day: 24, type: EXPENSE, categoryKey: 'travel', values: [250, 280, 320, 400], notes: 'Planejamento de viagem e lazer futuro.', scheduleOffsetDays: 3 },
  { description: 'Reembolso do trabalho', day: 25, type: INCOME, categoryKey: 'freelance', values: [220, 110, 180, 250], notes: 'Despesas pagas que retornaram ao caixa.' },
];

const monthSpecificTemplates = [
  [
    { description: 'IPTU a vista', day: 4, type: EXPENSE, categoryKey: 'housing', value: 920, notes: 'Pagamento anual concentrado em janeiro.' },
    { description: 'Material de trabalho', day: 19, type: EXPENSE, categoryKey: 'shopping', value: 310, notes: 'Reposicao de perifericos e itens de escritorio.' },
    { description: 'Seguro do carro', day: 27, type: EXPENSE, categoryKey: 'transport', value: 480, notes: 'Lancado como agendamento interno para demonstrar a funcionalidade.', scheduleOffsetDays: 2 },
    { description: 'Jantar de aniversario', day: 28, type: EXPENSE, categoryKey: 'fun', value: 260, notes: 'Evento social do mes.' },
    { description: 'Cashback do cartao', day: 30, type: INCOME, categoryKey: 'investments', value: 95, notes: 'Credito automatico do cartao de credito.' },
  ],
  [
    { description: 'Viagem de carnaval', day: 14, type: EXPENSE, categoryKey: 'travel', value: 860, notes: 'Viagem curta de feriado.' },
    { description: 'Consulta odontologica', day: 19, type: EXPENSE, categoryKey: 'health', value: 340, notes: 'Procedimento pontual de saude.' },
    { description: 'Freelance extra de carnaval', day: 20, type: INCOME, categoryKey: 'freelance', value: 1450, notes: 'Entrega adicional fechada no periodo do feriado.' },
    { description: 'Manutencao do notebook', day: 26, type: EXPENSE, categoryKey: 'shopping', value: 420, notes: 'Preventiva do equipamento principal.', scheduleOffsetDays: 2 },
    { description: 'Cashback do cartao', day: 28, type: INCOME, categoryKey: 'investments', value: 110, notes: 'Credito automatico do cartao de credito.' },
  ],
  [
    { description: 'Bonus trimestral', day: 4, type: INCOME, categoryKey: 'salary', value: 1800, notes: 'Pagamento de performance do trimestre.' },
    { description: 'Revisao do carro', day: 19, type: EXPENSE, categoryKey: 'transport', value: 680, notes: 'Revisao preventiva completa.' },
    { description: 'Exames laboratoriais', day: 20, type: EXPENSE, categoryKey: 'health', value: 290, notes: 'Rotina anual de saude.' },
    { description: 'Ingresso de show', day: 27, type: EXPENSE, categoryKey: 'fun', value: 360, notes: 'Evento especial do mes.' },
    { description: 'Transferencia para reserva', day: 29, type: EXPENSE, categoryKey: 'investments', value: 500, notes: 'Aporte agendado para fechamento do mes.', scheduleOffsetDays: 2 },
  ],
  [
    { description: 'Restituicao parcial do IR', day: 10, type: INCOME, categoryKey: 'salary', value: 950, notes: 'Entrada eventual de caixa no fim de abril.' },
    { description: 'Hotel da viagem de maio', day: 23, type: EXPENSE, categoryKey: 'travel', value: 780, notes: 'Agendada apos 29/04/2026 para demonstrar pendencia.', scheduledDate: '2026-05-02T12:00:00.000Z' },
    { description: 'Bonus de performance', day: 24, type: INCOME, categoryKey: 'freelance', value: 1400, notes: 'Agendado apos 29/04/2026 para demonstrar entrada futura.', scheduledDate: '2026-05-05T12:00:00.000Z' },
    { description: 'Manutencao do apartamento', day: 26, type: EXPENSE, categoryKey: 'housing', value: 540, notes: 'Pequena obra corretiva.' },
    { description: 'Parcela de curso intensivo', day: 29, type: EXPENSE, categoryKey: 'education', value: 290, notes: 'Agendada apos 29/04/2026 para demonstrar pendencia.', scheduledDate: '2026-05-06T12:00:00.000Z' },
  ],
];

function sqlString(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replaceAll("'", "''")}'`;
}

function normalizeName(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function createIsoDate(year, monthIndex, day) {
  return new Date(Date.UTC(year, monthIndex, day, 12, 0, 0)).toISOString();
}

function addDays(isoDate, days) {
  const date = new Date(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

async function ensureCategories() {
  const existingCategories = await query('SELECT id, name FROM categories');
  const idsByKey = new Map();
  const existingByNormalizedName = new Map(
    existingCategories.map((category) => [normalizeName(category.name), category.id])
  );
  const nowIso = NOW_REFERENCE.toISOString();

  for (const definition of categoryDefinitions) {
    const normalizedName = normalizeName(definition.name);
    const existingId =
      existingByNormalizedName.get(normalizedName) ||
      existingCategories.find((category) => category.id === definition.id)?.id;

    if (existingId) {
      idsByKey.set(definition.key, existingId);
      continue;
    }

    await execute(`
      INSERT INTO categories (id, name, color, is_favorite, created_at, updated_at)
      VALUES (
        ${sqlString(definition.id)},
        ${sqlString(definition.name)},
        ${sqlString(definition.color)},
        ${definition.isFavorite ? 'TRUE' : 'FALSE'},
        ${sqlString(nowIso)},
        ${sqlString(nowIso)}
      )
    `);

    idsByKey.set(definition.key, definition.id);
  }

  return idsByKey;
}

function buildTransactions(categoryIds) {
  const transactions = [];

  for (let monthIndex = 0; monthIndex < 4; monthIndex++) {
    for (const template of recurringTemplates) {
      const date = createIsoDate(DEMO_YEAR, monthIndex, template.day);
      const scheduledDate = template.scheduleOffsetDays ? addDays(date, template.scheduleOffsetDays) : null;

      transactions.push({
        id: `demo-transaction-${String(transactions.length + 1).padStart(3, '0')}`,
        description: template.description,
        value: template.values[monthIndex],
        type: template.type,
        categoryId: categoryIds.get(template.categoryKey),
        date,
        scheduledDate,
        isScheduled: Boolean(scheduledDate),
        notes: template.notes,
        createdAt: date,
        updatedAt: date,
      });
    }

    for (const template of monthSpecificTemplates[monthIndex]) {
      const date = createIsoDate(DEMO_YEAR, monthIndex, template.day);
      const scheduledDate = template.scheduledDate || (template.scheduleOffsetDays ? addDays(date, template.scheduleOffsetDays) : null);

      transactions.push({
        id: `demo-transaction-${String(transactions.length + 1).padStart(3, '0')}`,
        description: template.description,
        value: template.value,
        type: template.type,
        categoryId: categoryIds.get(template.categoryKey),
        date,
        scheduledDate,
        isScheduled: Boolean(scheduledDate),
        notes: template.notes,
        createdAt: date,
        updatedAt: date,
      });
    }
  }

  if (transactions.length !== 100) {
    throw new Error(`Expected 100 demo transactions, received ${transactions.length}.`);
  }

  return transactions;
}

async function upsertTransaction(transaction) {
  const rows = await query(
    `SELECT COUNT(*) AS count FROM transactions WHERE id = ${sqlString(transaction.id)}`
  );
  const exists = Number(rows[0]?.count || 0) > 0;

  if (exists) {
    await execute(`
      UPDATE transactions SET
        description = ${sqlString(transaction.description)},
        amount = ${Number(transaction.value.toFixed(2))},
        type = ${sqlString(transaction.type)},
        category_id = ${sqlString(transaction.categoryId)},
        date = ${sqlString(transaction.date)},
        scheduled_date = ${sqlString(transaction.scheduledDate)},
        is_scheduled = ${transaction.isScheduled ? 'TRUE' : 'FALSE'},
        notes = ${sqlString(transaction.notes)},
        created_at = ${sqlString(transaction.createdAt)},
        updated_at = ${sqlString(transaction.updatedAt)}
      WHERE id = ${sqlString(transaction.id)}
    `);
    return 'updated';
  }

  await execute(`
    INSERT INTO transactions (
      id, description, amount, type, category_id, date, scheduled_date, is_scheduled, notes, created_at, updated_at
    ) VALUES (
      ${sqlString(transaction.id)},
      ${sqlString(transaction.description)},
      ${Number(transaction.value.toFixed(2))},
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

  return 'inserted';
}

async function printSummary() {
  const rows = await query(`
    SELECT
      EXTRACT(MONTH FROM date) AS month_number,
      COUNT(*) AS total,
      SUM(CASE WHEN type = 'entrada' THEN 1 ELSE 0 END) AS income_total,
      SUM(CASE WHEN type = 'saída' THEN 1 ELSE 0 END) AS expense_total
    FROM transactions
    WHERE id LIKE 'demo-transaction-%'
    GROUP BY EXTRACT(MONTH FROM date)
    ORDER BY month_number
  `);

  const futureScheduled = await query(`
    SELECT COUNT(*) AS count
    FROM transactions
    WHERE id LIKE 'demo-transaction-%'
      AND is_scheduled = TRUE
      AND scheduled_date > ${sqlString(NOW_REFERENCE.toISOString())}
  `);

  console.log('Resumo da massa demo:');
  for (const row of rows) {
    console.log(
      `- mes ${String(row.month_number).padStart(2, '0')}: ${row.total} transacoes (${row.income_total} entradas / ${row.expense_total} saidas)`
    );
  }
  console.log(`- agendadas futuras apos 29/04/2026: ${futureScheduled[0]?.count || 0}`);
}

async function main() {
  await ensureSchema();
  const categoryIds = await ensureCategories();
  const demoTransactions = buildTransactions(categoryIds);

  let inserted = 0;
  let updated = 0;
  for (const transaction of demoTransactions) {
    const result = await upsertTransaction(transaction);
    if (result === 'inserted') inserted += 1;
    if (result === 'updated') updated += 1;
  }

  console.log(`Massa demo processada com sucesso: ${inserted} inseridas, ${updated} atualizadas.`);
  await printSummary();
}

main().catch((error) => {
  console.error('Falha ao gerar a massa demo:', error);
  process.exit(1);
});
