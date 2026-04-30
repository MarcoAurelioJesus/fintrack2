
9# Plano de Testes - Prova TCE Front

## Objetivo

Validar que a aplicação atende ao PDF da prova e garantir cobertura mínima de segurança e regressão funcional no frontend (Angular) e backend (Node.js + H2).

## Escopo

- Dashboard
- Transações (listar, criar, editar, remover, agendamento, detalhe)
- Categorias (listar, criar, editar, remover)
- Integração frontend + backend
- Regras de negócio de saldo
- Segurança básica de API e frontend

## Ambiente de teste

- Frontend: `npm start` (porta `4200`)
- Backend: iniciado no mesmo comando (`3000`)
- Banco H2 (modo PostgreSQL): `127.0.0.1:5436` / DB `fintrack`
- Navegadores alvo: Chrome (principal), Edge (sanidade)

## Critérios de aprovação

- 100% dos casos críticos (P0/P1) aprovados
- Nenhum bloqueador em fluxo de criação/edição/remover
- Regras de agendamento refletidas em saldo e gráfico
- Nenhuma falha grave de segurança (injeção, XSS refletido simples, CORS aberto sem controle em produção)

---

## Casos de teste funcionais (PDF)

### Dashboard

**TC-DASH-001 (P0) - Exibir saldo atual**
- Pré-condição: existir transações de entrada e saída.
- Passos: abrir aba Dashboard.
- Resultado esperado: card "Saldo Atual" mostra valor correto (entradas - saídas efetivas).

**TC-DASH-002 (P0) - Cor do card conforme saldo**
- Pré-condição: cenário A saldo positivo, cenário B saldo negativo.
- Passos: abrir Dashboard em ambos cenários.
- Resultado esperado: card muda estilo visual conforme positivo/negativo.

**TC-DASH-003 (P0) - Total de entradas do mês**
- Pré-condição: ao menos 2 entradas no mês corrente.
- Passos: abrir Dashboard.
- Resultado esperado: card "Total de entradas mês" soma e contagem corretas.

**TC-DASH-004 (P0) - Total de saídas do mês**
- Pré-condição: ao menos 2 saídas no mês corrente.
- Passos: abrir Dashboard.
- Resultado esperado: card "Total de saídas mês" soma e contagem corretas.

**TC-DASH-005 (P1) - Botão atualizar**
- Pré-condição: incluir nova transação por outra aba.
- Passos: voltar ao Dashboard e clicar "Atualizar".
- Resultado esperado: cards e gráfico recarregam valores.

**TC-DASH-006 (P0) - Gráfico evolução saldo por período**
- Pré-condição: transações distribuídas em meses diferentes.
- Passos: abrir Dashboard.
- Resultado esperado: gráfico de barras mostra saldo por período, com destaque visual no período atual.

**TC-DASH-007 (P1) - Filtro por categoria no gráfico**
- Pré-condição: categorias com transações distintas.
- Passos: selecionar categoria no filtro do gráfico.
- Resultado esperado: barras são recalculadas apenas para a categoria selecionada.

### Transações

**TC-TRX-001 (P0) - Listar transações**
- Pré-condição: base com transações.
- Passos: abrir aba Transações.
- Resultado esperado: tabela lista descrição, valor, tipo, categoria, data e ações.

**TC-TRX-002 (P0) - Criar nova transação**
- Pré-condição: existir categoria cadastrada.
- Passos: clicar "Nova Transação", preencher campos obrigatórios, salvar.
- Resultado esperado: modal fecha, toast de sucesso, tabela atualizada com novo item.

**TC-TRX-003 (P0) - Validação de categoria obrigatória**
- Pré-condição: nenhuma.
- Passos: abrir modal, preencher sem categoria, salvar.
- Resultado esperado: erro de validação e bloqueio de envio.

**TC-TRX-004 (P1) - Editar transação**
- Pré-condição: transação existente.
- Passos: clicar editar, alterar valor/descrição, salvar.
- Resultado esperado: item atualizado na tabela e no dashboard.

**TC-TRX-005 (P1) - Remover transação**
- Pré-condição: transação existente.
- Passos: clicar excluir e confirmar.
- Resultado esperado: item removido e totais recalculados.

**TC-TRX-006 (P0) - Detalhes da transação**
- Pré-condição: transação existente.
- Passos: clicar no ícone de detalhe (olho).
- Resultado esperado: modal exibe descrição, valor, tipo, data, categoria, agendamento e notas.

**TC-TRX-007 (P0) - Agendar transação futura não entra no saldo atual**
- Pré-condição: criar transação com `isScheduled=true` e data futura.
- Passos: salvar e verificar Dashboard.
- Resultado esperado: transação aparece na lista, mas não altera saldo/cards/gráfico antes da data.

**TC-TRX-008 (P0) - Agendada passa a contar na data efetiva**
- Pré-condição: transação agendada com data <= hoje.
- Passos: verificar Dashboard.
- Resultado esperado: valor é incorporado nos totais/saldo.

### Categorias

**TC-CAT-001 (P0) - Listar categorias**
- Pré-condição: categorias existentes.
- Passos: abrir aba Categorias.
- Resultado esperado: cards de categorias exibidos com nome e cor.

**TC-CAT-002 (P0) - Criar categoria**
- Pré-condição: nenhuma.
- Passos: clicar "Nova Categoria", preencher nome/cor, salvar.
- Resultado esperado: categoria criada e exibida na lista e no formulário de transação.

**TC-CAT-003 (P1) - Editar categoria**
- Pré-condição: categoria existente.
- Passos: clicar editar, alterar nome/cor, salvar.
- Resultado esperado: lista e dropdown de transações refletem alteração.

**TC-CAT-004 (P1) - Remover categoria**
- Pré-condição: categoria sem vínculo (ou tratar vínculo conforme regra da API).
- Passos: excluir categoria e confirmar.
- Resultado esperado: categoria removida da listagem.

---

## Casos de integração frontend + backend

**TC-INT-001 (P0) - Subir app com comando único**
- Passos: executar `npm start`.
- Resultado esperado: frontend e backend ativos sem intervenção manual.

**TC-INT-002 (P0) - API categorias**
- Passos: validar `GET/POST/PUT/DELETE /api/categories`.
- Resultado esperado: respostas `success=true`, dados consistentes no frontend.

**TC-INT-003 (P0) - API transações**
- Passos: validar `GET/POST/PUT/DELETE /api/transactions`.
- Resultado esperado: operações persistidas e refletidas na UI.

**TC-INT-004 (P1) - API dashboard**
- Passos: chamar `GET /api/dashboard` após operações.
- Resultado esperado: agregações corretas e consistentes com tela.

---

## Casos de segurança (necessários)

**TC-SEC-001 (P0) - SQL Injection em campos texto**
- Vetor: `description`, `notes`, `name` com payload `Categoria teste com apostrofo ' e comentario SQL`.
- Resultado esperado: registro salvo como texto literal ou rejeitado; sem vazamento/execução indevida.

**TC-SEC-002 (P0) - XSS refletido/armazenado básico**
- Vetor: `<script>alert(1)</script>` em descrição/notas/categoria.
- Resultado esperado: conteúdo renderizado como texto, sem executar script.

**TC-SEC-003 (P1) - Validação de entrada no backend**
- Vetor: `value` negativo, `type` inválido, `categoryId` inexistente.
- Resultado esperado: API retorna erro 4xx com mensagem clara.

**TC-SEC-004 (P1) - CORS em produção**
- Passos: revisar política CORS para ambiente prod.
- Resultado esperado: não permitir `*` irrestrito em produção.

**TC-SEC-005 (P1) - Exposição de erro interno**
- Passos: forçar falha no backend.
- Resultado esperado: resposta sem stack trace/sensíveis para cliente.

**TC-SEC-006 (P1) - Rate limiting (recomendado)**
- Passos: enviar alta taxa de requests em endpoints críticos.
- Resultado esperado: mitigação de abuso (limite por IP/janela).

---

## Matriz de cobertura por requisito do PDF

- Dashboard (saldo/cor/entradas/saídas/atualizar): `TC-DASH-001..005`
- Transações (listar/nova/modal/atualizar tabela/agendamento/categoria obrigatória/detalhe): `TC-TRX-001..008`
- Categorias (listar/criar/editar/remover): `TC-CAT-001..004`

---

## Regressão mínima antes de entrega

1. `npm start` sobe frontend + backend.
2. Criar categoria nova.
3. Criar entrada e saída normais.
4. Criar transação agendada futura.
5. Confirmar que agendada futura não entra no saldo.
6. Editar e remover transação.
7. Validar gráfico e cards no dashboard.
8. Executar cenários `TC-SEC-001` e `TC-SEC-002`.

