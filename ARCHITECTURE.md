# AutoCRM System Architecture

## High-Level Architecture

```text
                     Users
                       │
         ┌─────────────┼─────────────┐
         │             │             │
      Admin        Customer     Technician
         │             │             │
         └─────────────┼─────────────┘
                       │
                HTTP Requests
                       │
                       ▼
               AWS EC2 Instance
                       │
                ┌─────────────┐
                │    Nginx    │
                └─────────────┘
                  │         │
                  │         │
                  ▼         ▼
          React Frontend   PHP Backend
           (Vite + React)  (REST APIs)
                  │
                  ▼
              MySQL Database
                  │
                  ▼
             CRM Data Storage
```

---

## Components

### Frontend

- React
- Vite
- Tailwind CSS

Responsibilities

- Login
- Dashboard
- Customer Management
- Vehicle Management
- Ticket Management
- Inventory
- Reports

---

### Backend

Technology

- PHP 8.2

Responsibilities

- Authentication
- CRUD APIs
- Business Logic
- Database Access

---

### Database

Technology

- MySQL 8

Stores

- Users
- Customers
- Vehicles
- Tickets
- Work Orders
- Inventory
- Suppliers
- Warranty
- Insurance
- Service Logs

---

### Web Server

Technology

- Nginx

Responsibilities

- Reverse Proxy
- HTTP Request Routing
- Frontend Delivery
- API Forwarding

---

### Cloud Infrastructure

Provider

AWS EC2

Operating System

Amazon Linux 2023

Deployment

Docker Containers

- React
- PHP
- MySQL
