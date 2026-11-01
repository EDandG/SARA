// ============================================================
// Stock Req — shared.js
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

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// ---------- ACCESSIBILITY SETTINGS (colour modes + animation) ----------
// Stored per device in localStorage. Colour only: no layout or text-size changes.
const A11Y_MODES = [
  ['default', 'Standard', 'The normal Stock Req colours', ['#f4f5f7', '#1a2744', '#0e7c86']],
  ['bw', 'Black and white', 'Greyscale, no colour at all', ['#ffffff', '#000000', '#6b6b6b']],
  ['blue', 'Blue contrast', 'Pale blue background, deep blue text', ['#d6e6f8', '#00205b', '#005eb8']],
  ['beige', 'Beige contrast', 'Warm cream background, dark brown text', ['#f1e7cc', '#3a2f17', '#7a3e00']],
  ['high', 'High contrast', 'Black background, light text', ['#000000', '#ffffff', '#ffd23f']],
];
function a11yGet() {
  let c = 'default', m = null;
  try { c = localStorage.getItem('sr_a11y_contrast') || 'default'; m = localStorage.getItem('sr_a11y_motion'); } catch (e) {}
  if (!A11Y_MODES.some(x => x[0] === c)) c = 'default';
  if (m === null) { try { m = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'off' : 'on'; } catch (e) { m = 'on'; } }
  return { contrast: c, motion: m === 'off' ? 'off' : 'on' };
}
function a11yApply() {
  const s = a11yGet(), r = document.documentElement;
  if (s.contrast === 'default') r.removeAttribute('data-contrast'); else r.setAttribute('data-contrast', s.contrast);
  r.setAttribute('data-motion', s.motion);
}
function a11ySet(patch) {
  const s = Object.assign(a11yGet(), patch);
  try { localStorage.setItem('sr_a11y_contrast', s.contrast); localStorage.setItem('sr_a11y_motion', s.motion); } catch (e) {}
  a11yApply();
}
a11yApply();
function openAccessibilitySettings() {
  const s = a11yGet();
  openModal(`<h3>Accessibility settings</h3>
    <p class="muted" style="margin-top:0;">Choose colours that are comfortable to read. This applies on this device only.</p>
    <fieldset class="a11y-set"><legend>Colours</legend>
      ${A11Y_MODES.map(([id, name, desc, sw]) => `<label class="a11y-opt"><input type="radio" name="a11y-c" value="${id}" ${s.contrast === id ? 'checked' : ''} />
        <span class="a11y-sw" style="background:${sw[0]}; color:${sw[1]}; border-color:${sw[2]};">Aa</span>
        <span><b>${esc(name)}</b><small>${esc(desc)}</small></span></label>`).join('')}
    </fieldset>
    <fieldset class="a11y-set"><legend>Movement</legend>
      <label class="a11y-opt"><input type="checkbox" id="a11y-motion" ${s.motion === 'off' ? 'checked' : ''} />
        <span><b>Turn off animations</b><small>Removes the moving triangles and the header shimmer</small></span></label>
    </fieldset>
    <div class="actions"><button class="btn ghost" id="a11y-reset">Reset to standard</button><button class="btn magenta" onclick="closeModal()">Done</button></div>`);
  document.querySelectorAll('input[name=a11y-c]').forEach(i => i.onchange = () => a11ySet({ contrast: i.value }));
  document.getElementById('a11y-motion').onchange = (e) => a11ySet({ motion: e.target.checked ? 'off' : 'on' });
  document.getElementById('a11y-reset').onclick = () => {
    try { localStorage.removeItem('sr_a11y_contrast'); localStorage.removeItem('sr_a11y_motion'); } catch (e) {}
    a11yApply(); closeModal();
  };
}

// ED&G animated background (triangles / orbs / light beams / particles) —
// the original Pharmacy Portal look, styled in shared.css (.bg-anim).
(function injectBgAnim() {
  if (document.querySelector('.bg-anim')) return;
  const bg = document.createElement('div');
  bg.className = 'bg-anim';
  bg.setAttribute('aria-hidden', 'true');
  bg.innerHTML = "<div class=\"tri tri-a\"></div>\n<div class=\"tri tri-b\"></div>\n<div class=\"tri tri-c\"></div>\n<div class=\"tri tri-d\"></div>\n<div class=\"tri tri-e\"></div>\n<div class=\"tri tri-f\"></div>\n<div class=\"orb orb1\"></div>\n<div class=\"orb orb2\"></div>\n<div class=\"orb orb3\"></div>\n<div class=\"orb orb4\"></div>\n<div class=\"light-beam\" style=\"left:12%;height:60%;background:linear-gradient(to bottom,transparent,rgba(18,160,173,0.10),transparent);width:3px;animation:beamFall 14s linear infinite;animation-delay:0s\"></div>\n<div class=\"light-beam\" style=\"left:34%;height:75%;background:linear-gradient(to bottom,transparent,rgba(95,182,224,0.14),transparent);width:2px;animation:beamFall 18s linear infinite;animation-delay:-5s\"></div>\n<div class=\"light-beam\" style=\"left:62%;height:55%;background:linear-gradient(to bottom,transparent,rgba(76,175,80,0.10),transparent);width:4px;animation:beamFall 22s linear infinite;animation-delay:-9s\"></div>\n<div class=\"light-beam\" style=\"left:84%;height:70%;background:linear-gradient(to bottom,transparent,rgba(76,175,80,0.12),transparent);width:2px;animation:beamFall 16s linear infinite;animation-delay:-3s\"></div>\n<div class=\"particle\" style=\"width:4px;height:4px;background:rgba(95,182,224,0.6);bottom:5%;left:8%;animation:floatUp1 12s linear infinite,bobble 4s ease-in-out infinite;animation-delay:0s,0s\"></div>\n<div class=\"particle\" style=\"width:3px;height:3px;background:rgba(76,175,80,0.7);bottom:5%;left:20%;animation:floatUp2 16s linear infinite,bobble 6s ease-in-out infinite;animation-delay:-4s,-1s\"></div>\n<div class=\"particle\" style=\"width:5px;height:5px;background:rgba(18,160,173,0.45);bottom:5%;left:33%;animation:floatUp3 14s linear infinite,bobble 5s ease-in-out infinite;animation-delay:-8s,-2s\"></div>\n<div class=\"particle\" style=\"width:3px;height:3px;background:rgba(76,175,80,0.6);bottom:5%;left:45%;animation:floatUp1 18s linear infinite,bobble 7s ease-in-out infinite;animation-delay:-2s,-3s\"></div>\n<div class=\"particle\" style=\"width:4px;height:4px;background:rgba(95,182,224,0.55);bottom:5%;left:57%;animation:floatUp2 13s linear infinite,bobble 4.5s ease-in-out infinite;animation-delay:-6s,-1.5s\"></div>\n<div class=\"particle\" style=\"width:6px;height:6px;background:rgba(18,160,173,0.45);bottom:5%;left:68%;animation:floatUp3 20s linear infinite,bobble 6.5s ease-in-out infinite;animation-delay:-10s,-0.5s\"></div>\n<div class=\"particle\" style=\"width:3px;height:3px;background:rgba(159,208,238,0.8);bottom:5%;left:76%;animation:floatUp1 15s linear infinite,bobble 5.5s ease-in-out infinite;animation-delay:-3s,-2.5s\"></div>\n<div class=\"particle\" style=\"width:4px;height:4px;background:rgba(76,175,80,0.55);bottom:5%;left:84%;animation:floatUp2 17s linear infinite,bobble 4s ease-in-out infinite;animation-delay:-7s,-1s\"></div>\n<div class=\"particle\" style=\"width:5px;height:5px;background:rgba(18,160,173,0.5);bottom:5%;left:91%;animation:floatUp3 11s linear infinite,bobble 6s ease-in-out infinite;animation-delay:-1s,-3.5s\"></div>\n<div class=\"particle\" style=\"width:3px;height:3px;background:rgba(95,182,224,0.5);bottom:5%;left:4%;animation:floatUp1 19s linear infinite,bobble 5s ease-in-out infinite;animation-delay:-5s,-2s\"></div>";
  document.body.insertBefore(bg, document.body.firstChild);
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
let packSizes = {}; // medicine name -> pack size, from the drug catalog (loaded by requireAuth)
let systemSettings = { topup_window_start: '00:01', topup_window_end: '17:00', duplicate_window_hours: '48', overdue_topup_preview_enabled: 'false', trust_logo_data_url: '', login_logo_data_url: '', order_history_days: '7', picking_check_required: 'true', no_check_label: 'Processed', feature_insights_enabled: 'false', feature_bi_enabled: 'false' };
let notifyPollTimer = null;
let lastSeenOrdersAt = null;

const isDeveloper = () => profile?.role === 'developer';
const isSuperuserRole = () => profile?.role === 'superuser';
const isSuperuser  = () => isDeveloper() || isSuperuserRole(); // top tier, either flavour — see note above
// These keep their old names so every existing call site picks up the
// new meaning automatically — same approach as the backend functions
// they mirror. Titles carry no capability; every one of these is now
// a tickbox on the account, independent of what it's called.
const canPostBanners = () => isSuperuser() || !!profile?.can_post_banners;
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
// Superuser/Developer can switch the second-person picking check off (System Settings).
const pickingCheckRequired = () => checkingEnabled() && systemSettings.picking_check_required !== 'false';
// Wording used in the audit trail when the second-person check is switched off.
const noCheckLabel = () => (systemSettings.no_check_label || 'Processed').trim() || 'Processed';
// One sentence for the audit trail: "Processed by A on D, checked by B on D2"
// with the check on; "<label> by A on D" with it off.
function pickAuditLine(s, nameById) {
  if (!s.picking_confirmed_at) return '';
  const picker = esc(nameById[s.picking_confirmed_by] || '\u2014');
  if (s.checked_at && s.check_waived) return `${esc(noCheckLabel())} by ${picker} on ${fmtDate(s.picking_confirmed_at)}`;
  const base = `Processed by ${picker} on ${fmtDate(s.picking_confirmed_at)}`;
  if (s.checked_at) return `${base}, checked by ${esc(nameById[s.checked_by] || '\u2014')} on ${fmtDate(s.checked_at)}`;
  return `${base} \u2014 awaiting an independent check`;
}
const canApproveOrders = () => isSuperuser() || !!profile?.can_approve_orders;
const canMarkNonUrgent = () => isSuperuser() || !!profile?.can_mark_nonurgent;
const canManageStocklists = () => isSuperuser() || !!profile?.can_manage_stocklists;
const canManageWardsSites = () => isSuperuser() || !!profile?.can_manage_wards_sites;
const canViewBi = () => isSuperuser() || !!profile?.can_view_bi;
const canViewDashboard = () => isSuperuser() || !!profile?.can_view_dashboard;
// Paid features: hidden from everyone until a Developer switches them on in System settings.
const insightsEnabled = () => systemSettings.feature_insights_enabled === 'true';
const biEnabled = () => systemSettings.feature_bi_enabled === 'true';
const aboveMaxEnabled = () => systemSettings.feature_abovemax_enabled === 'true';
const alternativesEnabled = () => systemSettings.feature_alternatives_enabled === 'true';
const checkingEnabled = () => systemSettings.feature_checking_enabled === 'true';
const remindersEnabled = () => systemSettings.feature_reminders_enabled === 'true';
const predictiveEnabled = () => systemSettings.feature_predictive_enabled === 'true';
const canFreetextTempStock = () => !!profile?.can_freetext_temp_stock && canOrder();


// ---------- HELPERS (verbatim from the single-file app) ----------
function toast(msg, isErr = false) {
  const el = document.createElement('div');
  el.className = 'toast' + (isErr ? ' err' : '');
  el.setAttribute('role', isErr ? 'alert' : 'status');
  el.innerHTML = `<span class="toast-ic" aria-hidden="true">${isErr
    ? '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 7v6M12 17v.1"/></svg>'
    : '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'}</span><span class="toast-tx"></span>`;
  el.querySelector('.toast-tx').textContent = msg;
  const life = isErr ? 5200 : 3200;
  el.style.setProperty('--life', life + 'ms');
  document.getElementById('toast-root').appendChild(el);
  const kill = () => { el.classList.add('out'); setTimeout(() => el.remove(), 180); };
  el.onclick = kill;
  setTimeout(kill, life);
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
// Full wording for badges people read (the dot alone is too easy to miss).
function statusBadgeText(s) { return { pending:'Pending', complete:'Complete', out_of_stock:'To follow (out of stock)', part_supplied:'Part order, rest to follow', duplicate:'Duplicate order', non_urgent:'Non-urgent', pending_approval:'Awaiting approval', superseded:'Replaced by a later request', rejected:'Rejected' }[s] || s; }
function statusBadge(cls, text) { return `<span class="badge ${esc(cls)}" style="display:inline-flex; align-items:center; gap:6px; white-space:normal; text-align:left;">${statusDot(cls, text)}${esc(text)}</span>`; }
function statusLabel(s) { return { pending:'Pending', complete:'Complete', out_of_stock:'Out of stock', part_supplied:'Part supplied', duplicate:'Duplicate order', non_urgent:'Non-urgent', pending_approval:'Awaiting approval', superseded:'Superseded by reorder', rejected:'Rejected' }[s] || s; }
// Pack size shown beside a medicine name. Prefers the size copied onto the
// order line when it was placed; falls back to the catalog's current one.
function packTag(o) {
  const name = String(o?.medicine_name || '').replace(/^\[Temp stock\] /, '');
  const ps = o?.pack_size || packSizes[name] || '';
  return ps ? ` <span class="pack-size" style="font-size:11.5px; color:var(--text-dim); font-weight:400; white-space:nowrap;">\u00b7 Pack: ${esc(ps)}</span>` : '';
}
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
  const groups = [
    ['Waiting', [['pending', 'Pending', 'Sent to pharmacy, not dealt with yet'], ['pending_approval', 'Awaiting approval', 'Above max or restricted, a pharmacist must approve']]],
    ['Done', [['complete', 'Complete', 'Sent in full']]],
    ['Needs following up', [['out_of_stock', 'To follow (out of stock)', 'Out of stock, pharmacy is chasing it'], ['part_supplied', 'Part order', 'Some sent, the rest still to follow'], ['non_urgent', 'Non-urgent', 'Will be sent with a later delivery']]],
    ['Closed, nothing sent', [['duplicate', 'Duplicate', 'Already ordered recently'], ['superseded', 'Replaced', 'A newer request took its place'], ['rejected', 'Rejected', 'Pharmacist declined it']]],
  ];
  const item = ([status, label, mean]) => `<div class="lg-item">${statusDot(status, label)}<span><b>${esc(label)}</b><small>${esc(mean)}</small></span></div>`;
  return `<details class="legend-key" open><summary>What the dots mean</summary>
    <div class="lg-grid">
      ${groups.map(([g, items]) => `<div class="lg-group"><div class="lg-head">${esc(g)}</div>${items.map(item).join('')}</div>`).join('')}
      <div class="lg-group"><div class="lg-head">When it is processed</div>
        <div class="lg-item"><span class="status-dot shape-circle" style="background:#22C55E;"></span><span><b>Due today</b><small>Will be processed today</small></span></div>
        <div class="lg-item"><span class="status-dot shape-circle" style="background:#F97316;"></span><span><b>Next day</b><small>Sent after cut-off, processed tomorrow</small></span></div></div>
    </div></details>`;
}
function attribution(label, name, iso) {
  if (!name && !iso) return '';
  return `<div class="attribution">${label ? esc(label) + ' ' : ''}${name ? esc(name) : ''}${name && iso ? ' · ' : ''}${iso ? fmtDate(iso) : ''}</div>`;
}
// ---------- INACTIVITY SIGN-OUT ----------
// Signs the user out after systemSettings.idle_timeout_minutes (default 30, 0 = off),
// with a one-minute warning. Unsent order drafts live in localStorage and survive this.
let idleTimer = null, idleLast = Date.now(), idleWarnOpen = false;
function startIdleWatch() {
  const mins = parseFloat(systemSettings.idle_timeout_minutes ?? '30');
  if (idleTimer) clearInterval(idleTimer);
  if (!mins || mins <= 0) return;
  const limit = mins * 60000, warnAt = Math.min(60000, limit / 2);
  const bump = () => { if (!idleWarnOpen) idleLast = Date.now(); };
  ['pointerdown', 'keydown', 'touchstart', 'scroll'].forEach(ev => window.addEventListener(ev, bump, { passive: true }));
  idleTimer = setInterval(async () => {
    const left = limit - (Date.now() - idleLast);
    if (left <= 0) {
      clearInterval(idleTimer);
      try { await sb.auth.signOut(); } catch (e) {}
      window.location.href = 'login.html?idle=1';
    } else if (left <= warnAt && !idleWarnOpen) {
      idleWarnOpen = true;
      openModal(`<h3>Still there?</h3><p class="muted">You will be signed out in <b id="idle-left">${Math.ceil(left / 1000)}</b> seconds because there has been no activity. Anything you were building is kept on this device.</p>
        <div class="actions"><button class="btn ghost" id="idle-out">Sign out now</button><button class="btn magenta" id="idle-stay">Stay signed in</button></div>`);
      const tick = setInterval(() => {
        const el = document.getElementById('idle-left');
        if (!el) { clearInterval(tick); return; }
        el.textContent = Math.max(0, Math.ceil((limit - (Date.now() - idleLast)) / 1000));
      }, 500);
      document.getElementById('idle-stay').onclick = () => { idleWarnOpen = false; idleLast = Date.now(); closeModal(); };
      document.getElementById('idle-out').onclick = async () => { try { await sb.auth.signOut(); } catch (e) {} window.location.href = 'login.html'; };
    }
  }, 5000);
}

// "Next top-up: Larch Ward, Thursday" for empty states.
function nextTopupHint(list = wards) {
  let best = null;
  (list || []).filter(w => w.active !== false).forEach(w => (w.topup_days || []).forEach(d => {
    const idx = WEEKDAY_NAMES.indexOf(d); if (idx < 0) return;
    let diff = (idx - new Date().getDay() + 7) % 7; if (diff === 0) diff = 7;
    if (!best || diff < best.diff) best = { diff, ward: w.name, day: d };
  }));
  return best ? `Next top-up: ${best.ward}, ${best.day}.` : '';
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

let _modalReturnFocus = null;
function openModal(innerHtml, wide = false) {
  const root = document.getElementById('modal-root');
  _modalReturnFocus = document.activeElement;
  root.innerHTML = `<div class="modal-bg" id="modal-bg"><div class="modal${wide ? ' wide' : ''}" role="dialog" aria-modal="true">${innerHtml}</div></div>`;
  document.body.classList.add('modal-open');
  document.getElementById('modal-bg').onclick = (e) => { if (e.target.id === 'modal-bg') closeModal(); };
  // focus the first field, else the main action (so Enter / Tab work straight away)
  setTimeout(() => {
    const m = root.querySelector('.modal'); if (!m) return;
    const f = m.querySelector('input:not([type=hidden]):not([disabled]), textarea, select') || m.querySelector('.actions .btn:last-child, .btns .btn:last-child');
    f?.focus({ preventScroll: true });
  }, 30);
}
function closeModal() {
  document.getElementById('modal-root').innerHTML = '';
  document.body.classList.remove('modal-open');
  try { _modalReturnFocus?.focus?.({ preventScroll: true }); } catch (e) {}
  _modalReturnFocus = null;
}
document.addEventListener('keydown', (e) => {
  if (!document.querySelector('#modal-root .modal')) return;
  if (e.key === 'Escape') { e.preventDefault(); closeModal(); return; }
  // Enter in a single-line field presses the dialog's main button
  if (e.key === 'Enter' && e.target.matches?.('.modal input:not([type=checkbox]):not([type=radio])')) {
    const main = document.querySelector('.modal .actions .btn:last-child');
    if (main && !main.disabled) { e.preventDefault(); main.click(); }
  }
});
window.closeModal = closeModal;

// Two-step confirmation for changes to stocklists. Step 1 states exactly what
// is about to change and who it affects (one ward, several, or every ward);
// step 2 asks for a final confirm. Nothing happens until both are pressed.
//   scope: 'ward' (one ward, give wardName) | 'wards' (give wardCount) | 'all' (every ward, give wardCount)
function confirmChange({ scope = 'ward', wardName = '', wardCount = 0, title, details = '', confirmLabel = 'Confirm change', onConfirm, onCancel }) {
  const wide = scope !== 'ward';
  const scopeText = scope === 'all'
    ? `EVERY WARD${wardCount ? ` (${wardCount})` : ''}`
    : scope === 'wards' ? `${wardCount} WARD${wardCount === 1 ? '' : 'S'}`
    : `THIS WARD ONLY \u2014 ${esc(wardName || 'selected ward')}`;
  const banner = `<div style="margin:10px 0; padding:10px 12px; border-radius:8px; font-weight:700; letter-spacing:.02em;
      ${wide ? 'background:#fdecef; color:#9b1239; border:1px solid #f3b8c6;' : 'background:#eaf0fb; color:#13315c; border:1px solid #c5d3ee;'}">
      This change affects: ${scopeText}</div>`;
  const cancel = () => { closeModal(); if (onCancel) onCancel(); };
  const step2 = () => {
    openModal(`
      ${modalIcon('warn')}
      <h3>Final confirmation</h3>
      ${banner}
      <p><b>${esc(title)}</b></p>
      <p class="muted">Press <b>${esc(confirmLabel)}</b> to make this change now. Stocklist changes take effect immediately for ordering.</p>
      <div class="actions">
        <button class="btn ghost" id="cc-cancel2">Cancel</button>
        <button class="btn magenta" id="cc-final">${esc(confirmLabel)}</button>
      </div>`);
    document.getElementById('cc-cancel2').onclick = cancel;
    document.getElementById('cc-final').onclick = async () => {
      const b = document.getElementById('cc-final'); if (b) { b.disabled = true; b.textContent = 'Working\u2026'; }
      closeModal();
      await onConfirm();
    };
  };
  openModal(`
    ${modalIcon('ask')}
    <h3>Are you sure?</h3>
    ${banner}
    <p><b>${esc(title)}</b></p>
    ${details ? `<p class="muted">${details}</p>` : ''}
    <div class="actions">
      <button class="btn ghost" id="cc-cancel1">Cancel</button>
      <button class="btn" id="cc-continue">Continue</button>
    </div>`);
  document.getElementById('cc-cancel1').onclick = cancel;
  document.getElementById('cc-continue').onclick = step2;
}
window.confirmChange = confirmChange;

const MODAL_ICONS = {
  warn: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18.2v.1"/></svg>',
  ask: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M9.2 9.3a2.9 2.9 0 015.5 1.2c0 1.9-2.7 2.3-2.7 4M12 17.8v.1"/></svg>',
};
function modalIcon(kind) { return `<div class="modal-ic ${kind === 'warn' ? 'warn' : ''}">${MODAL_ICONS[kind] || MODAL_ICONS.ask}</div>`; }
function confirmDialog(title, body, confirmLabel, onConfirm, danger = false) {
  openModal(`
    ${modalIcon(danger ? 'warn' : 'ask')}
    <h3>${esc(title)}</h3>
    <p class="muted">${body}</p>
    <div class="actions">
      <button class="btn ghost" onclick="closeModal()">Cancel</button>
      <button class="btn ${danger ? 'danger' : 'magenta'}" id="modal-confirm-btn">${esc(confirmLabel)}</button>
    </div>`);
  document.getElementById('modal-confirm-btn').onclick = () => { closeModal(); onConfirm(); };
  if (danger) setTimeout(() => document.querySelector('.modal .actions .btn.ghost')?.focus(), 40);   // destructive: default focus is Cancel
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
    ['Site', 'Ward', 'Medicine', 'Pack size', 'Quantity', 'Status', 'Ordered by', 'Ordered at', 'Processed by', 'Processed at', 'Supplied at'],
    ...rows.map(r => [
      r._siteName || '', r._wardName || '', r.medicine_name, r.pack_size || packSizes[r.medicine_name] || '', r.quantity, statusLabel(r.status),
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
        <span style="display:flex; align-items:center; gap:8px;">${pendingCount ? `<span class="badge pending">${pendingCount} pending</span>` : processedBadge}<button class="btn small ghost" onclick="openRequestSummary('${session.id}')">View details</button></span>
      </div>
      <table style="margin-top:8px;"><tbody>
        ${lines.map(o => {
          const statusHtml = o._displayStatusText
            ? statusBadge(o._displayStatusClass, o._displayStatusText)
            : statusBadge(o.status, statusBadgeText(o.status));
          const actionedAttr = o.processed_by
            ? attribution(statusLabel(o.status) + ' by', nameById[o.processed_by], o._latestUpdate || o.processed_at)
            : (o.approved_by ? attribution('Approved by', nameById[o.approved_by], o.approved_at) : '');
          return `<tr>
          <td>${esc(o.medicine_name)}${packTag(o)}${actionedAttr}${fulfilledNote(o)}</td><td style="text-align:right;">${o.quantity}</td>
          <td style="text-align:right;">${statusHtml}</td>
        </tr>`;
        }).join('')}
      </tbody></table>
    </div>`;
}

// Puts the Trust logo (set by the Developer in System settings) at the left of
// the header on every page. Shown on a white plate so any logo reads on navy.
function applyTrustLogo() {
  const url = String(systemSettings.trust_logo_data_url || '');
  if (!/^data:image\/(svg\+xml|png|jpeg|gif|webp)[;,]/i.test(url)) return;
  document.querySelectorAll('header.topbar .brand').forEach(brand => {
    if (brand.querySelector('.trust-logo')) return;
    const wrap = document.createElement('div');
    wrap.className = 'trust-logo';
    const img = document.createElement('img');
    img.alt = 'Trust logo';
    img.src = url;
    wrap.appendChild(img);
    brand.insertBefore(wrap, brand.firstChild);
  });
}

// ---------- DAILY DASHBOARD (home screen, for users with the dashboard tickbox) ----------
// Everything is "today" in London time (midnight to now). "Yet to send" are the
// wards whose top-up is due TOMORROW and haven't submitted their top-up request today.
let dashboardTimer = null;

function dashFmtTime(iso) { return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }

function openDashboardList(kind, d) {
  const expected = d.expected || [];
  const sent = expected.filter(e => e.session_id);
  const yet = expected.filter(e => !e.session_id);
  const reqRows = (list) => list.length ? `<table><thead><tr><th>Ward</th><th>Site</th><th>Sent</th><th>Items</th><th></th></tr></thead><tbody>
      ${list.map(r => `<tr><td><b>${esc(r.ward)}</b></td><td class="muted">${esc(r.site)}</td><td>${dashFmtTime(r.created_at)}</td><td>${r.items}</td>
        <td style="text-align:right;"><button class="btn small ghost" data-dash-view="${r.id}">View request</button></td></tr>`).join('')}
    </tbody></table>` : '<div class="empty">None yet today.</div>';
  let title, sub, bodyHtml;
  if (kind === 'yet') {
    title = 'Wards yet to send their top-up request';
    sub = `Top-up is due ${esc(d.tomorrow)} — these wards haven't submitted today.`;
    const bySite = {};
    yet.forEach(w => { (bySite[w.site] ||= []).push(w); });
    bodyHtml = yet.length ? Object.keys(bySite).sort().map(site => `
      <div style="margin-bottom:12px;"><div style="font-weight:700; color:var(--navy); font-size:12.5px; margin-bottom:4px;">${esc(site)}</div>
        ${bySite[site].map(w => `<div class="proc-line" style="margin-bottom:6px;"><div class="pl-main"><div class="pl-name">${esc(w.ward)}</div><div class="pl-meta">Top-up request not yet sent</div></div><span class="badge pending">Yet to send</span></div>`).join('')}
      </div>`).join('') : '<div class="empty">Every ward due a top-up has sent theirs.</div>';
  } else if (kind === 'sent') {
    title = 'Wards that have sent their top-up request';
    sub = `Top-up is due ${esc(d.tomorrow)} — these wards have submitted today.`;
    bodyHtml = sent.length ? `<table><thead><tr><th>Ward</th><th>Site</th><th>Sent</th><th></th></tr></thead><tbody>
      ${sent.map(w => `<tr><td><b>${esc(w.ward)}</b></td><td class="muted">${esc(w.site)}</td><td>${dashFmtTime(w.sent_at)}</td>
        <td style="text-align:right;"><button class="btn small ghost" data-dash-view="${w.session_id}">View request</button></td></tr>`).join('')}
    </tbody></table>` : '<div class="empty">No ward has sent one yet.</div>';
  } else if (kind === 'adhoc') {
    title = 'Adhoc requests today'; sub = 'Since midnight.'; bodyHtml = reqRows(d.adhoc || []);
  } else {
    title = 'Top-up requests today'; sub = 'Since midnight.'; bodyHtml = reqRows(d.topup || []);
  }
  openModal(`<div id="proc-modal-body">
    <div class="proc-head"><div><h3>${title}</h3><p class="ph-sub">${sub}</p></div></div>
    <div class="proc-body">${bodyHtml}</div>
    <div class="proc-foot"><span class="hint"></span><div class="btns"><button class="btn ghost" onclick="closeModal()">Close</button></div></div>
  </div>`, true);
  document.querySelectorAll('[data-dash-view]').forEach(b => b.onclick = () => openRequestSummary(b.dataset.dashView));
}

async function renderDashboardPanel(mountEl) {
  if (!mountEl) return;
  if (dashboardTimer) { clearInterval(dashboardTimer); dashboardTimer = null; }
  async function refresh() {
    const { data: d, error } = await sb.rpc('dashboard_summary');
    if (error || !d) { mountEl.innerHTML = `<div class="card"><h2>Today</h2><div class="empty">${esc(error?.message || 'Dashboard unavailable.')}</div></div>`; return; }
    const expected = d.expected || [];
    const sentN = expected.filter(e => e.session_id).length;
    const yetN = expected.length - sentN;
    const tile = (kind, num, label, sub, cls) => `<button class="dash-tile ${cls || ''}" data-dash="${kind}">
        <div class="dt-num">${num}</div><div class="dt-label">${label}</div><div class="dt-sub">${sub}</div></button>`;
    mountEl.innerHTML = `<div class="card dash-card">
      <h2>Today <span class="muted">${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} \u00b7 since midnight \u00b7 updates automatically</span></h2>
      <div class="dash-tiles">
        ${tile('adhoc', (d.adhoc || []).length, 'Adhoc requests', 'Click to see them', 'navy')}
        ${tile('topup', (d.topup || []).length, 'Full top-up requests', 'Click to see them', 'navy')}
        ${tile('sent', sentN, 'Wards sent top-up request', `of ${expected.length} due ${esc(d.tomorrow)}`, 'teal')}
        ${tile('yet', yetN, 'Wards yet to send', yetN ? 'Click to see which wards' : 'All sent', yetN ? 'red' : 'teal')}
      </div></div>`;
    mountEl.querySelectorAll('[data-dash]').forEach(b => b.onclick = () => openDashboardList(b.dataset.dash, d));
  }
  await refresh();
  dashboardTimer = setInterval(refresh, 120000);
}

// ---------- REQUEST SUMMARY (click-through for any adhoc / top-up request) ----------
// Shows every drug on a request: what was asked for, what was actually sent,
// and what happened to it (sent in full, alternative, part supplied, out of
// stock, duplicate, ...). Used from every list that shows a request.
function summariseRequestLine(o, childOf, nameById) {
  const child = childOf.get(o.id);
  const by = o.processed_by && nameById[o.processed_by] ? ` · ${esc(nameById[o.processed_by])}` : '';
  const when = o.processed_at ? ` · ${fmtDate(o.processed_at)}` : '';
  const r = { sent: 0, cls: '', label: statusLabel(o.status), notes: [] };
  if (o.fulfilled_as_medicine_name) {
    r.sent = o.fulfilled_as_quantity || 0; r.cls = 'alt'; r.label = 'Alternative sent';
    r.notes.push(`Sent <b>${esc(o.fulfilled_as_medicine_name)} × ${o.fulfilled_as_quantity}</b> instead${by}${when}`);
  } else if (o.status === 'complete') {
    r.sent = o.quantity; r.cls = 'done'; r.label = 'Sent in full';
    if (o.out_of_stock_at && o.supplied_at) r.notes.push(`Was out of stock — supplied ${fmtDate(o.supplied_at)}`);
    else if (o.processed_at) r.notes.push(`${by ? by.slice(3) + ' · ' : ''}${fmtDate(o.processed_at)}`);
  } else if (o.status === 'part_supplied') {
    const rest = child && child.status === 'complete' ? child.quantity : 0;
    r.sent = (o.supplied_qty || 0) + rest; r.cls = 'part';
    if (child && child.status === 'complete') { r.label = 'Sent in full (in two parts)'; r.cls = 'done'; r.notes.push(`${o.supplied_qty} sent first, then ${child.quantity} on ${fmtDate(child.supplied_at || child.processed_at)}`); }
    else if (child && child.status === 'superseded') { r.label = 'Part supplied'; r.notes.push(`${o.supplied_qty} sent; remainder (${child.quantity}) resupplied under a later request`); }
    else { r.label = 'Part order, rest to follow'; r.notes.push(`${o.supplied_qty || 0} sent, <b>${child ? child.quantity : o.quantity - (o.supplied_qty || 0)} still to follow</b>${by}${when}`); }
  } else if (o.status === 'out_of_stock') {
    r.cls = 'oos'; r.label = 'To follow (out of stock)'; r.notes.push(`Nothing sent — on the to-follow list${by}${when}`);
  } else if (o.status === 'pending' || o.status === 'pending_approval') {
    r.cls = 'pend'; r.notes.push(o.status === 'pending' ? 'Not yet actioned' : 'Waiting for above-max approval');
  } else {
    r.cls = 'other';
    if (o.status === 'non_urgent') r.notes.push(`Nothing sent yet — marked non-urgent${by}${when}`);
    else if (o.status === 'rejected') r.notes.push('Rejected — nothing sent');
    else if (o.status === 'superseded') r.notes.push('Replaced by a later request — nothing sent from this one');
    else if (o.status === 'duplicate') r.notes.push(`Marked as a duplicate — nothing sent${by}${when}`);
  }
  if (o.disposition_reason) r.notes.push(`Reason: ${esc(o.disposition_reason)}`);
  return r;
}

// Body HTML (chips + one card per drug). `all` = every order row for the session.
function requestSummaryBodyHtml(all, nameById = {}) {
  const childOf = new Map();
  all.forEach(o => { if (o.parent_order_id) childOf.set(o.parent_order_id, o); });
  const parents = all.filter(o => !o.parent_order_id).sort((a, b) => String(a.medicine_name).localeCompare(String(b.medicine_name)));
  const rows = parents.map(o => ({ o, r: summariseRequestLine(o, childOf, nameById) }));
  const n = (f) => rows.filter(f).length;
  const chips = [
    [rows.length, rows.length === 1 ? 'drug' : 'drugs', ''],
    [n(x => x.r.cls === 'done'), 'sent in full', 'done'],
    [n(x => x.r.cls === 'alt'), 'alternative sent', 'alt'],
    [n(x => x.r.cls === 'part'), 'part supplied', 'part'],
    [n(x => x.r.cls === 'oos'), 'out of stock', 'oos'],
    [n(x => x.r.cls === 'pend'), 'not yet actioned', 'pend'],
    [n(x => x.r.cls === 'other'), 'other', 'other'],
  ].filter(c => c[0] > 0 || c[2] === '');
  return `<div class="rs-chips">${chips.map(c => `<span class="rs-chip ${c[2]}"><b>${c[0]}</b> ${c[1]}</span>`).join('')}</div>
    ${rows.map(({ o, r }) => `<div class="proc-line ${r.cls}">
      <div class="pl-main">
        <div class="pl-name">${esc(o.medicine_name)}${packTag(o)}</div>
        <div class="pl-meta"><span class="rs-label ${r.cls}">${r.label}</span></div>
        ${r.notes.map(t => `<div class="pl-meta">${t}</div>`).join('')}
      </div>
      <div class="pl-qty"><b>${o.quantity}</b><span>Requested</span></div>
      <div class="pl-qty sent ${r.sent === 0 ? 'zero' : (r.sent < o.quantity ? 'less' : '')}"><b>${r.sent}</b><span>Sent</span></div>
    </div>`).join('')}`;
}

// Who picked / checked, as a sentence for the top of the summary.
function requestPickLine(s, nameById) {
  return pickAuditLine(s, nameById);
}

async function openRequestSummary(sessionId) {
  openModal(`<div id="proc-modal-body"><div class="proc-body"><p class="muted">Loading…</p></div></div>`, true);
  const mount = document.getElementById('proc-modal-body');
  const [{ data: s, error }, { data: all }, { data: names }] = await Promise.all([
    sb.from('order_sessions').select('*').eq('id', sessionId).single(),
    sb.from('orders').select('*').eq('session_id', sessionId),
    sb.rpc('staff_display_names'),
  ]);
  if (error || !s) { mount.innerHTML = `<div class="proc-body"><div class="empty">Could not load this request — it may not exist, or you may not have access.</div></div><div class="proc-foot"><span class="hint"></span><div class="btns"><button class="btn ghost" onclick="closeModal()">Close</button></div></div>`; return; }
  const nameById = Object.fromEntries((names || []).map(n => [n.id, n.full_name]));
  const isTopup = s.order_type === 'topup';
  const pickLine = requestPickLine(s, nameById);
  mount.innerHTML = `<div class="proc-head">
      <div><h3>${esc(wardName(s.ward_id))}</h3><p class="ph-sub">Submitted by ${esc(nameById[s.submitted_by] || '—')} · ${fmtDate(s.created_at)}</p></div>
      <span class="ph-tag ${isTopup ? 'topup' : ''}">${isTopup ? 'Top-up request' : 'Adhoc request'}</span>
    </div>
    <div class="proc-body">
      ${pickLine ? `<p class="proc-note">${pickLine}.</p>` : ''}
      ${requestSummaryBodyHtml(all || [], nameById)}
    </div>
    <div class="proc-foot"><span class="hint"></span><div class="btns"><button class="btn ghost" onclick="closeModal()">Close</button></div></div>`;
}

// ---------- AUTH GUARD ----------
// Every page except login.html/reset-password.html calls this at load
// time. Redirects to login.html if there's no session, redirects to
// reset-password.html if the account still needs a forced passcode
// change, signs out and redirects if deactivated since login, and
// redirects home with a message if the page's required capability isn't
// met — RLS is still the real enforcement, this is just so nobody lands
// on a blank/broken page for a function they can't use.
// A failed connection (network down, Supabase unreachable, gateway error) is not the same as a
// wrong password or a missing profile, so it must never sign anyone out.
function isOutageError(err) {
  if (!err) return false;
  if (err instanceof TypeError) return true;
  const m = String(err.message || err).toLowerCase();
  const st = String(err.status || err.code || '');
  return /failed to fetch|networkerror|network request failed|load failed|fetch failed|timed out|timeout/.test(m)
    || /unexpected token|<html|bad gateway|service unavailable|gateway time/.test(m) || /^5\d\d$/.test(st);
}
function goUnavailable() {
  const here = (location.pathname.split('/').pop() || 'home.html') + (location.hash || '');
  location.href = 'unavailable.html?back=' + encodeURIComponent(here);
}
async function requireAuth(options = {}) {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { window.location.href = 'login.html'; return null; }

  const { data: p, error } = await sb.from('profiles').select('*').eq('id', session.user.id).single();
  if (isOutageError(error)) { goUnavailable(); return null; }
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
  try {
    const { data: packRows } = await sb.from('drug_catalog').select('medicine_name, pack_size');
    packSizes = Object.fromEntries((packRows || []).filter(r => r.pack_size).map(r => [r.medicine_name, r.pack_size]));
  } catch (e) { /* pack sizes are display-only; carry on without */ }

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

  document.querySelectorAll('[data-who-name]').forEach(el => {
    const ini = (profile.initials || profile.full_name.split(/\s+/).map(w => w[0]).join('').slice(0, 3)).toUpperCase();
    el.innerHTML = `<span class="who-av" title="${esc(profile.full_name)}">${esc(ini)}</span><span class="who-txt"><b>${esc(profile.full_name)}</b><small>${esc(roleLabel(profile.role))}</small></span>`;
  });
  applyTrustLogo();
  document.querySelectorAll('[data-ward-context]').forEach(el => el.textContent = canOrder() && myWards.length
    ? myWards.map(w => w.name).join(', ')
    : (isSuperuser() ? 'Full system access' : isAdminRole() ? 'Admin' : isGovernance() ? 'Governance — read only' : ''));
  wireLogout();
  document.querySelectorAll('header.topbar .who').forEach(w => {
    if (w.querySelector('[data-a11y]')) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'a11y-btn'; b.setAttribute('data-a11y', '');
    b.title = 'Accessibility settings'; b.setAttribute('aria-label', 'Accessibility settings');
    b.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="4.5" r="1.8"/><path d="M5 8.5l7 1.5 7-1.5M12 10v4.5M9 21l3-6.5 3 6.5"/></svg>';
    b.onclick = openAccessibilitySettings;
    w.insertBefore(b, w.querySelector('[data-logout]') || null);
  });
  startIdleWatch();
  buildSideNav();
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

// ---------- Ask people with no email linked to add one (for self-service password reset) ----------
function maybePromptForEmail() {
  document.getElementById('email-prompt')?.remove();
  if (!profile || profile.email_hash) return;
  try { if (sessionStorage.getItem('emailPromptDismissed')) return; } catch (e) {}
  const bannerRoot = document.getElementById('banner-root'); if (!bannerRoot) return;
  const el = document.createElement('div'); el.id = 'email-prompt'; el.className = 'hbanner-stack';
  el.innerHTML = `<div class="hbanner info" role="status"><span class="ic" aria-hidden="true">\u2709\ufe0f</span>
    <div class="tx">Add your email address so you can reset your own password if you ever forget it.</div>
    <button class="btn small magenta" id="ep-add" style="flex:none;">Add email</button>
    <button class="btn small ghost" id="ep-later" style="flex:none;">Not now</button></div>`;
  bannerRoot.before(el);
  document.getElementById('ep-later').onclick = () => { try { sessionStorage.setItem('emailPromptDismissed', '1'); } catch (e) {} el.remove(); };
  document.getElementById('ep-add').onclick = () => {
    openModal(`${modalIcon('ask')}<h3>Add your email</h3>
      <p class="muted">Used only to email you a reset link if you forget your password (or an administrator resets it for you). It is stored securely and never shown in the app. Once added, only an administrator can change it.</p>
      <label>Email address</label><input type="email" id="ep-email" placeholder="name@nhs.net" autocomplete="email" />
      <div class="modal-error" id="ep-err"></div>
      <div class="actions"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn magenta" id="ep-save">Save</button></div>`);
    document.getElementById('ep-save').onclick = async () => {
      const email = document.getElementById('ep-email').value.trim();
      if (!email) { document.getElementById('ep-err').textContent = 'Enter your email address.'; return; }
      const { data: { session } } = await sb.auth.getSession();
      const res = await fetch(`${FN_BASE}/admin-set-user-email`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ target_user_id: profile.id, email }) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) { document.getElementById('ep-err').textContent = out.error || 'Could not save.'; return; }
      profile.email_hash = 'set'; closeModal(); el.remove(); toast('Email saved.');
    };
  };
}

// ---------- BANNERS (ported from the Pharmacy Portal) ----------
function todayUK() { return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' }); }
function bannerState(b) {
  const t = todayUK();
  if (!b.active) return 'Hidden';
  if (b.starts_on && b.starts_on > t) return 'Scheduled';
  if (b.ends_on && b.ends_on < t) return 'Expired';
  return 'Live';
}
function bnLinkify(escaped) {
  return escaped.replace(/\bhttps?:\/\/[^\s<]+/g, (u) => {
    const trail = (u.match(/[.,;:!?)]+$/) || [''])[0];
    const clean = trail ? u.slice(0, -trail.length) : u;
    return `<a href="${clean}" target="_blank" rel="noopener noreferrer">${clean}</a>${trail}`;
  });
}
const BN_CHIP = { info: 'NOTICE', success: 'UPDATE', warning: 'HEADS UP', urgent: 'URGENT' };
function bannerHtml(b) {
  const sev = ['info', 'success', 'warning', 'urgent'].includes(b.severity) ? b.severity : 'info';
  return `<div class="hbanner ${sev}" role="status"><span class="chip">${BN_CHIP[sev]}</span><div class="tx">${bnLinkify(esc(b.message))}</div></div>`;
}
async function loadBanner() {
  const root = document.getElementById('banner-root');
  if (!root) return;
  const { data, error } = await sb.from('home_banners').select('*').order('created_at', { ascending: false });
  if (error || !data) { root.innerHTML = ''; return; }
  const live = data.filter(b => bannerState(b) === 'Live');
  root.innerHTML = live.length ? `<div class="hbanner-stack">${live.map(bannerHtml).join('')}</div>` : '';
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
    pushNotify('Stock Req', msg);
  }, 45000);
}

// ---------- NAVIGATION (replaces the old tile-picker + tab router) ----------
function buildNavLinks() {
  const links = [];
  if (canOrder()) {
    links.push({ href: 'order.html', label: 'Create new order', group: 'Create New Order' });
    links.push({ href: 'order-history.html', label: 'Order history', group: 'Create New Order' });
  }
  if (canProcess()) {
    if (profile?.role === 'bulk_assistant') links.push({ href: 'bulk-dashboard.html', label: 'Dashboard', group: 'Process awaiting orders' });
    links.push({ href: 'sessions.html', label: 'Pending orders', group: 'Process awaiting orders' });
    links.push({ href: 'out-of-stock.html', label: 'To follow orders', group: 'Process awaiting orders' });
    links.push({ href: 'processed-history.html', label: 'Processed (48h)', group: 'Process awaiting orders' });
    if (canCheckPicking() && pickingCheckRequired()) links.push({ href: 'sessions.html#awaiting-check', label: 'Complete final check', group: 'Complete final check' });
  }
  if (canApproveOrders()) {
    links.push({ href: 'approvals.html', label: 'Above max stock waiting for approval', group: 'Above max stock waiting for approval' });
  }
  if (isSuperuser()) {
    links.push({ href: 'sites.html', label: 'Sites', group: 'Admin' });
    links.push({ href: 'wards.html', label: 'Wards', group: 'Admin' });
    links.push({ href: 'users.html', label: 'Users', group: 'Admin' });
    if (isDeveloper()) links.push({ href: 'titles.html', label: 'Titles', group: 'Admin' });
    links.push({ href: 'drug-catalog.html', label: 'Drug Catalog', group: 'Admin' });
    links.push({ href: 'stocklists.html', label: 'Stocklists', group: 'Admin' });
    links.push({ href: 'active-sessions.html', label: 'Active sessions', group: 'Admin' });
    links.push({ href: 'bank-holidays.html', label: 'Bank holidays', group: 'Admin' });
    links.push({ href: 'system-settings.html', label: 'System settings', group: 'Admin' });
    links.push({ href: 'logs.html', label: 'Logs', group: 'Admin' });
    links.push({ href: 'audit.html', label: 'Audit', group: 'Governance' });
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
  if (insightsEnabled() && canViewDashboard()) links.push({ href: 'insights.html', label: 'Insights', group: 'Insights' });
  if (canViewBi() && biEnabled()) {
    links.push({ href: 'bi-analytics.html', label: 'Analytics', group: 'ED&G™ Business Intelligence Suite' });
    links.push({ href: 'bi-insights.html', label: 'Item usage', group: 'ED&G™ Business Intelligence Suite' });
    links.push({ href: 'bi-predictive.html', label: 'Predictive top-up', group: 'ED&G™ Business Intelligence Suite' });
  }
  if (isGovernance()) links.push({ href: 'audit.html', label: 'Audit', group: 'Governance' });
  if (canPostBanners()) links.push({ href: 'notifications.html', label: 'Banners', group: isSuperuser() ? 'Admin' : 'Banners' });
  return links;
}

function buildAreaTiles() {
  const links = buildNavLinks();
  const groups = [...new Set(links.map(l => l.group))];
  const svg = (d) => `<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const iconFor = {
    'Create New Order': svg('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9z"/><path d="M12 11v6M9 14h6"/>'),
    'Complete final check': svg('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9z"/><path d="M8.5 14l2.5 2.5 4.5-5"/>'),
    'Process awaiting orders': svg('<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>'),
    'Above max stock waiting for approval': svg('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>'),
    Admin: svg('<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>'),
    Governance: svg('<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/><path d="M8 10.5l2 2 3-3.5"/>'),
    Insights: svg('<path d="M4 20V11M10 20V5M16 20v-6M2 20h20"/>'),
    'ED&G™ Business Intelligence Suite': svg('<path d="M3 20h18"/><path d="M5 16l4-5 4 3 6-8"/><circle cx="19" cy="6" r="1.6"/>'),
  };
  return groups.map(g => ({ group: g, icon: iconFor[g] || '•', firstHref: links.find(l => l.group === g).href, label: g === 'Admin' ? (isSuperuser() ? 'System Admin' : 'User Management') : g }));
}

const PAGE_META = {
  'insights.html': ['\ud83d\udcca', 'Insights', 'Orders due today and how many have been processed.'],
  'bi-analytics.html': ['\ud83d\udcc8', 'ED&G™ Business Intelligence Suite', 'Volumes, turnaround, breaches, trends and top-up compliance.'],
  'bi-insights.html': ['\ud83d\udcca', 'ED&G™ Business Intelligence Suite', 'Most-ordered items, seasonal patterns and who is ordering what.'],
  'bi-predictive.html': ['\u2728', 'ED&G™ Business Intelligence Suite', 'What each ward is offered by predictive top-up.'],
  'sites.html': ['\ud83c\udfe5', 'Sites', 'Hospital sites that wards belong to.'],
  'wards.html': ['\ud83d\udecf\ufe0f', 'Wards', 'Create wards, set top-up days, suspend them and control alternative-stock swaps.'],
  'users.html': ['\ud83d\udc65', 'Users', 'Invite staff with permissions and wards pre-set, and manage existing accounts.'],
  'titles.html': ['\ud83c\udff7\ufe0f', 'Titles', 'Job titles used as labels on accounts \u2014 permissions come from the tickboxes.'],
  'drug-catalog.html': ['\ud83d\udc8a', 'Drug catalog', 'Every orderable medicine, its pack size and alternatives.'],
  'stocklists.html': ['\ud83d\udccb', 'Stocklists', 'Per-ward min/max stock levels. Add or remove a drug across every ward.'],
  'notifications.html': ['\ud83d\udce2', 'Banners', 'Post notices that everyone sees at the top of every page.'],
  'active-sessions.html': ['\ud83d\udfe2', 'Active sessions', 'Who is signed in right now.'],
  'bank-holidays.html': ['\ud83d\udcc5', 'Bank holidays', 'Dates that change top-up and turnaround timing.'],
  'system-settings.html': ['\u2699\ufe0f', 'System settings', 'Logos, order rules, checks and other system-wide switches.'],
  'logs.html': ['\ud83d\udcdc', 'Logs', 'System activity and errors.'],
  'topup-days.html': ['\ud83d\uddd3\ufe0f', 'Top-up days', 'Which days each ward is topped up.'],
  'sessions.html': ['\ud83d\udce6', 'Pending orders', 'Pick, action and confirm ward requests.'],
  'out-of-stock.html': ['\ud83d\udeab', 'To follow orders', 'Items awaiting supply.'],
  'processed-history.html': ['\ud83d\udd52', 'Processed (48h)', 'Requests processed in the last 48 hours.'],
};


// ---------- SLIDE-OUT SIDE MENU (the "side tab") ----------
// A navy menu that slides in from the left. It opens when the pointer rests on the
// left edge of the window (or on the small tab there), stays open while the pointer is
// over it and closes shortly after the pointer leaves. The menu button in the top bar
// (or the tab, or a tap on touch screens) PINS it open; Escape or a click elsewhere
// closes it. It is built from buildNavLinks(), so each person only sees what they can use.
function buildSideNav() {
  ['sideNav', 'sideEdge', 'sideHandle', 'sideScrim'].forEach(id => document.getElementById(id)?.remove());
  const header = document.querySelector('header.topbar');
  if (!header || !profile) return;
  const currentHref = document.body.getAttribute('data-page') || '';
  const links = buildNavLinks();
  const tiles = buildAreaTiles();
  const iconFor = Object.fromEntries(tiles.map(t => [t.group, t.icon.replace(/width="40" height="40"/, 'width="18" height="18"')]));
  const labelFor = Object.fromEntries(tiles.map(t => [t.group, t.label]));
  const groups = [...new Set(links.map(l => l.group))];
  const homeIcon = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-8 9 8M5 10v10h14V10"/></svg>';

  const nav = document.createElement('nav');
  nav.id = 'sideNav'; nav.className = 'side-nav'; nav.setAttribute('aria-label', 'Main navigation');
  nav.innerHTML =
    `<div class="sn-brand">Stock Req<small>by ED&amp;G™</small></div>` +
    `<a href="home.html" class="sn-home"${currentHref === 'home.html' ? ' aria-current="page"' : ''}>${homeIcon}<span>Home</span></a>` +
    groups.map(g => `<hr><div class="sn-group">${iconFor[g] || ''}<span>${esc(labelFor[g] || g)}</span></div>` +
      links.filter(l => l.group === g).map(l => `<a class="sn-sub" href="${l.href}"${l.href === currentHref ? ' aria-current="page"' : ''}><span>${esc(l.label)}</span></a>`).join('')).join('');

  const edge = document.createElement('div'); edge.id = 'sideEdge'; edge.className = 'side-edge'; edge.setAttribute('aria-hidden', 'true');
  const handle = document.createElement('button'); handle.id = 'sideHandle'; handle.type = 'button'; handle.className = 'side-handle';
  handle.setAttribute('aria-label', 'Open menu'); handle.tabIndex = -1;
  handle.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
  const scrim = document.createElement('div'); scrim.id = 'sideScrim'; scrim.className = 'side-scrim';
  document.body.append(scrim, edge, handle, nav);

  // Top bar: menu button + home button to the left of the brand.
  if (!header.querySelector('.tb-left')) {
    const brand = header.querySelector('.brand');
    const left = document.createElement('div'); left.className = 'tb-left';
    const tog = document.createElement('button');
    tog.type = 'button'; tog.id = 'navToggle'; tog.className = 'nav-toggle';
    tog.setAttribute('aria-label', 'Open menu'); tog.setAttribute('aria-expanded', 'false'); tog.setAttribute('aria-controls', 'sideNav');
    tog.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
    const home = document.createElement('a');
    home.href = 'home.html'; home.className = 'home-btn'; home.title = 'Home'; home.setAttribute('aria-label', 'Home');
    if (currentHref === 'home.html') home.setAttribute('aria-current', 'page');
    home.innerHTML = homeIcon.replace('width="18" height="18"', 'width="20" height="20"');
    if (brand) { brand.before(left); left.append(tog, home, brand); } else { header.prepend(left); left.append(tog, home); }
  }
  const tog = document.getElementById('navToggle');

  let openT = null, closeT = null, pinned = false;
  const modalOpen = () => !!document.querySelector('#modal-root .modal-bg');
  const setOpen = (v) => {
    nav.classList.toggle('open', v);
    handle.classList.toggle('gone', v);
    scrim.classList.toggle('show', v && pinned);
    tog.setAttribute('aria-expanded', String(v));
  };
  const canHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;

  if (canHover) {
    // Hot zone: the left 40px of the window. Tracked on the document so the page underneath stays clickable.
    document.addEventListener('mousemove', (e) => {
      if (e.clientX <= 40 && !nav.classList.contains('open') && !modalOpen()) {
        if (!openT) { clearTimeout(closeT); closeT = null; openT = setTimeout(() => { openT = null; setOpen(true); }, 35); }
      } else if (openT) { clearTimeout(openT); openT = null; }
    });
    // Close shortly after the pointer leaves the menu (unless it has been pinned open).
    document.addEventListener('mousemove', (e) => {
      if (pinned || !nav.classList.contains('open')) return;
      if (e.clientX <= nav.offsetWidth + 8) { clearTimeout(closeT); closeT = null; }
      else if (!closeT) closeT = setTimeout(() => { closeT = null; setOpen(false); }, 350);
    });
  }
  const toggle = (e) => { e.stopPropagation(); pinned = !nav.classList.contains('open'); setOpen(pinned); };
  tog.addEventListener('click', toggle);
  handle.addEventListener('click', toggle);
  scrim.addEventListener('click', () => { pinned = false; setOpen(false); });
  document.addEventListener('click', (e) => { if (pinned && !nav.contains(e.target)) { pinned = false; setOpen(false); } });
  nav.addEventListener('focusin', () => setOpen(true));
  nav.addEventListener('focusout', (e) => { if (!pinned && !nav.contains(e.relatedTarget)) setOpen(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('open')) { pinned = false; setOpen(false); tog.focus(); } });
}

// ---------- SUB-TABS for long admin pages ----------
// Sorts the page's top-level cards into tabs by their <h2> heading (a card with no
// heading stays with the card before it). Empty tabs are dropped; the chosen tab is
// kept in the URL hash so a reload or a re-render stays on it.
function applySubtabs(root, tabs, defaultId) {
  const cards = [...root.children].filter(c => c.classList.contains('card'));
  const tabOf = [];
  cards.forEach((c, i) => {
    const h = (c.querySelector('h2')?.textContent || '').trim().toLowerCase();
    let t = h ? tabs.find(x => x.heads.some(k => h.startsWith(k.toLowerCase()))) : null;
    if (!t) t = h ? tabs[0] : (tabOf[i - 1] || tabs[0]);
    tabOf[i] = t;
  });
  const used = tabs.filter(t => tabOf.includes(t));
  if (used.length < 2) return;
  const fromHash = decodeURIComponent((location.hash.match(/tab=([^&]+)/) || [])[1] || '');
  let active = used.find(t => t.id === fromHash) || used.find(t => t.id === defaultId) || used[0];
  const strip = document.createElement('div'); strip.className = 'subtabs-wrap';
  strip.innerHTML = '<nav class="seg subtabs" role="tablist">' + used.map(t => `<button type="button" role="tab" data-st="${t.id}">${esc(t.label)}</button>`).join('') + '</nav>';
  root.insertBefore(strip, cards[0]);
  const paint = () => {
    cards.forEach((c, i) => c.classList.toggle('st-off', tabOf[i] !== active));
    strip.querySelectorAll('button').forEach(b => { const on = b.dataset.st === active.id; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
  };
  strip.querySelectorAll('button').forEach(b => b.onclick = () => {
    active = used.find(t => t.id === b.dataset.st);
    try { history.replaceState(null, '', '#tab=' + encodeURIComponent(active.id)); } catch (e) {}
    paint();
  });
  paint();
}

function renderPageNav(currentHref) {
  const el = document.getElementById('page-nav');
  if (!el) return;
  const links = buildNavLinks();
  const current = links.find(l => l.href === currentHref);
  const group = current ? links.filter(l => l.group === current.group) : [];
  if (current && current.group === 'Admin') document.body.setAttribute('data-admin', '1');
  const meta = PAGE_META[currentHref];
  el.innerHTML = (group.length > 1 ? `<div class="nav-row"><nav class="seg">${group.map(l => `<a href="${l.href}" class="${l.href === currentHref ? 'on' : ''}">${esc(l.label)}</a>`).join('')}</nav></div>` : '') +
    (meta ? `<div class="page-head"><div class="ph-icon">${meta[0]}</div><div><h1>${esc(meta[1])}</h1><p>${esc(meta[2])}</p></div></div>` : '');
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
  if (!remindersEnabled()) { if (mountEl) mountEl.innerHTML = ''; return; }
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
    ${data.map(i => `<tr><td>${esc(i.medicine_name)}${packTag({ medicine_name: i.medicine_name })}</td><td>${i.max_qty}</td></tr>`).join('')}
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
