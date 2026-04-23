# ========== ESTÁGIO 1: BUILD ==========
FROM oven/bun:1 AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json bun.lockb ./

# Instalar dependências
RUN bun install

# Copiar código fonte
COPY . .

# Build da aplicação
RUN bun run build


# ========== ESTÁGIO 2: PRODUÇÃO ==========
FROM nginx:alpine AS production

# Copiar arquivos buildados
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração do Nginx para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar entrypoint para runtime config
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expor porta 80
EXPOSE 80

# Iniciar via entrypoint (gera env.js e sobe o Nginx)
ENTRYPOINT ["/entrypoint.sh"]
