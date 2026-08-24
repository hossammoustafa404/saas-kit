# Origin-gated sign-in and sign-up

A User has one Role and may use only one app (Customer → web, Admin → admin). We enforce that at **sign-in and sign-up**, by classifying the request `Origin` against `WEB_ORIGIN` and `ADMIN_ORIGIN`, instead of only later on Role-gated routes.

Wrong-app access is rejected when the browser is on the other app. When Origin is the API (`BETTER_AUTH_URL`) or missing (Swagger, curl), email and password are enough so tooling can still obtain a Session. Public sign-up is rejected on the admin origin.

We considered enforcing Role only on future Admin/Customer routes. That would let an Admin obtain a Session from the web app and shift the rule to every later endpoint. Origin at the auth boundary is the smaller, earlier check; the API/missing-Origin exception keeps this pass testable without the Next.js apps.
