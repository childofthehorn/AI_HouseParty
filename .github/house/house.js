// Room logic shared by the room-* workflows and driveway-sweep.
// Workflows check out the BASE commit and require this file; PR code is never run.

const DAY_MS = 86400000;

function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*' && glob[i + 1] === '*') {
      if (glob[i + 2] === '/') {
        re += '(?:.*/)?';
        i += 2;
      } else {
        re += '.*';
        i += 1;
      }
    } else if (c === '*') {
      re += '[^/]*';
    } else if (c === '?') {
      re += '[^/]';
    } else {
      re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp(`^${re}$`);
}

function matches(path, pattern) {
  if (/[*?]/.test(pattern)) return globToRegExp(pattern).test(path);
  const dir = pattern.replace(/\/+$/, '');
  return path === dir || path.startsWith(`${dir}/`);
}

function matchesAny(path, patterns = []) {
  return patterns.some((p) => matches(path, p));
}

function roomOf(path, config) {
  const room = config.rooms.find((r) => matchesAny(path, r.paths));
  return room ? room.id : config.defaultRoom;
}

function allRooms(config) {
  return [...config.rooms, config.safeRoom];
}

function roomById(id, config) {
  return allRooms(config).find((r) => r.id === id);
}

// Map of room id -> files that put the PR in that room.
function detectRooms(files, config, labels = []) {
  const byRoom = new Map();
  const add = (id, file) => {
    if (!byRoom.has(id)) byRoom.set(id, []);
    if (file) byRoom.get(id).push(file);
  };
  for (const file of files) {
    add(roomOf(file, config), file);
    if (matchesAny(file, config.safeRoom.paths)) add(config.safeRoom.id, file);
  }
  if (labels.includes(config.safeRoom.label)) add(config.safeRoom.id);
  return byRoom;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Rooms ticked in the PR template: "- [x] Kitchen — ...".
function declaredRooms(body, config) {
  const text = body || '';
  return new Set(
    allRooms(config)
      .filter((r) => new RegExp(`^\\s*[-*]\\s*\\[[xX]\\]\\s*${escapeRegExp(r.name)}\\b`, 'm').test(text))
      .map((r) => r.id),
  );
}

function parseExpiry(body) {
  const m = /Expiry[^\n]*?(\d{4}-\d{2}-\d{2})/.exec(body || '');
  if (!m) return null;
  const date = new Date(`${m[1]}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== m[1] ? null : date;
}

// Errors that fail the cleanliness check. Over-declaring a room is allowed.
function cleanlinessErrors({ body, files, labels, now }, config) {
  const errors = [];
  const declared = declaredRooms(body, config);
  const detected = detectRooms(files, config, labels);
  const safe = config.safeRoom;

  if (declared.size === 0) {
    errors.push('No room declared. Tick every room this PR touches in the "Room" section of the PR template.');
  }
  for (const [id, hits] of detected) {
    if (declared.has(id)) continue;
    const room = roomById(id, config);
    const why = hits.length ? `it changes ${hits.slice(0, 3).join(', ')}${hits.length > 3 ? ` and ${hits.length - 3} more` : ''}` : `it carries the ${room.label} label`;
    errors.push(`Undeclared room: ${room.name} — ${why}.`);
  }
  // Path-detected Safe-room gets its label from the labeler, which runs in parallel.
  if (declared.has(safe.id) && !detected.has(safe.id)) {
    errors.push(`Safe-room is ticked but the PR has no ${safe.label} label. Add the label so the Safe-room approvals apply.`);
  }
  if (declared.has('driveway') || detected.has('driveway')) {
    const expiry = parseExpiry(body);
    if (!expiry) {
      errors.push('Driveway changes need "Expiry: YYYY-MM-DD" in the PR body. Everything in the driveway gets towed.');
    } else if (expiry.getTime() < startOfDay(now)) {
      errors.push(`Driveway expiry ${expiry.toISOString().slice(0, 10)} is already in the past.`);
    }
  }
  return errors;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

function applicableRules(files, labels, config) {
  const rooms = detectRooms(files, config, labels);
  return config.approvalRules.filter(
    (rule) => (rule.match.rooms || []).some((id) => rooms.has(id)) || files.some((f) => matchesAny(f, rule.match.paths)),
  );
}

// Latest APPROVED/CHANGES_REQUESTED/DISMISSED state per reviewer; a later comment does not cancel an approval.
function approvers(reviews) {
  const latest = new Map();
  for (const r of reviews) {
    if (r.state === 'COMMENTED' || r.state === 'PENDING' || !r.user) continue;
    latest.set(r.user.login, r.state);
  }
  return [...latest].filter(([, state]) => state === 'APPROVED').map(([login]) => login);
}

function evaluateRules(rules, approved, config) {
  return rules.map((rule) => {
    const pool = new Set(config.teams[rule.from] || []);
    const counted = approved.filter((login) => pool.has(login));
    const problems = [];
    if (counted.length < rule.approvals) {
      problems.push(`${counted.length}/${rule.approvals} approvals from ${rule.from}`);
    }
    if (rule.oneOf) {
      const required = new Set(config.teams[rule.oneOf] || []);
      if (!approved.some((login) => required.has(login))) problems.push(`needs 1 approval from ${rule.oneOf}`);
    }
    return { rule: rule.name, ok: problems.length === 0, problems, counted };
  });
}

function isTrustedSender(sender, config) {
  return Boolean(sender) && sender.type === 'Bot' && config.labelBots.includes(sender.login);
}

// What to do about one label event: null = leave it, otherwise the revert to apply.
function labelRevert({ action, label, sender }, config) {
  if (isTrustedSender(sender, config)) return null;
  if (action === 'labeled' && config.humanAddableLabels.includes(label)) return null;
  return action === 'labeled' ? { remove: label } : { add: label };
}

// Driveway files whose most recent Driveway PR has expired and that still exist.
function towList({ prs, exists, now }, config) {
  const latest = new Map();
  const ordered = [...prs].sort((a, b) => new Date(a.mergedAt) - new Date(b.mergedAt));
  for (const pr of ordered) {
    const expiry = parseExpiry(pr.body) || new Date(new Date(pr.mergedAt).getTime() + config.driveway.defaultExpiryDays * DAY_MS);
    for (const file of pr.files) latest.set(file, { pr: pr.number, expiry });
  }
  return [...latest]
    .filter(([file, { expiry }]) => roomOf(file, config) === 'driveway' && exists(file) && expiry.getTime() < startOfDay(now))
    .map(([file, { pr, expiry }]) => ({ file, pr, expiry: expiry.toISOString().slice(0, 10) }))
    .sort((a, b) => a.file.localeCompare(b.file));
}

// ---- runners: thin glue between GitHub and the functions above ----

async function prFiles(github, context, number) {
  const files = await github.paginate(github.rest.pulls.listFiles, {
    ...context.repo,
    pull_number: number,
    per_page: 100,
  });
  return files.map((f) => f.filename);
}

// Create each room label with its color and description, update one that drifted,
// or rename a v1 `room/<label>` in place so PR history keeps the label.
async function ensureLabels({ github, context }, config) {
  for (const room of allRooms(config)) {
    const want = { name: room.label, color: room.color, description: room.description };
    const current = await getLabel(github, context, room.label);
    if (current) {
      if (current.color.toUpperCase() !== want.color.toUpperCase() || (current.description || '') !== want.description) {
        await github.rest.issues.updateLabel({ ...context.repo, ...want });
      }
      continue;
    }
    const legacyName = `${config.legacyLabelPrefix || ''}${room.label}`;
    const legacy = config.legacyLabelPrefix ? await getLabel(github, context, legacyName) : null;
    if (legacy) {
      await github.rest.issues.updateLabel({ ...context.repo, name: legacyName, new_name: want.name, color: want.color, description: want.description });
    } else {
      await github.rest.issues.createLabel({ ...context.repo, ...want });
    }
  }
}

async function getLabel(github, context, name) {
  try {
    return (await github.rest.issues.getLabel({ ...context.repo, name })).data;
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

async function runLabeler({ github, context, core }, config) {
  await ensureLabels({ github, context }, config);
  const pr = context.payload.pull_request;
  const labels = pr.labels.map((l) => l.name);
  const rooms = detectRooms(await prFiles(github, context, pr.number), config, labels);
  const wanted = [...rooms.keys()].map((id) => roomById(id, config).label);
  const toAdd = wanted.filter((l) => !labels.includes(l));
  // Room labels are bot-owned; Safe-room is never removed once a person adds it.
  const toRemove = config.rooms.map((r) => r.label).filter((l) => labels.includes(l) && !wanted.includes(l));

  if (toAdd.length) {
    await github.rest.issues.addLabels({ ...context.repo, issue_number: pr.number, labels: toAdd });
  }
  for (const name of toRemove) {
    await github.rest.issues.removeLabel({ ...context.repo, issue_number: pr.number, name });
  }
  core.info(`rooms: ${wanted.join(', ')} | added: ${toAdd.join(', ') || 'none'} | removed: ${toRemove.join(', ') || 'none'}`);
}

async function runCleanliness({ github, context, core }, config) {
  const pr = context.payload.pull_request;
  const errors = cleanlinessErrors(
    {
      body: pr.body,
      files: await prFiles(github, context, pr.number),
      labels: pr.labels.map((l) => l.name),
      now: new Date(),
    },
    config,
  );
  if (errors.length) {
    errors.forEach((e) => core.error(e));
    core.setFailed(`${errors.length} room problem(s). Fix the PR description; no new commit needed.`);
  } else {
    core.info('Rooms declared and consistent with the diff.');
  }
}

async function runLabelGuard({ github, context, core }, config) {
  const { action, label, sender, pull_request: pr } = context.payload;
  const revert = labelRevert({ action, label: label.name, sender }, config);
  if (!revert) return core.info(`${sender.login} ${action} "${label.name}": allowed.`);

  if (revert.remove) {
    await github.rest.issues.removeLabel({ ...context.repo, issue_number: pr.number, name: revert.remove });
  } else {
    await github.rest.issues.addLabels({ ...context.repo, issue_number: pr.number, labels: [revert.add] });
  }
  await github.rest.issues.createComment({
    ...context.repo,
    issue_number: pr.number,
    body:
      `@${sender.login} labels on this repo are set by automation from the files a PR changes, so ` +
      `${action === 'labeled' ? 'adding' : 'removing'} \`${label.name}\` was reverted. ` +
      `The only label you can add is \`${config.safeRoom.label}\`, for cryptography, secure storage, or key material.`,
  });
  core.warning(`Reverted ${action} "${label.name}" by ${sender.login}.`);
}

async function runApprovalGate({ github, context, core }, config) {
  const pr = context.payload.pull_request;
  const files = await prFiles(github, context, pr.number);
  const rules = applicableRules(files, pr.labels.map((l) => l.name), config);
  const reviews = await github.paginate(github.rest.pulls.listReviews, {
    ...context.repo,
    pull_number: pr.number,
    per_page: 100,
  });
  const results = evaluateRules(rules, approvers(reviews), config);
  const failed = results.filter((r) => !r.ok);

  let description;
  if (!rules.length) description = 'No approval rules match this PR.';
  else if (failed.length) description = failed.map((r) => `${r.rule}: ${r.problems.join(', ')}`).join('; ');
  else description = `Met: ${results.map((r) => r.rule).join(', ')}.`;

  await github.rest.repos.createCommitStatus({
    ...context.repo,
    sha: pr.head.sha,
    state: failed.length ? 'failure' : 'success',
    context: config.approvalStatusContext,
    description: description.substring(0, 140),
  });
  for (const r of results) core.info(`${r.ok ? 'PASS' : 'FAIL'} ${r.rule}: approvals counted ${r.counted.join(', ') || 'none'}${r.ok ? '' : ` — ${r.problems.join(', ')}`}`);
}

async function runSweepPlan({ github, context, core }, config, { exists }) {
  const driveway = roomById('driveway', config).label;
  const closed = await github.paginate(github.rest.pulls.list, {
    ...context.repo,
    state: 'closed',
    per_page: 100,
  });
  const prs = [];
  for (const pr of closed) {
    if (!pr.merged_at || !pr.labels.some((l) => l.name === driveway)) continue;
    const files = await github.paginate(github.rest.pulls.listFiles, {
      ...context.repo,
      pull_number: pr.number,
      per_page: 100,
    });
    prs.push({
      number: pr.number,
      body: pr.body,
      mergedAt: pr.merged_at,
      files: files.filter((f) => f.status !== 'removed').map((f) => f.filename),
    });
  }
  const tow = towList({ prs, exists, now: new Date() }, config);
  core.info(`${prs.length} merged Driveway PR(s); ${tow.length} expired file(s) to tow.`);
  return tow;
}

module.exports = {
  matches,
  roomOf,
  detectRooms,
  declaredRooms,
  parseExpiry,
  cleanlinessErrors,
  applicableRules,
  approvers,
  evaluateRules,
  labelRevert,
  towList,
  ensureLabels,
  runLabeler,
  runCleanliness,
  runLabelGuard,
  runApprovalGate,
  runSweepPlan,
};
