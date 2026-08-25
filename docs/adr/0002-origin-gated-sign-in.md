# Origin-gated sign-in and sign-up

A User has one Role and may use only one app (Customer → web, Admin → admin). We enforce that at **sign-in and sign-up**, by classifying the request `Origin` against `WEB_ORIGIN` and `ADMIN_ORIGIN`, instead of only later on Role-gated routes.

Wrong-app access is rejected when the browser is on the other app. When Origin is the API (`BETTER_AUTH_URL`) or missing (Swagger, curl), email and password are enough so tooling can still obtain a Session. Public sign-up is rejected on the admin origin.

We considered enforcing Role only on future Admin/Customer routes. That would let an Admin obtain a Session from the web app and shift the rule to every later endpoint. Origin at the auth boundary is the smaller, earlier check; the API/missing-Origin exception keeps this pass testable without the Next.js apps.

Wrong-app sign-in uses the same `UNAUTHORIZED` / `INVALID_EMAIL_OR_PASSWORD` response as an unknown email or a wrong password. A distinct `FORBIDDEN` would let a script tell registered addresses (and Role) from the status code before the password is checked. Sign-up from the admin origin stays `FORBIDDEN` for every email, so it does not enumerate.

`Origin` is a policy boundary, not a security control: non-browser clients can set it arbitrarily. Tooling is allowed when Origin is the API or missing so Swagger and curl can still obtain a Session.
