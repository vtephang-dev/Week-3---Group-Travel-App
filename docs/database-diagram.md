# Database Diagram

This shows the Group Travel App's tables and how they connect. GitHub renders the
Mermaid diagram below as a picture. See [database-design.md](database-design.md)
for the full column-by-column description.

```mermaid
erDiagram
    profiles ||--o{ trips : "owns"
    profiles ||--o{ trip_members : "is"
    trips ||--o{ trip_members : "has"
    trips ||--o{ invites : "has"
    trips ||--o{ itinerary_items : "has"
    trips ||--o{ ideas : "has"
    trips ||--o{ arrivals : "has"
    trips ||--o{ expenses : "has"
    trips ||--o{ settlements : "has"
    ideas ||--o{ idea_comments : "has"
    expenses ||--o{ expense_splits : "split into"
    profiles ||--o{ expense_splits : "owes"

    profiles {
        uuid id PK
        text display_name
    }
    trips {
        uuid id PK
        uuid owner_id FK
        text name
        text destination
        date start_date
        date end_date
        text main_currency
        text invite_code
    }
    trip_members {
        uuid trip_id PK_FK
        uuid user_id PK_FK
        timestamptz joined_at
    }
    invites {
        uuid id PK
        uuid trip_id FK
        text email
        text token
        uuid invited_by FK
        timestamptz expires_at
    }
    itinerary_items {
        uuid id PK
        uuid trip_id FK
        text title
        date day
        time start_time
        text place
        int cost_cents
        int version
        uuid created_by FK
    }
    ideas {
        uuid id PK
        uuid trip_id FK
        text title
        boolean decided
        text link
        int cost_cents
        uuid created_by FK
    }
    idea_comments {
        uuid id PK
        uuid idea_id FK
        uuid trip_id FK
        text body
        uuid author_id FK
    }
    arrivals {
        uuid id PK
        uuid trip_id FK
        uuid user_id FK
        timestamptz arrive_at
        text location
        text flight_number
    }
    expenses {
        uuid id PK
        uuid trip_id FK
        text description
        int amount_cents
        text currency
        uuid paid_by FK
        text split_mode
        timestamptz deleted_at
    }
    expense_splits {
        uuid expense_id PK_FK
        uuid user_id PK_FK
        uuid trip_id FK
        int share_cents
    }
    settlements {
        uuid id PK
        uuid trip_id FK
        uuid from_user FK
        uuid to_user FK
        int amount_cents
        timestamptz paid_at
    }
```

Notes:
- Every table has Row-Level Security on, scoped to trip members through `trip_id`.
- `profiles.id` matches the Supabase Auth user id.
- Money is always stored as whole cents plus a currency code (no floating-point money).
