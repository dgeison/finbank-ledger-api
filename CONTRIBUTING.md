# Contribuindo para FinBank Ledger API

Obrigado pelo interesse em contribuir! Este projeto é educacional e simples de propósito — mantenha as mudanças focadas e bem descritas.

## Fluxo de Contribuição
1. Abra uma issue descrevendo a motivação (bug / feature / melhoria).
2. Fork o repositório e crie um branch: `feature/nome-curto` ou `fix/descricao-curta`.
3. Faça commits pequenos e descritivos (em português ou inglês, mas consistentes).
4. Abra um Pull Request (PR) referenciando a issue.
5. Aguarde revisão; responda feedbacks.

## Padrões de Código
- Node.js >= 16.
- Estilo simples (sem frameworks extras neste estágio).
- Evitar dependências desnecessárias.
- Nomes claros em inglês no código (ex.: `getBalance`, `verifyExistsAccountCPF`).

## Commits
Sugestão (não obrigatório):
```
feat: adicionar endpoint de paginação no extrato
fix: corrigir cálculo de saldo com operações negativas
chore: atualizar dependências
refactor: extrair função de validação de CPF
docs: melhorar README com exemplos
```

## Testes
Ainda não há suíte formal de testes automatizados. Se adicionar lógica complexa, considere propor Jest/Supertest em uma etapa futura.

## Pull Request
Inclua no PR:
- Objetivo da mudança
- Como testar
- Screenshots (se aplicável)
- Impacto em endpoints existentes

## Discussões e Ideias Futuras
Use issues com label `enhancement`.

## Licença
Ao contribuir você concorda que seu código será licenciado sob MIT.
