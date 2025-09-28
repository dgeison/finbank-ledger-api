# Changelog

Todas as mudanças notáveis deste projeto serão documentadas aqui.

O formato segue parcialmente o *Keep a Changelog* e adota versionamento semântico.

## [1.0.0] - 2025-09-28
### Added
- Estrutura inicial da API (contas, extrato, depósito, saque, saldo, atualizar e deletar conta).
- Filtro de extrato por data.
- Endpoint `/simulate` para popular dados.
- Rota `/health` para verificação simples.
- Página HTML na raiz listando endpoints.
- Ambiente Docker (Dockerfile + docker-compose).
- Script PowerShell `test-flow.ps1` para fluxo rápido.
- Documentação inicial completa no README.
- Arquivos: LICENSE, CONTRIBUTING.md, CHANGELOG.md.

### Changed
- Nome do pacote para `finbank-ledger-api`.
- Ajuste da rota DELETE para remover conta corretamente.

### Fixed
- Corrigido bug de deleção que usava `splice(customer, 1)`.

### Security
- (Nenhuma alteração de segurança nesta versão.)

---

[1.0.0]: https://github.com/SEU_USUARIO/finbank-ledger-api/releases/tag/v1.0.0
