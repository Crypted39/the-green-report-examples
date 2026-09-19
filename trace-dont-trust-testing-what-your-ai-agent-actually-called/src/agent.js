import { TransientError } from './tools.js';

// Minimal agent loop. One model step = one turn. The model returns either
// { toolCalls: [...] } or { final: "answer" }. Tool results are appended to
// the context the model sees on its next step.
export function runAgent({ model, tools, tracer, maxTurns = 20 }) {
  const context = [];
  for (let i = 0; i < maxTurns; i++) {
    tracer.nextTurn();
    const step = model(context);
    if (step.final !== undefined) return { answer: step.final, context };

    for (const call of step.toolCalls) {
      const tool = tools[call.tool];
      if (!tool) throw new Error(`Unknown tool: ${call.tool}`);
      const result = invokeWithRetry(tool, call.args);
      context.push({ tool: call.tool, args: call.args, result });
    }
  }
  throw new Error(`Agent exceeded ${maxTurns} turns`);
}

// The harness retries transient failures once. The retry is tagged so the
// detectors can tell a harness retry from a model-initiated repeat.
function invokeWithRetry(tool, args) {
  try {
    return tool.run(args);
  } catch (err) {
    if (err instanceof TransientError) return tool.run(args, { origin: 'harness-retry' });
    throw err;
  }
}

// Stand-in for a real LLM: replays a fixed list of steps.
export function scriptedModel(steps) {
  let i = 0;
  return () => {
    if (i >= steps.length) throw new Error('Scripted model ran out of steps');
    return steps[i++];
  };
}
