// The house map, as code. Every room workflow reads this file from the PR's
// BASE commit, so a PR cannot loosen its own rules. See adr/0001.
//
// Patterns: a plain name matches that file or anything under that directory
// ("core/auth" and "core/auth/" both cover core/auth/**). Globs use * (one
// path segment), ** (any depth) and ? (one character).
//
// FILL IN: the paths below are the AGENTS.md defaults; the logins are placeholders.

module.exports = {
  // A file belongs to the first room whose paths match it. Unmatched files are Living Room.
  rooms: [
    {
      // Listed first so these paths win over the Kitchen entry for `.claude/` below:
      // agents write their memory as they learn, so it cannot carry Kitchen gates.
      id: 'living-room',
      name: 'Living Room',
      label: 'living-room',
      color: '59C1EE',
      description: 'Core product. Normal review, full CI.',
      paths: ['.claude/agent-memory/'],
    },
    {
      id: 'kitchen',
      name: 'Kitchen',
      label: 'kitchen',
      color: 'EE2B37',
      description: 'Money, auth, regulated flows, shared contracts, the gates. Two approvals, one senior.',
      paths: [
        'shared/',
        'core/network/',
        'core/auth/',
        'core/wallet/',
        'core/compliance/',
        // schema changes cannot be rolled back by reverting the PR
        '**/db/migration/**',
        // the door itself (CODEOWNERS): nobody edits the gates alone
        '.github/',
        'build-logic/',
        'gradle/libs.versions.toml',
        '**/Package.swift',
        '**/Package.resolved',
        '**/*.xcconfig',
        'package.json',
        'package-lock.json',
        'pnpm-lock.yaml',
        'yarn.lock',
        'pom.xml',
        'AGENTS.md',
        'platform/',
        'scripts/*',
        // agent and skill definitions, for every runtime (generated copies included)
        '.claude/',
        '.codex/',
        '.gemini/',
        '.cursor/',
        '.agents/',
        'agents/',
        'skills/',
      ],
    },
    {
      id: 'garage',
      name: 'Garage',
      label: 'garage',
      color: 'FFC512',
      description: 'Spike or prototype. Nothing ships from here.',
      paths: ['sandbox/', '**/experiments/**'],
    },
    {
      id: 'driveway',
      name: 'Driveway',
      label: 'driveway',
      color: 'FF7A1A',
      description: 'Throwaway with an expiry date. Towed when it passes.',
      // scripts/ as a whole is real tooling (pre-commit, setup); only oneoff/ is throwaway
      paths: ['tools/', 'scripts/oneoff/', 'analyses/', 'dashboards/'],
    },
  ],
  defaultRoom: 'living-room',

  // Safe-room stacks on top of a file's room: the most sensitive code
  // (cryptography, secure storage, key material). Applied by the labeler when
  // these paths change, and the only label a person may add by hand.
  safeRoom: {
    id: 'safe-room',
    name: 'Safe-room',
    label: 'safe-room',
    color: '15171D',
    description: 'Cryptography, secure storage, key material. The only label a person may add.',
    paths: [
      '**/crypto/**',
      '**/cryptography/**',
      '**/core-secure/**',
      '**/securestorage/**',
      '**/secure-storage/**',
      '**/keystore/**',
      '**/keychain/**',
    ],
  },

  // Labels a person may ADD. Every other human label change is reverted.
  humanAddableLabels: ['safe-room'],
  // The labeler creates these labels with the colors above, renaming a v1 `room/<label>` in place.
  legacyLabelPrefix: 'room/',
  // Accounts whose label changes are trusted. Add your sweep GitHub App's bot login here.
  labelBots: ['github-actions[bot]'],

  driveway: {
    // Used when a Driveway PR has no parseable "Expiry: YYYY-MM-DD" line.
    defaultExpiryDays: 90,
    sweepLabel: 'driveway-sweep',
    sweepBranch: 'driveway/tow',
  },

  // Reviewer pools for approval rules. Update when the team changes.
  // FILL IN: `mobile` is the Kitchen pool for every stack. In a multi-stack house put
  // your backend and web leads in it too, or split the Kitchen rule by path.
  teams: {
    mobile: ['your-login', 'teammate-1', 'teammate-2', 'teammate-3'],
    senior: ['your-login', 'teammate-1'],
    security: ['security-reviewer-1', 'security-reviewer-2'],
    platform: ['your-login', 'platform-reviewer-1'],
  },

  // Every rule a PR matches must pass. A rule matches when the PR touches any
  // of its `paths`, or any of its `rooms` (Safe-room counts once labeled).
  approvalRules: [
    {
      name: 'Kitchen',
      match: { rooms: ['kitchen'] },
      approvals: 2,
      from: 'mobile',
      oneOf: 'senior',
    },
    {
      name: 'Safe-room',
      match: { rooms: ['safe-room'] },
      approvals: 2,
      from: 'senior',
      oneOf: 'security',
    },
    {
      // Example file/directory rule: modules every feature depends on.
      name: 'Core modules',
      match: { paths: ['app/', 'data/', 'navigation/', 'design/theme/'] },
      approvals: 2,
      from: 'mobile',
      oneOf: 'senior',
    },
    {
      // New or changed dependencies; dependency-gate.yml posts the questions.
      name: 'Dependencies',
      match: {
        paths: [
          'gradle/libs.versions.toml', '**/Package.swift', '**/Package.resolved', '**/Podfile', '**/Podfile.lock',
          '**/pom.xml', '**/package.json', '**/package-lock.json', '**/pnpm-lock.yaml', '**/yarn.lock',
        ],
      },
      approvals: 1,
      from: 'platform',
    },
  ],

  approvalStatusContext: 'room-approval-gate',
};
