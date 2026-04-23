# 🖥️ EcoPower — Frontend

## 🚀 Tecnologias

- React
- TypeScript

---

## 📁 Estrutura de Camadas

src/
├── pages/ # Rotas principais da aplicação (ponto de entrada das telas)
├── views/ # Telas da aplicação (composição da interface)
├── components/ # Componentes reutilizáveis
├── controllers/ # Chamadas de API e lógica de comunicação com o backend
├── models/ # Tipos e interfaces TypeScript
├── hooks/ # Hooks personalizados reutilizáveis
├── contexts/ # Gerenciamento de estado global
└── lib/ # Utilitários e helpers

---

## 🧱 Responsabilidades de cada camada

| Camada        | Responsabilidade                              |
| ------------- | --------------------------------------------- |
| `pages`       | Ponto de entrada das rotas da aplicação       |
| `views`       | Composição das telas com os componentes       |
| `components`  | Componentes reutilizáveis em toda a aplicação |
| `controllers` | Comunicação com o backend e chamadas de API   |
| `models`      | Tipagem — interfaces e types TypeScript       |
| `hooks`       | Hooks customizados reutilizáveis              |
| `contexts`    | Estado global da aplicação                    |
| `lib`         | Funções utilitárias e bibliotecas auxiliares  |

---

## ⚙️ Como rodar

```bash
# Clonar o repositório
git clone <url-do-repo>
cd <nome-do-projeto>

# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev
```

Acesse: `http://localhost:5173`
