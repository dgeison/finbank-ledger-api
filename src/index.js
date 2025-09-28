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

// Playground HTML para testar endpoints via navegador
app.get("/playground", (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
  <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <title>FinBank Playground</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        :root { color-scheme: light dark; }
        body { font-family: system-ui, Arial, sans-serif; margin:0; padding:0; background:#f5f7fa; }
        header { background:#1d3557; color:#fff; padding:16px 28px; }
        h1 { margin:0; font-size:1.4rem; }
        main { padding:20px; max-width:1200px; margin:0 auto; }
        section { background:#fff; border:1px solid #dde3eb; border-radius:8px; padding:16px 18px; margin-bottom:18px; box-shadow:0 1px 2px rgba(0,0,0,.05); }
        section h2 { margin-top:0; font-size:1.05rem; letter-spacing:.5px; }
        label { display:block; font-size:.75rem; text-transform:uppercase; margin-bottom:4px; color:#444; letter-spacing:.5px; }
        input, select { width:100%; padding:8px 10px; margin-bottom:10px; border:1px solid #ccd2d9; border-radius:4px; font-size:.9rem; }
        input:focus { outline:2px solid #457b9d; }
        button { cursor:pointer; background:#1d3557; color:#fff; border:none; border-radius:4px; padding:8px 14px; font-size:.8rem; letter-spacing:.5px; text-transform:uppercase; }
        button.secondary { background:#457b9d; }
        button.danger { background:#e63946; }
        button:disabled { opacity:.5; cursor:not-allowed; }
        .row { display:grid; gap:14px; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); }
        pre { background:#0b1520; color:#d8f2ff; padding:12px 14px; border-radius:6px; overflow:auto; font-size:.75rem; line-height:1.3; }
        .flex { display:flex; gap:8px; flex-wrap:wrap; }
        .tag { background:#1d3557; color:#fff; padding:2px 6px; font-size:.6rem; border-radius:3px; letter-spacing:.5px; }
        nav { margin:12px 0 28px; display:flex; flex-wrap:wrap; gap:6px; }
        nav a { text-decoration:none; font-size:.65rem; background:#e5ecf3; color:#1d3557; padding:4px 8px; border-radius:4px; }
        footer { text-align:center; font-size:.65rem; padding:40px 0 25px; color:#555; }
        .status { font-size:.65rem; padding:2px 6px; border-radius:4px; background:#eee; }
        .good { background:#2d6a4f; color:#fff; }
        .bad { background:#d00000; color:#fff; }
        .grid-2 { display:grid; gap:16px; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); }
        .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
        details summary { cursor:pointer; font-weight:600; }
        .warn { color:#b45309; font-size:.7rem; }
      </style>
    </head>
    <body>
      <header>
        <h1>FinBank Playground</h1>
      </header>
      <main>
        <nav>
          <a href="#config">Config</a>
          <a href="#conta">Conta</a>
          <a href="#mov">Movimentações</a>
          <a href="#extrato">Extrato</a>
          <a href="#simulate">Simulação</a>
          <a href="#debug">Debug</a>
        </nav>
        <section id="config">
          <h2>Configuração</h2>
          <div class="row">
            <div>
              <label>CPF</label>
              <input id="cpf" placeholder="Somente números" />
            </div>
            <div>
              <label>Nome</label>
              <input id="nome" placeholder="Nome do titular" />
            </div>
          </div>
          <div class="flex">
            <button id="salvarConfig">Salvar Config</button>
            <button id="limparConfig" class="secondary">Limpar Config</button>
          </div>
          <p class="warn">Os dados não persistem entre reinicializações do servidor (memória).</p>
        </section>
        <section id="conta">
          <h2>Conta</h2>
          <div class="flex">
            <button id="criarConta">Criar Conta</button>
            <button id="verConta" class="secondary">Ver Conta</button>
            <button id="atualizarNome" class="secondary">Atualizar Nome</button>
            <button id="deletarConta" class="danger">Deletar Conta</button>
          </div>
        </section>
        <section id="mov">
          <h2>Movimentações</h2>
          <div class="row">
            <div>
              <label>Descrição (depósito)</label>
              <input id="descDeposito" value="Depósito" />
            </div>
            <div>
              <label>Valor (depósito)</label>
              <input id="valorDeposito" type="number" value="100" />
            </div>
          </div>
          <div class="flex">
            <button id="fazerDeposito">Depositar</button>
          </div>
          <hr />
          <div class="row">
            <div>
              <label>Valor (saque)</label>
              <input id="valorSaque" type="number" value="50" />
            </div>
          </div>
          <div class="flex">
            <button id="fazerSaque" class="danger">Sacar</button>
          </div>
        </section>
        <section id="extrato">
          <h2>Extrato / Saldo</h2>
          <div class="row">
            <div>
              <label>Data (YYYY-MM-DD)</label>
              <input id="filtroData" placeholder="2025-09-28" />
            </div>
          </div>
          <div class="flex">
            <button id="verExtrato">Extrato Completo</button>
            <button id="extratoData" class="secondary">Extrato por Data</button>
            <button id="verSaldo" class="secondary">Saldo</button>
          </div>
        </section>
        <section id="simulate">
          <h2>Simulação</h2>
          <div class="flex">
            <button id="simular">Simular Operações</button>
            <button id="simularReset" class="secondary">Simular (Reset)</button>
          </div>
        </section>
        <section id="debug">
          <h2>Saída</h2>
          <pre id="output">{ }</pre>
        </section>
        <footer>
          FinBank Ledger API Playground • ${new Date().getFullYear()} • Código educativo
        </footer>
      </main>
      <script>
        const $ = (id) => document.getElementById(id);
        const out = $("output");
        const persistKeys = ["cpf","nome"]; 
        // Restaura valores
        persistKeys.forEach(k=>{ const v = localStorage.getItem('finbank_'+k); if(v) $(k).value = v; });

        function show(obj){
          out.textContent = (typeof obj === 'string') ? obj : JSON.stringify(obj, null, 2);
        }

        function headers(){
          const cpf = $("cpf").value.trim();
          return cpf ? { 'Content-Type':'application/json', 'cpf': cpf } : { 'Content-Type':'application/json' };
        }

        async function api(path, method='GET', body){
          try {
            const res = await fetch(path, { method, headers: headers(), body: body ? JSON.stringify(body): undefined });
            const text = await res.text();
            let data;
            try { data = text ? JSON.parse(text) : { status: res.status }; } catch(e){ data = { raw: text, status: res.status }; }
            if(!res.ok){ throw { status: res.status, data }; }
            show(data);
            return data;
          } catch(err){ show({ error: true, ...err }); throw err; }
        }

        $("salvarConfig").onclick = () => {
          persistKeys.forEach(k=> localStorage.setItem('finbank_'+k, $(k).value.trim()));
          show({ message: 'Config salva' });
        };
        $("limparConfig").onclick = () => {
          persistKeys.forEach(k=> localStorage.removeItem('finbank_'+k));
          persistKeys.forEach(k=> $(k).value='');
          show({ message: 'Config limpa' });
        };

        $("criarConta").onclick = () => {
          api('/account','POST',{ cpf: $("cpf").value.trim(), name: $("nome").value.trim() });
        };
        $("verConta").onclick = () => api('/account');
        $("atualizarNome").onclick = () => api('/account','PUT',{ name: $("nome").value.trim() });
        $("deletarConta").onclick = () => api('/account','DELETE');

        $("fazerDeposito").onclick = () => api('/deposit','POST',{ description: $("descDeposito").value, amount: Number($("valorDeposito").value) });
        $("fazerSaque").onclick = () => api('/withdraw','POST',{ amount: Number($("valorSaque").value) });

        $("verExtrato").onclick = () => api('/statement');
        $("extratoData").onclick = () => {
          const d = $("filtroData").value.trim(); if(!d) { return show({ error:'Informe a data'}); }
          api('/statement/date?date='+encodeURIComponent(d));
        };
        $("verSaldo").onclick = () => api('/balance');

        $("simular").onclick = () => api('/simulate','POST',{ cpf: $("cpf").value.trim(), name: $("nome").value.trim() || 'Cliente Demo' });
        $("simularReset").onclick = () => api('/simulate','POST',{ cpf: $("cpf").value.trim(), name: $("nome").value.trim() || 'Cliente Demo', reset: true });

        // Auto definir data atual
        const today = new Date().toISOString().slice(0,10); $("filtroData").placeholder = today; 
      </script>
    </body>
  </html>`);
});

// Exportar o app para permitir testes sem subir a porta automaticamente
module.exports = app;

