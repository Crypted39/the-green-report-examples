// Fake tools backed by a tiny in-memory "world".
// Each tool declares whether it mutates state and which resource it touches,
// so the redundancy detectors can tell a legitimate verify-after-write
// from a pointless re-read.

export class TransientError extends Error {}

export function createWorld(overrides = {}) {
  return {
    files: {
      'README.md': '# Demo project',
      'config.json': '{"debug":false}',
    },
    users: {
      5: { id: 5, name: 'Ada' },
      7: { id: 7, name: 'Grace' },
    },
    // Number of upcoming search() calls that should fail with a transient error.
    transientFailures: 0,
    ...overrides,
  };
}

export function createTools(world) {
  return {
    read_file: {
      mutates: false,
      resource: ({ path }) => `file:${path}`,
      run: ({ path }) => world.files[path] ?? null,
    },
    write_file: {
      mutates: true,
      resource: ({ path }) => `file:${path}`,
      run: ({ path, content }) => {
        world.files[path] = content;
        return 'ok';
      },
    },
    get_user: {
      mutates: false,
      resource: ({ id }) => `user:${id}`,
      run: ({ id }) => world.users[id] ?? null,
    },
    search: {
      mutates: false,
      resource: ({ query }) => `search:${query}`,
      run: ({ query }) => {
        if (world.transientFailures > 0) {
          world.transientFailures--;
          throw new TransientError('search backend timed out');
        }
        return Object.keys(world.files).filter((f) => f.includes(query));
      },
    },
  };
}
