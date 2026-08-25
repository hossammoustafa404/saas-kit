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
Whether a User is an Admin or a Customer. Not a permission.
_Avoid_: Permission, type, access level, user

**Customer**:
A User who uses the web app. A Customer is created by public sign-up. A Customer cannot use the admin app.
_Avoid_: Client, end user, member, buyer

**Admin**:
A User who uses the admin app and cannot use the web app. An Admin is never created by public sign-up; the first Admin is seeded, and later Admins are created only by an existing Admin.
_Avoid_: Owner, operator, superadmin, staff

**Session**:
Proof that a User is signed in. The API treats a request as that User while the Session is valid.
_Avoid_: Token, JWT, login
