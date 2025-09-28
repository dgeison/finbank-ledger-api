# Imagem base (usar LTS leve)
#############################
# Etapa 1: Base (builder)
#############################
FROM node:18-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

#############################
# Etapa 2: Dependências prod
#############################
FROM base AS deps
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

#############################
# Etapa 3: Desenvolvimento
#############################
FROM base AS dev
ENV NODE_ENV=development
COPY package.json ./
RUN npm install && npm cache clean --force
COPY src ./src
EXPOSE 3333
CMD ["npm", "run", "dev"]

#############################
# Etapa 4: Produção final
#############################
FROM base AS prod
USER root
# Adicionar usuário não root para rodar app com menos privilégios
RUN addgroup -S nodegrp && adduser -S nodeusr -G nodegrp
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
EXPOSE 3333
USER nodeusr

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
	CMD wget -qO- http://localhost:3333/health || exit 1

CMD ["node", "src/server.js"]
