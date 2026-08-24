# Role value is customer, not user

The better-auth admin plugin defaults non-Admin Users to Role `user`. In this product **User** is the person; the two Roles are **Admin** and **Customer**. Storing `user` as a Role would collide with that language forever.

We configure the admin plugin with `defaultRole: "customer"` and `adminRoles: ["admin"]`. Public sign-up and seeded Admins use those values. Readers of better-auth snippets that check `role === "user"` must map that to Customer.
