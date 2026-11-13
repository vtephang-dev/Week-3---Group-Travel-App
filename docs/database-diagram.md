# Database Diagram — Group Travel App

This diagram shows the database tables and how they relate. Money and dates are
kept simple for MVP #1. Security (Row Level Security) ensures each person only
sees their own `trips`.

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : "has one"
    AUTH_USERS ||--o{ TRIPS : "owns"

    AUTH_USERS {
        uuid id PK "managed by Supabase Auth"
        text email
    }

    PROFILES {
        uuid id PK "= auth.users.id"
        text display_name
        timestamptz created_at
    }

    TRIPS {
        uuid id PK
        uuid owner_id FK "= auth.users.id"
        text name
        text destination
        date start_date
        date end_date
        timestamptz created_at
    }
```

## In plain words
- **auth.users** — the built-in Supabase login table (one row per account).
- **profiles** — one profile per user, created automatically at sign-up.
- **trips** — each trip belongs to the user who created it (`owner_id`). One user
  can own many trips.
