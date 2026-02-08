# Usa uma imagem leve do Node
FROM node:18-alpine

# Define o diretório de trabalho dentro do container
WORKDIR /usr/src/app

# Copia apenas os arquivos de definição de dependências primeiro (Cache Layering)
COPY package*.json ./

# Instala as dependências dentro do container
RUN npm install

# Copia o restante do código fonte
COPY . .

# Expõe a porta que a aplicação usa
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "src/server.js"]