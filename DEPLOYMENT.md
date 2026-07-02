# AutoCRM AWS Deployment Guide

## Deployment Overview

AutoCRM is deployed on an AWS EC2 instance using Docker containers and Nginx as a reverse proxy.

---

## Infrastructure

### Cloud Provider

AWS EC2

### Operating System

Amazon Linux 2023

### Web Server

Nginx

### Containers

- React Frontend
- PHP Backend
- MySQL Database

---

## Deployment Architecture

```text
                   Internet
                       │
                       ▼
                Public IP Address
                       │
                       ▼
                AWS EC2 Instance
                       │
               Port 80 (HTTP)
                       │
                       ▼
                    Nginx
             Reverse Proxy Server
                │            │
                ▼            ▼
        React Frontend    PHP Backend
          Port 5173       Port 8000
                 │
                 ▼
            MySQL Database
               Port 3306
```

---

## Docker Services

### Frontend

- React
- Vite
- Port 5173

### Backend

- PHP
- REST APIs
- Port 8000

### Database

- MySQL 8
- Port 3306

---

## Security Group Configuration

| Port | Purpose |
|------|---------|
|22|SSH|
|80|HTTP|
|5173|React|
|8000|PHP Backend|

---

## Deployment Steps

1. Clone repository

2. Start Docker

```
docker compose up -d
```

3. Configure Nginx

4. Open Security Group Ports

5. Access

```
http://3.110.196.167
```

---

## Deployment Status

✅ Successfully deployed on AWS EC2
