# Super Admin Role is superadmin, not admin

The better-auth admin plugin's `adminRoles` value is the Super Admin Role. ADR 0003 set that to `admin`. Membership position `admin` (owner / admin / member) would collide with that Role value once Organizations land.

We store Super Admin as `superadmin` and configure `adminRoles: ["superadmin"]` with `defaultRole: "customer"`. The plugin `roles` map names those same values (`superadmin`, `customer`) so `admin` is not a Role. This supersedes ADR 0003's `admin` Role value. ADR 0003's Customer-vs-better-auth-default-`user` decision stays.

Origin-gating compares Role to `superadmin` and `customer`. Seed creates the Super Admin User with Role `superadmin` (and migrates an existing seeded `admin` Role to `superadmin`).
