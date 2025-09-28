# Imagem base (usar LTS leve)
FROM node:18-alpine

# Diretório de trabalho dentro do container
WORKDIR /usr/src/app

# Copiar manifestos de dependências
COPY package.json ./

# Instalar dependências (inclui dev para usar nodemon no modo dev)
RUN npm install

# Copiar código-fonte
COPY src ./src

# Expor porta
EXPOSE 3333

# Comando padrão (pode ser sobrescrito no docker-compose para dev)
CMD ["npm", "start"]
