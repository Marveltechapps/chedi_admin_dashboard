# CHEDI Farm Club — Admin Dashboard API Contract

**Version:** 1.0.0  
**Date:** 2026-08-22  
**Audience:** Admin Dashboard (`chedi_admin_dashboard`) + Backend (`chedi_web_app_backend`)  
**Member app:** `chedi_web_app` (source of member-facing business logic)

This contract is the source of truth for wiring the Admin Console to the same backend that already serves the member app. It covers every operational action the dashboard performs today (currently against seed data) and every member-app lifecycle the dashboard must be able to observe, approve, reverse, or operate.

---

## 1. Purpose

The member app lets people join Farm Club, pay a one-time membership fee, lease a plot, pay an annual subscription (plus delivery charge), track their plot and weekly baskets, cancel unlocked deliveries, manage profile/addresses, and receive notifications.

The Admin Console must fully operate that business:

| Member-app outcome | Admin must be able to |
|---|---|
| Join + membership payment request | See pending registrations, mark membership paid (activates member + welcome basket), reject, remind |
| Plot browse + lease payment request | See inventory, assign/reserve plots, mark lease paid (creates subscription + delivery schedule), reject, refund |
| Manual annual renewal | Generate renewal bill, remind, mark paid (`billPaid`), pause/resume/cancel |
| Weekly deliveries | Advance ops status, reschedule, fail, cancel; review cancellation requests |
| Weekly basket shown in the app | Compose, lock, publish, pack; add supplements on harvest shortfall |
| My Plot crop stages | Advance crop stages, record yield, push harvest updates |
| In-app notifications | Send to audiences / individual members; templates |
| Support FAQ today; tickets in console | Full ticket CRUD, assign, reply, resolve, close |
| Account settings | View/edit member profile, addresses; suspend / reactivate / cancel |

---

## 2. Base URLs, versioning, headers

| Item | Value |
|---|---|
| API base | `/api/v1` (also mounted at `/api` for `VITE_API_URL=/api`) |
| Admin namespace | `/api/v1/admin` |
| Health | `GET /health` (no auth) |
| Content-Type | `application/json` |
| Body limit | 1 MB |
| Request timeout | `HTTP_REQUEST_TIMEOUT_MS` (default 30s) → `504 TIMEOUT` |
| Correlation | Send `X-Request-Id`; echoed on errors as `error.requestId` |
| Idempotency | Header `Idempotency-Key` (UUID) required on payment mutations; replay window 24h |

### 2.1 Success envelope (admin)

All **admin** endpoints return:

```json
{
  "success": true,
  "message": "Optional human-readable confirmation",
  "data": {},
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  },
  "meta": {}
}
```

`pagination` is omitted on non-list endpoints. `meta` holds filter counts, KPI extras, etc.

Member-app routes keep their existing (often unwrapped) shapes. Admin **must not** depend on member-app response envelopes.

### 2.2 Error envelope (all APIs)

HTTP status is the transport code. Body:

```json
{
  "success": false,
  "message": "Human-readable error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error",
    "details": [{ "field": "email", "message": "Invalid email address" }],
    "requestId": "req_abc123"
  }
}
```

| HTTP | Typical `error.code` |
|---|---|
| 400 | `VALIDATION_ERROR`, `PLOT_UNAVAILABLE`, `PLOT_NOT_COMING_SOON`, `DELIVERY_LOCKED`, `METHOD_NOT_REMOVABLE` |
| 401 | `UNAUTHORIZED`, `OTP_INVALID` |
| 403 | `FORBIDDEN`, `OTP_LOCKED` |
| 404 | `NOT_FOUND`, `MEMBER_NOT_FOUND`, `PLOT_NOT_FOUND`, `PLAN_NOT_FOUND`, `PAYMENT_NOT_FOUND`, `SUBSCRIPTION_NOT_FOUND`, `DELIVERY_NOT_FOUND`, `TICKET_NOT_FOUND`, `BASKET_NOT_FOUND`, `CROP_NOT_FOUND`, `REGISTRATION_NOT_FOUND` |
| 409 | `CONFLICT`, `PHONE_ALREADY_REGISTERED`, `EMAIL_ALREADY_REGISTERED`, `ALREADY_MEMBER`, `DUPLICATE_LEASE`, `PLOT_NOT_AVAILABLE`, `BILL_ALREADY_PAID`, `ALREADY_CANCELLED`, `ALREADY_PAID`, `PAYMENT_CLOSED`, `INVALID_STATUS`, `BASKET_COMPLETE`, `ALREADY_SUBSCRIBED_TO_NOTIFY` |
| 402 | `PAYMENT_REQUIRED` (member app only) |
| 410 | `OTP_EXPIRED` |
| 429 | `RESEND_COOLDOWN` (`details[0].retryAfterSeconds`) |
| 502 | `OTP_DELIVERY_FAILED` |
| 503 | `DB_UNAVAILABLE` |
| 504 | `TIMEOUT` |

`details[]` is always an array. Field-level validation uses `{ field, message }`. OTP verify failures may also include `attemptsRemaining`.

---

## 3. Authentication (staff)

Replace the current shared-secret admin login (`ADMIN_API_KEY` / `chedi-admin-demo`) with staff JWT for the React console. Keep the old payment-approve routes working until the dashboard is switched over (see §18).

### 3.1 Staff JWT

| Token | Lifetime (env) | Storage |
|---|---|---|
| Access | `JWT_ACCESS_EXPIRES_IN` default 3600s | Memory; `Authorization: Bearer <accessToken>` |
| Refresh | `JWT_REFRESH_EXPIRES_IN` default 2592000s | HttpOnly cookie **or** body; rotated on refresh |

Access payload: `{ sub: staffId, role, typ: "staff_access" }`.

All `/api/v1/admin/*` routes except `POST /admin/login` and `POST /admin/refresh` require `requireStaff`.

### 3.2 Auth endpoints

#### `POST /api/v1/admin/login`

```json
{ "email": "anitha@chedi.in", "password": "••••••••" }
```

**201/200 `data`:**

```json
{
  "accessToken": "eyJ…",
  "refreshToken": "rt_…",
  "expiresIn": 3600,
  "tokenType": "Bearer",
  "staff": {
    "id": "anitha",
    "name": "Anitha R.",
    "email": "anitha@chedi.in",
    "role": "super_admin",
    "roleLabel": "Super Admin",
    "initial": "A"
  }
}
```

**Validation:** email required + valid; password required. Unknown / inactive staff → `401 UNAUTHORIZED` (“Invalid admin credentials”).

#### `POST /api/v1/admin/refresh`

```json
{ "refreshToken": "rt_…" }
```

Returns a new token pair (old refresh revoked).

#### `POST /api/v1/admin/logout`

Auth required (or refresh token in body). Revokes the refresh session.

```json
{ "refreshToken": "rt_…" }
```

#### `GET /api/v1/admin/me`

Returns `{ staff }` (same staff object as login).

### 3.3 Roles and permissions

Canonical `role` values (snake_case). Dashboard labels in `roleLabel`.

| `role` | Label | Allowed modules |
|---|---|---|
| `super_admin` | Super Admin | All |
| `farm_manager` | Farm Manager | dashboard (read), plots, crops, baskets, members (read), audit (read) |
| `billing_manager` | Billing Manager | dashboard (read), members (read + billing actions), payments, subscriptions, reports, audit (read) |
| `delivery_manager` | Delivery Manager | dashboard (read), deliveries, cancellations, members (read), baskets (read), audit (read) |
| `support_agent` | Support Agent | dashboard (read), members (read + notify), notifications, support, audit (read) |

Module keys match dashboard tabs: `dashboard`, `members`, `payments`, `subscriptions`, `plots`, `crops`, `baskets`, `deliveries`, `cancellations`, `notifications`, `support`, `reports`, `audit`.

**403 `FORBIDDEN`** when the role cannot perform the action. `GET` of a forbidden module is also 403.

Seed staff (must exist after `npm run seed`):

| id | email | role |
|---|---|---|
| `anitha` | anitha@chedi.in | `super_admin` |
| `murugan` | murugan@chedi.in | `farm_manager` |
| `sundar` | sundar@chedi.in | `billing_manager` |
| `kavya` | kavya@chedi.in | `delivery_manager` |
| `ramesh` | ramesh@chedi.in | `support_agent` |

### 3.4 Actor identity

Mutations stamp `req.staff` (`id`, `name`, `role`) onto:

- `audit_log.actorId` / `actorName`
- payment `approvedBy` / `refundedBy`
- ticket `assignee`
- notification `sentBy`

---

## 4. Pagination, search, filters

List endpoints accept:

| Query | Default | Rules |
|---|---|---|
| `page` | `1` | Integer ≥ 1 |
| `limit` | `20` | Integer 1–100 |
| `q` | — | Case-insensitive search (see each resource) |
| `status` / `filter` | `all` | Resource-specific enum; `all` skips the filter |
| `sort` | resource default | `createdAt:desc` unless noted |

`meta.counts` always reflects **unpaginated** totals per filter chip (so the UI can render chip badges).

Global top-bar search (`q`) is `GET /admin/members?q=` (dashboard switches to Members). Search haystack: `name`, `email`, `phone`, `memberCode`, `city`.

---

## 5. Money, dates, phones, IDs

### 5.1 Money

Backend is source of truth. Amounts are **integer INR rupees** (not paise).

```json
{
  "amountInr": 240000,
  "amountFormatted": "₹2,40,000",
  "currency": "INR"
}
```

Never send or persist PAN/CVV. Checkout on the member app is **payment request only** (`method: "payment_request"`). Admin records the collected channel later (`upi`, `neft`, `imps`, `cash`, `bank_transfer`, `offline`).

Constants (env, also in `app_settings`):

| Key | Default |
|---|---|
| `MEMBERSHIP_FEE_INR` | `500` |
| `DELIVERY_CHARGE_INR` | `10000` |

Plan prices are annual plot fees. Quote total = `plan.priceInr + DELIVERY_CHARGE_INR`.

### 5.2 Dates

| Field style | Format | Example |
|---|---|---|
| Stored date | `YYYY-MM-DD` (UTC calendar) | `2026-08-22` |
| Date-time | ISO-8601 | `2026-08-22T04:30:00.000Z` |
| Display label | Server-computed, `en-GB` | `Sat 22 Aug` / `Jul 2026` |

Admin UI may show labels; it must send ISO/`YYYY-MM-DD` on writes.

### 5.3 Phone / email

- Phone stored E.164: `+91[6-9]\d{9}`
- `phoneDisplay`: `+91 98840 12345`
- Email stored lowercase; max 254 chars
- Name: 2–80 chars
- PIN: `/^\d{6}$/`

### 5.4 Public IDs

| Entity | Canonical `id` | Public / display |
|---|---|---|
| Member | `"0500"` | `memberCode`: `CHEDI-0500` |
| Payment | `pay_<nanoid>` | `ref`: `CHEDI-R-YYYYMMDD-NNN` |
| Subscription | `sub_<nanoid>` | — |
| Delivery | `del_<subscriptionId>_<weekIndex>` or `DLV-####` | — |
| Basket | `wk34` | `weekLabel`: `Week 34 · 22 Aug` |
| Ticket | `TKT-118` | — |
| Cancellation | `CX-01` | — |
| Registration | `reg_<nanoid>` | — |
| Address | `addr_<nanoid>` | — |
| Notification | `ntf_<nanoid>` | — |
| Plot (catalog) | `sivaganga-1` | `name`: `Sivaganga-1` |
| Plan | `family4` \| `family8` \| `family12` | `Family of 4` etc. |

**Any member path param** (`:memberId`) accepts internal `id` **or** `memberCode`.  
**Any payment path param** (`:paymentId`) accepts `id` **or** `ref`.

---

## 6. Canonical enums and state machines

Admin UI historically used friendly aliases (`paid`, `subscription`, `fam8`, `siv-1`). The API uses the **backend/member-app** vocabulary. The dashboard must map display labels; do not send UI aliases on the wire.

### 6.1 Member account status — `accountStatus`

| Value | UI label | Meaning |
|---|---|---|
| `pending` | Membership unpaid | Registration paid request outstanding; `isMember` false or not yet activated |
| `active` | Active | Membership activated |
| `suspended` | Suspended | Account blocked; deliveries paused |
| `cancelled` | Cancelled | Membership ended; plot released |

**Transitions**

```
pending  --activate / mark membership paid-->  active
active   --suspend-------------------------->  suspended
suspended --reactivate--------------------->  active
active|suspended --cancel------------------>  cancelled
```

`cancelled` is terminal for the membership. A new join creates a new member/registration.

**Side effects**

| Action | Member app impact |
|---|---|
| Activate (from pending) | Same as approving membership payment: `isMember=true`, welcome basket dispatched, login OTP starts working |
| Suspend | `subStatus=paused`; cancel deliveries in `scheduled`/`packed`; member cannot start new leases |
| Reactivate | `subStatus=active` if a live subscription exists; deliveries resume next unlocked week |
| Cancel | `subStatus=cancelled`; release plot (`availableUnits++`); cancel future `scheduled`/`packed` deliveries; `hasPlot=false` |

### 6.2 Subscription status — `subStatus` (member denormalized) / `subscriptions.status`

| Value | UI label | Member-app `subscriptions.status` |
|---|---|---|
| `none` | No subscription | (no row) |
| `pending_activation` | Pending activation | `pending_activation` |
| `payment_pending` | Payment pending | `payment_pending` or lease/renewal payment outstanding |
| `active` | Active | `active` |
| `renewal_due` | Renewal due | `active` with `billPaid=false` and `nextBillDue` within 30 days **or** past |
| `paused` | Paused | `paused` |
| `expired` | Expired | `expired` |
| `cancelled` | Cancelled | `cancelled` |
| — | — | `past_due` (legacy member-app; treat as `renewal_due` in admin) |

Filter chips on Subscriptions page:

| Chip `filter` | Includes |
|---|---|
| `all` | any except `none` |
| `active` | `active` |
| `renewal_due` | `renewal_due` |
| `payment_pending` | `payment_pending`, `pending_activation` |
| `paused` | `paused`, `cancelled`, `expired` |

**Transitions (admin)**

```
pending_activation --activate--> active
  (also: reserved plot → leased; member accountStatus → active)

active --pause--> paused
  (cancel deliveries in scheduled|packed)

paused --resume--> active

active|renewal_due --generate bill--> payment_pending
  (creates pending renewal payment)

payment_pending --mark renewal paid--> active  (billPaid=true, cycle extended)
renewal_due --remind--> (notification only)

* except cancelled|expired --cancel--> cancelled
  (release plot, void future deliveries)
```

Marking a **lease** payment paid creates `subscriptions.status=active`, `billPaid=false` (annual bill is for *next* year), seeds 8 weekly deliveries, decrements `plots.availableUnits`, sets `members.activeSubscriptionId` if empty, `hasPlot=true`.

### 6.3 Catalog plot status — `plots.status` (member browse)

| Value | Meaning |
|---|---|
| `available` | Units remain; member can quote/lease |
| `booked` | Fully allocated (`availableUnits=0`) |
| `soon` | Coming soon; member may `POST /plots/:key/notify-me` |

### 6.4 Operational plot status — `opsStatus` (Admin Plots)

Used on the assigned/operational plot view (one row per leased unit / assignment):

| Value | UI label |
|---|---|
| `available` | Available |
| `reserved` | Reserved (pending lease payment) |
| `leased` | Leased |
| `cultivating` | Cultivating |
| `harvesting` | Harvesting |
| `maintenance` | Maintenance |
| `unavailable` | Unavailable |

Lease payment approval: `reserved → leased`.  
Crop stage `ready` or `harvested` sets `opsStatus=harvesting`.

### 6.5 Crop stage — `cropStage`

Order (advance-only, one step):

```
planned → growing → flowering → fruiting → ready → harvested
```

Cannot advance past `harvested`. Target yield default: `12` if `crop.unit=kg`, else `10`. Shortfall when `actualYield < targetYield` after harvest → banner + “Add supplement”.

### 6.6 Payment

**Context** (stored as `payments.context`; member app):

| `context` | Admin UI type chip | Default label |
|---|---|---|
| `membership` | MEMBERSHIP | Farm Club membership (one-time) |
| `lease` | SUBSCRIPTION | Annual subscription · {plotName} · {planName} |
| `renewal` | RENEWAL | Renewal · {plotName} · {planName} |
| `delivery` | DELIVERY | Delivery charge |

**Ledger status** (`payments.status`) — member app + DB:

| DB `status` | Admin UI | Notes |
|---|---|---|
| `pending` | Pending | Awaiting collection |
| `pending` + `dueDate < today` | Overdue | Derived in serializer, not stored |
| `processing` | Pending | Treat as pending for admin actions |
| `succeeded` | Paid | Member app success |
| `failed` | Failed | Collection failed |
| `cancelled` | Cancelled | Admin rejected |
| `refunded` | Refunded | After succeeded |

Admin list filter chips: `all`, `pending` (includes overdue+processing), `overdue`, `paid` (`succeeded`), `failed`, `refunded`.

**Actions**

| Current | Allowed |
|---|---|
| `pending` / `overdue` / `failed` / `processing` | Mark paid, remind, reject (→ `cancelled`) |
| `succeeded` | Receipt, refund (→ `refunded`) |
| `refunded` / `cancelled` | Receipt (if money moved) / view only |

**Mark paid side effects** (must match `lib/payments.js`):

| context | Effect |
|---|---|
| `membership` | `activateMembership`: create/upgrade member, welcome basket, issue is *not* returned to admin (member already has/will get tokens on next OTP login); registration `completed` |
| `lease` | `createSubscriptionFromPayment`; notify member “Payment confirmed” / plot leased |
| `renewal` | `billPaid=true`; notify “Renewal payment confirmed” |
| `delivery` | No subscription change |

Reject of membership returns registration to `pending_payment`.

### 6.7 Basket status

```
draft → review → locked → published → packed
```

Publishing inserts an in-app notification for every member with `subStatus=active`: title `This week’s basket`.

Once `locked`, member delivery cancellation for that week is ineligible (`locked=true`).

### 6.8 Delivery ops status — `opsStatus`

Member app still uses `cancelled` / `locked` / `cancellable` booleans. Admin adds an ops pipeline:

```
scheduled → packed → ready_dispatch → out → delivered
```

Exception transitions: `cancelled`, `failed`, `rescheduled`.

| Action | From | To | Member notification |
|---|---|---|---|
| Pack | `scheduled` | `packed` | — |
| Ready | `packed` | `ready_dispatch` | — |
| Dispatch | `ready_dispatch` | `out` | “Out for delivery” |
| Delivered | `out` | `delivered` | “Delivered” |
| Fail | `out` | `failed` | “We could not deliver…” |
| Cancel | `scheduled` \| `packed` | `cancelled` | “Your delivery has been cancelled.” |
| Reschedule | `scheduled` \| `packed` \| `failed` \| `cancelled` | `rescheduled` then typically back to `scheduled` with new `date` | “Your delivery has been moved to {date}.” |

Filter chips: `all`, `upcoming` (`scheduled|packed|ready_dispatch|out`), `delivered`, `failed` (`failed|cancelled`), `rescheduled`.

Member-app tracking timeline is derived from `opsStatus`:

| opsStatus | Tracking |
|---|---|
| `scheduled` | warehouse done; packed/out/delivered pending |
| `packed` / `ready_dispatch` | packed done; out active |
| `out` | out active |
| `delivered` | all done |
| `failed` / `cancelled` | last done step stays; not delivered |

### 6.9 Cancellation request status

```
pending → approved | rejected
```

`locked=true` means the week’s basket is locked (first two seeded weeks, or basket status ≥ `locked`). Admin **cannot** approve locked requests. UI shows “Basket locked — cannot cancel”; API returns `400 DELIVERY_LOCKED` if approve is attempted.

**Member app today:** `POST /deliveries/:id/cancel` auto-cancels if `cancellable && !locked`. Contract for admin completeness:

1. Always insert a `cancellation_requests` row.
2. If eligible (`!locked && cancellable`): auto-approve, set `deliveries.cancelled=true`, `opsStatus=cancelled`. Request stored as `approved` (visible in history, not the pending queue).
3. If locked: member receives `400 DELIVERY_LOCKED`; request stored as `pending` + `locked=true` so admin can see and reject it.

Pending queue = `status=pending`. Eligible pending (if any non-auto) can be approved.

### 6.10 Support ticket status

```
open → in_progress → resolved → closed
```

First staff reply or assign moves `open → in_progress`. Categories (string, free but seeded): `Delivery`, `Payment`, `Plot`, `Membership`, `Other`. Do **not** persist `waiting` — the dashboard pill map has a leftover label that is not a ticket status.

### 6.11 Notification preferences (member)

```json
{
  "notifications": { "delivery": true, "harvest": true, "promos": false },
  "channel": "push"
}
```

`channel` ∈ `push` | `sms` | `email`. Admin compose still *sends* the chosen channel; member preference is respected for **automated** notifications (`delivery` / `harvest` / `promos`). Manual admin compose always sends.

### 6.12 Welcome basket

Created on membership activation:

```json
{
  "status": "dispatched",
  "etaLabel": "Mon 24 Aug",
  "etaDate": "2026-08-24",
  "imageUrl": "https://…",
  "description": "Seasonal vegetable sample box"
}
```

`status` ∈ `dispatched` | `delivered`. ETA = activation + `welcomeBasketEtaDays` (default 2).

---

## 7. Resource DTOs

Field names below are **response** shapes under `data` (or `data` list items). Write payloads are listed per endpoint.

### 7.1 Staff

```json
{
  "id": "anitha",
  "name": "Anitha R.",
  "email": "anitha@chedi.in",
  "role": "super_admin",
  "roleLabel": "Super Admin",
  "initial": "A",
  "scope": "Full access · all modules"
}
```

### 7.2 Member (admin)

Hydrated from `members` + latest subscription + default address + plot + plan.

```json
{
  "id": "0500",
  "memberCode": "CHEDI-0500",
  "name": "Priya Balan",
  "firstName": "Priya",
  "phone": "+919884012345",
  "phoneDisplay": "+91 98840 12345",
  "email": "priya.balan@email.com",
  "accountStatus": "active",
  "subStatus": "active",
  "isMember": true,
  "memberSince": "2026-07-20",
  "joinedLabel": "20 Jul 2026",
  "hasPlot": true,
  "plotCount": 1,
  "statusLabel": "Subscribed · active",
  "planKey": "family8",
  "planName": "Family of 8",
  "plotKey": "sivaganga-1",
  "plotName": "Sivaganga-1",
  "farmId": "siv",
  "farmName": "Sivaganga Farm",
  "region": "Karaikudi, Sivaganga",
  "city": "Chennai",
  "addressLine": "12, 3rd Cross Street, Besant Nagar",
  "pin": "600090",
  "addressDisplay": "12, 3rd Cross Street, Besant Nagar, Chennai 600090",
  "cycleStart": "2026-07-01",
  "cycleEnd": "2027-07-01",
  "cycleStartLabel": "Jul 2026",
  "cycleEndLabel": "Jul 2027",
  "activeSubscriptionId": "sub_demo_sivaganga",
  "welcomeBasket": { "status": "delivered", "etaDate": "2026-07-22", "etaLabel": "Tue, 22 Jul" },
  "preferences": {
    "notifications": { "delivery": true, "harvest": true, "promos": false },
    "channel": "push"
  },
  "deletedAt": null
}
```

### 7.3 Plan

Matches member-app `toPlan`:

```json
{
  "key": "family8",
  "tag": "POPULAR",
  "name": "Family of 8",
  "priceInr": 240000,
  "priceFormatted": "₹2,40,000",
  "deliveryChargeInr": 10000,
  "deliveryChargeFormatted": "₹10,000",
  "totalInr": 250000,
  "totalFormatted": "₹2,50,000",
  "plotsLabel": "2 plots",
  "sizeLabel": "1,200 sq ft",
  "boxesPerWeek": 2,
  "plotCount": 2,
  "featured": true,
  "features": ["2 dedicated 600 sq ft plots", "2 boxes delivered weekly"]
}
```

Catalog keys: `family4` (₹1,20,000 + ₹10,000), `family8` (₹2,40,000 + ₹10,000), `family12` (₹3,80,000 + ₹10,000).

### 7.4 Catalog plot

Matches member-app `toPlotDetail` plus admin inventory:

```json
{
  "key": "sivaganga-1",
  "name": "Sivaganga-1",
  "status": "available",
  "opsStatus": "cultivating",
  "size": "600 sq ft",
  "state": "Tamil Nadu",
  "district": "Sivaganga",
  "city": "Karaikudi",
  "region": "Karaikudi, Sivaganga",
  "farmId": "siv",
  "farmerName": "Murugan V.",
  "crop": "Mullai",
  "cropKey": "tomato",
  "cropName": "Tomato",
  "cropStage": "ready",
  "plantDate": "2026-07-25",
  "harvestDate": "2026-08-20",
  "targetYield": 12,
  "actualYield": null,
  "unit": "kg",
  "cropCycle": "Seasonal · year-round beds",
  "soil": "Red loam · organic certified",
  "totalUnits": 70,
  "availableUnits": 59,
  "leasedUnits": 11,
  "memberId": "0500",
  "memberCode": "CHEDI-0500",
  "memberName": "Priya Balan",
  "planKey": "family8",
  "imageUrl": "https://…",
  "gallery": [{ "label": "week 32", "imageUrl": "https://…" }],
  "map": { "lat": 10.0735, "lng": 78.7732 },
  "notifyRequestCount": 0
}
```

For multi-unit catalog plots, list endpoints return **one card per catalog plot** with unit counts. The assignment/crop overlay uses the **primary (latest active) lease** on that plot for the ops fields. `GET /admin/plots/:plotKey` includes `leases[]`.

### 7.5 Farm

```json
{
  "id": "siv",
  "name": "Sivaganga Farm",
  "region": "Karaikudi, Sivaganga",
  "farmer": "Murugan V.",
  "plotCount": 2,
  "leasedCount": 1
}
```

Seed farms: `siv` Sivaganga, `the` Periyakulam/Theni, `pud` Pudukkottai.

### 7.6 Crop

```json
{
  "key": "tomato",
  "name": "Tomato",
  "season": "Kharif",
  "unit": "kg"
}
```

Seed: `tomato`, `okra`, `spinach`, `brinjal`, `beans`, `chilli`, `coriander`, `onion`. Season ∈ `Kharif` | `Rabi` | `All`. Unit ∈ `kg` | `bunch`.

### 7.7 Payment (admin)

```json
{
  "id": "pay_seed_lease",
  "ref": "CHEDI-R-20260803-002",
  "memberId": "0500",
  "memberCode": "CHEDI-0500",
  "memberName": "Priya Balan",
  "memberEmail": "priya.balan@email.com",
  "memberPhone": "+91 98840 12345",
  "context": "lease",
  "status": "succeeded",
  "opsStatus": "paid",
  "amountInr": 250000,
  "amountFormatted": "₹2,50,000",
  "currency": "INR",
  "method": "bank_transfer",
  "label": "Annual subscription · Sivaganga-1 · Family of 8",
  "date": "2026-08-03",
  "dueDate": "2026-08-10",
  "collectedAt": "2026-08-03",
  "collectionRef": "NEFT 4471",
  "receiptUrl": null,
  "adminNote": null,
  "approvedAt": "2026-08-03T10:00:00.000Z",
  "approvedBy": "sundar",
  "rejectedAt": null,
  "refundedAt": null,
  "metadata": { "plotKey": "sivaganga-1", "planKey": "family8", "registrationId": null, "subscriptionId": null },
  "requestNotice": "Our team will contact you by email to collect payment, then mark this request as paid from the Admin Dashboard."
}
```

`opsStatus` is the admin chip value: `pending` | `overdue` | `paid` | `failed` | `refunded` | `cancelled`.

Receipt DTO:

```json
{
  "ref": "CHEDI-R-20260803-002",
  "date": "2026-08-03",
  "memberName": "Priya Balan",
  "memberCode": "CHEDI-0500",
  "memberId": "0500",
  "label": "Annual subscription · Sivaganga-1 · Family of 8",
  "method": "Bank transfer",
  "status": "Paid",
  "amountInr": 250000,
  "amountFormatted": "₹2,50,000",
  "rows": [
    { "k": "Receipt no.", "v": "CHEDI-R-20260803-002" },
    { "k": "Member", "v": "Priya Balan" },
    { "k": "Member ID", "v": "CHEDI-0500" },
    { "k": "For", "v": "Annual subscription · Sivaganga-1 · Family of 8" },
    { "k": "Method", "v": "Bank transfer" },
    { "k": "Date", "v": "03 Aug 2026" }
  ]
}
```

### 7.8 Subscription (admin)

```json
{
  "id": "sub_demo_sivaganga",
  "memberId": "0500",
  "memberCode": "CHEDI-0500",
  "memberName": "Priya Balan",
  "plotKey": "sivaganga-1",
  "plotName": "Sivaganga-1",
  "planKey": "family8",
  "planName": "Family of 8",
  "status": "active",
  "subStatus": "active",
  "totalInr": 250000,
  "totalFormatted": "₹2,50,000",
  "cycleStart": "2026-07-01",
  "cycleEnd": "2027-07-01",
  "cycleStartLabel": "Jul 2026",
  "cycleEndLabel": "Jul 2027",
  "billPaid": false,
  "billingMode": "manual",
  "nextBillDue": "2027-07-01",
  "nextBillAmountInr": 250000,
  "nextBillAmountFormatted": "₹2,50,000",
  "boxesPerWeek": 2
}
```

### 7.9 Basket

```json
{
  "id": "wk34",
  "weekLabel": "Week 34 · 22 Aug",
  "weekStart": "2026-08-22",
  "status": "review",
  "items": [
    { "cropKey": "tomato", "cropName": "Tomato", "qty": 2, "unit": "kg", "supp": false },
    { "cropKey": "coriander", "cropName": "Coriander", "qty": 1, "unit": "bunch", "supp": true }
  ]
}
```

`supp=true` → sourced from “CHEDI supply (supplement)”, else “member plots”.

### 7.10 Delivery (admin)

```json
{
  "id": "DLV-3401",
  "memberId": "0500",
  "memberCode": "CHEDI-0500",
  "memberName": "Priya Balan",
  "addressDisplay": "Besant Nagar, Chennai 600090",
  "plotKey": "sivaganga-1",
  "plotName": "Sivaganga-1",
  "subscriptionId": "sub_demo_sivaganga",
  "basketId": "wk34",
  "weekIndex": 0,
  "date": "2026-08-22",
  "dateLabel": "Sat 22 Aug",
  "boxes": 2,
  "boxesLabel": "2 boxes",
  "opsStatus": "packed",
  "cancelled": false,
  "locked": true,
  "cancellable": false,
  "lockReason": "Produce is already being harvested",
  "cancelReason": null
}
```

### 7.11 Cancellation request

```json
{
  "id": "CX-01",
  "deliveryId": "DLV-3402",
  "memberId": "0455",
  "memberCode": "CHEDI-0455",
  "memberName": "Vikram Anand",
  "date": "2026-08-22",
  "dateLabel": "Sat 22 Aug",
  "plotKey": "theni-1",
  "plotName": "Periyakulam-1",
  "reason": "Travelling this weekend",
  "locked": false,
  "status": "pending"
}
```

### 7.12 Ticket

```json
{
  "id": "TKT-118",
  "memberId": "0480",
  "memberCode": "CHEDI-0480",
  "memberName": "Meena Gopal",
  "category": "Delivery",
  "subject": "Last basket arrived late",
  "status": "open",
  "assigneeId": "ramesh",
  "assigneeName": "Ramesh T.",
  "messages": [
    { "id": "msg_1", "who": "Meena Gopal", "staffId": null, "text": "My Saturday basket came Sunday evening.", "createdAt": "2026-08-20T10:00:00.000Z", "timeLabel": "2 days ago" }
  ],
  "createdAt": "2026-08-20T10:00:00.000Z",
  "updatedAt": "2026-08-20T10:00:00.000Z"
}
```

### 7.13 Notification template / sent / member inbox

Template:

```json
{ "key": "pay_reminder", "title": "Payment reminder", "body": "A gentle reminder that your payment is due. Please complete it to keep your membership active." }
```

Seed keys: `pay_reminder`, `pay_received`, `sub_active`, `renewal`, `dlv_scheduled`, `out_delivery`, `delivered`, `crop_update`.

Compose audiences (`audience`):

| Value | Resolves to |
|---|---|
| `all_members` | `accountStatus=active` and not deleted |
| `active_subscribers` | `subStatus=active` |
| `pending_payments` | members with a `pending`/`overdue` payment |
| `renewal_due` | `subStatus=renewal_due` |
| `individual` | requires `memberId` |

Wire values are snake_case. UI labels: All members, Active subscribers, Pending payments, Renewal due, Individual member.

Channels: `push` | `sms` | `email` (UI: Push, SMS, Email).

Sent log item:

```json
{
  "id": "snd_1",
  "icon": "bell",
  "title": "Out for delivery",
  "body": "Your Saturday basket is on the way.",
  "audience": "active_subscribers",
  "audienceLabel": "Active subscribers",
  "channel": "push",
  "memberId": null,
  "recipientCount": 12,
  "createdAt": "2026-08-22T08:00:00.000Z",
  "timeLabel": "2h ago",
  "sentBy": "kavya"
}
```

Member inbox item (also what `GET /api/v1/notifications` returns):

```json
{
  "id": "ntf_abc",
  "icon": "truck",
  "title": "Out for delivery",
  "description": "Your basket is out for delivery and on its way.",
  "createdAt": "2026-08-22T08:00:00.000Z",
  "unread": true,
  "deepLinkTab": "deliveries",
  "deepLinkPath": "/app/deliveries"
}
```

Admin compose maps `body` → member `description`.

### 7.14 Audit

```json
{
  "id": "aud_1",
  "createdAt": "2026-08-19T10:00:00.000Z",
  "timeLabel": "3 days ago",
  "actorId": "anitha",
  "actorName": "Anitha R.",
  "action": "Payment marked paid",
  "entity": "CHEDI-R-20260803-002",
  "entityType": "payment",
  "detail": "Priya Balan · ₹2,40,000",
  "meta": { "memberId": "0500", "paymentId": "pay_seed_lease" }
}
```

Every mutating admin endpoint **must** write an audit row. `entityType` ∈ `member` | `payment` | `subscription` | `plot` | `crop` | `basket` | `delivery` | `cancellation` | `ticket` | `notification` | `staff`.

---

## 8. Endpoints — Dashboard

### `GET /api/v1/admin/dashboard`

Permission: any staff.

**`data`:**

```json
{
  "kpis": {
    "totalMembers": 8,
    "activeMembers": 5,
    "pendingPayments": 4,
    "pendingPaymentsAmountInr": 480500,
    "pendingPaymentsAmountFormatted": "₹4,80,500",
    "activeSubscriptions": 2,
    "renewalsDue": 1,
    "plotsLeased": 5,
    "plotsTotal": 7,
    "plotsAvailable": 1,
    "upcomingDeliveries": 3,
    "revenueCollectedInr": 600500,
    "revenueCollectedFormatted": "₹6,00,500",
    "pendingActionCount": 9
  },
  "pendingActions": [
    {
      "kind": "collect_payment",
      "severity": "overdue",
      "title": "Overdue: Arjun Nair",
      "description": "Annual subscription · Sivaganga-2 · Family of 8 · ₹2,40,000",
      "cta": "Mark paid",
      "href": { "tab": "payments", "paymentId": "pay_…" }
    }
  ],
  "recentActivity": [ "/* AuditEntry, max 6 */" ]
}
```

KPI definitions (must match dashboard):

| KPI | Rule |
|---|---|
| Total members | `deletedAt=null` |
| Active members | `accountStatus=active` |
| Pending payments | `status ∈ pending, processing, failed` **or** derived overdue (count + sum `amountInr`) |
| Active subscriptions | `subStatus=active` |
| Renewals due | `subStatus=renewal_due` (next 30 days window) |
| Plots leased | catalog plots whose `opsStatus ∈ leased, cultivating, harvesting` **or** sum of active leases |
| Upcoming deliveries | `opsStatus ∈ scheduled, packed` |
| Revenue collected | sum `amountInr` where `status=succeeded` (all-time on dashboard) |
| Pending actions | overdue/pending payments + eligible pending cancellations + renewal_due members + open tickets |

Pending action kinds: `collect_payment`, `review_cancellation`, `renewal_due`, `open_ticket`.

Top-bar badge count = `kpis.pendingActionCount`.

---

## 9. Endpoints — Members

### `GET /api/v1/admin/members`

Query: `page`, `limit`, `q`, `filter`.

`filter` ∈ `all` | `active` | `pending` | `suspended` | `renewal`  
(`renewal` = `subStatus=renewal_due`).

Search `q`: name, email, phone, memberCode, city.

**`data`:** `Member[]`  
**`meta.counts`:** `{ all, active, pending, suspended, renewal }`

### `GET /api/v1/admin/members/:memberId`

Full member + nested:

```json
{
  "member": { },
  "addresses": [ { "id": "addr_a1", "label": "Home", "line": "…", "city": "Chennai", "pin": "600090", "isDefault": true } ],
  "paymentMethods": [ { "id": "pm_c2", "kind": "card", "label": "HDFC •••• 4821", "isPrimary": true, "removable": true } ],
  "payments": [ ],
  "deliveries": [ ],
  "subscriptions": [ ],
  "timeline": [ ]
}
```

`timeline` = audit rows where `meta.memberId` matches or `entity` is the memberCode. If empty, synthesize `{ action: "Member joined CHEDI Farm Club", timeLabel: joinedLabel }`.

This payload powers the member drawer tabs: Profile, Payments, Deliveries, Timeline.

### `POST /api/v1/admin/members/:memberId/activate`

From `accountStatus=pending` → `active`.  
If a pending membership payment exists, prefer `POST /admin/payments/:id/mark-paid` (this route is the explicit “activate without collecting” override).  
409 if not `pending`.

Audit: `Member activate`. Notify: “Your account is active.”

### `POST /api/v1/admin/members/:memberId/suspend`

Body optional: `{ "reason": "…" }`.  
409 unless `accountStatus=active`.

Sets `accountStatus=suspended`, `subStatus=paused`, cancels `scheduled|packed` deliveries.

Audit: `Member suspend`. Notify: “Your account has been suspended. Contact support for help.”

### `POST /api/v1/admin/members/:memberId/reactivate`

409 unless `suspended`. Restores `accountStatus=active`, `subStatus=active` if a subscription exists.

Audit: `Member reactivate`. Notify: “Welcome back — your account is active again.”

### `POST /api/v1/admin/members/:memberId/cancel`

Cancels membership **and** subscription. Releases plot (`availableUnits++`, clear assignment), voids future `scheduled|packed` deliveries, `plotKey` null, `hasPlot=false`, `subStatus=cancelled`, `accountStatus=cancelled`. Soft-keeps the member row (unlike member-app `DELETE /me`, which anonymizes).

Audit: `Member cancel`. Notify: “Your membership has been cancelled. We hope to see you again.”

### `PATCH /api/v1/admin/members/:memberId`

Billing/support may patch profile fields the member can also edit:

```json
{
  "name": "Priya Balan",
  "email": "priya.balan@email.com"
}
```

Phone change for admin:

```json
{ "phone": "9884012345" }
```

Validations identical to member `PATCH /me/profile` and Indian mobile rules. Unique email/phone among non-deleted members.

### `POST /api/v1/admin/members/:memberId/plan`

```json
{ "planKey": "family4" }
```

Updates latest subscription `planKey` and member denormalized plan. Does **not** auto-charge; admin may follow with a payment request for pro-rata. 404 `PLAN_NOT_FOUND`. Notify: “Your plan is now {planName}.”

Audit: `Plan changed`.

---

## 10. Endpoints — Payments

### `GET /api/v1/admin/payments`

Query: `page`, `limit`, `q`, `status`, `context`, `memberId`.

`status` ∈ `all` | `pending` | `overdue` | `paid` | `failed` | `refunded`  
(`paid` maps to DB `succeeded`; `pending` includes `processing` and non-overdue `pending`).

`q` searches ref, member name, email, label.

**`meta.counts`:** chip counts.  
**`data`:** `Payment[]`.

**Live today:** `GET /api/v1/admin/payments?status=pending` (shared-secret, unwrapped `{ items, count }`, max 200). New contract wraps + paginates.

### `GET /api/v1/admin/payments/:paymentId`

### `GET /api/v1/admin/payments/:paymentId/receipt`

Returns Receipt DTO. Allowed for `succeeded` and `refunded`. 409 if never collected.

### `POST /api/v1/admin/payments` — create request

Requires `Idempotency-Key`. Permission: billing.

```json
{
  "memberId": "0500",
  "context": "membership",
  "amountInr": 500,
  "dueDate": "2026-08-28",
  "label": null
}
```

| Field | Rules |
|---|---|
| `memberId` | Required; existing non-deleted member **or** pending registration member |
| `context` | `membership` \| `lease` \| `renewal` \| `delivery` |
| `amountInr` | Required, integer > 0 |
| `dueDate` | Optional; default today + 7 days |
| `label` | Optional; else `paymentLabel(context)` |
| `metadata.plotKey` / `planKey` | Required when `context=lease` |
| `metadata.subscriptionId` | Required when `context=renewal` |

Creates `status=pending`, `method=payment_request`. Notifies member: “Payment request — {label} — {amount} due.”

409 if an identical pending request already exists (same member+context+metadata); return the existing payment (idempotent).

### `POST /api/v1/admin/payments/:paymentId/mark-paid`

Requires `Idempotency-Key`. Replaces legacy `POST /admin/payments/:id/approve`.

```json
{
  "collectionRef": "UPI 4471",
  "method": "upi",
  "adminNote": ""
}
```

`method` ∈ `upi` | `neft` | `imps` | `cash` | `bank_transfer` | `offline` (default `offline` if `collectionRef` empty).  
`collectionRef` stored as display method text when present.

409 `INVALID_STATUS` unless current status is `pending|processing|failed`.  
409 `PAYMENT_CLOSED` if `cancelled`.  
If already `succeeded`, return `{ alreadyPaid: true, payment }` (idempotent).

Runs the same fulfillers as today’s `approvePayment` (membership activate / lease subscribe / renewal billPaid).

Audit: `Payment marked paid`. Member notify:

- membership → “Membership activated” / welcome
- lease → “Subscription activated”
- renewal → “Subscription renewed”

### `POST /api/v1/admin/payments/:paymentId/reject`

Legacy alias: `POST /admin/payments/:id/reject`.

```json
{ "adminNote": "Could not collect" }
```

Sets `status=cancelled`. Cannot reject `succeeded` (`409 ALREADY_PAID`). Membership registration returns to `pending_payment`. Member notify: “Payment request cancelled”.

### `POST /api/v1/admin/payments/:paymentId/remind`

No body. Inserts member notification “Payment reminder” with amount. Audit: `Payment reminder sent`. 409 if not collectible (`pending|overdue|failed`).

### `POST /api/v1/admin/payments/:paymentId/refund`

```json
{ "adminNote": "Duplicate collection", "amountInr": null }
```

Only `succeeded`. Full refund default; `amountInr` if present must equal original (partial refunds out of scope for v1). Sets `status=refunded`. Does **not** automatically cancel membership/subscription — admin must take those actions separately.

Audit: `Refund issued`. Notify: “A refund of {amount} has been issued.”

---

## 11. Endpoints — Subscriptions

### `GET /api/v1/admin/subscriptions`

Query: `page`, `limit`, `filter`, `q`.  
`filter` ∈ `all` | `active` | `renewal_due` | `payment_pending` | `paused` (see §6.2).

**`data`:** hydrated members-with-subscription (same as dashboard rows) **or** subscription DTOs that include member name — dashboard needs member + plot + plan + cycle + subStatus.

**`meta.counts`:** `{ all, active, renewal_due, payment_pending, paused }`.

### `POST /api/v1/admin/subscriptions/:memberId/activate`

`subStatus` must be `pending_activation`. Sets member `accountStatus=active`, `subStatus=active`; subscription `active`; reserved plot → `leased`.

Notify: “Your subscription is now active.”

### `POST /api/v1/admin/subscriptions/:memberId/pause`

Active → paused; cancel `scheduled|packed` deliveries.

Notify: “Your deliveries are paused. Resume anytime.”

### `POST /api/v1/admin/subscriptions/:memberId/resume`

Paused → active.

Notify: “Welcome back — your deliveries resume this week.”

### `POST /api/v1/admin/subscriptions/:memberId/renewal-bill`

Creates pending `context=renewal` payment for `plan.priceInr` (or `nextBillAmountInr`), due `defaultDueDate` (today+7 or cycle end). Sets `subStatus=payment_pending`.

Notify: “Your renewal of {amount} is ready. Pay to continue baskets.”

409 `BILL_ALREADY_PAID` if `billPaid=true` and cycle not ended. If a pending renewal already exists, return it.

### `POST /api/v1/admin/subscriptions/:memberId/renewal-remind`

Notification only: “Your subscription is up for renewal soon.” Allowed for `renewal_due` and `payment_pending`.

### `POST /api/v1/admin/subscriptions/:memberId/cancel`

Same plot-release rules as member cancel, but **keeps** `accountStatus=active` (member remains a Farm Club member without a plot). Use member cancel to end membership entirely.

---

## 12. Endpoints — Plots, farms, inventory

### `GET /api/v1/admin/farms`

**`data`:** `Farm[]` with `plotCount` / `leasedCount`.

### `GET /api/v1/admin/plots`

Query: `page`, `limit`, `filter`, `farmId`, `q`.

`filter` ∈ `all` | `available` | `cultivating` | `reserved` | `maintenance`  
(`cultivating` includes `cultivating|harvesting|leased`; `maintenance` includes `maintenance|unavailable`).

**`meta.counts`** for chips.  
**`data`:** catalog plots with ops overlay.

`q` searches name, region, crop, city, district, member name.

### `GET /api/v1/admin/plots/:plotKey`

Plot detail + `leases[]` (subscriptions against this catalog plot) + `notifyMe[]` (members who requested notify-me when `status=soon`).

### `POST /api/v1/admin/plots/:plotKey/assign`

```json
{ "memberId": "0526" }
```

Eligible members: `accountStatus != cancelled` and no current plot assignment (`!hasPlot` / no active lease). Plot must be assignable (`available` with `availableUnits>0` or ops `available`).

Sets assignment, `opsStatus=leased` (or `reserved` if a lease payment is still pending — if member has not paid lease, create a pending `lease` payment request as well). Member `plotKey` updated.

Notify: “Your plot {name} is ready.” Audit: `Plot assigned`.

409 if member already has a live lease on this plot (`DUPLICATE_LEASE`) or no units (`PLOT_NOT_AVAILABLE`).

### `POST /api/v1/admin/plots/:plotKey/unassign`

Releases the current member. Only when subscription is cancelled/paused as part of the same business action, or Super Admin override. Increments `availableUnits`.

### `PATCH /api/v1/admin/plots/:plotKey`

Farm manager. Catalog fields the member app shows:

```json
{
  "status": "available",
  "availableUnits": 59,
  "totalUnits": 70,
  "imageUrl": "https://…",
  "gallery": [{ "label": "week 35", "imageUrl": "https://…" }],
  "crop": "Mullai",
  "opsStatus": "maintenance"
}
```

Setting catalog `status=soon` enables member notify-me. Setting `available` with `availableUnits>0` should notify `plot_notifications` subscribers (new admin job: “This plot is now open.”).

### `POST /api/v1/admin/plots/:plotKey/notify-open`

Sends the “plot now available” notification to all `plot_notifications` rows for this key, then clears them.

---

## 13. Endpoints — Crops & harvest

### `GET /api/v1/admin/crops`

Crop library. **`data`:** `Crop[]`.

### `POST /api/v1/admin/crops`

```json
{ "key": "mint", "name": "Mint", "season": "All", "unit": "bunch" }
```

`key` slug `[a-z0-9-]+`, unique.

### `GET /api/v1/admin/cultivations`

Rows for the Crops page: plots with a `cropKey`.

**`data`:** array of

```json
{
  "plotKey": "sivaganga-1",
  "plotName": "Sivaganga-1",
  "cropKey": "tomato",
  "cropName": "Tomato",
  "unit": "kg",
  "plantDate": "2026-07-25",
  "harvestDate": "2026-08-20",
  "cropStage": "ready",
  "targetYield": 12,
  "actualYield": null,
  "shortfall": false,
  "canAdvance": true,
  "nextStage": "harvested"
}
```

**`meta.shortfalls`:** cultivations where `cropStage=harvested` and `actualYield < targetYield`.

### `POST /api/v1/admin/plots/:plotKey/crop`

Assign / replace crop:

```json
{
  "cropKey": "tomato",
  "plantDate": "2026-07-25",
  "harvestDate": "2026-08-20",
  "targetYield": 12,
  "cropStage": "planned"
}
```

### `POST /api/v1/admin/plots/:plotKey/advance-stage`

No body. Advances `cropStage` by one. If next is `ready` or `harvested`, set `opsStatus=harvesting`.

409 if already `harvested`. Audit: `Crop stage updated` detail `{crop} → {Stage}`.

### `PATCH /api/v1/admin/plots/:plotKey/yield`

```json
{ "actualYield": 7, "targetYield": 12 }
```

When harvested and `actualYield < targetYield`, `meta.shortfall=true`. Dashboard banner uses this.

---

## 14. Endpoints — Weekly basket

### `GET /api/v1/admin/baskets`

**`data`:** `{ "current": Basket, "history": Basket[] }` (current = latest `weekStart`).

### `POST /api/v1/admin/baskets/advance`

Advances **current** basket one step. 409 `BASKET_COMPLETE` at `packed`.  
On `published`: notify all `subStatus=active` members.

### `POST /api/v1/admin/baskets/items`

Add substitution / supplement to **current** basket (allowed in `draft|review`; 409 if `locked` or later unless Super Admin).

```json
{ "cropKey": "onion", "qty": 1, "supp": true }
```

`qty` > 0 required. Crop must exist. Default `supp=true` (admin “Add substitution”).

Audit: `Supplement added`.

### `PATCH /api/v1/admin/baskets/:basketId/items`

Replace full item list (compose UI). Same status gate as add.

### `POST /api/v1/admin/baskets/duplicate`

Copies latest basket into a new `draft` for next week (`weekStart + 7 days`), `supp` flags cleared. Audit: `Basket duplicated`.

Published basket contents are what the member app should show for `deliveries.currentWeek.basket` (replace today’s hardcoded `DEFAULT_BASKET` once this API is live).

---

## 15. Endpoints — Deliveries

### `GET /api/v1/admin/deliveries`

Query: `page`, `limit`, `filter`, `memberId`, `subscriptionId`, `basketId`, `dateFrom`, `dateTo`.

`filter` ∈ `all` | `upcoming` | `delivered` | `failed` | `rescheduled`.

**`meta.counts`** for chips.

### `POST /api/v1/admin/deliveries/:deliveryId/advance`

Moves one step along `scheduled→packed→ready_dispatch→out→delivered`. 409 if not on the happy path.

Notifications on `out` and `delivered` only.

### `POST /api/v1/admin/deliveries/:deliveryId/cancel`

Admin ops cancel (not a member request). Allowed from `scheduled|packed`. Sets `cancelled=true`, `opsStatus=cancelled`, `cancellable=false`, `locked=true`.

### `POST /api/v1/admin/deliveries/:deliveryId/fail`

From `out` only → `failed`.

### `POST /api/v1/admin/deliveries/:deliveryId/reschedule`

```json
{ "date": "2026-08-29" }
```

`date` required, `YYYY-MM-DD`, must be a Saturday (business rule: weekly Saturday delivery). Sets `opsStatus=rescheduled` then `scheduled` with new `date` / `dateLabel`. Allowed from `scheduled|packed|failed|cancelled`.

Notify: “Your delivery has been moved to {dateLabel}.”

---

## 16. Endpoints — Cancellations

### `GET /api/v1/admin/cancellations`

Query: `status` default `pending` (`pending|approved|rejected|all`).

Pending queue is the Cancellations tab.

### `POST /api/v1/admin/cancellations/:id/approve`

Eligible only if `!locked`. Sets request `approved`, delivery `cancelled` / `opsStatus=cancelled`.

Notify: “Your delivery for {date} has been cancelled.”

### `POST /api/v1/admin/cancellations/:id/reject`

Always allowed. Notify: “Your basket is already locked and cannot be cancelled.” (use this copy for locked; for eligible rejects: “We could not cancel this delivery.”)

---

## 17. Endpoints — Notifications

### `GET /api/v1/admin/notifications/templates`

**`data`:** template list.

### `GET /api/v1/admin/notifications/sent`

Query: `page`, `limit`. Recently sent log.

### `POST /api/v1/admin/notifications/send`

```json
{
  "audience": "individual",
  "memberId": "0500",
  "channel": "push",
  "title": "Payment reminder",
  "body": "A gentle reminder that your payment is due.",
  "icon": "bell",
  "deepLinkTab": "subscription",
  "deepLinkPath": "/app/subscription"
}
```

| Field | Rules |
|---|---|
| `title` | Required, 1–80 chars |
| `body` | Optional, max 500 |
| `audience` | Required enum §7.13 |
| `memberId` | Required iff `audience=individual` |
| `channel` | `push` \| `sms` \| `email` |

Inserts one `notifications` row per recipient (member inbox). Appends `notifications_sent` log with `recipientCount`.

Honor member `preferences.notifications` only for automated events, not this endpoint.

Audit: `Notification sent`.

---

## 18. Endpoints — Support

### `GET /api/v1/admin/tickets`

Query: `page`, `limit`, `status`, `category`, `assigneeId`, `q` (subject, member, id).

### `GET /api/v1/admin/tickets/:ticketId`

### `POST /api/v1/admin/tickets/:ticketId/reply`

```json
{ "text": "Checking with the farm team." }
```

`text` required, 1–4000 chars. Appends message with `who=staff.name`. If ticket was `open`, set `in_progress`.

Notify member: title `Support reply`, body = reply text, deep link support.

### `POST /api/v1/admin/tickets/:ticketId/assign`

```json
{ "assigneeId": "ramesh" }
```

Default assignee = current staff if body omitted. Sets `in_progress`.

### `POST /api/v1/admin/tickets/:ticketId/resolve`

→ `resolved`.

### `POST /api/v1/admin/tickets/:ticketId/close`

→ `closed`.

### Member-app companion (required so the console is not empty)

These are **member** routes the backend should add so tickets created in the app appear in admin:

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| `GET` | `/api/v1/support/tickets` | member | — | Member’s tickets |
| `POST` | `/api/v1/support/tickets` | member | `{ category, subject, text }` | Creates `open` ticket |
| `POST` | `/api/v1/support/tickets/:id/messages` | member | `{ text }` | Member reply |

Existing `GET /api/v1/support` (FAQ + contacts) stays public.

---

## 19. Endpoints — Reports

### `GET /api/v1/admin/reports`

Query: `range` ∈ `this_week` | `this_month` | `this_year` (UI: This week / This month / This year). Default `this_month`.

**`data`:**

```json
{
  "range": "this_month",
  "rangeLabel": "This month",
  "revenue": { "amountInr": 0, "amountFormatted": "₹0", "series": [40, 55, 48, 70, 62, 85] },
  "newMembers": { "count": 2, "series": [] },
  "activeSubscriptions": { "count": 2, "renewalsDue": 1, "series": [] },
  "paymentsCollected": { "count": 4, "outstanding": 3, "series": [] },
  "deliveries": { "delivered": 2, "failed": 1, "series": [] },
  "plotUtilization": { "percent": 86, "available": 1, "series": [] }
}
```

`series` is 6 normalized 0–100 points for the sparkline (server may return real weekly buckets).

Definitions vs range:

| Card | Metric |
|---|---|
| Revenue | sum succeeded `amountInr` with `date` in range |
| New members | members with `memberSince` in range |
| Active subscriptions | current `subStatus=active` (snapshot) + renewal_due count |
| Payments collected | count succeeded in range; outstanding = pending+overdue now |
| Deliveries | count `delivered` / `failed` in range |
| Plot utilization | `(plots not available) / total * 100` snapshot |

### `GET /api/v1/admin/reports/export`

Same `range`. Returns `text/csv` (`Content-Disposition: attachment; filename="chedi-report-{range}-{date}.csv"`). Columns: date, category, ref, memberCode, amountInr, status.

---

## 20. Endpoints — Audit & staff

### `GET /api/v1/admin/audit`

Query: `page`, `limit`, `q`, `actorId`, `entityType`, `from`, `to`.  
Default sort `createdAt desc`.

### `GET /api/v1/admin/staff`

**`data`:** all staff with `scope` strings for the Roles panel.

| role | scope copy |
|---|---|
| Super Admin | Full access · all modules |
| Farm Manager | Plots, crops, harvest, baskets |
| Billing Manager | Payments, subscriptions, refunds |
| Delivery Manager | Deliveries, cancellations |
| Support Agent | Support tickets, notifications |

---

## 21. Catalog (plans) admin

So the member app plans stay in sync:

### `GET /api/v1/admin/plans`  
### `PATCH /api/v1/admin/plans/:planKey`

```json
{
  "priceInr": 240000,
  "features": ["…"],
  "featured": true
}
```

`totalInr` is always `priceInr + DELIVERY_CHARGE_INR` (server computed). Changing price does not rewrite historical payments.

### `GET /api/v1/admin/settings`

Returns `app_settings.json` values (membership fee, delivery charge, billing note, audiences, etc.) for the console to display.

### `PATCH /api/v1/admin/settings`

Super Admin only. Whitelist: `membershipFeeInr`, `deliveryChargeInr`, `welcomeBasketEtaDays`, `billingNote`, `paymentRequestNotice`.

---

## 22. Member-app API surface the dashboard must support

Admin does not call these; it must **cause and reflect** their outcomes.

### 22.1 Auth (`/api/v1/auth`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/auth/otp` | public | `{ email }` → OTP email. `resendAvailableInSeconds`, `otpExpiresInSeconds`. Demo may return `demoOtp`. |
| POST | `/auth/otp/resend` | public | Same. |
| POST | `/auth/otp/verify` | public | `{ email, code }` → tokens + member. 404 `MEMBER_NOT_FOUND` if membership not activated. |
| POST | `/auth/refresh` | public | `{ refreshToken }` |
| POST | `/auth/logout` | member | `{ refreshToken }` |
| POST | `/auth/sessions/revoke-all` | member | |

OTP: length `OTP_LENGTH` (4), TTL 300s, resend cooldown 30s, max 3 attempts. Login OTP is **email-only**. Codes: `OTP_INVALID` (401, `attemptsRemaining`), `OTP_LOCKED` (403 after max attempts), `OTP_EXPIRED` (410), `RESEND_COOLDOWN` (429).

**Admin implication:** marking membership paid is what makes `/auth/otp/verify` succeed for that email.

### 22.2 Membership (`/api/v1/membership`)

| Method | Path | Notes |
|---|---|---|
| POST | `/membership/register` | `{ name, phone, email, address:{ line, city, pin, label? } }` → `{ registrationId, membershipFeeInr, includesWelcomeBasket }`. 409 phone/email taken. |
| POST | `/membership/payments` | Idempotency-Key. `{ registrationId, method: "payment_request" }` → pending payment. |
| GET | `/membership/me` | Member summary + fee paid + welcomeBasket. |

Address on register: line, city required; pin 6 digits.

**Admin implication:** pending registrations appear as members with `accountStatus=pending` (hydrate from `registrations` joined to pending membership payments). Mark-paid activates welcome basket (`status=dispatched`, ETA +2 days).

### 22.3 Me (`/api/v1/me`)

| Method | Path | Notes |
|---|---|---|
| GET | `/me` | member, profile, preferences, activeSubscriptionId, subscriptionCount |
| PATCH | `/me/profile` | `{ name?, email? }` |
| POST | `/me/phone/otp` | `{ newPhone }` SMS/email OTP `purpose=phone_change` |
| POST | `/me/phone/verify` | `{ newPhone, code }` |
| PUT | `/me/preferences/notifications` | `{ delivery, harvest, promos, channel }` |
| PUT | `/me/active-subscription` | `{ subscriptionId }` |
| DELETE | `/me` | `{ confirmation: "DELETE" }` soft-delete, revoke sessions, cancel future deliveries |
| POST | `/me/data-export` | 202 export job |

**Admin implication:** drawer profile must show the same name/phone/email/address; deleted members hidden (`deletedAt != null`).

### 22.4 Plots & plans

| Method | Path | Notes |
|---|---|---|
| GET | `/plots` | `q,state,district,city,status,page,pageSize`. `status` default `all`. `meta.filters` + `meta.stats`. |
| GET | `/plots/:plotKey` | Detail + gallery + map |
| POST | `/plots/:plotKey/notify-me` | Only if `status=soon` |
| GET | `/plans` | items + delivery charge |
| GET | `/plans/:planKey` | |
| GET | `/plans/:planKey/produce-shares` | staples + seasonal |

Catalog plot `status=booked` when units exhausted. Lease requires `status=available`.

### 22.5 Subscriptions & payments

| Method | Path | Notes |
|---|---|---|
| GET | `/subscriptions` | `{ items, activeSubscriptionId }` |
| POST | `/subscriptions/quote` | `{ plotKey, planKey }` totals; 400 if plot not available or already leased by member |
| POST | `/subscriptions` | `{ plotKey, planKey, paymentId }` — payment must be `succeeded` + `context=lease` (usually created by admin mark-paid, so this is rarely used in payment-request mode) |
| GET | `/subscriptions/:id` | |
| POST | `/subscriptions/:id/renewal-payments` | Idempotency-Key; pending renewal request |
| GET | `/payments/history` | |
| POST | `/payments` | `{ context, metadata }` lease/renewal payment_request |
| GET | `/payments/:id` | |
| GET | `/payments/:id/receipt` | |
| GET | `/payment-methods` | includes non-removable net-banking |
| POST | `/payment-methods` | `{ kind: "card", number, name, expiry, cvv, setPrimary? }` — PAN never stored |
| POST | `/payment-methods/:id/primary` | |
| DELETE | `/payment-methods/:id` | 400 if `isFixed` |

Billing mode is **manual**. `billPaid` starts `false` after lease (next year’s bill). No auto-charge.

### 22.6 Deliveries, overview, my-plot

| Method | Path | Notes |
|---|---|---|
| GET | `/deliveries?subscriptionId` | schedule + currentWeek basket/tracking; `hasPlot:false` + welcomeBasket if no sub |
| POST | `/deliveries/:id/cancel` | `{ subscriptionId, reason }` — see §6.9 |
| GET | `/overview` | member, welcomeBasket, hasPlot, activeSubscription, nextDelivery, growingNow / leaseTeaser |
| GET | `/my-plot?subscriptionId` | plot detail, farmer, facts, growingNow, gallery |

`growingNow` on member app must eventually come from admin cultivations (crop name + stage label), not the hardcoded Tomato/Spinach list.

First two seeded weeks: `locked=true`, `cancellable=false`, `lockReason="Produce is already being harvested"`. Weeks 3–8 cancellable until basket lock.

Box count on a delivery = plan `boxesPerWeek` (family4=1, family8=2, family12=3).

### 22.7 Addresses, notifications, legal

| Method | Path | Notes |
|---|---|---|
| CRUD | `/addresses` | line, city, pin; first or `setDefault` is default; deleting default promotes another |
| GET | `/notifications` | `unreadOnly=true` optional |
| POST | `/notifications/clear` | delete all for member |
| POST | `/notifications/:id/read` | |
| GET | `/legal/terms` \| `/legal/privacy` | |
| GET | `/support` | FAQ + contacts |

Default delivery address is what admin shows on the Deliveries row (`addressDisplay`).

---

## 23. Cross-cutting business rules

1. **Payment request is the only checkout.** Member `method` must be `payment_request`. Card/net-banking checkout is rejected (`400`). Saved cards remain in Settings for future gateway work.
2. **Membership before lease.** Member-app login requires `isMember=true`. Lease endpoints use `requireMember`.
3. **One live lease per member per catalog plot.** `subscriptions.status ∈ active, past_due`.
4. **Inventory.** Lease fulfillment decrements `availableUnits` (not below 0). Cancel/release increments. When `availableUnits` hits 0, catalog `status` becomes `booked`. *(Live backend today decrements units only and does not flip `status`; implement the flip as part of this contract.)*
5. **Idempotency.** Header `Idempotency-Key` required. Member scopes already in use: `membership_payment`, `payment_create`, `create_subscription`, `renewal_payment`. Admin scopes: `admin_mark_paid`, `admin_create_payment`, `admin_refund`. Keyed by `{ key, scope, memberId|staffId }`. Replay 24h returns the stored body.
6. **Soft delete.** Member `DELETE /me` sets `deletedAt`, scrambles phone, clears email, `isMember=false`. Admin lists exclude these. Historical payments remain.
7. **Welcome basket** is membership-only, not a weekly delivery row.
8. **Manual billing.** Generating a renewal bill does not charge cards. Deliveries continue until admin pauses, cancels, or the product policy stops them for non-payment (`subStatus=payment_pending` should pause *new* week scheduling; in-flight weeks continue).
9. **Suspend vs pause.** Suspend is account-level (no login-blocking required, but no new leases; deliveries cancelled). Pause is subscription-level; member can still log in.
10. **Audit + notify.** If `useAppLogic` currently writes both, the API must too. Automated member notifications still honor `preferences.notifications.delivery|harvest|promos`.
11. **Request timeout / DB.** Never leak Mongo URIs; `503 DB_UNAVAILABLE` with public message.
12. **Saturday deliveries.** New/rescheduled dates must be Saturdays (UTC). Seed schedule: next Saturday + 7-day steps, 8 weeks.

---

## 24. Permission matrix (mutations)

| Endpoint group | super_admin | farm_manager | billing_manager | delivery_manager | support_agent |
|---|---|---|---|---|---|
| Auth / me | ✓ | ✓ | ✓ | ✓ | ✓ |
| Dashboard, audit GET, staff GET | ✓ | ✓ | ✓ | ✓ | ✓ |
| Members GET / drawer | ✓ | ✓ | ✓ | ✓ | ✓ |
| Members activate/suspend/cancel/plan | ✓ | — | ✓ | — | — |
| Payments * | ✓ | — | ✓ | — | — |
| Subscriptions * | ✓ | — | ✓ | — | — |
| Plots assign / catalog PATCH | ✓ | ✓ | — | — | — |
| Crops / stages / yield / baskets | ✓ | ✓ | — | — | — |
| Deliveries / cancellations | ✓ | — | — | ✓ | — |
| Notifications send | ✓ | — | — | — | ✓ |
| Tickets * | ✓ | — | — | — | ✓ |
| Reports | ✓ | — | ✓ | — | — |
| Settings PATCH / plans PATCH | ✓ | — | — | — | — |

GET on a module follows the same module access as the dashboard sidebar.

---

## 25. Notification copy (canonical)

| Event | icon | title | body |
|---|---|---|---|
| Membership paid | `leaf` | Membership activated | Welcome to CHEDI Farm Club! Your membership is active. |
| Lease paid | `sprout` | Subscription activated | Your subscription is active and your weekly baskets are scheduled. |
| Renewal paid | `sprout` | Subscription renewed | Your subscription is active and your weekly baskets are scheduled. |
| Payment reminder | `bell` | Payment reminder | A reminder that your payment of {amount} is due. |
| Refund | `card` | Refund processed | A refund of {amount} has been issued. |
| Payment request created | `card` | Payment request | {label} — {amount} due. |
| Payment rejected | `alert` | Payment request cancelled | Payment {ref} was not approved. Please submit a new request if needed. |
| Member suspend | `users` | Account update | Your account has been suspended. Contact support for help. |
| Member reactivate | `users` | Account update | Welcome back — your account is active again. |
| Member cancel | `users` | Account update | Your membership has been cancelled. We hope to see you again. |
| Plan change | `refresh` | Plan updated | Your plan is now {planName}. |
| Plot assigned | `pin` | Plot assigned | Your plot {name} is ready. |
| Sub activate | `sprout` | Subscription activated | Your subscription is now active. |
| Sub pause | `sprout` | Subscription paused | Your deliveries are paused. Resume anytime. |
| Sub resume | `sprout` | Subscription resumed | Welcome back — your deliveries resume this week. |
| Renewal bill | `refresh` | Renewal reminder | Your renewal of {amount} is ready. Pay to continue baskets. |
| Renewal remind | `refresh` | Renewal reminder | Your subscription is up for renewal soon. |
| Basket published | `basket` | This week’s basket | Your {weekLabel} basket is confirmed. |
| Out for delivery | `truck` | Out for delivery | Your basket is out for delivery. |
| Delivered | `check` | Delivered | Your basket has been delivered. Enjoy! |
| Delivery cancel | `truck` | Delivery update | Your delivery has been cancelled. |
| Delivery fail | `truck` | Delivery update | We could not deliver your basket. We will reschedule. |
| Delivery reschedule | `truck` | Delivery update | Your delivery has been moved to {dateLabel}. |
| Cancellation approved | `truck` | Delivery cancelled | Your delivery for {date} has been cancelled. |
| Cancellation rejected | `truck` | Cancellation declined | Your basket is already locked and cannot be cancelled. |
| Ticket reply | `life` | Support reply | {reply text} |
| Plot leased (system) | `leaf` | Plot leased | Your subscription for {plotName} is active. |
| Lease paid (system) | `check` | Payment confirmed | Your lease payment {ref} was marked paid. Your plot subscription is now active. |
| Renewal paid (system) | `check` | Renewal payment confirmed | Payment {ref} was marked paid. Your renewal bill is settled. |

Icons used in the member app: `leaf`, `sprout`, `bell`, `card`, `users`, `refresh`, `pin`, `basket`, `truck`, `check`, `alert`, `life`.

---

## 26. Audit action strings

Use these exact `action` values (dashboard icon mapping keys off them):

`Payment marked paid`, `Payment reminder sent`, `Payment request created`, `Refund issued`, `Member activate`, `Member suspend`, `Member reactivate`, `Member cancel`, `Plan changed`, `Plot assigned`, `Crop stage updated`, `Supplement added`, `Basket {status}`, `Basket duplicated`, `Delivery {opsStatus}`, `Cancellation approved`, `Cancellation rejected`, `Subscription activated`, `Subscription paused`, `Subscription resumed`, `Renewal bill generated`, `Renewal reminder sent`, `Notification sent`, `Ticket reply`, `Ticket assigned`, `Ticket resolved`, `Ticket closed`.

---

## 27. Legacy admin routes (keep until dashboard cutover)

Mounted today under `/api/v1/admin` with **shared secret** (`Authorization: Bearer $ADMIN_API_KEY` or `X-Admin-Key`):

| Method | Path | Behavior |
|---|---|---|
| POST | `/admin/login` | `{ password }` → `{ token: adminKey }` |
| GET | `/admin/payments?status=` | Unwrapped `{ items, count }` via `toPaymentAdmin` |
| POST | `/admin/payments/:paymentId/approve` | `{ approvedBy, adminNote }` → mark succeeded + fulfill |
| POST | `/admin/payments/:paymentId/reject` | `{ rejectedBy, adminNote }` |

Static demo UI: `GET /admin` (Express static). The React Admin Dashboard **must not** use the shared secret once staff JWT is live. During migration, `mark-paid` may internally call the same `approvePayment()` helper so member-app e2e (`scripts/e2e-api.js`) keeps working.

E2E currently approves with the legacy route after member payment requests — that path remains the source of membership/lease/renewal fulfillment logic.

---

## 28. Implementation mapping (dashboard → API)

| Dashboard UI | API |
|---|---|
| Sign in | `POST /admin/login` |
| KPI cards / pending actions / recent activity | `GET /admin/dashboard` |
| Members chips + table + search | `GET /admin/members` |
| Member drawer | `GET /admin/members/:id` |
| Activate / Suspend / Reactivate / Cancel | `POST /admin/members/:id/{activate,suspend,reactivate,cancel}` |
| Change plan | `POST /admin/members/:id/plan` |
| Assign / change plot | `POST /admin/plots/:plotKey/assign` |
| Send notification (from drawer) | navigate + `POST /admin/notifications/send` audience=individual |
| Payments chips + table | `GET /admin/payments` |
| Create request | `POST /admin/payments` |
| Mark paid | `POST /admin/payments/:id/mark-paid` |
| Remind | `POST /admin/payments/:id/remind` |
| Refund | `POST /admin/payments/:id/refund` |
| Receipt modal | `GET /admin/payments/:id/receipt` |
| Subscriptions chips + actions | `GET /admin/subscriptions` + activate/pause/resume/renewal-bill/renewal-remind/cancel |
| Farm cards + plot filters | `GET /admin/farms` + `GET /admin/plots` |
| Plot detail modal | `GET /admin/plots/:plotKey` |
| Advance crop stage | `POST /admin/plots/:plotKey/advance-stage` |
| Add supplement | `POST /admin/baskets/items` |
| Crop library | `GET /admin/crops` |
| Weekly basket + advance + duplicate | `GET /admin/baskets`, `POST /admin/baskets/advance`, `POST /admin/baskets/duplicate` |
| Delivery pipeline | `GET /admin/deliveries` + advance/cancel/fail/reschedule |
| Cancellation queue | `GET /admin/cancellations` + approve/reject |
| Compose + sent | templates GET, send POST, sent GET |
| Tickets | `GET /admin/tickets` + reply/assign/resolve/close |
| Reports + CSV | `GET /admin/reports`, `GET /admin/reports/export` |
| Audit + roles | `GET /admin/audit`, `GET /admin/staff` |

---

## 29. Status / identifier translation cheat sheet

| Admin seed / UI (today) | API (canonical) |
|---|---|
| Member id `CHEDI-0500` | `memberCode`; path also accepts `0500` |
| Plan `fam4` / `fam8` / `fam12` | `family4` / `family8` / `family12` |
| Plot `siv-1` | `sivaganga-1` (catalog key) |
| Plot `the-1` | `theni-1` |
| Plot `pud-1` | `pudukkottai-1` |
| Payment type `subscription` | `context: "lease"` |
| Payment status `paid` | `status: "succeeded"`, `opsStatus: "paid"` |
| Payment ref `PMT-260803-02` | `ref: "CHEDI-R-YYYYMMDD-NNN"` (display); path uses `id` or `ref` |
| Delivery status `out` | `opsStatus: "out"` |
| Basket `week` string | `weekLabel` + `weekStart` |

---

## 30. Collections (Mongo)

Existing: `members`, `registrations`, `addresses`, `payment_methods`, `plots`, `plans`, `produce_shares`, `subscriptions`, `payments`, `deliveries`, `notifications`, `plot_notifications`, `otps`, `sessions`, `idempotency`, `data_exports`, `counters`.

Add for this contract:

| Collection | Purpose |
|---|---|
| `staff` | Admin users, roles, password hashes |
| `staff_sessions` | Refresh tokens (`typ=staff`) |
| `audit_log` | Append-only admin actions |
| `farms` | Farm cards |
| `crops` | Crop library |
| `cultivations` | Per-plot crop stage / yield |
| `baskets` | Weekly basket documents |
| `cancellation_requests` | Member cancel queue |
| `tickets` | Support tickets + embedded or sibling `ticket_messages` |
| `notification_templates` | Compose templates |
| `notifications_sent` | Admin send log |
| `app_settings` | Singleton fees / copy |

---

## 31. Live code vs this contract

Facts confirmed from the three apps as of this version:

| Area | Live today | This contract |
|---|---|---|
| Admin Dashboard data | In-memory `seed.ts` only; `VITE_API_URL` unused | All tabs call `/api/v1/admin/*` |
| Admin auth | Shared secret `chedi-admin-demo` + static `/admin` page | Staff JWT (`adminConsole` files exist but are **not mounted** and miss `lib/response`, `middleware/staffAuth`, `lib/admin/auth.service`) |
| Payments admin | Approve/reject pending only; DB status `succeeded` | Mark paid / remind / refund / create request; UI `paid` ↔ `succeeded` |
| Subscriptions pause/resume/renewal bill | Orphan `lib/admin/subscriptions.service.js` (unmounted) | Mounted admin subscription commands |
| Baskets / crops | Orphan `lib/admin/baskets.service.js`; no `crops`/`baskets` seed | Full basket + cultivation APIs |
| Member-app tickets, pause, plan change | **None** — FAQ only; pause/plan-change are admin-only | Admin implements them; member ticket create is a companion route so the queue is not empty |
| Member data export | Backend `POST /me/data-export` exists; **UI button does not call it** | Keep backend; out of admin v1 unless Settings is wired |
| `growingNow` / weekly basket in member app | Hardcoded arrays in `overview.js` / `deliveries.js` | Driven by cultivations + published basket |
| `app_settings.json` | File exists, **not loaded by routes** | `GET/PATCH /admin/settings` is the loader |
| Create-pay `context` | Dashboard store has `selectVal2`; modal has **no type picker** | API requires `context`; dashboard should add the picker |
| Global search placeholder | Only Members list filters on `q` | `GET /admin/members?q=` is the search API; other tabs keep their own `q` |

## 32. Out of scope for v1

- Partial refunds, gateway capture/void, webhooks other than stub `POST /payments/webhooks/:provider`
- Auto-debit / stored-card charges (member Settings card add remains a stub)
- Multi-plot assignment UX beyond plan `plotCount` (Family of 8 still leases catalog plots one at a time)
- Real-time WebSocket ops board (poll dashboard/lists)
- Staff invite / password-reset APIs (seeded staff only until specified)
- Ticket status `waiting` (pill leftover only)
- Enforcing RBAC in the current seed UI (API must enforce; UI currently allows every role every tab)

---

*This document supersedes the Admin Dashboard’s in-memory `seed.ts` / `useAppLogic.ts` as the behavioral spec. Member-app routes remain as implemented in `chedi_web_app_backend/routes/*` except where §18 and §22.6 explicitly extend them (tickets, cancellation records, live basket / growingNow). Payment fulfillment must stay centralized in `lib/payments.js` (`approvePayment` / `activateMembership` / `createSubscriptionFromPayment`) so the member app and admin console cannot diverge.*
