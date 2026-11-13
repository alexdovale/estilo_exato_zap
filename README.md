# Estilo Exato Zap

Sistema Inteligente de Gestão de Fila e Atendimento para Barbearias e Ateliers com Notificação WhatsApp e Cartão Fidelidade.

Este projeto foi reescrito de Flutter para uma aplicação web moderna em **React + TypeScript + Vite + Tailwind CSS**.

## ✨ Principais Funcionalidades

- **Boas-Vindas e Acesso Rápido**: Interface para Proprietário (teste de 14 dias), Acesso da Equipe / Funcionários, Fila Virtual Pública e Área do Cliente.
- **Painel Administrativo da Fila**:
  - Monitoramento da cadeira de atendimento atual (Ao Vivo / Cadeira Disponível).
  - Chamada do próximo cliente com disparo de notificação simulada de WhatsApp via Z-API.
  - Finalização de atendimento com comanda interativa, venda adicional (upsell de produtos como pomadas e óleos) e cálculo automático de troco.
  - Cadastro rápido presencial (Walk-In).
  - Compartilhamento de link direto para a fila virtual (`/#/fila/:id`).
- **Assistente de Configuração (Setup Wizard)**:
  - Passo 1: Localização (País, CEP, Cidade, Endereço).
  - Passo 2: Segmentação de ramo (Barbearia, Cabeleireiro, Unhas, Estética, etc.) e ticket médio.
  - Passo 3: Catálogo de Serviços com duração e preço.
  - Passo 4: Cadastro da Equipe inicial.
- **Área do Cliente & Programa de Fidelidade**:
  - Cartão de fidelidade visual com 10 selos para recompensar clientes frequentes com corte grátis.
  - Botão de entrada na fila com confirmação instantânea.
- **Fila Virtual Pública**:
  - Status em tempo real de quem está na cadeira e formulário para garantia de lugar na fila.
  - Adaptação dinâmica de tema (Obsidian escuro para Barbearias / Aura claro para Estética e Salões).
- **Módulos de Gestão**:
  - Gestão de Equipe (Adicionar e remover colaboradores).
  - Menu de Serviços (Gerenciamento de catálogo).
  - Clubes de Assinatura (Planos VIP com mensalidade).
  - Relatórios Financeiros (Faturamento do dia e total do mês em tempo real).
  - Checkout e Renovação de Assinatura via Mercado Pago.

## 🚀 Como Executar

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Compilar para produção
npm run build
```
