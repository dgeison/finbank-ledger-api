const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json());

// Armazenamento em memória (somente para fins de estudo / demo)
const customers = [];
// Expor para testes automatizados limpar/resetar
app.locals.customers = customers;

// Rota raiz para visualizar algo no navegador (http://localhost:3333/)
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
  <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <title>FinAPI</title>
      <style>
        body { font-family: Arial, sans-serif; margin:40px; background:#f7f7f7; }
        code { background:#eee; padding:2px 4px; border-radius:4px; }
        h1 { margin-top:0; }
        ul { line-height:1.6; }
        .tag { background:#222; color:#fff; padding:2px 6px; border-radius:4px; font-size:12px; }
      </style>
    </head>
    <body>
      <h1>FinAPI 🚀</h1>
      <p>API simples de conta bancária em memória. Endpoints principais:</p>
      <ul>
        <li><span class="tag">POST</span> <code>/account</code> – cria conta ({ cpf, name })</li>
        <li><span class="tag">GET</span> <code>/statement</code> – extrato (header cpf)</li>
        <li><span class="tag">POST</span> <code>/deposit</code> – depósito ({ description, amount })</li>
        <li><span class="tag">POST</span> <code>/withdraw</code> – saque ({ amount })</li>
        <li><span class="tag">GET</span> <code>/statement/date?date=YYYY-MM-DD</code></li>
        <li><span class="tag">PUT</span> <code>/account</code> – atualizar nome</li>
        <li><span class="tag">GET</span> <code>/account</code> – dados da conta</li>
        <li><span class="tag">DELETE</span> <code>/account</code> – excluir conta</li>
        <li><span class="tag">GET</span> <code>/balance</code> – saldo</li>
        <li><span class="tag">GET</span> <code>/health</code> – health-check JSON</li>
      </ul>
      <p>Exemplo rápido via <code>curl</code>:</p>
      <pre>curl -X POST http://localhost:3333/account -H "Content-Type: application/json" -d '{"cpf":"11122233344","name":"Maria"}'</pre>
    </body>
  </html>`);
});

/**
 * cpf = string
 * name = name
 * id = uuid
 * statement = []
 */

// Middleware - para verificar se o usuário existe:
function verifyExistsAccountCPF(request, response, next) {
  const { cpf } = request.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer) {
    return response.status(400).json({ error: "Customer not found" });
  }

  request.customer = customer;

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === "credit") {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);
  return balance;
}

// Para criar uma conta:
app.post("/account", (request, response) => {
  const { cpf, name } = request.body;

  const customerAlreadExists = customers.some(
    (customer) => customer.cpf === cpf
  );
  if (customerAlreadExists) {
    return response.status(400).json({ error: "Customer already exists!" });
  }

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: [],
  });

  return response.status(201).send();
});

// Para puxar o extrato:
app.get("/statement", verifyExistsAccountCPF, (request, response) => {
  // get verifyExistsAccountCPF
  const { customer } = request;
  console.log(customer);
  return response.json(customer.statement);
});

// Para fazer um depósito:
app.post("/deposit", verifyExistsAccountCPF, (request, response) => {
  const { description, amount } = request.body;

  const { customer } = request;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit",
  };

  customer.statement.push(statementOperation);
  return response.status(201).send();
});

// Para fazer um saque:
app.post("/withdraw", verifyExistsAccountCPF, (request, response) => {
  const { amount } = request.body;

  const { customer } = request;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return response.status(400).json({ error: "Insufficent funds!" });
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: "debit",
  };

  customer.statement.push(statementOperation);
  return response.status(201).send();
});

// Para puxar o extrato por data:
app.get("/statement/date", verifyExistsAccountCPF, (request, response) => {
  const { customer } = request;
  const { date } = request.query;
  const dateFormat = new Date(date + " 00:00");

  const statement = customer.statement.filter(
    (statement) =>
      statement.created_at.toDateString() ===
      new Date(dateFormat).toDateString()
  );

  return response.json(statement);
});

// Para Atualizar os dados do cliente:
app.put("/account", verifyExistsAccountCPF, (request, response) => {
  const { name } = request.body;
  const { customer } = request;

  customer.name = name;

  return response.status(200).send();
});

// Para buscar os dados da conta cliente:
app.get("/account", verifyExistsAccountCPF, (request, response) => {
  const { customer } = request;

  return response.json(customer);
});

// Para deletar a conta:
app.delete("/account", verifyExistsAccountCPF, (request, response) => {
  const { customer } = request;

  const index = customers.findIndex((c) => c.cpf === customer.cpf);
  if (index === -1) {
    // Já não existe (condição de corrida rara)
    return response.status(404).json({ error: "Customer not found" });
  }
  customers.splice(index, 1);

  return response.status(200).json({ message: "Account deleted" });
});

// Para ver o saldo da conta:
app.get("/balance", verifyExistsAccountCPF, (request, response) => {
  const { customer } = request;
  const balance = getBalance(customer.statement);

  return response.json(balance);
});

// Rota de health-check simples para verificar se o container está de pé
app.get("/health", (request, response) => {
  return response.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Endpoint para simular rapidamente algumas transações em uma conta.
// POST /simulate  Body: { cpf: "123", name?: "Fulano", reset?: true }
// Se a conta não existir, é criada. Se reset=true, o extrato é limpo antes de inserir operações.
app.post('/simulate', (request, response) => {
  const { cpf, name, reset } = request.body || {};
  if (!cpf) {
    return response.status(400).json({ error: 'cpf é obrigatório' });
  }

  let customer = customers.find(c => c.cpf === cpf);
  if (!customer) {
    customer = { cpf, name: name || 'Cliente Demo', id: uuidv4(), statement: [] };
    customers.push(customer);
  } else if (reset) {
    customer.statement = [];
  }

  // Inserir operações simuladas (datas espalhadas nos últimos 5 dias)
  const now = new Date();
  const mkDate = (daysAgo) => new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

  const ops = [
    { description: 'Salário', amount: 3500, type: 'credit', created_at: mkDate(5) },
    { description: 'Supermercado', amount: 420.75, type: 'debit', created_at: mkDate(4) },
    { description: 'Café', amount: 12, type: 'debit', created_at: mkDate(3) },
    { description: 'Transferência recebida', amount: 500, type: 'credit', created_at: mkDate(2) },
    { description: 'Streaming', amount: 34.9, type: 'debit', created_at: mkDate(1) },
    { description: 'Bônus', amount: 800, type: 'credit', created_at: mkDate(0) }
  ];

  // Evitar duplicar se já foram inseridas (checamos por uma marca simples: existência de uma operação "Salário" no mesmo dia)
  const hasSalary = customer.statement.some(op => op.description === 'Salário');
  if (!hasSalary) {
    customer.statement.push(...ops);
  }

  const balance = getBalance(customer.statement);
  return response.json({
    message: 'Simulação aplicada',
    cpf: customer.cpf,
    name: customer.name,
    balance,
    operations: customer.statement.length,
    statementSample: customer.statement.slice(-5) // últimas 5
  });
});

// Exportar o app para permitir testes sem subir a porta automaticamente
module.exports = app;

