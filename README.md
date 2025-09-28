<div align="center">

# FinBank Ledger API

API educacional em Node.js/Express que simula operações bancárias básicas (criação de conta via CPF, depósitos, saques, extratos e saldo) utilizando armazenamento em memória. Ideal para estudos de REST, middlewares, validações e organização de endpoints.

![Status](https://img.shields.io/badge/status-educacional-blue) ![License](https://img.shields.io/badge/license-MIT-green)

</div>

---

## ✨ Funcionalidades

- Criar conta (CPF + nome)
- Extrato completo e por data
- Depósitos e saques com cálculo de saldo
- Atualização de nome do titular
- Exclusão de conta
- Cálculo de saldo consolidado
- Endpoint de simulação rápida (`POST /simulate`)
- Health-check (`GET /health`)
- Página HTML simples na raiz (`/`) listando endpoints

---

## 🧱 Arquitetura (Simplificada)

| Camada | Descrição |
|--------|-----------|
| Express App | Define rotas e middlewares |
| In-memory store | Array `customers[]` mantido em `app.locals` |
| Middleware `verifyExistsAccountCPF` | Valida existência de cliente por header `cpf` |
| Função util `getBalance` | Reduz operações (credit/debit) |

Persistência não existe (reset a cada restart). Pode ser expandido para banco/arquivo futuramente.

---

## 🚀 Como Rodar

### Via Node local
```bash
npm install
npm run dev   # nodemon
# ou
npm start
```
Acessar: http://localhost:3333/

### Via Docker
```bash

```

### Health-check
```bash
curl http://localhost:3333/health
```

---

## 🔌 Endpoints Principais

| Método | Rota | Descrição | Header/Body |
|--------|------|-----------|-------------|
| POST | /account | Cria conta | `{ cpf, name }` |
| GET | /statement | Extrato completo | Header: `cpf` |
| GET | /statement/date?date=YYYY-MM-DD | Extrato filtrado por data | Header: `cpf` |
| POST | /deposit | Depósito | Header: `cpf`, Body: `{ description, amount }` |
| POST | /withdraw | Saque | Header: `cpf`, Body: `{ amount }` |
| PUT | /account | Atualiza nome | Header: `cpf`, Body: `{ name }` |
| GET | /account | Dados da conta | Header: `cpf` |
| DELETE | /account | Remove conta | Header: `cpf` |
| GET | /balance | Saldo atual | Header: `cpf` |
| POST | /simulate | Popula conta com operações | `{ cpf, name?, reset? }` |
| GET | /health | Status JSON | - |

---

## 🧪 Simulação Rápida

```bash
curl -X POST http://localhost:3333/simulate \
	-H "Content-Type: application/json" \
	-d '{"cpf":"99988877766","name":"Demo User","reset":true}'
```

---

## ✅ Requisitos Implementados

- [x] Criar conta
- [x] Buscar extrato bancário
- [x] Realizar depósito
- [x] Realizar saque
- [x] Extrato por data
- [x] Atualizar dados da conta
- [x] Obter dados da conta
- [x] Deletar conta
- [x] Retornar balance
- [x] Simulação de transações

### Regras de Negócio
- [x] CPF não pode duplicar
- [x] Não operar em conta inexistente
- [x] Não sacar com saldo insuficiente

---

## 🛠 Script de Teste (PowerShell)
Arquivo: `scripts/test-flow.ps1`

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test-flow.ps1 -Cpf 12345678900 -Reset
```

---
## 🧯 Troubleshooting (PowerShell)

| Erro | Causa | Solução |
|------|-------|---------|
| node : não é reconhecido | Node não instalado | Instalar Node LTS |
| 400 Customer not found | CPF não existe | Criar conta / usar /simulate |
| ECONNREFUSED | API não iniciou | `docker compose up` |
| JSON inválido | Aspas quebradas | Usar script ou `Invoke-RestMethod` |

---

## ⚡ Quick Start

```bash
git clone https://github.com/dgeison/finbank-ledger-api.git
cd finbank-ledger-api
npm install
npm run dev
# Abrir: http://localhost:3333/
```

## 🔐 Aviso de Segurança
Esta API é exclusivamente para fins educacionais. Não possui:
* Autenticação / autorização
* Persistência real
* Rate limiting
* Criptografia de dados sensíveis

Não use em produção.

## 📁 Estrutura de Pastas
```
finbank-ledger-api/
├─ src/
│  ├─ index.js        # App Express / rotas
│  └─ server.js       # Bootstrap servidor
├─ scripts/
│  └─ test-flow.ps1   # Script fluxo de testes
├─ Dockerfile
├─ docker-compose.yml
├─ package.json
├─ CHANGELOG.md
├─ CONTRIBUTING.md
├─ LICENSE
└─ README.md
```

## 📦 Publicação / Nome no GitHub

Nome sugerido: `finbank-ledger-api` (descritivo, curto, busca fácil)

Checklist antes de subir:
1. Atualizar `author`, `repository`, `bugs`, `homepage` no `package.json` (já está com placeholders).
2. Confirmar `.gitignore` inclui `node_modules/` (ok) e adicionar se quiser: `logs/`, `*.log`, `coverage/`.
3. Commit inicial:
	 ```bash
	 git init
	 git add .
	 git commit -m "chore: initial public version"
	 git branch -M main
		git remote add origin https://github.com/dgeison/finbank-ledger-api.git
	 git push -u origin main
	 ```
4. Criar issue template / PR template (opcional para open source).
5. Adicionar badge de CI (quando tiver workflow).

---

## 💡 Exemplos de Uso (curl)

Criar conta:
```bash
curl -X POST http://localhost:3333/account \
	-H "Content-Type: application/json" \
	-d '{"cpf":"11122233344","name":"Maria"}'
```

Depósito:
```bash
curl -X POST http://localhost:3333/deposit \
	-H "Content-Type: application/json" -H "cpf: 11122233344" \
	-d '{"description":"Depósito inicial","amount":500}'
```

Saque:
```bash
curl -X POST http://localhost:3333/withdraw \
	-H "Content-Type: application/json" -H "cpf: 11122233344" \
	-d '{"amount":200}'
```

Extrato por data:
```bash
curl "http://localhost:3333/statement/date?date=2025-09-28" -H "cpf: 11122233344"
```

Simulação:
```bash
curl -X POST http://localhost:3333/simulate \
	-H "Content-Type: application/json" \
	-d '{"cpf":"99988877766","reset":true}'
```

## 🤝 Contribuição
1. Fork / branch: `feature/nome`.
2. Descrever mudança no commit.
3. Abrir PR com contexto.

---

## 🔮 Próximas Evoluções (Ideias)
- Validação formal de CPF (algoritmo dígito verificador)
- Verificação amount > 0 em depósito/saque
- Adicionar IDs (UUID) em operações
- Paginação de extrato (`?page=&limit=`)
- Persistência (arquivo ou SQLite)
- Autenticação JWT
- Rate limiting simples

---

## 📄 Licença
MIT. Livre para estudo e extensão.

---



