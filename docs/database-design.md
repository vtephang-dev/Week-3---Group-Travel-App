# Database Design

This describes the Supabase (PostgreSQL) database behind the Group Travel App.
Every table has Row-Level Security (RLS) turned on, so people only see data for
trips they belong to.

## What does the app need to save?

- A profile for each person who signs up (their display name).
- Each trip, with its name, destination, dates, and the currency the group settles up in.
- Who is a member of each trip.
- Invitations sent to people by email (which can expire or be cancelled).
- Itinerary items (the plan): what, when, where, and an optional cost.
- Ideas the group is still deciding on, with an optional link and rough cost.
- Comments on each idea.
- Each person's arrival details (time, place, flight/train number).
- Shared expenses (who paid, amount, currency), kept even after they are removed.
- How each expense is split between people.
- Payments people make to each other to settle up.

## Tables

### Table name: profiles
**What it stores:** one row per signed-up user, with the name shown in the app.

| Column | Type | Required? | What it means |
| --- | --- | --- | --- |
| id | uuid | Yes | The user's id (same as their Supabase Auth id). |
| display_name | text | No | The name shown in the app (their email by default). |
| created_at | timestamp | Yes | When the profile was created. |

**Who can see it?** You can see your own profile, and the profiles of people who share a trip with you.
**Who can add, change, or delete it?** Created automatically on signup; you can update your own.

### Table name: trips
**What it stores:** one row per trip.

| Column | Type | Required? | What it means |
| --- | --- | --- | --- |
| id | uuid | Yes | Unique id for the trip. |
| owner_id | uuid | Yes | The user who created it (the organizer). |
| name | text | Yes | The trip's name. |
| destination | text | No | Where the trip is going. |
| start_date | date | No | When the trip starts. |
| end_date | date | No | When the trip ends. |
| main_currency | text | Yes | The currency the group settles up in (default USD). |
| invite_code | text | Yes | A short code used for the shareable join link. |
| created_at | timestamp | Yes | When the trip was created. |

**Who can see it?** Members of the trip (the owner plus anyone in trip_members).
**Who can add, change, or delete it?** Anyone signed in can create a trip (they become the owner); only the owner can change or delete it.

### Table name: trip_members
**What it stores:** which users belong to which trips (a many-to-many link).

| Column | Type | Required? | What it means |
| --- | --- | --- | --- |
| trip_id | uuid | Yes | The trip. |
| user_id | uuid | Yes | The member. |
| joined_at | timestamp | Yes | When they joined. |

**Who can see it?** Members of the trip.
**Who can add, change, or delete it?** You can add yourself (join) and remove yourself (leave); the organizer can remove any member.

### Table name: invites
**What it stores:** named invitations to a trip, which expire and can be cancelled.

| Column | Type | Required? | What it means |
| --- | --- | --- | --- |
| id | uuid | Yes | Unique id for the invitation. |
| trip_id | uuid | Yes | The trip the invitation is for. |
| email | text | Yes | The invited person's email. |
| token | text | Yes | A unique token for the invitation. |
| invited_by | uuid | Yes | Who sent it. |
| expires_at | timestamp | Yes | When it stops being valid (14 days by default). |
| accepted_at | timestamp | No | When it was accepted, if ever. |
| created_at | timestamp | Yes | When it was created. |

**Who can see it?** Members of the trip.
**Who can add, change, or delete it?** A member can create one; the organizer or the person who sent it can cancel it.

### Table name: itinerary_items
**What it stores:** the trip's plan — one row per planned activity.

| Column | Type | Required? | What it means |
| --- | --- | --- | --- |
| id | uuid | Yes | Unique id. |
| trip_id | uuid | Yes | The trip. |
| title | text | Yes | What the plan is. |
| details | text | No | Extra notes. |
| day | date | No | The date. |
| start_time | time | No | The time. |
| place | text | No | Where it is. |
| cost_cents | integer | No | Optional cost, stored in whole cents. |
| currency | text | No | Currency code for the cost. |
| version | integer | Yes | A counter used to prevent two edits overwriting each other. |
| created_by | uuid | Yes | Who added it. |
| created_at | timestamp | Yes | When it was added. |

**Who can see it?** Members of the trip.
**Who can add, change, or delete it?** Any member can add or edit; you can delete your own, and the organizer can delete any.

### Table name: ideas
**What it stores:** suggestions the group is still deciding on.

| Column | Type | Required? | What it means |
| --- | --- | --- | --- |
| id | uuid | Yes | Unique id. |
| trip_id | uuid | Yes | The trip. |
| title | text | Yes | The idea. |
| notes | text | No | Extra notes. |
| decided | boolean | Yes | Whether the group has decided on it. |
| link | text | No | Optional link. |
| cost_cents | integer | No | Optional rough cost, in whole cents. |
| created_by | uuid | Yes | Who added it. |
| created_at | timestamp | Yes | When it was added. |

**Who can see it?** Members of the trip.
**Who can add, change, or delete it?** Any member can add; you can edit or delete your own (or the organizer can); only the organizer can mark an idea "decided".

### Table name: idea_comments
**What it stores:** comments on an idea.

| Column | Type | Required? | What it means |
| --- | --- | --- | --- |
| id | uuid | Yes | Unique id. |
| idea_id | uuid | Yes | The idea the comment is on. |
| trip_id | uuid | Yes | The trip (for access checks). |
| body | text | Yes | The comment text. |
| author_id | uuid | Yes | Who wrote it. |
| created_at | timestamp | Yes | When it was written. |

**Who can see it?** Members of the trip.
**Who can add, change, or delete it?** Any member can add; you can edit or delete only your own.

### Table name: arrivals
**What it stores:** each person's arrival details.

| Column | Type | Required? | What it means |
| --- | --- | --- | --- |
| id | uuid | Yes | Unique id. |
| trip_id | uuid | Yes | The trip. |
| user_id | uuid | Yes | Whose arrival it is. |
| arrive_at | timestamp | No | The arrival time (destination local time). |
| location | text | No | The place (airport, station…). |
| notes | text | No | Extra notes. |
| flight_number | text | No | Optional flight or train number. |
| created_at | timestamp | Yes | When it was added. |

**Who can see it?** Members of the trip.
**Who can add, change, or delete it?** You can add, edit, and delete only your own arrival.

### Table name: expenses
**What it stores:** shared costs. Removed costs are kept (soft-deleted), never erased.

| Column | Type | Required? | What it means |
| --- | --- | --- | --- |
| id | uuid | Yes | Unique id. |
| trip_id | uuid | Yes | The trip. |
| description | text | Yes | What the cost was for. |
| amount_cents | integer | Yes | The total, in whole cents. |
| currency | text | Yes | Currency code (default USD). |
| paid_by | uuid | Yes | Who paid. |
| split_mode | text | Yes | How it was split (even or custom). |
| deleted_at | timestamp | No | When it was removed, if it was (soft delete). |
| created_at | timestamp | Yes | When it was added. |

**Who can see it?** Members of the trip.
**Who can add, change, or delete it?** Any member can add, edit, or remove a cost (removal is a soft delete).

### Table name: expense_splits
**What it stores:** how much of each expense each person owes.

| Column | Type | Required? | What it means |
| --- | --- | --- | --- |
| expense_id | uuid | Yes | The expense. |
| user_id | uuid | Yes | The person who shares it. |
| trip_id | uuid | Yes | The trip (for access checks). |
| share_cents | integer | Yes | That person's share, in whole cents. |

**Who can see it?** Members of the trip.
**Who can add, change, or delete it?** Any member of the trip.

### Table name: settlements
**What it stores:** payments people make to each other to settle up.

| Column | Type | Required? | What it means |
| --- | --- | --- | --- |
| id | uuid | Yes | Unique id. |
| trip_id | uuid | Yes | The trip. |
| from_user | uuid | Yes | Who paid. |
| to_user | uuid | Yes | Who received the payment. |
| amount_cents | integer | Yes | The payment amount, in whole cents. |
| currency | text | No | Currency code. |
| paid_at | timestamp | Yes | When it was paid. |
| created_by | uuid | Yes | Who recorded it. |
| created_at | timestamp | Yes | When it was recorded. |

**Who can see it?** Members of the trip.
**Who can add, change, or delete it?** A member can record a payment they made; you can delete one you recorded.

## How the tables connect

- One person has one profile. Each profile belongs to one user.
- One person can own many trips. Each trip has one owner.
- One trip has many members, and one person can be in many trips (through trip_members).
- One trip has many invites, itinerary items, ideas, arrivals, expenses, and settlements. Each of those belongs to one trip.
- One idea has many comments. Each comment belongs to one idea.
- One expense has many splits. Each split belongs to one expense and one person.
- Each person has at most one arrival per trip (one row per person).

## Access rules (Row-Level Security)

- [x] RLS is turned on for every table.
- [x] Each table has a rule that limits access to members of the trip (checked through `trip_id`), so a non-member sees none of a trip's data.
- [x] Tested with two accounts: members share a trip's data; a non-member could not see the other trip's information; co-members can see each other's names.

Security helper: a `SECURITY DEFINER` function `can_access_trip(trip_id)` returns
true if the current user owns or is a member of the trip. Every trip-child table's
policies call it, which avoids RLS recursion.

## Database diagram

See [database-diagram.md](database-diagram.md) (a Mermaid diagram that GitHub renders as a picture).

## Migration files

- [x] Every change to the database is saved as a SQL migration file in `supabase/migrations/`.
- [x] Each migration file's name says what it does (e.g. `20261115030000_invites_and_currency.sql`).
