#!/usr/bin/env python3
import sqlite3
import os
import sys

SQLITE_PATH = "/home/ezedinmoh/Web-Projects/smart-nextjs/db.sqlite3"
OUTPUT_PATH = "/home/ezedinmoh/Web-Projects/smart-nextjs/prisma/migration.sql"

# Map SQLite table name -> PostgreSQL table name
TABLE_MAP = {
    "users_user": "users_user",
    "users_userprofile": "users_userprofile",
    "account_emailaddress": "users_emailaddress",
    "users_notificationread": "users_notificationread",
    "users_activitylog": "users_activitylog",
    "books_category": "books_category",
    "books_book": "books_book",
    "books_bookreview": "books_bookreview",
    "borrow_bookrequest": "borrow_bookrequest",
    "borrow_borrowrecord": "borrow_borrowrecord",
    "dashboard_systemsettings": "dashboard_systemsettings",
    "payments_payment": "payments_payment",
    "payments_stripepayment": "payments_stripepayment",
    "payments_chapapayment": "payments_chapapayment",
}

# Dependency order for inserts (least dependent first)
TABLE_ORDER = [
    "users_user",
    "users_userprofile",
    "account_emailaddress",
    "users_notificationread",
    "users_activitylog",
    "books_category",
    "books_book",
    "books_bookreview",
    "borrow_bookrequest",
    "borrow_borrowrecord",
    "dashboard_systemsettings",
    "payments_payment",
    "payments_stripepayment",
    "payments_chapapayment",
]

def format_val(val, col_name, table):
    if val is None:
        return "NULL"
    
    # Check for specific boolean column mapping based on standard schemas
    # SQLite represents booleans as 0/1
    is_bool_col = False
    if table == "users_user" and col_name in ("is_superuser", "is_staff", "is_active"):
        is_bool_col = True
    elif table == "account_emailaddress" and col_name in ("verified", "primary"):
        is_bool_col = True
    elif table == "borrow_bookrequest" and col_name == "notified":
        is_bool_col = True
    elif table == "borrow_borrowrecord" and col_name == "fine_paid":
        is_bool_col = True

    if is_bool_col:
        return "true" if val else "false"

    if isinstance(val, (int, float)):
        return str(val)

    # Convert string / text value
    s = str(val)
    # Escape single quotes in Postgres strings
    escaped = s.replace("'", "''")
    return f"'{escaped}'"

def main():
    if not os.path.exists(SQLITE_PATH):
        print(f"Error: SQLite database not found at {SQLITE_PATH}", file=sys.stderr)
        sys.exit(1)
        
    conn = sqlite3.connect(SQLITE_PATH)
    cursor = conn.cursor()

    # Get tables present in SQLite
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    sqlite_tables = {row[0] for row in cursor.fetchall()}

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        # Start SQL output
        f.write("-- Smart Library Migration Script (SQLite -> PostgreSQL)\n")
        f.write("-- Generated dynamically by Antigravity\n\n")
        
        # We can temporarily disable triggers if user runs as superuser, or just rely on order
        f.write("BEGIN;\n\n")

        for table in TABLE_ORDER:
            if table not in sqlite_tables:
                print(f"Skipping table {table} (not in SQLite)")
                continue

            pg_table = TABLE_MAP[table]
            
            # Get SQLite column metadata
            cursor.execute(f"PRAGMA table_info({table})")
            cols_info = cursor.fetchall()
            col_names = [info[1] for info in cols_info]
            
            # Fetch all rows from table
            cursor.execute(f"SELECT * FROM \"{table}\"")
            rows = cursor.fetchall()

            if not rows:
                f.write(f"-- Table {pg_table} is empty in SQLite\n\n")
                continue

            f.write(f"-- Migrating {table} -> {pg_table} ({len(rows)} rows)\n")
            
            # Map SQLite column names to Prisma mapping equivalents if different
            # For account_emailaddress, the user_id column is 'user_id' in SQLite and 'user_id' in PostgreSQL maps to 'user_id'
            # Let's write the SQL inserts
            col_list = ", ".join(f'"{c}"' for c in col_names)
            
            for row in rows:
                vals_str = []
                for idx, val in enumerate(row):
                    vals_str.append(format_val(val, col_names[idx], table))
                
                insert_line = f"INSERT INTO \"{pg_table}\" ({col_list}) VALUES ({', '.join(vals_str)}) ON CONFLICT DO NOTHING;\n"
                f.write(insert_line)
            
            f.write("\n")

        # Reset sequences for serial primary keys
        f.write("-- Reset auto-increment sequences\n")
        
        autoincrement_tables = [
            "users_user",
            "users_userprofile",
            "account_emailaddress",
            "users_notificationread",
            "users_activitylog",
            "books_category",
            "books_book",
            "books_bookreview",
            "borrow_bookrequest",
            "borrow_borrowrecord",
            "dashboard_systemsettings",
            "payments_stripepayment",
            "payments_chapapayment",
        ]
        
        for table in autoincrement_tables:
            if table not in sqlite_tables:
                continue
            pg_table = TABLE_MAP[table]
            seq_reset = (
                f"SELECT setval(pg_get_serial_sequence('\"{pg_table}\"', 'id'), "
                f"COALESCE((SELECT MAX(id) FROM \"{pg_table}\"), 1));\n"
            )
            f.write(seq_reset)

        f.write("\nCOMMIT;\n")

    conn.close()
    print(f"Successfully generated migration SQL at {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
