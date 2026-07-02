# AutoCRM API Documentation

## Base URL

```
http://3.110.196.167/api
```

---

# Authentication

## Login

**POST**

```
/auth/login.php
```

Request

```json
{
  "email": "admin@autocrm.in",
  "password": "Admin@CRM12"
}
```

Response

```json
{
  "success": true,
  "user": {
    "id": 1,
    "role": "Admin"
  }
}
```

---

# Customers

## Get Customers

GET

```
/customer/
```

## Add Customer

POST

```
/customer/
```

## Update Customer

PUT

```
/customer/
```

## Delete Customer

DELETE

```
/customer/
```

---

# Vehicles

GET

```
/vehicle/
```

POST

```
/vehicle/
```

PUT

```
/vehicle/
```

DELETE

```
/vehicle/
```

---

# Tickets

GET

```
/ticket/
```

POST

```
/ticket/
```

PUT

```
/ticket/
```

DELETE

```
/ticket/
```

---

# Inventory

GET

```
/inventory/
```

POST

```
/inventory/
```

---

# Technicians

GET

```
/technician/
```

POST

```
/technician/
```

---

# Reports

GET

```
/reports/
```

---

# Technologies Used

- PHP REST APIs
- JSON
- MySQL
- React Frontend
