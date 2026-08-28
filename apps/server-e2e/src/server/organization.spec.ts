import {
  ADMIN_ORIGIN,
  SEED_ADMIN_EMAIL,
  SEED_ADMIN_PASSWORD,
  WEB_ORIGIN,
  cookieHeader,
  createVerifiedCustomerSession,
  getSession,
  signIn,
  signOut,
  uniqueOrganizationSlug,
} from '../support/auth-client';
import {
  createOrganization,
  getActiveMember,
  getFullOrganization,
  listOrganizations,
  setActiveOrganization,
} from '../support/organization-client';

describe('Customer Organization workspace', () => {
  it('should create no Organization on sign-up', async () => {
    const session = await createVerifiedCustomerSession();

    const listed = await listOrganizations(session);

    expect(listed.status).toBe(200);
    expect(listed.data).toEqual([]);
  });

  it('should leave Active Organization unset when the Customer has zero Memberships', async () => {
    const session = await createVerifiedCustomerSession();

    const current = await getSession(session);

    expect(current.status).toBe(200);
    expect(current.data.session.activeOrganizationId).toBeNull();
  });

  it('should let a verified Customer create an Organization as owner and set it Active', async () => {
    const session = await createVerifiedCustomerSession();
    const slug = uniqueOrganizationSlug();

    const created = await createOrganization(session, {
      name: `Workspace ${slug}`,
      slug,
    });
    const current = await getSession(session);

    expect(created.status).toBe(200);
    expect(created.data.name).toBe(`Workspace ${slug}`);
    expect(created.data.slug).toBe(slug);
    expect(created.data.members).toHaveLength(1);
    expect(created.data.members[0].role).toBe('owner');
    expect(String(created.data.members[0].userId)).toBe(
      String(current.data.user.id),
    );
    expect(String(current.data.session.activeOrganizationId)).toBe(
      String(created.data.id),
    );
  });

  it('should keep the current Active Organization when the Customer asks to keep it', async () => {
    const session = await createVerifiedCustomerSession();
    const firstSlug = uniqueOrganizationSlug();
    const secondSlug = uniqueOrganizationSlug();

    const first = await createOrganization(session, {
      name: `Workspace ${firstSlug}`,
      slug: firstSlug,
    });
    const second = await createOrganization(session, {
      name: `Workspace ${secondSlug}`,
      slug: secondSlug,
      keepCurrentActiveOrganization: true,
    });
    const current = await getSession(session);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(String(current.data.session.activeOrganizationId)).toBe(
      String(first.data.id),
    );
  });

  it('should list Organizations the Customer belongs to', async () => {
    const session = await createVerifiedCustomerSession();
    const firstSlug = uniqueOrganizationSlug();
    const secondSlug = uniqueOrganizationSlug();

    await createOrganization(session, {
      name: `Workspace ${firstSlug}`,
      slug: firstSlug,
    });
    await createOrganization(session, {
      name: `Workspace ${secondSlug}`,
      slug: secondSlug,
      keepCurrentActiveOrganization: true,
    });
    const listed = await listOrganizations(session);

    expect(listed.status).toBe(200);
    expect(listed.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ slug: firstSlug }),
        expect.objectContaining({ slug: secondSlug }),
      ]),
    );
  });

  it('should set the Active Organization', async () => {
    const session = await createVerifiedCustomerSession();
    const firstSlug = uniqueOrganizationSlug();
    const secondSlug = uniqueOrganizationSlug();

    await createOrganization(session, {
      name: `Workspace ${firstSlug}`,
      slug: firstSlug,
    });
    const second = await createOrganization(session, {
      name: `Workspace ${secondSlug}`,
      slug: secondSlug,
      keepCurrentActiveOrganization: true,
    });

    const setActive = await setActiveOrganization(session, {
      organizationId: String(second.data.id),
    });
    const current = await getSession(session);

    expect(setActive.status).toBe(200);
    expect(String(current.data.session.activeOrganizationId)).toBe(
      String(second.data.id),
    );
  });

  it('should unset the Active Organization', async () => {
    const session = await createVerifiedCustomerSession();
    const slug = uniqueOrganizationSlug();
    await createOrganization(session, {
      name: `Workspace ${slug}`,
      slug,
    });

    const unset = await setActiveOrganization(session, {
      organizationId: null,
    });
    const current = await getSession(session);

    expect(unset.status).toBe(200);
    expect(current.data.session.activeOrganizationId).toBeNull();
  });

  it('should get the Active Organization and Membership', async () => {
    const session = await createVerifiedCustomerSession();
    const slug = uniqueOrganizationSlug();
    const created = await createOrganization(session, {
      name: `Workspace ${slug}`,
      slug,
    });

    const active = await getFullOrganization(session);
    const membership = await getActiveMember(session);

    expect(active.status).toBe(200);
    expect(String(active.data.id)).toBe(String(created.data.id));
    expect(membership.status).toBe(200);
    expect(membership.data.role).toBe('owner');
    expect(String(membership.data.organizationId)).toBe(String(created.data.id));
  });

  it('should leave Active Organization unset on sign-in even when the Customer has Memberships', async () => {
    const session = await createVerifiedCustomerSession();
    const slug = uniqueOrganizationSlug();
    await createOrganization(session, {
      name: `Workspace ${slug}`,
      slug,
    });

    await signOut(session);
    const signInRes = await signIn({
      email: session.email,
      password: session.password,
      origin: WEB_ORIGIN,
    });
    const signedIn = {
      cookie: cookieHeader(signInRes.headers['set-cookie']),
      origin: WEB_ORIGIN,
    };
    const current = await getSession(signedIn);
    const listed = await listOrganizations(signedIn);

    expect(signInRes.status).toBe(200);
    expect(current.data.session.activeOrganizationId).toBeNull();
    expect(listed.data).toEqual([expect.objectContaining({ slug })]);
  });

  it('should reject Super Admin create-Organization via the plugin', async () => {
    const signInRes = await signIn({
      email: SEED_ADMIN_EMAIL,
      password: SEED_ADMIN_PASSWORD,
      origin: ADMIN_ORIGIN,
    });
    const session = {
      cookie: cookieHeader(signInRes.headers['set-cookie']),
      origin: ADMIN_ORIGIN,
    };
    const slug = uniqueOrganizationSlug();

    const created = await createOrganization(session, {
      name: `Workspace ${slug}`,
      slug,
    });

    expect(signInRes.status).toBe(200);
    expect(created.status).toBeGreaterThanOrEqual(400);
    expect(created.data.code).toBe(
      'YOU_ARE_NOT_ALLOWED_TO_CREATE_A_NEW_ORGANIZATION',
    );
  });
});
