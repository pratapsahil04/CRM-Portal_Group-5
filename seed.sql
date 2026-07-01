-- ============================================================
-- Seed Data — AutoCRM (India Edition)
-- ============================================================
-- Currency: Indian Rupee (₹)
-- Admin password: Admin@CRM12
-- Customer/Technician password: India@2024
-- ============================================================

USE crm;

SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM  ATTACHMENT;
DELETE FROM  MESSAGE;
DELETE FROM CONVERSATION;
DELETE FROM STATUS_HISTORY;
DELETE FROM SLA;
DELETE FROM SERVICE_LOG;
DELETE FROM PARTS_USED;
DELETE FROM INVENTORY_ITEM;
DELETE FROM SUPPLIER;
DELETE FROM WORK_ORDER;
DELETE FROM TICKET;
DELETE FROM VEHICLE_TELEMETRY;
DELETE FROM INSURANCE;
DELETE FROM WARRANTY;
DELETE FROM VEHICLE;
DELETE FROM ADMIN;
DELETE FROM TECHNICIAN;
DELETE FROM CUSTOMER;
DELETE FROM USER;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 1. USERS
-- Admin  : Admin@CRM12  → $2y$10$zT9jfKFM1GqnuiVCBkWrBOrnpUbCzlU/BJ7ClRomI0XMLE1K6fNIq
-- Others : India@2024   → $2y$10$F9KSSiFBwM6vWTop5PtcEu.XioK/Xc8YrbAvd71aEtceLhVKpRGHW
-- ============================================================
INSERT INTO USER (user_id, name, email, password_hash, phone, role, status, created_at) VALUES
-- Admin
(1, 'Rajan Mehta',   'admin@autocrm.in',  '$2y$10$zT9jfKFM1GqnuiVCBkWrBOrnpUbCzlU/BJ7ClRomI0XMLE1K6fNIq', '+919876540001', 'admin',      'active', DATE_SUB(NOW(), INTERVAL 60 DAY)),
-- Customers
(2, 'Arjun Sharma',  'arjun@example.in',  '$2y$10$F9KSSiFBwM6vWTop5PtcEu.XioK/Xc8YrbAvd71aEtceLhVKpRGHW', '+919876540002', 'customer',   'active', DATE_SUB(NOW(), INTERVAL 20 DAY)),
(3, 'Priya Nair',    'priya@example.in',   '$2y$10$F9KSSiFBwM6vWTop5PtcEu.XioK/Xc8YrbAvd71aEtceLhVKpRGHW', '+919876540003', 'customer',   'active', DATE_SUB(NOW(), INTERVAL 12 DAY)),
-- Technicians
(4, 'Suresh Pillai', 'suresh@autocrm.in', '$2y$10$F9KSSiFBwM6vWTop5PtcEu.XioK/Xc8YrbAvd71aEtceLhVKpRGHW', '+919876540004', 'technician', 'active', DATE_SUB(NOW(), INTERVAL 30 DAY)),
(5, 'Deepak Verma',  'deepak@autocrm.in', '$2y$10$F9KSSiFBwM6vWTop5PtcEu.XioK/Xc8YrbAvd71aEtceLhVKpRGHW', '+919876540005', 'technician', 'active', DATE_SUB(NOW(), INTERVAL 25 DAY));

-- ============================================================
-- 2. ROLE EXTENSIONS
-- ============================================================
INSERT INTO ADMIN (admin_id, user_id) VALUES (1, 1);

INSERT INTO CUSTOMER (customer_id, user_id, address) VALUES
(1, 2, '14, MG Road, Bengaluru, Karnataka 560001'),
(2, 3, '7, Anna Salai, Chennai, Tamil Nadu 600002');

INSERT INTO TECHNICIAN (technician_id, user_id, specialization, experience_years, rating) VALUES
(1, 4, 'Engine & Transmission Overhaul', 9, 4.90),
(2, 5, 'Electrical, AC & Diagnostics',   6, 4.70);

-- ============================================================
-- 3. VEHICLES (Indian makes + Indian licence plate format)
--    VIN: 17 chars, no I O Q
-- ============================================================
INSERT INTO VEHICLE (vehicle_id, customer_id, vin, license_plate, make, model, year, mileage, health_score, status) VALUES
(1, 1, 'MA3FJEB1S00001234', 'KA01AB1234', 'Maruti Suzuki', 'Swift Dzire', 2021, 38400,  90, 'active'),
(2, 1, 'MBLFA2BE8G0002345', 'KA03CD5678', 'Tata',          'Nexon EV',   2023, 14200, 97, 'active'),
(3, 2, 'MA1MK2851RP003456', 'TN09EF9012', 'Hyundai',       'Creta',      2020, 55600, 78, 'active');

-- ============================================================
-- 4. WARRANTIES & INSURANCE
-- ============================================================
INSERT INTO WARRANTY (warranty_id, vehicle_id, provider, expiry_date) VALUES
(1, 1, 'Maruti Genuine Warranty', '2026-08-15'),
(2, 2, 'Tata EV Battery Warranty', '2030-01-01');

INSERT INTO INSURANCE (insurance_id, vehicle_id, provider, renewal_date) VALUES
(1, 1, 'HDFC ERGO Auto Insurance',  '2027-03-31'),
(2, 2, 'Bajaj Allianz Motor',       '2026-11-30'),
(3, 3, 'New India Assurance',       '2027-06-15');

-- ============================================================
-- 5. TELEMETRY
-- ============================================================
INSERT INTO VEHICLE_TELEMETRY (telemetry_id, vehicle_id, timestamp, battery_health, fuel_efficiency, dtc_code) VALUES
(1, 1, DATE_SUB(NOW(), INTERVAL 1 HOUR), NULL,  18.5, NULL),
(2, 1, NOW(),                            NULL,  18.2, NULL),
(3, 3, DATE_SUB(NOW(), INTERVAL 2 HOUR), NULL,  11.4, 'P0420');

-- ============================================================
-- 6. SUPPLIERS (Indian)
-- ============================================================
INSERT INTO SUPPLIER (supplier_id, name, contact_person, phone) VALUES
(1, 'Bharat Auto Parts Pvt. Ltd.',  'Ramesh Gupta',   '+911141200011'),
(2, 'Deccan Tyre Distributors',     'Anita Krishnan', '+914466300022');

-- ============================================================
-- 7. INVENTORY (Indian parts, costs in ₹)
-- ============================================================
INSERT INTO INVENTORY_ITEM (item_id, supplier_id, part_number, name, quantity, minimum_quantity) VALUES
(1, 1, 'FLT-OIL-MSZ21',   'Maruti Suzuki Swift Dzire Oil Filter',    40, 8),
(2, 1, 'BRK-PAD-HYN20',   'Hyundai Creta Ceramic Front Brake Pads',  10, 4),
(3, 1, 'BAT-12V-AMRN',    'Amaron 12V AGM Battery (MF44B20L)',         5, 2),
(4, 2, 'TYR-195-60R15',   'MRF ZVTS 195/60R15 Tyre',                 18, 6),
(5, 1, 'FLT-AIR-CRT20',   'Hyundai Creta Cabin Air Filter',            3, 2);

-- ============================================================
-- 8. TICKETS
-- ============================================================
INSERT INTO TICKET (ticket_id, customer_id, vehicle_id, technician_id, title, category, priority, status, created_at) VALUES
(1, 1, 1, 1, 'Engine vibration and check engine light blinking',  'Engine',  'high',   'in_progress', DATE_SUB(NOW(), INTERVAL 20 HOUR)),
(2, 2, 3, 2, 'AC not cooling properly, unusual noise from vents', 'AC',      'medium', 'open',        DATE_SUB(NOW(), INTERVAL 6  HOUR)),
(3, 1, 2, 2, 'EV range dropped by 20%, dashboard warning light',  'Electrical','low',  'closed',      DATE_SUB(NOW(), INTERVAL 7  DAY));

-- ============================================================
-- 9. SLA
-- ============================================================
INSERT INTO SLA (sla_id, ticket_id, response_deadline, resolution_deadline, breached) VALUES
(1, 1, DATE_ADD(DATE_SUB(NOW(), INTERVAL 20 HOUR), INTERVAL 4 HOUR),  DATE_ADD(DATE_SUB(NOW(), INTERVAL 20 HOUR), INTERVAL 72 HOUR), 0),
(2, 2, DATE_ADD(DATE_SUB(NOW(), INTERVAL 6  HOUR), INTERVAL 24 HOUR), DATE_ADD(DATE_SUB(NOW(), INTERVAL 6  HOUR), INTERVAL 7  DAY),  0),
(3, 3, DATE_ADD(DATE_SUB(NOW(), INTERVAL 7  DAY),  INTERVAL 72 HOUR), DATE_ADD(DATE_SUB(NOW(), INTERVAL 7  DAY),  INTERVAL 14 DAY),  0);

-- ============================================================
-- 10. STATUS HISTORY
-- ============================================================
INSERT INTO STATUS_HISTORY (history_id, ticket_id, old_status, new_status, changed_at) VALUES
(1, 1, 'open',        'in_progress', DATE_SUB(NOW(), INTERVAL 19 HOUR)),
(2, 3, 'open',        'in_progress', DATE_SUB(NOW(), INTERVAL 5  DAY)),
(3, 3, 'in_progress', 'resolved',    DATE_SUB(NOW(), INTERVAL 3  DAY)),
(4, 3, 'resolved',    'closed',      DATE_SUB(NOW(), INTERVAL 1  DAY));

-- ============================================================
-- 11. WORK ORDERS (costs in ₹)
-- ============================================================
INSERT INTO WORK_ORDER (work_order_id, ticket_id, technician_id, estimated_cost, actual_cost, status) VALUES
(1, 1, 1, 4500.00, NULL,    'in_progress'),
(2, 3, 2, 2800.00, 2650.00, 'completed');

-- ============================================================
-- 12. SERVICE LOGS
-- ============================================================
INSERT INTO SERVICE_LOG (service_log_id, vehicle_id, work_order_id, service_type, performed_date) VALUES
(1, 2, 2, 'EV Battery Diagnostics & Cell Balancing', DATE_SUB(NOW(), INTERVAL 3 DAY));

-- ============================================================
-- 13. PARTS USED
-- ============================================================
INSERT INTO PARTS_USED (id, work_order_id, inventory_item_id, quantity_used) VALUES
(1, 1, 1, 1),
(2, 2, 5, 1);

-- ============================================================
-- 14. CONVERSATIONS & MESSAGES
-- ============================================================
INSERT INTO CONVERSATION (conversation_id, ticket_id, customer_id, agent_id) VALUES
(1, 1, 1, 1),
(2, 2, 2, 1);

INSERT INTO MESSAGE (message_id, conversation_id, sender_id, message, created_at) VALUES
(1, 1, 2, 'Namaste, gaadi subah cold start par bahut vibrate kar rahi hai aur check engine light blink ho rahi hai.', DATE_SUB(NOW(), INTERVAL 20 HOUR)),
(2, 1, 1, 'Namaste Arjun ji, humne Suresh Pillai ko aapki gaadi assign ki hai. Woh jald hi diagnose karenge.', DATE_SUB(NOW(), INTERVAL 19 HOUR)),
(3, 1, 4, 'Maine OBD scan kiya. Cylinder 2 misfiring chal raha hai. Spark plug aur ignition coil check karna hoga.', DATE_SUB(NOW(), INTERVAL 18 HOUR)),
(4, 2, 3, 'Hello, meri Creta ki AC ek hafte se theek se thanda nahi kar rahi aur kuch khat-khat ki awaaz aa rahi hai.', DATE_SUB(NOW(), INTERVAL 6 HOUR));

-- ============================================================
-- 15. ATTACHMENTS
-- ============================================================
INSERT INTO ATTACHMENT (attachment_id, message_id, file_url) VALUES
(1, 1, 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=1000');
