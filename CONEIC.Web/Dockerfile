FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx ng build --configuration production --base-href /coneic/

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/CONEIC.Web/browser /usr/share/nginx/html/coneic
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
