-- ============================================================
-- Auto Service Management System — MySQL Schema
-- With full input constraints, CHECK rules, and guards
-- ============================================================

-- ----------------------------------------------------------------
-- USERS & ROLES
-- ----------------------------------------------------------------

CREATE TABLE USER (
    user_id       INT          NOT NULL AUTO_INCREMENT,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone         VARCHAR(20),
    role          ENUM('customer','technician','admin') NOT NULL,
    status        ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active',
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id),
    UNIQUE KEY uq_user_email (email),

    -- name must not be blank whitespace
    CONSTRAINT chk_user_name_nonempty
        CHECK (CHAR_LENGTH(TRIM(name)) > 0),

    -- basic email shape: local@domain.tld
    CONSTRAINT chk_user_email_format
        CHECK (email REGEXP '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$'),

    -- password hash must be a non-empty bcrypt / argon2 string
    CONSTRAINT chk_user_password_nonempty
        CHECK (CHAR_LENGTH(TRIM(password_hash)) > 0),

    -- phone: digits, spaces, +, -, (, ) only; 7–20 chars when supplied
    CONSTRAINT chk_user_phone_format
        CHECK (phone IS NULL
               OR (phone REGEXP '^[0-9 +\\-().]{7,20}$')),

    -- created_at must not be in the far future
    CONSTRAINT chk_user_created_at
        CHECK (created_at <= '2100-01-01 00:00:00')
);

CREATE TABLE CUSTOMER (
    customer_id     INT  NOT NULL AUTO_INCREMENT,
    user_id         INT  NOT NULL,
    membership_tier ENUM('bronze','silver','gold','platinum') NOT NULL DEFAULT 'bronze',
    loyalty_points  INT  NOT NULL DEFAULT 0,
    address         TEXT,

    PRIMARY KEY (customer_id),
    UNIQUE KEY uq_customer_user (user_id),

    CONSTRAINT fk_customer_user FOREIGN KEY (user_id)
        REFERENCES USER (user_id) ON DELETE CASCADE ON UPDATE CASCADE,

    -- points cannot go negative
    CONSTRAINT chk_customer_loyalty_points
        CHECK (loyalty_points >= 0),

    -- address must not be blank when supplied
    CONSTRAINT chk_customer_address_nonempty
        CHECK (address IS NULL OR CHAR_LENGTH(TRIM(address)) > 0)
);

CREATE TABLE TECHNICIAN (
    technician_id    INT          NOT NULL AUTO_INCREMENT,
    user_id          INT          NOT NULL,
    specialization   VARCHAR(100),
    experience_years INT          NOT NULL DEFAULT 0,
    rating           DECIMAL(3,2) NOT NULL DEFAULT 0.00,

    PRIMARY KEY (technician_id),
    UNIQUE KEY uq_technician_user (user_id),

    CONSTRAINT fk_technician_user FOREIGN KEY (user_id)
        REFERENCES USER (user_id) ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT chk_technician_experience
        CHECK (experience_years >= 0 AND experience_years <= 60),

    CONSTRAINT chk_technician_rating
        CHECK (rating >= 0.00 AND rating <= 5.00),

    -- specialization must not be blank when supplied
    CONSTRAINT chk_technician_specialization_nonempty
        CHECK (specialization IS NULL OR CHAR_LENGTH(TRIM(specialization)) > 0)
);

CREATE TABLE ADMIN (
    admin_id INT NOT NULL AUTO_INCREMENT,
    user_id  INT NOT NULL,

    PRIMARY KEY (admin_id),
    UNIQUE KEY uq_admin_user (user_id),

    CONSTRAINT fk_admin_user FOREIGN KEY (user_id)
        REFERENCES USER (user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ----------------------------------------------------------------
-- VEHICLES
-- ----------------------------------------------------------------

CREATE TABLE VEHICLE (
    vehicle_id    INT         NOT NULL AUTO_INCREMENT,
    customer_id   INT         NOT NULL,
    vin           VARCHAR(17) NOT NULL,
    license_plate VARCHAR(20) NOT NULL,
    make          VARCHAR(50) NOT NULL,
    model         VARCHAR(50) NOT NULL,
    year          YEAR        NOT NULL,
    mileage       INT         NOT NULL DEFAULT 0,
    health_score  TINYINT     NOT NULL DEFAULT 100,
    status        ENUM('active','inactive','totaled') NOT NULL DEFAULT 'active',

    PRIMARY KEY (vehicle_id),
    UNIQUE KEY uq_vehicle_vin (vin),

    CONSTRAINT fk_vehicle_customer FOREIGN KEY (customer_id)
        REFERENCES CUSTOMER (customer_id) ON DELETE RESTRICT ON UPDATE CASCADE,

    -- VIN: exactly 17 alphanumeric chars, no I O Q (ISO 3779)
    CONSTRAINT chk_vehicle_vin_format
        CHECK (vin REGEXP '^[A-HJ-NPR-Z0-9]{17}$'),

    -- license plate: alphanumeric + hyphen/space, 1–10 chars
    CONSTRAINT chk_vehicle_license_plate
        CHECK (license_plate REGEXP '^[A-Z0-9 \\-]{1,10}$'),

    CONSTRAINT chk_vehicle_make_nonempty
        CHECK (CHAR_LENGTH(TRIM(make)) > 0),

    CONSTRAINT chk_vehicle_model_nonempty
        CHECK (CHAR_LENGTH(TRIM(model)) > 0),

    -- year between first car (1885) and 2100
    CONSTRAINT chk_vehicle_year
        CHECK (year >= 1885 AND year <= 2100),

    CONSTRAINT chk_vehicle_mileage
        CHECK (mileage >= 0 AND mileage <= 9999999),

    CONSTRAINT chk_vehicle_health_score
        CHECK (health_score BETWEEN 0 AND 100)
);

CREATE TABLE WARRANTY (
    warranty_id INT          NOT NULL AUTO_INCREMENT,
    vehicle_id  INT          NOT NULL,
    provider    VARCHAR(100) NOT NULL,
    expiry_date DATE         NOT NULL,

    PRIMARY KEY (warranty_id),

    CONSTRAINT fk_warranty_vehicle FOREIGN KEY (vehicle_id)
        REFERENCES VEHICLE (vehicle_id) ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT chk_warranty_provider_nonempty
        CHECK (CHAR_LENGTH(TRIM(provider)) > 0),

    -- expiry must be valid date
    CONSTRAINT chk_warranty_expiry_future
        CHECK (expiry_date >= '2000-01-01')
);

CREATE TABLE INSURANCE (
    insurance_id INT          NOT NULL AUTO_INCREMENT,
    vehicle_id   INT          NOT NULL,
    provider     VARCHAR(100) NOT NULL,
    renewal_date DATE         NOT NULL,

    PRIMARY KEY (insurance_id),

    CONSTRAINT fk_insurance_vehicle FOREIGN KEY (vehicle_id)
        REFERENCES VEHICLE (vehicle_id) ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT chk_insurance_provider_nonempty
        CHECK (CHAR_LENGTH(TRIM(provider)) > 0),

    -- renewal date must be valid date
    CONSTRAINT chk_insurance_renewal_future
        CHECK (renewal_date >= '2000-01-01')
);

CREATE TABLE VEHICLE_TELEMETRY (
    telemetry_id    INT          NOT NULL AUTO_INCREMENT,
    vehicle_id      INT          NOT NULL,
    timestamp       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    battery_health  DECIMAL(5,2),
    fuel_efficiency DECIMAL(5,2),
    dtc_code        VARCHAR(20),           -- Diagnostic Trouble Code (e.g. P0301)

    PRIMARY KEY (telemetry_id),
    INDEX idx_telemetry_vehicle_time (vehicle_id, timestamp),

    CONSTRAINT fk_telemetry_vehicle FOREIGN KEY (vehicle_id)
        REFERENCES VEHICLE (vehicle_id) ON DELETE CASCADE ON UPDATE CASCADE,

    -- telemetry cannot be timestamped in the far future
    CONSTRAINT chk_telemetry_timestamp
        CHECK (timestamp <= '2100-01-01 00:00:00'),

    -- battery health: 0–100 %
    CONSTRAINT chk_telemetry_battery
        CHECK (battery_health IS NULL
               OR (battery_health >= 0 AND battery_health <= 100)),

    -- fuel efficiency: 0–200 km/l (or mpg) — physically sane ceiling
    CONSTRAINT chk_telemetry_fuel
        CHECK (fuel_efficiency IS NULL
               OR (fuel_efficiency >= 0 AND fuel_efficiency <= 200)),

    -- DTC code format: one letter + 4 digits (SAE J2012)
    CONSTRAINT chk_telemetry_dtc_format
        CHECK (dtc_code IS NULL
               OR dtc_code REGEXP '^[PBCU][0-9]{4}$')
);

-- ----------------------------------------------------------------
-- TICKETS
-- ----------------------------------------------------------------

CREATE TABLE TICKET (
    ticket_id     INT          NOT NULL AUTO_INCREMENT,
    customer_id   INT          NOT NULL,
    vehicle_id    INT          NOT NULL,
    technician_id INT,                       -- nullable until assigned
    title         VARCHAR(255) NOT NULL,
    category      VARCHAR(100) NOT NULL,
    priority      ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
    status        ENUM('open','in_progress','on_hold','resolved','closed') NOT NULL DEFAULT 'open',
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (ticket_id),
    INDEX idx_ticket_status   (status),
    INDEX idx_ticket_customer (customer_id),
    INDEX idx_ticket_vehicle  (vehicle_id),

    CONSTRAINT fk_ticket_customer   FOREIGN KEY (customer_id)
        REFERENCES CUSTOMER (customer_id)   ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_ticket_vehicle    FOREIGN KEY (vehicle_id)
        REFERENCES VEHICLE (vehicle_id)     ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_ticket_technician FOREIGN KEY (technician_id)
        REFERENCES TECHNICIAN (technician_id) ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT chk_ticket_title_nonempty
        CHECK (CHAR_LENGTH(TRIM(title)) > 0),

    CONSTRAINT chk_ticket_category_nonempty
        CHECK (CHAR_LENGTH(TRIM(category)) > 0),

    CONSTRAINT chk_ticket_created_at
        CHECK (created_at <= '2100-01-01 00:00:00')
);

CREATE TABLE SLA (
    sla_id              INT        NOT NULL AUTO_INCREMENT,
    ticket_id           INT        NOT NULL,
    response_deadline   DATETIME   NOT NULL,
    resolution_deadline DATETIME   NOT NULL,
    breached            TINYINT(1) NOT NULL DEFAULT 0,

    PRIMARY KEY (sla_id),
    UNIQUE KEY uq_sla_ticket (ticket_id),

    CONSTRAINT fk_sla_ticket FOREIGN KEY (ticket_id)
        REFERENCES TICKET (ticket_id) ON DELETE CASCADE ON UPDATE CASCADE,

    -- resolution deadline must be after response deadline
    CONSTRAINT chk_sla_deadline_order
        CHECK (resolution_deadline > response_deadline),

    CONSTRAINT chk_sla_breached
        CHECK (breached IN (0, 1))
);

CREATE TABLE STATUS_HISTORY (
    history_id INT         NOT NULL AUTO_INCREMENT,
    ticket_id  INT         NOT NULL,
    old_status VARCHAR(50) NOT NULL,
    new_status VARCHAR(50) NOT NULL,
    changed_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (history_id),
    INDEX idx_status_history_ticket (ticket_id),

    CONSTRAINT fk_status_history_ticket FOREIGN KEY (ticket_id)
        REFERENCES TICKET (ticket_id) ON DELETE CASCADE ON UPDATE CASCADE,

    -- a status transition must actually change something
    CONSTRAINT chk_status_history_different
        CHECK (old_status <> new_status),

    CONSTRAINT chk_status_history_old_valid
        CHECK (old_status IN ('open','in_progress','on_hold','resolved','closed')),

    CONSTRAINT chk_status_history_new_valid
        CHECK (new_status IN ('open','in_progress','on_hold','resolved','closed')),

    CONSTRAINT chk_status_history_changed_at
        CHECK (changed_at <= '2100-01-01 00:00:00')
);

-- ----------------------------------------------------------------
-- CONVERSATIONS & MESSAGING
-- ----------------------------------------------------------------

CREATE TABLE CONVERSATION (
    conversation_id INT NOT NULL AUTO_INCREMENT,
    ticket_id       INT NOT NULL,
    customer_id     INT NOT NULL,
    agent_id        INT,                      -- FK → USER (any staff member)

    PRIMARY KEY (conversation_id),
    UNIQUE KEY uq_conversation_ticket (ticket_id),

    CONSTRAINT fk_conversation_ticket   FOREIGN KEY (ticket_id)
        REFERENCES TICKET (ticket_id)       ON DELETE CASCADE  ON UPDATE CASCADE,
    CONSTRAINT fk_conversation_customer FOREIGN KEY (customer_id)
        REFERENCES CUSTOMER (customer_id)   ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_conversation_agent    FOREIGN KEY (agent_id)
        REFERENCES USER (user_id)           ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE MESSAGE (
    message_id      INT      NOT NULL AUTO_INCREMENT,
    conversation_id INT      NOT NULL,
    sender_id       INT      NOT NULL,        -- FK → USER
    message         TEXT     NOT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (message_id),
    INDEX idx_message_conversation (conversation_id),

    CONSTRAINT fk_message_conversation FOREIGN KEY (conversation_id)
        REFERENCES CONVERSATION (conversation_id) ON DELETE CASCADE  ON UPDATE CASCADE,
    CONSTRAINT fk_message_sender       FOREIGN KEY (sender_id)
        REFERENCES USER (user_id)                 ON DELETE RESTRICT ON UPDATE CASCADE,

    -- message body must not be blank
    CONSTRAINT chk_message_nonempty
        CHECK (CHAR_LENGTH(TRIM(message)) > 0),

    CONSTRAINT chk_message_created_at
        CHECK (created_at <= '2100-01-01 00:00:00')
);

CREATE TABLE ATTACHMENT (
    attachment_id INT          NOT NULL AUTO_INCREMENT,
    message_id    INT          NOT NULL,
    file_url      VARCHAR(512) NOT NULL,

    PRIMARY KEY (attachment_id),

    CONSTRAINT fk_attachment_message FOREIGN KEY (message_id)
        REFERENCES MESSAGE (message_id) ON DELETE CASCADE ON UPDATE CASCADE,

    -- must be an absolute HTTP/HTTPS URL
    CONSTRAINT chk_attachment_url_format
        CHECK (file_url REGEXP '^https?://.+'),

    CONSTRAINT chk_attachment_url_nonempty
        CHECK (CHAR_LENGTH(TRIM(file_url)) > 0)
);

-- ----------------------------------------------------------------
-- WORK ORDERS & SERVICE
-- ----------------------------------------------------------------

CREATE TABLE WORK_ORDER (
    work_order_id  INT           NOT NULL AUTO_INCREMENT,
    ticket_id      INT           NOT NULL,
    technician_id  INT           NOT NULL,
    estimated_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    actual_cost    DECIMAL(10,2),
    status         ENUM('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',

    PRIMARY KEY (work_order_id),
    INDEX idx_work_order_ticket (ticket_id),

    CONSTRAINT fk_work_order_ticket     FOREIGN KEY (ticket_id)
        REFERENCES TICKET (ticket_id)         ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_work_order_technician FOREIGN KEY (technician_id)
        REFERENCES TECHNICIAN (technician_id) ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT chk_work_order_estimated_cost
        CHECK (estimated_cost >= 0),

    CONSTRAINT chk_work_order_actual_cost
        CHECK (actual_cost IS NULL OR actual_cost >= 0),

    -- actual cost only makes sense when the order is completed
    CONSTRAINT chk_work_order_actual_cost_status
        CHECK (actual_cost IS NULL OR status = 'completed')
);

CREATE TABLE SERVICE_LOG (
    service_log_id INT          NOT NULL AUTO_INCREMENT,
    vehicle_id     INT          NOT NULL,
    work_order_id  INT          NOT NULL,
    service_type   VARCHAR(100) NOT NULL,
    performed_date DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (service_log_id),
    INDEX idx_service_log_vehicle (vehicle_id),

    CONSTRAINT fk_service_log_vehicle    FOREIGN KEY (vehicle_id)
        REFERENCES VEHICLE (vehicle_id)         ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_service_log_work_order FOREIGN KEY (work_order_id)
        REFERENCES WORK_ORDER (work_order_id)   ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT chk_service_log_type_nonempty
        CHECK (CHAR_LENGTH(TRIM(service_type)) > 0),

    -- service cannot be logged for a far future date
    CONSTRAINT chk_service_log_performed_date
        CHECK (performed_date <= '2100-01-01 00:00:00')
);

-- ----------------------------------------------------------------
-- INVENTORY & PARTS
-- ----------------------------------------------------------------

CREATE TABLE SUPPLIER (
    supplier_id    INT          NOT NULL AUTO_INCREMENT,
    name           VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    phone          VARCHAR(20),

    PRIMARY KEY (supplier_id),

    CONSTRAINT chk_supplier_name_nonempty
        CHECK (CHAR_LENGTH(TRIM(name)) > 0),

    CONSTRAINT chk_supplier_contact_nonempty
        CHECK (contact_person IS NULL
               OR CHAR_LENGTH(TRIM(contact_person)) > 0),

    CONSTRAINT chk_supplier_phone_format
        CHECK (phone IS NULL
               OR (phone REGEXP '^[0-9 +\\-().]{7,20}$'))
);

CREATE TABLE INVENTORY_ITEM (
    item_id          INT          NOT NULL AUTO_INCREMENT,
    supplier_id      INT          NOT NULL,
    part_number      VARCHAR(100) NOT NULL,
    name             VARCHAR(150) NOT NULL,
    quantity         INT          NOT NULL DEFAULT 0,
    minimum_quantity INT          NOT NULL DEFAULT 0,

    PRIMARY KEY (item_id),
    UNIQUE KEY uq_inventory_part_number (part_number),
    INDEX idx_inventory_part_number (part_number),

    CONSTRAINT fk_inventory_supplier FOREIGN KEY (supplier_id)
        REFERENCES SUPPLIER (supplier_id) ON DELETE RESTRICT ON UPDATE CASCADE,

    -- part number: alphanumeric + hyphens only
    CONSTRAINT chk_inventory_part_number_format
        CHECK (part_number REGEXP '^[A-Z0-9\\-]{1,100}$'),

    CONSTRAINT chk_inventory_name_nonempty
        CHECK (CHAR_LENGTH(TRIM(name)) > 0),

    CONSTRAINT chk_inventory_quantity
        CHECK (quantity >= 0),

    CONSTRAINT chk_inventory_minimum_quantity
        CHECK (minimum_quantity >= 0),

    -- current stock must be at least the minimum threshold
    CONSTRAINT chk_inventory_quantity_vs_minimum
        CHECK (quantity >= minimum_quantity)
);

CREATE TABLE PARTS_USED (
    id                INT NOT NULL AUTO_INCREMENT,
    work_order_id     INT NOT NULL,
    inventory_item_id INT NOT NULL,
    quantity_used     INT NOT NULL DEFAULT 1,

    PRIMARY KEY (id),
    UNIQUE KEY uq_parts_used (work_order_id, inventory_item_id),

    CONSTRAINT fk_parts_work_order     FOREIGN KEY (work_order_id)
        REFERENCES WORK_ORDER (work_order_id)     ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_parts_inventory_item FOREIGN KEY (inventory_item_id)
        REFERENCES INVENTORY_ITEM (item_id)       ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT chk_parts_quantity_used
        CHECK (quantity_used > 0 AND quantity_used <= 10000)
);
