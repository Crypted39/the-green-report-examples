import { createHash } from 'node:crypto';

// Canonical form of tool arguments: sorted keys, trimmed strings,
// numbers coerced to strings. get_user({ id: 5 }) and get_user({ id: "5" })
// end up with the same normalized key.
export function normalizeArgs(value) {
  if (Array.isArray(value)) return value.map(normalizeArgs);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, normalizeArgs(value[k])]),
    );
  }
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value.trim();
  return value;
}

const hash = (value) =>
  createHash('sha1').update(JSON.stringify(value) ?? 'undefined').digest('hex').slice(0, 12);

// Wraps a tool registry so every invocation is recorded.
// The wrapped tools behave exactly like the originals.
export class ToolTracer {
  constructor() {
    this.calls = [];
    this.turn = 0;
  }

  nextTurn() {
    this.turn++;
  }

  wrap(tools) {
    const wrapped = {};
    for (const [name, tool] of Object.entries(tools)) {
      wrapped[name] = {
        ...tool,
        run: (args, meta = {}) => {
          const record = {
            seq: this.calls.length,
            turn: this.turn,
            name,
            args,
            rawKey: `${name}(${JSON.stringify(args)})`,
            normalizedKey: `${name}(${JSON.stringify(normalizeArgs(args))})`,
            resource: tool.resource(args),
            mutates: tool.mutates,
            origin: meta.origin ?? 'model', // 'model' | 'harness-retry'
          };
          try {
            const result = tool.run(args);
            record.ok = true;
            record.resultHash = hash(result);
            return result;
          } catch (err) {
            record.ok = false;
            record.error = err.message;
            throw err;
          } finally {
            this.calls.push(record);
          }
        },
      };
    }
    return wrapped;
  }
}
