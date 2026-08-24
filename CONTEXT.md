# SaaS Kit

The platform API and clients for this SaaS starter. Language here is for product and API concepts shared across web, admin, and server.

## Language

**Health**:
A signal that the API process is accepting HTTP requests. It does not mean dependencies such as PostgreSQL are reachable.
_Avoid_: Liveness, readiness, ping, heartbeat
