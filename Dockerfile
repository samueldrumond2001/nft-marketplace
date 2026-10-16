# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app

# camada de dependências separada: só reinstala quando o lockfile muda
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- runtime ----
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
# 127.0.0.1 e não localhost: dentro do container localhost resolve primeiro
# para ::1, e o healthcheck batia em IPv6 enquanto o nginx escutava em IPv4
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
CMD ["nginx", "-g", "daemon off;"]
