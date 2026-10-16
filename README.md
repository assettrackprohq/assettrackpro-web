# Inventory Companion Field App (counters' phone app)

A plain website: `index.html`, `sw.js`, `manifest.webmanifest`, `icon.svg`. No build step.
It talks to the `inventory-companion` Supabase project with the public (anon) key. The service key is never in this app.

## What it does
- Counter signs in with the account the admin created; a temporary password forces a new password at first login.
- **My assignments:** only the counter's own open locations and rounds.
- Items are downloaded through `get_my_assignment_items()` and cached on the phone. **No system quantities ever reach the phone.**
- Search by SKU, part number or description; `*` = any characters, `?` = one character.
- Quantity (decimals allowed), condition, flag, expiry, remarks. Counts of the same item in one round add up.
- Discovery counts: counter can add a new item (with the engagement's custom fields, e.g. HP for pumps); a reconciler approves it later.
- **Offline:** counts are saved on the phone at once and sync when there is a connection. Each count has its own id, so a retry never duplicates. A refused count (for example a recount by the same person) stays visible with the reason.
- Submit a location when everything has synced. After that no more counts can be added.

## Put it online (Vercel)
1. Create a GitHub repository (private) and upload these files (Add file, Upload files), or drag the folder into a new Vercel project.
2. In Vercel: Add New, Project, import the repository, Framework "Other", no build command. Deploy.
3. Optional: add your own subdomain (for example `count.yourdomain`) under the project's Domains.
4. Counters open the link on their phone and use "Add to Home Screen" to install it.

## Supabase settings to change (dashboard, Authentication)
- **Turn off "Allow new users to sign up".** Accounts must be created by an admin only.
- **URL configuration:** set Site URL to your deployed address.
- **Email:** set up a custom email sender if you will send invitations (the default sender has a very low hourly limit).

## First admin (one time, SQL editor of the project)
1. Authentication, Users, Add user: create yourself (email and password). Copy the user's id.
2. Run, replacing `<USER_ID>` and the names:
```sql
with o as (insert into organizations (name, code) values ('Skyrit Technologies', 'SKYRIT') returning id),
     s as (insert into organization_settings (organization_id) select id from o),
     m as (insert into organization_members (organization_id, user_id) select id, '<USER_ID>' from o),
     p as (insert into profiles (user_id, organization_id, display_name) select '<USER_ID>', id, 'Your name' from o)
insert into user_roles (user_id, role_id, organization_id)
  select '<USER_ID>', r.id, o.id from o, app_roles r where r.code = 'admin';
```
Per the design, each client is its own organisation, and your staff are members of it. Repeat per client.

## Creating counters
Use `admin.html` (Team tab). It calls the deployed `admin-create-user` function. Counters must hold ONLY the counter (or team_lead) role to stay blind.

## Not included yet
Camera or barcode scanning; password reset by email (admin resets for now); photo capture; report templates and merging proposed items in the Admin console.

## Checks run
`tests/smoke.js` runs the app in a simulated browser against a stand-in database (login, search with wildcards, decimal counts, offline queue and sync, proposed items sent before their counts, refused counts, submit). It passes. It has NOT been run against the live project with a real login, because no user exists yet.

## Admin console (`admin.html`)
Host it beside `index.html`. Sign in as an admin or manager. Tabs: Engagements (create, preset, activate/close), Import (CSV of items and system quantities), Team (create/suspend accounts), Assignments (share locations among counters, sign off), Reconcile (variances, approve, recount assignments, new items), Reports (final, variance, KPI, exceptions as CSV or Excel).
Syntax-checked only; not run against the live project. Not in this version: report templates, merging proposed items into existing ones, audit log view.

## Keeping a free Supabase project awake (stopgap)
`.github/workflows/keepalive.yml` calls the database function `keepalive()` once a day. Upload the whole folder, including the hidden `.github` folder, to your GitHub repository. Then open the repository's Actions tab, choose "Keep Supabase awake" and press "Run workflow" once to confirm it shows a green tick.
- It is a stopgap for development. It adds no backups, and Supabase can change its pausing rule. Move to a paid plan before real client data.
- GitHub may switch off scheduled runs in a public repository after 60 days without activity. Keep the repository private and look at the Actions tab now and then.
- The key in the file is the public anon key, the same one the apps use. Do not put any other key in it.

## Who can see what in the Admin console
The console hides sections by role (the database enforces the same rules, so hiding is a courtesy, not the only protection):
- **Admin:** everything, including Team (create accounts, change roles, suspend).
- **Manager:** Engagements, Import, Assignments, Reconcile, Reports. No Team.
- **Team lead:** Assignments only.
- **Reconciler:** Reconcile and Reports.
- **Counter, viewer, field operator:** "Access denied" screen. Counters use the Field app.
The Team screen shows each member's email through the database function `count_team_list(p_org)`, which only admins and managers can call.
