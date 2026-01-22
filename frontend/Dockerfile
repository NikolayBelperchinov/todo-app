FROM node:22-alpine AS build

WORKDIR /app

# Копираме package.json и package-lock.json (ако имаш)
COPY package*.json ./

RUN npm install

# Копираме останалия код
COPY . .

# Позволяваме да подадем URL на бекенда при build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# 2) Run stage – сервиране на статичните файлове с nginx
FROM nginx:alpine

# Изтриваме default страницата на nginx и слагаме нашия билд
RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]