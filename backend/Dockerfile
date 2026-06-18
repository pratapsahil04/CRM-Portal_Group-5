FROM php:8.2-cli

# Install dependencies and PDO MySQL extension
RUN apt-get update && apt-get install -y \
    libzip-dev \
    zip \
    && docker-php-ext-install pdo pdo_mysql

WORKDIR /app

EXPOSE 8000

# Start PHP built-in server serving /app directory
CMD ["php", "-S", "0.0.0.0:8000", "-t", "/app"]
