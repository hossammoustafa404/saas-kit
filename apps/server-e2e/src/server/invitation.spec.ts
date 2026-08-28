import {
  ADMIN_ORIGIN,
  SEED_ADMIN_EMAIL,
  SEED_ADMIN_PASSWORD,
  WEB_ORIGIN,
  cookieHeader,
  createVerifiedCustomerSession,
  getSession,
  readQueuedMailText,
  signIn,
  signUpCustomer,
  uniqueCustomerEmail,
  uniqueOrganizationSlug,
  verifyCustomerEmail,
  type AuthSession,
} from '../support/auth-client';
import {
  acceptInvitation,
  addMember,
  cancelInvitation,
  createOrganization,
  deleteOrganization,
  getFullOrganization,
  getInvitation,
  getInvitationAnonymous,
  inviteMember,
  leaveOrganization,
  listInvitations,
  listOrganizations,
  listUserInvitations,
  rejectInvitation,
  removeMember,
  updateMemberRole,
} from '../support/organization-client';

jest.setTimeout(60_000);

describe('Invitation and addMember', () => {
  it('should let an owner invite an email and enqueue an accept link', async () => {
    const { owner, organizationId } = await createOwnerWorkspace();
    const inviteeEmail = uniqueCustomerEmail();

    const invited = await inviteMember(owner, {
      email: inviteeEmail,
      role: 'admin',
      organizationId,
    });
    const mail = await readQueuedMailText(inviteeEmail);

    expect(invited.status).toBe(200);
    expect(invited.data.email).toBe(inviteeEmail);
    expect(invited.data.role).toBe('admin');
    expect(invited.data.status).toBe('pending');
    expect(mail).toContain(
      `${WEB_ORIGIN}/accept-invitation/${invited.data.id}`,
    );
  });

  it('should let an admin invite and addMember, and forbid a member from both', async () => {
    const { owner, organizationId } = await createOwnerWorkspace();
    const admin = await createSeatedCustomer({
      owner,
      organizationId,
      role: 'admin',
    });
    const member = await createSeatedCustomer({
      owner,
      organizationId,
      role: 'member',
    });
    const invitee = await createVerifiedCustomerSession();
    const inviteeSession = await getSession(invitee);

    const adminInvite = await inviteMember(admin.session, {
      email: uniqueCustomerEmail(),
      role: 'member',
      organizationId,
    });
    const adminAdd = await addMember(admin.session, {
      userId: String(inviteeSession.data.user.id),
      role: 'member',
      organizationId,
    });
    const memberInvite = await inviteMember(member.session, {
      email: uniqueCustomerEmail(),
      role: 'member',
      organizationId,
    });
    const memberAdd = await addMember(member.session, {
      userId: String(inviteeSession.data.user.id),
      role: 'member',
      organizationId,
    });

    expect(adminInvite.status).toBe(200);
    expect(adminAdd.status).toBe(200);
    expect(adminAdd.data.role).toBe('member');
    expect(memberInvite.status).toBeGreaterThanOrEqual(400);
    expect(memberAdd.status).toBeGreaterThanOrEqual(400);
  });

  it('should reject inviting a Super Admin email and adding a Super Admin userId', async () => {
    const { owner, organizationId } = await createOwnerWorkspace();
    const superAdminSignIn = await signIn({
      email: SEED_ADMIN_EMAIL,
      password: SEED_ADMIN_PASSWORD,
      origin: ADMIN_ORIGIN,
    });
    const superAdmin = {
      cookie: cookieHeader(superAdminSignIn.headers['set-cookie']),
      origin: ADMIN_ORIGIN,
    };
    const superAdminSession = await getSession(superAdmin);

    const invited = await inviteMember(owner, {
      email: SEED_ADMIN_EMAIL,
      role: 'member',
      organizationId,
    });
    const added = await addMember(owner, {
      userId: String(superAdminSession.data.user.id),
      role: 'member',
      organizationId,
    });

    expect(invited.status).toBeGreaterThanOrEqual(400);
    expect(added.status).toBeGreaterThanOrEqual(400);
  });

  it('should let an unknown email sign up, verify, then accept the invited position', async () => {
    const { owner, organizationId, slug } = await createOwnerWorkspace();
    const inviteeEmail = uniqueCustomerEmail();
    const password = 'customer-password-1';

    const invited = await inviteMember(owner, {
      email: inviteeEmail,
      role: 'admin',
      organizationId,
    });
    await signUpCustomer({ origin: WEB_ORIGIN, email: inviteeEmail, password });
    await verifyCustomerEmail(inviteeEmail);
    const signInRes = await signIn({
      email: inviteeEmail,
      password,
      origin: WEB_ORIGIN,
    });
    const invitee = {
      cookie: cookieHeader(signInRes.headers['set-cookie']),
      origin: WEB_ORIGIN,
    };

    const accepted = await acceptInvitation(invitee, {
      invitationId: String(invited.data.id),
    });
    const listed = await listOrganizations(invitee);

    expect(invited.status).toBe(200);
    expect(accepted.status).toBe(200);
    expect(accepted.data.member.role).toBe('admin');
    expect(String(accepted.data.member.organizationId)).toBe(organizationId);
    expect(listed.data).toEqual([expect.objectContaining({ slug })]);
  });

  it('should require a matching verified Session to get, accept, or reject an Invitation', async () => {
    const { owner, organizationId } = await createOwnerWorkspace();
    const invitee = await createVerifiedCustomerSession();
    const stranger = await createVerifiedCustomerSession();
    const invited = await inviteMember(owner, {
      email: invitee.email,
      role: 'member',
      organizationId,
    });
    const invitationId = String(invited.data.id);

    const anonymousGet = await getInvitationAnonymous(invitationId);
    const strangerGet = await getInvitation(stranger, invitationId);
    const strangerAccept = await acceptInvitation(stranger, { invitationId });
    const strangerReject = await rejectInvitation(stranger, { invitationId });
    const matchingGet = await getInvitation(invitee, invitationId);

    expect(anonymousGet.status).toBeGreaterThanOrEqual(400);
    expect(strangerGet.status).toBeGreaterThanOrEqual(400);
    expect(strangerAccept.status).toBeGreaterThanOrEqual(400);
    expect(strangerReject.status).toBeGreaterThanOrEqual(400);
    expect(matchingGet.status).toBe(200);
    expect(matchingGet.data.email).toBe(invitee.email);
  });

  it('should let the invitee reject, and let owner cancel and list Invitations', async () => {
    const { owner, organizationId } = await createOwnerWorkspace();
    const rejector = await createVerifiedCustomerSession();
    const cancelledInvitee = await createVerifiedCustomerSession();

    const toReject = await inviteMember(owner, {
      email: rejector.email,
      role: 'member',
      organizationId,
    });
    const toCancel = await inviteMember(owner, {
      email: cancelledInvitee.email,
      role: 'member',
      organizationId,
    });

    const rejected = await rejectInvitation(rejector, {
      invitationId: String(toReject.data.id),
    });
    const cancelled = await cancelInvitation(owner, {
      invitationId: String(toCancel.data.id),
    });
    const listed = await listInvitations(owner, organizationId);
    const forRejector = await listUserInvitations(rejector);
    const forCancelled = await listUserInvitations(cancelledInvitee);
    const acceptCancelled = await acceptInvitation(cancelledInvitee, {
      invitationId: String(toCancel.data.id),
    });

    expect(rejected.status).toBe(200);
    expect(cancelled.status).toBe(200);
    expect(listed.status).toBe(200);
    expect(listed.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          email: rejector.email,
          status: 'rejected',
        }),
        expect.objectContaining({
          email: cancelledInvitee.email,
          status: 'canceled',
        }),
      ]),
    );
    expect(forRejector.status).toBe(200);
    expect(forRejector.data).toEqual([]);
    expect(forCancelled.status).toBe(200);
    expect(forCancelled.data).toEqual([]);
    expect(acceptCancelled.status).toBeGreaterThanOrEqual(400);
  });

  it('should list pending Invitations sent to the Customer email', async () => {
    const { owner, organizationId } = await createOwnerWorkspace();
    const invitee = await createVerifiedCustomerSession();

    const invited = await inviteMember(owner, {
      email: invitee.email,
      role: 'member',
      organizationId,
    });
    const listed = await listUserInvitations(invitee);

    expect(listed.status).toBe(200);
    expect(listed.data).toEqual([
      expect.objectContaining({
        id: String(invited.data.id),
        email: invitee.email,
        status: 'pending',
      }),
    ]);
  });

  it('should forbid the last owner from leaving or being removed, and allow delete or transfer', async () => {
    const { owner, organizationId } = await createOwnerWorkspace();
    const seated = await createSeatedCustomer({
      owner,
      organizationId,
      role: 'member',
    });

    const lastOwnerLeave = await leaveOrganization(owner, { organizationId });
    const lastOwnerRemove = await removeMember(owner, {
      memberIdOrEmail: owner.email,
      organizationId,
    });

    const promoted = await updateMemberRole(owner, {
      memberId: String(seated.added.data.id),
      role: 'owner',
      organizationId,
    });
    const left = await leaveOrganization(owner, { organizationId });
    const listed = await listOrganizations(owner);

    expect(lastOwnerLeave.status).toBeGreaterThanOrEqual(400);
    expect(lastOwnerRemove.status).toBeGreaterThanOrEqual(400);
    expect(promoted.status).toBe(200);
    expect(left.status).toBe(200);
    expect(listed.data).toEqual([]);
  });

  it('should let an owner delete the Organization and forbid an admin from deleting it', async () => {
    const { owner, organizationId, slug } = await createOwnerWorkspace();
    const admin = await createSeatedCustomer({
      owner,
      organizationId,
      role: 'admin',
    });

    const adminDelete = await deleteOrganization(admin.session, {
      organizationId,
    });
    const stillThere = await listOrganizations(owner);
    const ownerDelete = await deleteOrganization(owner, { organizationId });
    const afterDelete = await listOrganizations(owner);

    expect(adminDelete.status).toBeGreaterThanOrEqual(400);
    expect(stillThere.data).toEqual([expect.objectContaining({ slug })]);
    expect(ownerDelete.status).toBe(200);
    expect(afterDelete.data).toEqual([]);
  });

  it('should let owner or admin update and remove a Member who is not the last owner, and let that Member leave', async () => {
    const { owner, organizationId } = await createOwnerWorkspace();
    const admin = await createSeatedCustomer({
      owner,
      organizationId,
      role: 'admin',
    });
    const toUpdate = await createSeatedCustomer({
      owner,
      organizationId,
      role: 'member',
    });
    const toRemove = await createSeatedCustomer({
      owner,
      organizationId,
      role: 'member',
    });
    const toLeave = await createSeatedCustomer({
      owner,
      organizationId,
      role: 'member',
    });

    const updated = await updateMemberRole(admin.session, {
      memberId: String(toUpdate.added.data.id),
      role: 'admin',
      organizationId,
    });
    const removed = await removeMember(owner, {
      memberIdOrEmail: toRemove.session.email,
      organizationId,
    });
    const left = await leaveOrganization(toLeave.session, { organizationId });
    const remaining = await getFullOrganization(owner);

    expect(updated.status).toBe(200);
    expect(updated.data.role).toBe('admin');
    expect(removed.status).toBe(200);
    expect(left.status).toBe(200);
    expect(remaining.status).toBe(200);
    expect(remaining.data.members).toHaveLength(3);
  });
});

async function createOwnerWorkspace() {
  const owner = await createVerifiedCustomerSession();
  const slug = uniqueOrganizationSlug();
  const created = await createOrganization(owner, {
    name: `Workspace ${slug}`,
    slug,
  });

  return {
    owner,
    organizationId: String(created.data.id),
    slug,
  };
}

async function createSeatedCustomer(options: {
  owner: AuthSession;
  organizationId: string;
  role: string;
}) {
  const session = await createVerifiedCustomerSession();
  const current = await getSession(session);
  const added = await addMember(options.owner, {
    userId: String(current.data.user.id),
    role: options.role,
    organizationId: options.organizationId,
  });

  return {
    session,
    userId: String(current.data.user.id),
    added,
  };
}
