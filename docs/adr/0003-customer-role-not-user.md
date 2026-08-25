# Role value is customer, not user

The `adminRoles: ["admin"]` value is superseded by [ADR 0004](0004-super-admin-role-is-superadmin.md). Customer vs better-auth default `user` stays.

The better-auth admin plugin defaults Users who are not Super Admins to Role `user`. In this product **User** is the person; the two Roles are **Super Admin** and **Customer**. Storing `user` as a Role would collide with that language forever.

We configure the admin plugin with `defaultRole: "customer"`. Public sign-up creates a Customer. Readers of better-auth snippets that check `role === "user"` must map that to Customer.
