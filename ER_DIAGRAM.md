# AutoCRM Database ER Diagram

## Entity Relationship Diagram

```text
                USERS
                  │
          ┌───────┴────────┐
          │                │
          ▼                ▼
      CUSTOMERS      TECHNICIANS
          │
          ▼
      VEHICLES
          │
          ▼
       TICKETS
          │
    ┌─────┴─────┐
    ▼           ▼
WORK_ORDERS  SERVICE_LOGS
    │
    ▼
PARTS_USED
    │
    ▼
INVENTORY
    │
    ▼
SUPPLIERS

VEHICLES
    │
 ┌──┴───┐
 ▼      ▼
WARRANTY
INSURANCE
```

---

## Main Tables

- Users
- Customers
- Vehicles
- Tickets
- Work Orders
- Service Logs
- Inventory
- Suppliers
- Parts Used
- Warranty
- Insurance

---

## Relationships

Customer → Multiple Vehicles

Vehicle → Multiple Tickets

Ticket → One Work Order

Work Order → Multiple Parts

Inventory → Multiple Suppliers

Vehicle → Warranty

Vehicle → Insurance
