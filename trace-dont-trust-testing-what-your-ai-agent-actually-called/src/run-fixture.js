import { readFileSync } from 'node:fs';
import { createWorld, createTools } from './tools.js';
import { ToolTracer } from './tracer.js';
import { runAgent, scriptedModel } from './agent.js';

export function loadFixture(name) {
  const url = new URL(`../fixtures/${name}.json`, import.meta.url);
  return JSON.parse(readFileSync(url, 'utf8'));
}

// Runs a fixture through the agent loop and returns the recorded call list.
export function runFixture(name) {
  const fixture = loadFixture(name);
  const world = createWorld(fixture.world);
  const tracer = new ToolTracer();
  const tools = tracer.wrap(createTools(world));
  const outcome = runAgent({ model: scriptedModel(fixture.steps), tools, tracer });
  return { fixture, trace: tracer.calls, outcome };
}
