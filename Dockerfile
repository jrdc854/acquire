# Imagen base con Node 22
FROM node:22-slim

# Directorio dentro del contenedor
WORKDIR /usr/src/app

# Copiar dependencias primero
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --omit=dev

# Copiar el código restante
COPY . .

# El servicio escucha en 3002
EXPOSE 3001

# Comando de arranque
CMD ["node", "server.js"]