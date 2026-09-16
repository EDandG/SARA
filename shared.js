// ============================================================
// SARA — shared.js
// Loaded via a classic <script> tag by every page, after the Supabase
// UMD script. Deliberately NOT an ES module — `import` from a CDN can
// hang silently on restrictive/corporate networks with no console
// error, which was the suspected cause of the single-file version
// going blank. This is loaded as plain JS, using window.supabase
// (the UMD global) instead.
// ============================================================

const SUPABASE_URL = 'https://ngsbqzceypktdtpzqtfp.supabase.co';
// Publishable key (Supabase's newer name for the anon key — same role,
// same security model: identifies the project, maps to the low-
// privilege `anon` Postgres role, and only ever grants what RLS allows.
// Safe to be public — it's shipped in this file's own source.
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_-rZ17jyE1QJvaUHY4t4qWw_zKJUYLox';
const FN_BASE = 'https://ngsbqzceypktdtpzqtfp.functions.supabase.co';

// The only place this needs bumping — a small tag reads this and
// shows on every page, including pre-login, so it's visible however
// far someone's got. "v2" marks this as the version at the SARA
// rebrand; bump on the next materially significant change, not every
// small fix.
const SARA_VERSION = 'v2';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

(function renderVersionTag() {
  const tag = document.createElement('div');
  tag.textContent = `SARA ${SARA_VERSION}`;
  tag.style.cssText = 'position:fixed; right:10px; bottom:8px; font-size:10.5px; color:#9aa3af; z-index:1; pointer-events:none; font-family:inherit;';
  document.body.appendChild(tag);
})();

// ---------- ROLE MODEL ----------
// Top tier is split into two: Developer (renamed from the original
// single "superuser" role) and a new, lower Superuser tier beneath it.
// isSuperuser() is kept as the name every existing check already calls
// and REDEFINED to mean "top tier, either flavour" — same strategy as
// schema.sql, for the same reason: minimises how many call sites need
// individual review. isDeveloper()/isSuperuserRole() are the two new,
// narrowly-named checks for the places that must tell the tiers apart
// (see schema.sql's role-hierarchy patch for the full reasoning, plus
// a real bug it caught: a helper with its own internal "superuser
// bypasses everything" shortcut that silently extended to the new tier
// too — worth remembering if adding new top-tier bypasses here).
const ROLES = ['developer','superuser','admin','governance','ward_manager','dispensary_manager','bulk_admin','nurse','pharmacist','pharmacy_technician','clinical_assistant','bulk_assistant','lead_pharmacist'];
const CLINICAL_ROLES = ['nurse','pharmacist','pharmacy_technician','clinical_assistant','bulk_assistant','lead_pharmacist'];
const WARD_SCOPED_ROLES = [...CLINICAL_ROLES, 'ward_manager'];
const MANAGER_TYPES = ['admin','ward_manager','dispensary_manager','bulk_admin'];
const ROLE_LABEL = {
  developer:'Developer', superuser:'Superuser', admin:'Admin', governance:'Governance',
  ward_manager:'Ward Manager', dispensary_manager:'Dispensary Manager', bulk_admin:'Bulk Admin',
  nurse:'Nurse', pharmacist:'Pharmacist', pharmacy_technician:'Pharmacy Technician',
  clinical_assistant:'Clinical Assistant', bulk_assistant:'Bulk Assistant', lead_pharmacist:'Lead Pharmacist',
};

// ---------- STATE (populated by requireAuth()) ----------
let profile = null;
let sites = [];
let wards = [];
let myWards = [];
let bankHolidays = [];
let processingCutoffs = { weekday: '14:00', weekend_or_holiday: '14:00' };
let systemSettings = { topup_window_start: '00:01', topup_window_end: '17:00', duplicate_window_hours: '48', overdue_topup_preview_enabled: 'false', trust_logo_data_url: '' };
let notifyPollTimer = null;
let lastSeenOrdersAt = null;

const isDeveloper = () => profile?.role === 'developer';
const isSuperuserRole = () => profile?.role === 'superuser';
const isSuperuser  = () => isDeveloper() || isSuperuserRole(); // top tier, either flavour — see note above
// These keep their old names so every existing call site picks up the
// new meaning automatically — same approach as the backend functions
// they mirror. Titles carry no capability; every one of these is now
// a tickbox on the account, independent of what it's called.
const isAdminRole  = () => !!profile?.can_manage_users;
const isWardManager = () => !!profile?.can_manage_ward_staff;
const isDispensaryManager = () => !!profile?.can_manage_users;
const isBulkAdmin = () => !!profile?.can_manage_users;
const isAnyManagerType = () => isSuperuser() || isAdminRole() || isWardManager();
const canCreateUsers = () => isSuperuser() || isAdminRole();
const isManager    = () => isAnyManagerType();
const isGovernance = () => profile?.role === 'governance';
const canOrder      = () => !!profile?.can_order;
const canProcess    = () => !!profile?.can_process;
const canCheckPicking = () => isSuperuser() || !!profile?.can_check_picking;
const canApproveOrders = () => isSuperuser() || !!profile?.can_approve_orders;
const canMarkNonUrgent = () => isSuperuser() || !!profile?.can_mark_nonurgent;
const canManageStocklists = () => isSuperuser() || !!profile?.can_manage_stocklists;
const canManageWardsSites = () => isSuperuser() || !!profile?.can_manage_wards_sites;
const canViewBi = () => isSuperuser() || !!profile?.can_view_bi;
const canFreetextTempStock = () => !!profile?.can_freetext_temp_stock && canOrder();


// ---------- HELPERS (verbatim from the single-file app) ----------
function toast(msg, isErr = false) {
  const el = document.createElement('div');
  el.className = 'toast' + (isErr ? ' err' : '');
  el.textContent = msg;
  document.getElementById('toast-root').appendChild(el);
  setTimeout(() => el.remove(), 3200);
}
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB') + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function dateOnly(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function isoDate(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function isWeekend(d) {
  const day = d.getDay();
  return day === 0 || day === 6;
}
function isBankHoliday(d) { return bankHolidays.includes(isoDate(d)); }
// Only an actual bank holiday is skipped — weekends still get processed
// (they just use the weekend/holiday cutoff time below), so a Saturday
// order due next-day lands on the Sunday, not the following Monday.
function isWorkingDay(d) { return !isBankHoliday(d); }
function nextWorkingDay(d) {
  const next = new Date(d);
  do { next.setDate(next.getDate() + 1); } while (!isWorkingDay(next));
  return next;
}
function cutoffMinutesFor(day) {
  const key = isWeekend(day) ? 'weekend_or_holiday' : 'weekday';
  const [h, m] = (processingCutoffs[key] || '14:00').split(':').map(Number);
  return h * 60 + m;
}
function targetProcessingDate(createdAtIso) {
  const created = new Date(createdAtIso);
  const createdDay = dateOnly(created);
  if (!isWorkingDay(createdDay)) return nextWorkingDay(createdDay);
  const createdMinutes = created.getHours() * 60 + created.getMinutes();
  return createdMinutes < cutoffMinutesFor(createdDay) ? createdDay : nextWorkingDay(createdDay);
}
function turnaroundStatus(order) {
  const target = targetProcessingDate(order.created_at);
  return target <= dateOnly(new Date()) ? 'green' : 'amber';
}
function turnaroundDot(order) {
  const status = turnaroundStatus(order);
  const target = targetProcessingDate(order.created_at);
  const label = status === 'green'
    ? 'Due today'
    : `Next-day processing — due ${target.toLocaleDateString('en-GB')}`;
  // Distinct colours from every status dot above, AND rendered as
  // circles (shape-circle) rather than hexagons/triangles — this is a
  // timing signal, not a status, and should never be visually
  // confusable with one even where a colour might otherwise feel close.
  const color = status === 'green' ? '#22C55E' : '#F97316';
  return `<span class="status-dot shape-circle" style="background:${color};" title="${esc(label)}"></span>`;
}

function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function wardName(id) { return wards.find(w => w.id === id)?.name || ''; }
function siteName(id) { return sites.find(s => s.id === id)?.name || ''; }
function statusLabel(s) { return { pending:'Pending', complete:'Complete', out_of_stock:'Out of stock', part_supplied:'Part supplied', duplicate:'Duplicate order', non_urgent:'Non-urgent', pending_approval:'Awaiting approval', superseded:'Superseded by reorder', rejected:'Rejected' }[s] || s; }
function fulfilledNote(o) {
  if (!o.fulfilled_as_medicine_name) return '';
  return `<div class="muted" style="font-size:11px;">Requested: ${esc(o.medicine_name)} \u00d7 ${o.quantity} \u2014 sent: ${esc(o.fulfilled_as_medicine_name)} \u00d7 ${o.fulfilled_as_quantity}</div>`;
}
// Every status gets its own distinct colour — no two share a hue.
// Stock-problem statuses (out_of_stock, part_supplied) also get the
// triangle shape via TRIANGLE_STATUSES, on top of their own colour, so
// they're distinguishable two ways at once.
const STATUS_DOT_COLOR = {
  pending: '#E0A72E', complete: '#1E8A73', out_of_stock: '#C0392B', part_supplied: '#6A3FB5',
  duplicate: '#8891A0', non_urgent: '#3E6E93', pending_approval: '#A85D2E',
  superseded: '#5C6B7A', rejected: '#B23A48',
};
const TRIANGLE_STATUSES = ['out_of_stock', 'part_supplied'];
function statusDot(status, label) {
  const color = STATUS_DOT_COLOR[status] || '#8891A0';
  const shapeClass = TRIANGLE_STATUSES.includes(status) ? ' shape-triangle' : '';
  return `<span class="status-dot${shapeClass}" style="background:${color};" title="${esc(label)}"></span>`;
}
function statusLegendHtml() {
  const entries = [
    ['pending', 'Pending'], ['complete', 'Complete'], ['out_of_stock', 'Out of stock / to follow'],
    ['part_supplied', 'Part supplied'], ['duplicate', 'Duplicate order'], ['non_urgent', 'Non-urgent'],
    ['pending_approval', 'Awaiting approval'], ['superseded', 'Superseded by reorder'], ['rejected', 'Rejected'],
  ];
  return `<div class="legend" style="display:flex; flex-wrap:wrap; gap:14px; margin-top:10px; padding-top:10px; border-top:1px solid var(--border);">
    ${entries.map(([status, label]) => `<span style="display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text-dim);">${statusDot(status, label)}${esc(label)}</span>`).join('')}
    <span style="display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text-dim);"><span class="status-dot shape-circle" style="background:#22C55E;"></span>Due today</span>
    <span style="display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text-dim);"><span class="status-dot shape-circle" style="background:#F97316;"></span>Next-day processing</span>
  </div>`;
}
function attribution(label, name, iso) {
  if (!name && !iso) return '';
  return `<div class="attribution">${label ? esc(label) + ' ' : ''}${name ? esc(name) : ''}${name && iso ? ' · ' : ''}${iso ? fmtDate(iso) : ''}</div>`;
}
function roleLabel(r) { return ROLE_LABEL[r] || r; }

function baseUserIdFromName(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  const clean = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (parts.length === 1) return clean(parts[0]);
  return clean(parts[0][0] + parts[parts.length - 1]);
}
async function suggestAvailableUserId(fullName) {
  const base = baseUserIdFromName(fullName);
  if (!base) return '';
  let candidate = base, suffix = 2;
  while (suffix < 50) {
    const { data: exists, error } = await sb.rpc('user_id_exists', { candidate });
    if (error || !exists) return candidate;
    candidate = base + suffix;
    suffix++;
  }
  return candidate;
}

function openModal(innerHtml, wide = false) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `<div class="modal-bg" id="modal-bg"><div class="modal${wide ? ' wide' : ''}">${innerHtml}</div></div>`;
  document.getElementById('modal-bg').onclick = (e) => { if (e.target.id === 'modal-bg') closeModal(); };
}
function closeModal() { document.getElementById('modal-root').innerHTML = ''; }
window.closeModal = closeModal;

function confirmDialog(title, body, confirmLabel, onConfirm, danger = false) {
  openModal(`
    <h3>${esc(title)}</h3>
    <p class="muted">${body}</p>
    <div class="actions">
      <button class="btn ghost" onclick="closeModal()">Cancel</button>
      <button class="btn ${danger ? 'danger' : 'magenta'}" id="modal-confirm-btn">${esc(confirmLabel)}</button>
    </div>`);
  document.getElementById('modal-confirm-btn').onclick = () => { closeModal(); onConfirm(); };
}

function groupPartOrders(rows) {
  const childOf = new Map();
  rows.forEach(o => { if (o.parent_order_id) childOf.set(o.parent_order_id, o); });
  const result = [];
  for (const o of rows) {
    if (o.parent_order_id && rows.some(r => r.id === o.parent_order_id)) continue;
    if (o.status === 'part_supplied' && childOf.has(o.id)) {
      const child = childOf.get(o.id);
      const childDone = child.status === 'complete';
      const childSuperseded = child.status === 'superseded';
      result.push({
        ...o,
        _displayStatusText: childDone ? `${o.supplied_qty} + ${child.quantity} supplied`
          : childSuperseded ? `${o.supplied_qty} supplied, remainder resupplied separately`
          : `${o.supplied_qty} supplied, ${child.quantity} to follow`,
        _displayStatusClass: childDone ? 'complete' : childSuperseded ? 'superseded' : 'part_supplied',
        _latestUpdate: child.processed_at || child.superseded_at || child.created_at,
      });
    } else {
      result.push(o);
    }
  }
  return result;
}

function exportRowsToExcel(rows, filename) {
  const aoa = [
    ['Site', 'Ward', 'Medicine', 'Quantity', 'Status', 'Ordered by', 'Ordered at', 'Processed by', 'Processed at', 'Supplied at'],
    ...rows.map(r => [
      r._siteName || '', r._wardName || '', r.medicine_name, r.quantity, statusLabel(r.status),
      r._orderedByName || '', r.created_at ? new Date(r.created_at).toLocaleString('en-GB') : '',
      r._processedByName || '', r.processed_at ? new Date(r.processed_at).toLocaleString('en-GB') : '',
      r.supplied_at ? new Date(r.supplied_at).toLocaleString('en-GB') : '',
    ]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Orders');
  XLSX.writeFile(wb, filename);
}

// Excel-style column letter (A, B, ... Z, AA, AB...) to a zero-based index.
function colToIndex(letter) {
  letter = String(letter || '').trim().toUpperCase();
  if (!letter) return -1;
  let n = 0;
  for (let i = 0; i < letter.length; i++) {
    const c = letter.charCodeAt(i) - 64;
    if (c < 1 || c > 26) return -1;
    n = n * 26 + c;
  }
  return n - 1;
}

async function fetchNameMap(orderRows) {
  const ids = [...new Set(orderRows.flatMap(o => [o.ordered_by, o.processed_by, o.approved_by]).filter(Boolean))];
  if (!ids.length) return {};
  // Ordinary clinical accounts can no longer bare-select the profiles
  // table (see the profiles RLS tightening in schema.sql) — this uses
  // the same narrow staff_display_names() RPC every other attribution
  // lookup uses, and filters to just the ids actually needed.
  const { data } = await sb.rpc('staff_display_names');
  const all = Object.fromEntries((data || []).map(u => [u.id, u.full_name]));
  return Object.fromEntries(ids.filter(id => all[id]).map(id => [id, all[id]]));
}

// Requested-vs-supplied, correctly attributed: only genuine ward
// requests (parent_order_id is null) count toward "requested" — the
// internal remainder row a part-supply creates is not a second
// request. "Supplied" walks each parent through to however it was
// actually resolved: complete = the whole quantity; part_supplied =
// the recorded supplied_qty, plus the remainder too if that child
// row later itself became complete. Everything else (out_of_stock,
// pending, pending_approval, rejected, duplicate, non_urgent,
// superseded) contributes 0 supplied for that line — a superseded
// line's need was covered by whatever replaced it, which is counted
// separately in its own right, so this never double-counts.
// Optionally grouped by ordered_by for a per-person breakdown.
function calcRequestedSupplied(allRows, { byOrderer = false } = {}) {
  const byId = Object.fromEntries(allRows.map(o => [o.id, o]));
  const childByParent = {};
  allRows.forEach(o => { if (o.parent_order_id) childByParent[o.parent_order_id] = o; });
  const parents = allRows.filter(o => !o.parent_order_id);

  const results = {};
  parents.forEach(p => {
    const key = byOrderer ? p.ordered_by : p.medicine_name;
    if (!results[key]) results[key] = { requested: 0, supplied: 0 };
    results[key].requested += p.quantity;
    if (p.status === 'complete') {
      results[key].supplied += p.quantity;
    } else if (p.status === 'part_supplied') {
      results[key].supplied += (p.supplied_qty || 0);
      const child = childByParent[p.id];
      if (child && child.status === 'complete') {
        results[key].supplied += child.quantity;
      }
    }
  });
  return results;
}

// Shared between order.html (recent submissions) and order-history.html.
function renderSessionCard(session, allLines, nameById = {}) {
  const lines = groupPartOrders(allLines.filter(o => o.session_id === session.id));
  const pendingCount = lines.filter(o => o.status === 'pending').length;
  const toFollowCount = lines.filter(o => ['out_of_stock', 'part_supplied'].includes(o.status)).length;
  const typeBadge = `<span class="badge ${session.order_type === 'topup' ? 'complete' : 'pending_approval'}" style="margin-left:6px;">${session.order_type === 'topup' ? 'Top-up' : 'Adhoc'}</span>`;
  const processedBadge = toFollowCount
    ? `<span class="badge pending">Order processed, one or more orders to follow</span>`
    : `<span class="badge complete">Order processed</span>`;
  return `
    <div style="border:1px solid var(--border); border-radius:10px; padding:14px; margin-top:10px;">
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:13px; color:var(--text-dim);">
        <span>${fmtDate(session.created_at)}${nameById[session.submitted_by] ? ` · by ${esc(nameById[session.submitted_by])}` : ''} · ${lines.length} item${lines.length > 1 ? 's' : ''}${typeBadge}</span>
        ${pendingCount ? `<span class="badge pending">${pendingCount} pending</span>` : processedBadge}
      </div>
      <table style="margin-top:8px;"><tbody>
        ${lines.map(o => {
          const statusHtml = o._displayStatusText
            ? statusDot(o._displayStatusClass, o._displayStatusText)
            : statusDot(o.status, statusLabel(o.status));
          const actionedAttr = o.processed_by
            ? attribution(statusLabel(o.status) + ' by', nameById[o.processed_by], o._latestUpdate || o.processed_at)
            : (o.approved_by ? attribution('Approved by', nameById[o.approved_by], o.approved_at) : '');
          return `<tr>
          <td>${esc(o.medicine_name)}${actionedAttr}${fulfilledNote(o)}</td><td style="text-align:right;">${o.quantity}</td>
          <td style="text-align:right; width:40px;">${statusHtml}</td>
        </tr>`;
        }).join('')}
      </tbody></table>
    </div>`;
}

// ---------- AUTH GUARD ----------
// Every page except login.html/reset-password.html calls this at load
// time. Redirects to login.html if there's no session, redirects to
// reset-password.html if the account still needs a forced passcode
// change, signs out and redirects if deactivated since login, and
// redirects home with a message if the page's required capability isn't
// met — RLS is still the real enforcement, this is just so nobody lands
// on a blank/broken page for a function they can't use.
async function requireAuth(options = {}) {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { window.location.href = 'login.html'; return null; }

  const { data: p, error } = await sb.from('profiles').select('*').eq('id', session.user.id).single();
  if (error || !p) { await sb.auth.signOut(); window.location.href = 'login.html'; return null; }

  if (!p.active) {
    await sb.auth.signOut();
    window.location.href = 'login.html?deactivated=1';
    return null;
  }

  if (p.must_reset_password) {
    const setAt = p.password_set_at ? new Date(p.password_set_at) : null;
    const expired = setAt && (Date.now() - setAt.getTime()) > 72 * 3600 * 1000;
    if (expired) {
      await sb.auth.signOut();
      window.location.href = 'login.html?expired=1';
      return null;
    }
    window.location.href = 'reset-password.html';
    return null;
  }

  profile = p;

  const [{ data: siteRows }, { data: wardRows }, { data: holidayRows }, { data: cutoffRows }, { data: settingRows }] = await Promise.all([
    sb.from('sites').select('*').order('name'),
    sb.from('wards').select('*').order('name'),
    sb.from('bank_holidays').select('holiday_date'),
    sb.from('processing_cutoffs').select('*'),
    sb.from('system_settings').select('*'),
  ]);
  sites = siteRows || [];
  wards = wardRows || [];
  bankHolidays = (holidayRows || []).map(h => h.holiday_date);
  (cutoffRows || []).forEach(r => { processingCutoffs[r.day_type] = r.cutoff_time?.slice(0, 5) || processingCutoffs[r.day_type]; });
  (settingRows || []).forEach(r => { systemSettings[r.key] = r.value; });

  if (canOrder()) {
    const { data: uw } = await sb.from('user_wards').select('ward_id').eq('user_id', profile.id);
    const ids = (uw || []).map(x => x.ward_id);
    myWards = wards.filter(w => ids.includes(w.id));
  } else {
    myWards = [];
  }

  if (options.require && !options.require(profile)) {
    window.location.href = 'home.html?denied=1';
    return null;
  }

  document.querySelectorAll('[data-who-name]').forEach(el => el.textContent = `${profile.full_name} · ${roleLabel(profile.role)}`);
  document.querySelectorAll('[data-ward-context]').forEach(el => el.textContent = canOrder() && myWards.length
    ? myWards.map(w => w.name).join(', ')
    : (isSuperuser() ? 'Full system access' : isAdminRole() ? 'Admin' : isGovernance() ? 'Governance — read only' : ''));
  wireLogout();
  loadBanner();
  startNewOrderPolling();
  startSessionHeartbeat();
  renderPageNav(document.body.dataset.page || '');

  return profile;
}

function wireLogout() {
  document.querySelectorAll('[data-logout]').forEach(el => el.onclick = async () => {
    if (notifyPollTimer) { clearInterval(notifyPollTimer); notifyPollTimer = null; }
    if (sessionHeartbeatTimer) { clearInterval(sessionHeartbeatTimer); sessionHeartbeatTimer = null; }
    if (profile) {
      await sb.from('login_events').insert({ user_id: profile.id, event_type: 'logout' });
      // No client-callable session-clearing RPC — active_sessions has
      // no client-writable delete path at all now. The heartbeat
      // simply stops (the tab's gone), last_seen_at goes stale, and
      // the admin "active now" view already treats that as offline.
    }
    await sb.auth.signOut();
    window.location.href = 'login.html';
  });
}

// ---------- SESSION PRESENCE & KICK CHECK ----------
// Upserts a heartbeat row every ~60s so a developer/superuser can see
// who's genuinely active right now (a closed-without-logging-out tab
// just goes stale rather than looking permanently "online"). The same
// tick checks whether this session has been force-logged-out.
//
// active_sessions has no client-writable RLS policy at all — every
// write goes through a security-definer RPC that can only ever touch
// last_seen_at. Without that, a kicked session could simply DELETE or
// UPDATE its own row to clear revoked_at before the next check saw
// it, silently defeating the kick. Reading revoked_at is still direct
// (RLS allows reading your own row) since that alone can't be abused.
let sessionHeartbeatTimer = null;

function startSessionHeartbeat() {
  if (!profile) return;
  if (sessionHeartbeatTimer) clearInterval(sessionHeartbeatTimer);
  const tick = async () => {
    if (!profile) return;
    const { data: row } = await sb.from('active_sessions').select('revoked_at').eq('user_id', profile.id).maybeSingle();
    if (row?.revoked_at) {
      if (sessionHeartbeatTimer) clearInterval(sessionHeartbeatTimer);
      if (notifyPollTimer) clearInterval(notifyPollTimer);
      await sb.auth.signOut();
      window.location.href = 'login.html?ended=1';
      return;
    }
    await sb.rpc('heartbeat_own_session');
  };
  tick();
  sessionHeartbeatTimer = setInterval(tick, 60000);
}

async function loadBanner() {
  const root = document.getElementById('banner-root');
  if (!root) return;
  const { data } = await sb.from('notifications').select('*').eq('active', true).order('created_at', { ascending: false }).limit(1);
  const note = data && data[0];
  if (!note) { root.innerHTML = ''; return; }
  root.innerHTML = `<div class="banner">
    <div class="msg">⚠️ ${esc(note.message)}</div>
    ${isSuperuser() ? `<button id="banner-clear">Clear</button>` : ''}
  </div>`;
  if (isSuperuser()) {
    document.getElementById('banner-clear').onclick = async () => {
      await sb.from('notifications').update({ active: false }).eq('id', note.id);
      loadBanner();
    };
  }
}

function startNewOrderPolling() {
  if (!canProcess()) return;
  requestPushPermissionIfNeeded();
  lastSeenOrdersAt = new Date().toISOString();
  if (notifyPollTimer) clearInterval(notifyPollTimer);
  notifyPollTimer = setInterval(async () => {
    const since = lastSeenOrdersAt;
    lastSeenOrdersAt = new Date().toISOString();
    const { data: newSessions } = await sb.from('order_sessions').select('ward_id, order_type').gt('created_at', since);
    if (!newSessions || !newSessions.length) return;
    const wardName = (id) => wards.find(w => w.id === id)?.name || 'Unknown ward';
    const msg = newSessions.length === 1
      ? `New ${newSessions[0].order_type === 'topup' ? 'top-up' : 'adhoc'} order submitted — ${wardName(newSessions[0].ward_id)}.`
      : `${newSessions.length} new orders submitted — ${[...new Set(newSessions.map(s => wardName(s.ward_id)))].join(', ')}.`;
    // Toast only matters if the tab is actually visible; push notably
    // does NOT check document.hidden — the whole point is to reach
    // someone who isn't currently looking at the tab.
    if (!document.hidden) toast(msg);
    pushNotify('SARA', msg);
  }, 45000);
}

// ---------- NAVIGATION (replaces the old tile-picker + tab router) ----------
function buildNavLinks() {
  const links = [];
  if (canOrder()) {
    links.push({ href: 'order.html', label: 'Make a new stock request', group: 'Ordering' });
    links.push({ href: 'order-history.html', label: 'Order history', group: 'Ordering' });
  }
  if (canProcess()) {
    if (profile?.role === 'bulk_assistant') links.push({ href: 'bulk-dashboard.html', label: 'Dashboard', group: 'Processing' });
    links.push({ href: 'sessions.html', label: 'Pending orders', group: 'Processing' });
    links.push({ href: 'out-of-stock.html', label: 'To follow orders', group: 'Processing' });
    links.push({ href: 'processed-history.html', label: 'Processed (48h)', group: 'Processing' });
  }
  if (canApproveOrders()) {
    links.push({ href: 'approvals.html', label: 'Above-max approvals', group: 'Approvals' });
  }
  if (isSuperuser()) {
    links.push({ href: 'sites.html', label: 'Sites', group: 'Admin' });
    links.push({ href: 'wards.html', label: 'Wards', group: 'Admin' });
    links.push({ href: 'users.html', label: 'Users', group: 'Admin' });
    if (isDeveloper()) links.push({ href: 'titles.html', label: 'Titles', group: 'Admin' });
    links.push({ href: 'drug-catalog.html', label: 'Drug Catalog', group: 'Admin' });
    links.push({ href: 'stocklists.html', label: 'Stocklists', group: 'Admin' });
    links.push({ href: 'notifications.html', label: 'Notifications', group: 'Admin' });
    links.push({ href: 'active-sessions.html', label: 'Active sessions', group: 'Admin' });
    links.push({ href: 'bank-holidays.html', label: 'Bank holidays', group: 'Admin' });
    links.push({ href: 'system-settings.html', label: 'System settings', group: 'Admin' });
    links.push({ href: 'logs.html', label: 'Logs', group: 'Admin' });
    links.push({ href: 'audit.html', label: 'Audit', group: 'Governance' });
    links.push({ href: 'insights.html', label: 'Insights', group: 'Insights' });
  } else {
    // Below the two fixed top tiers, every one of these is its own
    // tickbox — an account can hold any combination, so each link is
    // gated independently rather than bundled behind one manager check.
    if (canManageWardsSites()) {
      links.push({ href: 'sites.html', label: 'Sites', group: 'Admin' });
      links.push({ href: 'wards.html', label: 'Wards', group: 'Admin' });
    }
    if (isAnyManagerType()) links.push({ href: 'users.html', label: 'Users', group: 'Admin' });
    if (canManageStocklists()) links.push({ href: 'stocklists.html', label: 'Stocklists', group: 'Admin' });
    if (isAdminRole()) links.push({ href: 'topup-days.html', label: 'Top-up days', group: 'Admin' });
  }
  if (canViewBi()) links.push({ href: 'bi-insights.html', label: 'BI Insights', group: 'Insights' });
  if (isGovernance()) links.push({ href: 'audit.html', label: 'Audit', group: 'Governance' });
  return links;
}

function buildAreaTiles() {
  const links = buildNavLinks();
  const groups = [...new Set(links.map(l => l.group))];
  const iconFor = { Ordering:'🛒', Processing:'📦', Approvals:'✅', Admin:'⚙️', Governance:'🔎', Insights:'📊' };
  return groups.map(g => ({ group: g, icon: iconFor[g] || '•', firstHref: links.find(l => l.group === g).href, label: g === 'Admin' ? (isSuperuser() ? 'System Admin' : 'User Management') : g }));
}

function renderPageNav(currentHref) {
  const el = document.getElementById('page-nav');
  if (!el) return;
  const links = buildNavLinks();
  const current = links.find(l => l.href === currentHref);
  const group = current ? links.filter(l => l.group === current.group) : [];
  el.innerHTML = `<a href="home.html" class="btn ghost small">← Home</a>` +
    group.map(l => `<a href="${l.href}" class="btn ${l.href === currentHref ? '' : 'ghost'} small">${esc(l.label)}</a>`).join('');
}

// ---------- ADMIN SHARED HELPERS (sites/wards/topup-days pages) ----------
async function refreshSitesWards() {
  const [{ data: siteRows }, { data: wardRows }] = await Promise.all([
    sb.from('sites').select('*').order('name'), sb.from('wards').select('*').order('name'),
  ]);
  sites = siteRows || []; wards = wardRows || [];
}

const WEEKDAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

function openTopupModal(ward, onSaved) {
  const current = ward.topup_days || [];
  openModal(`
    <h3>Top-up days — ${esc(ward.name)}</h3>
    <p class="muted">Shown to the ward as "Your top up dates are: …".</p>
    <div class="checklist">${WEEKDAYS.map(d => `<label><input type="checkbox" class="tu-day" value="${d}" ${current.includes(d) ? 'checked' : ''}>${d}</label>`).join('')}</div>
    <div class="actions"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn magenta" id="tu-save">Save</button></div>`);
  document.getElementById('tu-save').onclick = async () => {
    const days = [...document.querySelectorAll('.tu-day:checked')].map(c => c.value);
    const { error } = await sb.rpc('set_ward_topup_days', { target_ward: ward.id, days });
    closeModal();
    if (error) return toast(error.message, true);
    toast('Top-up days updated.');
    await refreshSitesWards();
    onSaved?.();
  };
}

// ---------- TOP-UP COUNTDOWN BANNER ----------
// Shown on order.html for the currently-selected ward. Active from
// systemSettings.topup_window_start to topup_window_end (default
// 00:01–17:00, Developer-configurable) on the day BEFORE a ward's
// top-up day — i.e. today, if tomorrow is one of the ward's topup_days.
// Turns green with a link to the session once a top-up order has
// actually been submitted today for this ward.
const WEEKDAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function parseHM(hm) {
  const [h, m] = (hm || '00:00').split(':').map(Number);
  return { h: h || 0, m: m || 0 };
}
function isWithinTopupWindow(now = new Date()) {
  const start = parseHM(systemSettings.topup_window_start);
  const end = parseHM(systemSettings.topup_window_end);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return nowMin >= (start.h * 60 + start.m) && nowMin < (end.h * 60 + end.m);
}

let topupCountdownTimer = null;

async function renderTopupBanner(ward, mountEl) {
  if (topupCountdownTimer) { clearInterval(topupCountdownTimer); topupCountdownTimer = null; }
  if (!ward || !mountEl) { if (mountEl) mountEl.innerHTML = ''; return; }

  const tomorrowName = WEEKDAY_NAMES[(new Date().getDay() + 1) % 7];
  const isTopupEve = (ward.topup_days || []).includes(tomorrowName);
  if (!isTopupEve) { mountEl.innerHTML = ''; return; }

  // Checked before any time-window logic — a late submission (even past
  // cutoff) still counts as done; it just means the countdown never
  // reaches the overdue state, or stops showing it if it already had.
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const { data: todaysTopup } = await sb.from('order_sessions').select('id')
    .eq('ward_id', ward.id).eq('order_type', 'topup').gte('created_at', todayStart.toISOString())
    .order('created_at', { ascending: false }).limit(1);

  if (todaysTopup && todaysTopup.length) {
    mountEl.innerHTML = `<div class="card" style="background:var(--teal-pale); border-color:var(--teal);">
      <p style="margin:0; color:var(--navy); font-weight:600;">✓ You have completed your top up request. <a href="session-detail.html?id=${todaysTopup[0].id}">See order</a></p>
    </div>`;
    return;
  }

  const start = parseHM(systemSettings.topup_window_start);
  const end = parseHM(systemSettings.topup_window_end);
  function renderCountdown() {
    const now = new Date();
    const startsAt = new Date(now); startsAt.setHours(start.h, start.m, 0, 0);
    const endsAt = new Date(now); endsAt.setHours(end.h, end.m, 0, 0);
    const midnight = new Date(now); midnight.setHours(23, 59, 59, 999);

    if (now < startsAt) { mountEl.innerHTML = ''; return; }

    if (now < endsAt) {
      // Active window — amber countdown to cutoff.
      const msLeft = endsAt - now;
      const hh = String(Math.floor(msLeft / 3600000)).padStart(2, '0');
      const mm = String(Math.floor((msLeft % 3600000) / 60000)).padStart(2, '0');
      const ss = String(Math.floor((msLeft % 60000) / 1000)).padStart(2, '0');
      mountEl.innerHTML = `<div class="card" style="background:#fff8e1; border-color:#f0d98c;">
        <p style="margin:0; color:#8a6d00; font-weight:600;">⚠ Your top up day is tomorrow — please complete your top up request today.</p>
        <p style="margin:4px 0 0; color:#8a6d00; font-variant-numeric:tabular-nums; font-size:20px; font-weight:700;">${hh}:${mm}:${ss} remaining</p>
      </div>`;
      return;
    }

    if (now < midnight) {
      // Past cutoff, still not submitted, still the same day — overdue.
      // Disappears at midnight since a new "is tomorrow a topup day"
      // check naturally takes over on the next calendar day.
      const msLeft = midnight - now;
      const hh = String(Math.floor(msLeft / 3600000)).padStart(2, '0');
      const mm = String(Math.floor((msLeft % 3600000) / 60000)).padStart(2, '0');
      const ss = String(Math.floor((msLeft % 60000) / 1000)).padStart(2, '0');
      mountEl.innerHTML = `<div class="card" style="background:var(--red-pale); border-color:#f0c7c0;">
        <p style="margin:0; color:var(--red); font-weight:700;">⚠ OVERDUE — your top up request needs to be sent urgently.</p>
        <p style="margin:4px 0 0; color:var(--red); font-variant-numeric:tabular-nums; font-size:20px; font-weight:700;">${hh}:${mm}:${ss} left today</p>
      </div>`;
      return;
    }

    mountEl.innerHTML = '';
  }
  renderCountdown();
  topupCountdownTimer = setInterval(renderCountdown, 1000);
}

// ---------- BROWSER PUSH NOTIFICATIONS ----------
// Alongside the in-app toast, for processing staff — requires the user
// to grant permission once (browsers won't show anything until they do,
// and won't re-prompt if previously denied).
async function requestPushPermissionIfNeeded() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    try { await Notification.requestPermission(); } catch { /* ignore */ }
  }
}
function pushNotify(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try { new Notification(title, { body, icon: undefined }); } catch { /* ignore */ }
}

// ---------- DAILY SNAPSHOT (shared between insights.html and bulk-dashboard.html) ----------
// "Today's" cohort is cutoff-aware, using the same targetProcessingDate()
// logic as the turnaround dots — an order placed after cutoff belongs to
// the NEXT working day's cohort, not today's, matching how the team
// actually experiences the workday.
let dailySnapshotTimer = null;
let dailySnapshotChart = null;

const ACTIONED_STATUSES = ['complete', 'out_of_stock', 'duplicate', 'non_urgent', 'part_supplied', 'superseded', 'rejected'];
// "To follow" is a subset of ACTIONED_STATUSES — a decision was made
// (out of stock / part-supplied / non-urgent), but it still needs
// further work. Only used by the bulk dashboard's own pie chart below
// — insights.html's chart is untouched and keeps the original
// pending/actioned split.
const TOFOLLOW_STATUSES = ['out_of_stock', 'non_urgent', 'part_supplied'];

async function loadDailySnapshotData() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayIso = isoDate(today);
  const todayName = WEEKDAY_NAMES[today.getDay()];

  // Candidate window generous enough that anything targeting today
  // (including yesterday's after-cutoff orders) is definitely included.
  const lookback = new Date(today); lookback.setDate(lookback.getDate() - 3);
  const { data: orderRows } = await sb.from('orders').select('id, status, created_at, order_type, ward_id')
    .gte('created_at', lookback.toISOString());

  const todaysCohort = (orderRows || []).filter(o => isoDate(targetProcessingDate(o.created_at)) === todayIso);
  const pending = todaysCohort.filter(o => !ACTIONED_STATUSES.includes(o.status));
  const actioned = todaysCohort.filter(o => ACTIONED_STATUSES.includes(o.status));

  const dueTopupWards = wards.filter(w => (w.topup_days || []).includes(todayName) && w.active !== false);
  let sentTopups = 0, completedTopups = 0;
  if (dueTopupWards.length) {
    const dueWardIds = dueTopupWards.map(w => w.id);
    const { data: sessions } = await sb.from('order_sessions').select('id, ward_id')
      .in('ward_id', dueWardIds).eq('order_type', 'topup').gte('created_at', today.toISOString());
    sentTopups = sessions?.length || 0;
    if (sentTopups) {
      const { data: sessionOrders } = await sb.from('orders').select('session_id, status').in('session_id', (sessions || []).map(s => s.id));
      completedTopups = (sessions || []).filter(s => {
        const lines = (sessionOrders || []).filter(o => o.session_id === s.id);
        return lines.length && lines.every(o => o.status === 'complete');
      }).length;
    }
  }

  return { pendingCount: pending.length, actionedCount: actioned.length, dueTopupCount: dueTopupWards.length, sentTopups, completedTopups };
}

async function renderDailySnapshot(pieCanvasId, statsContainerId) {
  if (dailySnapshotTimer) clearInterval(dailySnapshotTimer);

  async function refresh() {
    const d = await loadDailySnapshotData();
    const canvas = document.getElementById(pieCanvasId);
    if (canvas) {
      dailySnapshotChart?.destroy();
      dailySnapshotChart = new Chart(canvas, {
        type: 'pie',
        data: {
          labels: ['Pending', 'Actioned'],
          datasets: [{ data: [d.pendingCount, d.actionedCount], backgroundColor: ['#E0A72E', '#229A82'] }],
        },
        options: { responsive: true },
      });
    }
    const statsEl = document.getElementById(statsContainerId);
    if (statsEl) {
      statsEl.innerHTML = [
        ['Due top-ups today', d.dueTopupCount, 'var(--navy)'],
        ['Top-ups sent today', d.sentTopups, 'var(--teal)'],
        ['Top-ups completed today', d.completedTopups, 'var(--teal-deep)'],
      ].map(([label, val, color]) => `
        <div class="card" style="text-align:center; flex:1; box-shadow:none; border:1px solid var(--border-soft);">
          <div class="muted" style="font-size:11px; text-transform:uppercase; letter-spacing:.04em;">${esc(label)}</div>
          <div style="font-size:24px; font-weight:700; color:${color}; margin-top:4px;">${val}</div>
        </div>`).join('');
    }
  }
  await refresh();
  dailySnapshotTimer = setInterval(refresh, 120000); // live — refreshes every 2 minutes
}

// ---------- BULK DASHBOARD'S OWN PIE CHART (separate from the shared
// one above, which insights.html still uses unchanged) ----------
// Pending / Actioned / To-follow, each independently toggleable.
let bulkPieTimer = null;
let bulkPieChart = null;

async function loadBulkPieData() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayIso = isoDate(today);
  const lookback = new Date(today); lookback.setDate(lookback.getDate() - 3);
  const { data: orderRows } = await sb.from('orders').select('id, status, created_at')
    .gte('created_at', lookback.toISOString());
  const todaysCohort = (orderRows || []).filter(o => isoDate(targetProcessingDate(o.created_at)) === todayIso);
  const toFollowOnly = ACTIONED_STATUSES.filter(s => !TOFOLLOW_STATUSES.includes(s));
  const pending = todaysCohort.filter(o => !ACTIONED_STATUSES.includes(o.status));
  const actioned = todaysCohort.filter(o => toFollowOnly.includes(o.status));
  const toFollow = todaysCohort.filter(o => TOFOLLOW_STATUSES.includes(o.status));
  return { pendingCount: pending.length, actionedCount: actioned.length, toFollowCount: toFollow.length };
}

// slices: { pending: bool, actioned: bool, toFollow: bool }
async function renderBulkPieSnapshot(canvasId, slices) {
  if (bulkPieTimer) clearInterval(bulkPieTimer);
  async function refresh() {
    const d = await loadBulkPieData();
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const all = [
      ['Pending', d.pendingCount, '#E0A72E', slices.pending],
      ['Actioned', d.actionedCount, '#229A82', slices.actioned],
      ['To follow', d.toFollowCount, '#6A3FB5', slices.toFollow],
    ].filter(([, , , on]) => on);
    bulkPieChart?.destroy();
    bulkPieChart = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: all.map(([label]) => label),
        datasets: [{ data: all.map(([, val]) => val), backgroundColor: all.map(([, , color]) => color) }],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });
  }
  await refresh();
  bulkPieTimer = setInterval(refresh, 120000);
}

// ---------- SITE SCOPE (client-side mirror of can_process_for_site) ----------
// The wards/sites tables are deliberately readable by everyone (names
// aren't sensitive and are needed broadly for pickers etc.), so unlike
// orders/order_sessions/blist_items, RLS doesn't narrow the `wards`
// array itself — any dashboard view built from it needs to filter
// client-side. Returns null for "unrestricted" (superuser/developer),
// otherwise a Set of site_ids this user can process for — matching
// can_process_for_site()'s own site-level granularity: any single
// ward assignment at a site opens up that whole site, same as the
// backend already allows them to query elsewhere in the app.
async function myAccessibleSiteIds() {
  if (isSuperuser()) return null;
  const [{ data: siteRows }, { data: wardRows }] = await Promise.all([
    sb.from('user_sites').select('site_id').eq('user_id', profile.id),
    sb.from('user_wards').select('ward_id').eq('user_id', profile.id),
  ]);
  const ids = new Set((siteRows || []).map(r => r.site_id));
  (wardRows || []).forEach(r => {
    const w = wards.find(x => x.id === r.ward_id);
    if (w) ids.add(w.site_id);
  });
  return ids;
}

// ---------- WARD TOP-UP STATUS (separate card on the bulk dashboard) ----------
// A ward whose top-up is due TODAY should have submitted its request
// YESTERDAY (the day-before submission workflow this system already
// uses elsewhere) — so "on time" here means a session dated exactly
// yesterday's calendar day, not a rolling 24h window.
let wardTopupStatusTimer = null;

async function loadWardTopupStatusData() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayName = WEEKDAY_NAMES[today.getDay()];
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

  const mySiteIds = await myAccessibleSiteIds();
  const dueWards = wards.filter(w => (w.topup_days || []).includes(todayName) && w.active !== false
    && (mySiteIds === null || mySiteIds.has(w.site_id)));
  if (!dueWards.length) return { dueWards: [], processedWardIds: new Set(), onTimeWardIds: new Set() };

  const dueWardIds = dueWards.map(w => w.id);
  const { data: sessions } = await sb.from('order_sessions').select('id, ward_id, created_at')
    .in('ward_id', dueWardIds).eq('order_type', 'topup').gte('created_at', yesterday.toISOString());

  const onTimeWardIds = new Set(
    (sessions || []).filter(s => isoDate(new Date(s.created_at)) === isoDate(yesterday)).map(s => s.ward_id)
  );

  const relevantSessionIds = (sessions || []).map(s => s.id);
  let processedWardIds = new Set();
  if (relevantSessionIds.length) {
    const { data: sessionOrders } = await sb.from('orders').select('session_id, ward_id, status').in('session_id', relevantSessionIds);
    (sessions || []).forEach(s => {
      const lines = (sessionOrders || []).filter(o => o.session_id === s.id);
      if (lines.length && lines.every(o => o.status === 'complete')) processedWardIds.add(s.ward_id);
    });
  }

  return { dueWards, processedWardIds, onTimeWardIds };
}

async function renderWardTopupStatus(containerId) {
  if (wardTopupStatusTimer) clearInterval(wardTopupStatusTimer);
  async function refresh() {
    const { dueWards, processedWardIds, onTimeWardIds } = await loadWardTopupStatusData();
    const el = document.getElementById(containerId);
    if (!el) return;
    const notSubmitted = dueWards.filter(w => !onTimeWardIds.has(w.id));
    const previewEnabled = systemSettings.overdue_topup_preview_enabled === 'true';
    const tiles = [
      ['Wards due top-up today', dueWards.length, 'var(--navy)'],
      ['Wards processed', processedWardIds.size, 'var(--teal-deep)'],
      ['Submitted on time', onTimeWardIds.size, 'var(--teal)'],
      ['Not submitted on time', notSubmitted.length, notSubmitted.length ? 'var(--red)' : 'var(--slate)'],
    ].map(([label, val, color]) => `
      <div class="card" style="text-align:center; flex:1; box-shadow:none; border:1px solid var(--border-soft);">
        <div class="muted" style="font-size:11px; text-transform:uppercase; letter-spacing:.04em;">${esc(label)}</div>
        <div style="font-size:24px; font-weight:700; color:${color}; margin-top:4px;">${val}</div>
      </div>`).join('');

    const rows = dueWards.map(w => {
      const isOverdue = !processedWardIds.has(w.id) && !onTimeWardIds.has(w.id);
      const status = processedWardIds.has(w.id) ? ['complete', 'Processed']
        : onTimeWardIds.has(w.id) ? ['pending', 'Submitted, awaiting processing']
        : ['out_of_stock', 'Not submitted'];
      const previewBtn = (isOverdue && previewEnabled)
        ? `<button class="btn small ghost" data-preview-topup="${w.id}" style="margin-left:8px;">Preview predictive top-up</button>` : '';
      return `<tr><td>${esc(w.name)}</td><td style="text-align:right; white-space:nowrap;"><span class="badge ${status[0]}">${status[1]}</span>${previewBtn}</td></tr>`;
    }).join('');

    el.innerHTML = `<div class="row" style="width:100%;">${tiles}</div>
      ${dueWards.length ? `<table style="margin-top:14px;"><thead><tr><th>Ward</th><th></th></tr></thead><tbody>${rows}</tbody></table>`
        : `<div class="empty" style="margin-top:14px;">No wards due a top-up today.</div>`}`;

    el.querySelectorAll('[data-preview-topup]').forEach(b => b.onclick = () => openOverdueTopupPreview(b.dataset.previewTopup));
  }
  await refresh();
  wardTopupStatusTimer = setInterval(refresh, 120000);
}

// ---------- OVERDUE TOP-UP PREVIEW (read-only) ----------
// Full current stocklist at max quantity — what a top-up would look
// like if raised right now. Read-only for anyone who can process;
// actually raising it as a real order is a separate step, only
// available to whoever has genuine order access to that ward, in
// order.html — this never creates or commits anything itself.
async function openOverdueTopupPreview(wardId) {
  const wName = wardName(wardId) || 'this ward';
  openModal(`<h3>Predictive top-up preview \u2014 ${esc(wName)}</h3>
    <p class="muted">Every current stocklist item at its usual max quantity. This is a preview only \u2014 nothing is created here. Whoever has ordering access to this ward can raise it for real from the ordering screen.</p>
    <div id="overdue-preview-body">Loading\u2026</div>
    <div class="actions"><button class="btn ghost" onclick="closeModal()">Close</button></div>`);
  const { data, error } = await sb.from('blist_items').select('medicine_name, max_qty').eq('ward_id', wardId).order('medicine_name');
  const bodyEl = document.getElementById('overdue-preview-body');
  if (!bodyEl) return; // modal closed before this resolved
  if (error) { bodyEl.innerHTML = `<div class="empty">${esc(error.message)}</div>`; return; }
  if (!data?.length) { bodyEl.innerHTML = `<div class="empty">No stocklist set up for this ward.</div>`; return; }
  bodyEl.innerHTML = `<table><thead><tr><th>Medicine</th><th>Max qty</th></tr></thead><tbody>
    ${data.map(i => `<tr><td>${esc(i.medicine_name)}</td><td>${i.max_qty}</td></tr>`).join('')}
  </tbody></table>`;
}

// ---------- AUTO-REFRESH (always on, per page) ----------
// A full re-render on a timer, distinct from the toast/push
// notification polling above — that just alerts you something new
// arrived; this actually redraws the page's own content so it shows
// up without a manual reload. Skips a refresh cycle entirely if a
// modal is currently open, so it never yanks away a form someone's
// mid-way through filling in (e.g. a part-order quantity). Runs
// silently — no on-page toggle or indicator.
let autoRefreshTimer = null;

function startAutoRefresh(renderFn, mountElId, intervalMs = 30000) {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  autoRefreshTimer = setInterval(async () => {
    if (document.hidden) return; // don't burn requests on a backgrounded tab
    const modalOpen = document.getElementById('modal-root')?.innerHTML.trim().length > 0;
    if (modalOpen) return;
    await renderFn();
  }, intervalMs);
}
