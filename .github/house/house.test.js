// Run: node --test .github/house/
const test = require('node:test');
const assert = require('node:assert/strict');
const config = require('./rooms.config');
const h = require('./house');

const body = (...ticked) =>
  ['## Room', ...['Kitchen', 'Living Room', 'Garage', 'Driveway', 'Safe-room'].map((r) => `- [${ticked.includes(r) ? 'x' : ' '}] ${r} — ...`)].join('\n');
const NOW = new Date('2026-10-04T12:00:00Z');

test('plain names match the file or anything under the directory', () => {
  assert.ok(h.matches('core/auth/Token.kt', 'core/auth'));
  assert.ok(h.matches('core/auth/Token.kt', 'core/auth/'));
  assert.ok(h.matches('gradle/libs.versions.toml', 'gradle/libs.versions.toml'));
  assert.ok(!h.matches('core/authz/Token.kt', 'core/auth'));
});

test('globs: * stays in one segment, ** crosses any depth including zero', () => {
  assert.ok(h.matches('a/b/experiments/x.kt', '**/experiments/**'));
  assert.ok(h.matches('experiments/x.kt', '**/experiments/**'));
  assert.ok(h.matches('ios/Package.swift', '**/Package.swift'));
  assert.ok(h.matches('Package.swift', '**/Package.swift'));
  assert.ok(!h.matches('a/b.kt', '*.kt'));
});

test('each file gets its first matching room, unmatched files are Living Room', () => {
  assert.equal(h.roomOf('shared/src/commonMain/A.kt', config), 'kitchen');
  assert.equal(h.roomOf('.github/workflows/x.yml', config), 'kitchen');
  assert.equal(h.roomOf('sandbox/spike.kt', config), 'garage');
  assert.equal(h.roomOf('.claude/agents/person/host-agent.md', config), 'kitchen');
  assert.equal(h.roomOf('.codex/agents/host-agent.toml', config), 'kitchen');
  assert.equal(h.roomOf('.agents/skills/architecture-review/SKILL.md', config), 'kitchen');
  assert.equal(h.roomOf('.claude/agent-memory/stacy-agent/MEMORY.md', config), 'living-room');
  assert.equal(h.roomOf('tools/report.py', config), 'driveway');
  assert.equal(h.roomOf('scripts/pre-commit', config), 'kitchen');
  assert.equal(h.roomOf('scripts/oneoff/fix.sh', config), 'driveway');
  assert.equal(h.roomOf('feature/home/Home.kt', config), 'living-room');
});

test('Safe-room stacks on the file room, from paths or from the label', () => {
  const byPath = h.detectRooms(['core/auth/crypto/Aes.kt'], config);
  assert.deepEqual([...byPath.keys()].sort(), ['kitchen', 'safe-room']);
  const byLabel = h.detectRooms(['feature/home/Home.kt'], config, ['safe-room']);
  assert.deepEqual([...byLabel.keys()].sort(), ['living-room', 'safe-room']);
});

test('declared rooms are read from ticked boxes only; several are allowed', () => {
  assert.deepEqual([...h.declaredRooms(body('Kitchen', 'Driveway'), config)].sort(), ['driveway', 'kitchen']);
  assert.equal(h.declaredRooms('- [ ] Kitchen', config).size, 0);
  assert.equal(h.declaredRooms(null, config).size, 0);
});

test('cleanliness fails with no room declared', () => {
  const errors = h.cleanlinessErrors({ body: body(), files: ['feature/a.kt'], labels: [], now: NOW }, config);
  assert.ok(errors.some((e) => e.startsWith('No room declared')));
});

test('cleanliness fails when the diff touches a room the PR did not declare', () => {
  const errors = h.cleanlinessErrors({ body: body('Living Room'), files: ['feature/a.kt', 'core/auth/T.kt'], labels: [], now: NOW }, config);
  assert.deepEqual(errors, ['Undeclared room: Kitchen — it changes core/auth/T.kt.']);
});

test('cleanliness passes with every touched room declared, over-declaring allowed', () => {
  const errors = h.cleanlinessErrors({ body: body('Living Room', 'Kitchen', 'Garage'), files: ['feature/a.kt', 'core/auth/T.kt'], labels: [], now: NOW }, config);
  assert.deepEqual(errors, []);
});

test('Safe-room: label requires the tick, a hand tick requires the label', () => {
  const unticked = h.cleanlinessErrors({ body: body('Living Room'), files: ['feature/a.kt'], labels: ['safe-room'], now: NOW }, config);
  assert.deepEqual(unticked, ['Undeclared room: Safe-room — it carries the safe-room label.']);
  const unlabeled = h.cleanlinessErrors({ body: body('Living Room', 'Safe-room'), files: ['feature/a.kt'], labels: [], now: NOW }, config);
  assert.equal(unlabeled.length, 1);
  assert.match(unlabeled[0], /no safe-room label/);
  // path-detected: the labeler adds the label in parallel, so the tick alone is enough
  const byPath = h.cleanlinessErrors({ body: body('Kitchen', 'Safe-room'), files: ['core/auth/keystore/K.kt'], labels: [], now: NOW }, config);
  assert.deepEqual(byPath, []);
});

test('Driveway needs a valid, non-past expiry', () => {
  const files = ['tools/report.py'];
  const missing = h.cleanlinessErrors({ body: body('Driveway'), files, labels: [], now: NOW }, config);
  assert.match(missing[0], /Expiry: YYYY-MM-DD/);
  const past = h.cleanlinessErrors({ body: `${body('Driveway')}\nExpiry (Driveway only): \`2026-01-01\``, files, labels: [], now: NOW }, config);
  assert.match(past[0], /already in the past/);
  const ok = h.cleanlinessErrors({ body: `${body('Driveway')}\nExpiry (Driveway only): \`2026-12-31\``, files, labels: [], now: NOW }, config);
  assert.deepEqual(ok, []);
  assert.equal(h.parseExpiry('Expiry: 2026-02-30'), null);
});

test('approval rules match by room and by file/directory path', () => {
  const names = (files, labels = []) => h.applicableRules(files, labels, config).map((r) => r.name);
  assert.deepEqual(names(['feature/home/Home.kt']), []);
  assert.deepEqual(names(['core/auth/T.kt']), ['Kitchen']);
  assert.deepEqual(names(['data/session/Store.kt']), ['Core modules']);
  assert.deepEqual(names(['gradle/libs.versions.toml']), ['Kitchen', 'Dependencies']);
  assert.deepEqual(names(['pom.xml']), ['Kitchen', 'Dependencies']);
  assert.deepEqual(names(['webApp/package.json']), ['Dependencies']);
  assert.deepEqual(names(['server/src/main/resources/db/migration/V2__add_index.sql']), ['Kitchen']);
  assert.deepEqual(names(['webApp/src/App.tsx']), []);
  assert.deepEqual(names(['core/core-secure/Vault.kt']), ['Safe-room']);
  assert.deepEqual(names(['feature/home/Home.kt'], ['safe-room']), ['Safe-room']);
});

test('a later comment keeps an approval; a dismissal or change request drops it', () => {
  const reviews = [
    { user: { login: 'a' }, state: 'APPROVED' },
    { user: { login: 'a' }, state: 'COMMENTED' },
    { user: { login: 'b' }, state: 'APPROVED' },
    { user: { login: 'b' }, state: 'DISMISSED' },
    { user: { login: 'c' }, state: 'APPROVED' },
    { user: { login: 'c' }, state: 'CHANGES_REQUESTED' },
  ];
  assert.deepEqual(h.approvers(reviews), ['a']);
});

test('a rule needs its count from the pool and one approval from oneOf', () => {
  const [kitchen] = config.approvalRules;
  const [twoJuniors] = h.evaluateRules([kitchen], ['teammate-2', 'teammate-3'], config);
  assert.deepEqual(twoJuniors.problems, ['needs 1 approval from senior']);
  const [oneSenior] = h.evaluateRules([kitchen], ['your-login'], config);
  assert.deepEqual(oneSenior.problems, ['1/2 approvals from mobile']);
  const [met] = h.evaluateRules([kitchen], ['your-login', 'teammate-3', 'outsider'], config);
  assert.ok(met.ok);
});

test('people can only add Safe-room; every other label change is reverted', () => {
  const human = { login: 'dev', type: 'User' };
  const bot = { login: 'github-actions[bot]', type: 'Bot' };
  const otherBot = { login: 'random-app[bot]', type: 'Bot' };
  assert.equal(h.labelRevert({ action: 'labeled', label: 'safe-room', sender: human }, config), null);
  assert.deepEqual(h.labelRevert({ action: 'unlabeled', label: 'safe-room', sender: human }, config), { add: 'safe-room' });
  assert.deepEqual(h.labelRevert({ action: 'labeled', label: 'garage', sender: human }, config), { remove: 'garage' });
  assert.deepEqual(h.labelRevert({ action: 'unlabeled', label: 'kitchen', sender: human }, config), { add: 'kitchen' });
  assert.deepEqual(h.labelRevert({ action: 'labeled', label: 'kitchen', sender: otherBot }, config), { remove: 'kitchen' });
  assert.equal(h.labelRevert({ action: 'unlabeled', label: 'kitchen', sender: bot }, config), null);
});

test('tow list: expired Driveway files that still exist; a later PR renews', () => {
  const prs = [
    { number: 1, mergedAt: '2026-01-01T00:00:00Z', body: 'Expiry: 2026-02-01', files: ['tools/old.py', 'tools/renewed.py', 'feature/a.kt'] },
    { number: 2, mergedAt: '2026-06-01T00:00:00Z', body: 'Expiry: 2026-12-01', files: ['tools/renewed.py'] },
    { number: 3, mergedAt: '2026-05-01T00:00:00Z', body: 'no expiry line', files: ['dashboards/d.sql', 'dashboards/gone.sql'] },
    { number: 4, mergedAt: '2026-09-01T00:00:00Z', body: '', files: ['analyses/fresh.ipynb'] },
  ];
  const exists = (f) => f !== 'dashboards/gone.sql';
  assert.deepEqual(h.towList({ prs, exists, now: NOW }, config), [
    { file: 'dashboards/d.sql', pr: 3, expiry: '2026-07-30' },
    { file: 'tools/old.py', pr: 1, expiry: '2026-02-01' },
  ]);
});

test('runners: labeler adds missing room labels and drops stale ones, never Safe-room', async () => {
  const calls = [];
  const github = {
    paginate: async () => [{ filename: 'core/auth/T.kt' }],
    rest: {
      pulls: { listFiles: 'listFiles' },
      issues: {
        getLabel: async ({ name }) => ({ data: { name, color: config.rooms.concat(config.safeRoom).find((r) => r.label === name).color, description: config.rooms.concat(config.safeRoom).find((r) => r.label === name).description } }),
        addLabels: async (a) => calls.push(['add', a.labels]),
        removeLabel: async (a) => calls.push(['remove', a.name]),
      },
    },
  };
  const context = {
    repo: { owner: 'o', repo: 'r' },
    payload: { pull_request: { number: 7, labels: [{ name: 'garage' }, { name: 'safe-room' }] } },
  };
  await h.runLabeler({ github, context, core: { info() {} } }, config);
  assert.deepEqual(calls, [['add', ['kitchen']], ['remove', 'garage']]);
});

test('runners: ensureLabels creates, recolors, and renames v1 room/ labels in place', async () => {
  const existing = { kitchen: { color: 'ededed', description: '' }, 'room/garage': { color: 'ededed', description: '' } };
  const calls = [];
  const github = {
    rest: {
      issues: {
        getLabel: async ({ name }) => {
          if (existing[name]) return { data: { name, ...existing[name] } };
          const error = new Error('Not Found'); error.status = 404; throw error;
        },
        createLabel: async (a) => calls.push(['create', a.name, a.color]),
        updateLabel: async (a) => calls.push(['update', a.name, a.new_name ?? null, a.color]),
      },
    },
  };
  await h.ensureLabels({ github, context: { repo: { owner: 'o', repo: 'r' } } }, config);
  assert.deepEqual(calls.sort(), [
    ['update', 'kitchen', null, 'D93F0B'],          // existed in default gray: recolored
    ['update', 'room/garage', 'garage', 'FBCA04'],  // v1 name: renamed in place
    ['create', 'driveway', '6F42C1'],
    ['create', 'safe-room', '000000'],
    ['create', 'living-room', '0E8A16'],
  ].sort());
});
