# SaaS Kit

The platform API and clients for this SaaS starter. Language here is for product and API concepts shared across web, admin, and server.

## Language

**Health**:
A signal that the API process is accepting HTTP requests. It does not mean dependencies such as PostgreSQL are reachable.
_Avoid_: Liveness, readiness, ping, heartbeat

**User**:
An authenticated person with a name and an email. Every login, Session, and email belongs to a User. A User has exactly one Role.
_Avoid_: Account, client, person

**Role**:
Whether a User is a Super Admin or a Customer. Not a permission.
_Avoid_: Permission, type, access level, user

**Customer**:
A User who uses the web app. A Customer is created by public sign-up. A Customer cannot use the admin app.
_Avoid_: Client, end user, member, buyer

**Super Admin**:
A User who uses the admin app and cannot use the web app. A Super Admin is never created by public sign-up; the first Super Admin is seeded, and later Super Admins are created only by an existing Super Admin. Stored as Role `superadmin`.
_Avoid_: Admin, owner, operator, staff

**Session**:
Proof that a User is signed in. The API treats a request as that User while the Session is valid.
_Avoid_: Token, JWT, login

**Event**:
A fact that a User did something that matters to the product. The auth Events are user signed up, email verified, user signed in, and user signed out. Sign-up does not include signed in. Failed auth, get-session, and Health are not Events. An Event is not a Log and not a Trace.
_Avoid_: Trace, span, log, login, capture

**Trace**:
The path of one HTTP request through the API, including database work. A Trace can exist with no User (for example a failed sign-in). Health is not traced. A Trace is not a product fact.
_Avoid_: Event, span, request log, log

**Metric**:
A number over time (count or latency), not a product fact. Auth has no custom Metrics. A later feature may add one. User id, email, and Session id are never Metric attributes.
_Avoid_: Event, Trace, counter, dashboard

**Log**:
A line written by the process logger (info, warn, or error). When tracing is on, a Log carries trace_id so it can join a Trace. HTTP 4xx adds a warn Log; HTTP 5xx adds an error Log. Info Logs still exist (boot, Prisma connected, and so on). A Log never includes email, password, or the request body. A Log is not an Event.
_Avoid_: Event, Trace, capture
