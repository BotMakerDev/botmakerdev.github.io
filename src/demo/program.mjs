// The demo's program: placed blocks, the plugins ticked, the Java they make and the steps a run walks. Pure
// functions over plain values, no DOM, so node --test covers all of it (test/program.test.mjs); editor.mjs draws.
//
// A program is {blocks: Placed[], plugins: Set<'basics' | 'sdk'>}, a Placed {block, value, children?}. A loop
// sits at the top level and holds plain blocks: one level deep is all a ten-second demo needs. A block's index is
// its place in reading order (flat), the order its Java lines come in.

import { BLOCKS, CLASS, FOREVER_TURNS, PACKAGE } from './blocks.mjs';

/** @typedef {{block: string, value: string, children?: Placed[]}} Placed */
/** @typedef {{blocks: Placed[], plugins: Set<string>}} Program */

const place = (id) => {
  const block = BLOCKS[id];
  return block.container ? { block: id, value: block.values[0], children: [] } : { block: id, value: block.values[0] };
};

const enabled = (program, id) => BLOCKS[id].plugin === 'core' || program.plugins.has(BLOCKS[id].plugin);

/** @type {Program} */
export const EMPTY = { blocks: [], plugins: new Set() };

/** What the demo opens with: Studio's own blocks only. */
export const START = {
  blocks: [{ block: 'counting', value: '3', children: [{ block: 'print', value: '"Hello!"' }] }],
  plugins: new Set(),
};

/** What ticking the SDK loads: the shape of a game bot's loop, with the SDK sample bot's names. */
const SAMPLE = [{
  block: 'while', value: 'true', children: [
    { block: 'navigate', value: 'HOME' },
    { block: 'click', value: 'COLLECT' },
    { block: 'wait', value: '2' },
    { block: 'click', value: 'BATTLE' },
    { block: 'log', value: '"collected"' },
  ],
}];

/** Every placed block in reading order: a loop, then what is inside it. */
export function flat(program) {
  return program.blocks.flatMap((placed) => [placed, ...(placed.children ?? [])]);
}

/** The block at a flat index as [top, child]: child is -1 for a top-level block, undefined when there is none. */
function locate(program, index) {
  let i = 0;
  for (let top = 0; top < program.blocks.length; top++) {
    if (i++ === index) return [top, -1];
    const children = program.blocks[top].children ?? [];
    if (index < i + children.length) return [top, index - i];
    i += children.length;
  }
  return undefined;
}

function update(program, index, change) {
  const at = locate(program, index);
  if (!at) return program;
  const [top, child] = at;
  const blocks = program.blocks.map((placed, i) => {
    if (i !== top) return placed;
    if (child < 0) return change(placed);
    const children = placed.children.map((c, j) => (j === child ? change(c) : c)).filter(Boolean);
    return { ...placed, children };
  });
  return { ...program, blocks: blocks.filter(Boolean) };
}

/** Adds a block: inside the last loop when there is one, unless it is a loop itself. */
export function add(program, id) {
  if (!BLOCKS[id] || !enabled(program, id)) return program;
  const placed = place(id);
  const loop = BLOCKS[id].container ? -1 : program.blocks.findLastIndex((p) => BLOCKS[p.block].container);
  if (loop < 0) return { ...program, blocks: [...program.blocks, placed] };
  return {
    ...program,
    blocks: program.blocks.map((p, i) => (i === loop ? { ...p, children: [...p.children, placed] } : p)),
  };
}

/** Removes the block at a flat index; a loop goes with what is inside it. */
export function remove(program, index) {
  return update(program, index, () => null);
}

/** Sets a block's value, only to one the block offers. */
export function setValue(program, index, value) {
  const placed = flat(program)[index];
  if (!placed || !BLOCKS[placed.block].values.includes(value)) return program;
  return update(program, index, (p) => ({ ...p, value }));
}

/**
 * Ticks or unticks a plugin. Off removes its blocks wherever they are. The SDK on, with none of its blocks placed,
 * loads the sample program in place of Studio's own blocks; Basics blocks the visitor added stay, before it.
 */
export function togglePlugin(program, plugin, on) {
  const plugins = new Set(program.plugins);
  if (on) plugins.add(plugin);
  else plugins.delete(plugin);
  const next = { ...program, plugins };
  if (on && plugin === 'sdk' && !flat(program).some((p) => BLOCKS[p.block].plugin === 'sdk')) {
    const kept = flat(program).filter((p) => BLOCKS[p.block].plugin === 'basics');
    return { ...next, blocks: [...kept, ...SAMPLE] };
  }
  const keep = (p) => enabled(next, p.block);
  return {
    ...next,
    blocks: program.blocks.filter(keep).map((p) => (p.children ? { ...p, children: p.children.filter(keep) } : p)),
  };
}

const INDENT = '    ';

/**
 * The program's Java, as Studio writes it into a blank project's main.
 *
 * @returns {{lines: string[], lineOf: number[]}} lineOf[i] is the line of the block at flat index i
 */
export function toJava(program) {
  const placed = flat(program);
  const imports = [...new Set(placed.flatMap((p) => BLOCKS[p.block].imports ?? []))].sort();
  const lines = [`package ${PACKAGE};`, ''];
  if (imports.length) lines.push(...imports.map((name) => `import ${name};`), '');
  lines.push(`public class ${CLASS} {`, '', `${INDENT}public static void main(String[] args) {`);

  const uses = new Map();
  const lineOf = [];
  const emit = (p, depth) => {
    const n = (uses.get(p.block) ?? 0) + 1;
    uses.set(p.block, n);
    lineOf.push(lines.length);
    lines.push(INDENT.repeat(depth) + BLOCKS[p.block].java(p.value, n));
  };
  for (const p of program.blocks) {
    emit(p, 2);
    if (p.children) {
      for (const child of p.children) emit(child, 3);
      lines.push(`${INDENT.repeat(2)}}`);
    }
  }
  lines.push(`${INDENT}}`, '}');
  return { lines, lineOf };
}

/**
 * The steps a run walks, in order: each plain block once, each loop's blocks once per turn (a forever loop
 * FOREVER_TURNS times). A loop itself is no step; its blocks carry the turn.
 *
 * @returns {{blockIndex: number, javaLine: number, log: string, turn?: number}[]}
 */
export function runSteps(program) {
  const { lineOf } = toJava(program);
  const steps = [];
  const step = (p, blockIndex, turn) => {
    const block = BLOCKS[p.block];
    steps.push({ blockIndex, javaLine: lineOf[blockIndex], log: block.run(p.value), ...(turn ? { turn } : {}) });
  };
  let index = 0;
  for (const p of program.blocks) {
    const at = index++;
    if (!p.children) {
      step(p, at, 0);
      continue;
    }
    const turns = BLOCKS[p.block].turns?.(p.value) ?? FOREVER_TURNS;
    for (let turn = 1; turn <= turns; turn++) p.children.forEach((child, j) => step(child, at + 1 + j, turn));
    index += p.children.length;
  }
  return steps;
}

const KEYWORDS = new Set(['package', 'import', 'public', 'class', 'static', 'void', 'for', 'while', 'int', 'true']);
const TOKEN = new RegExp(`"(?:[^"\\\\]|\\\\.)*"|\\b(?:${[...KEYWORDS].join('|')})\\b|[A-Za-z_]\\w*(?=\\()`, 'g');

/**
 * One Java line as parts to colour: a string literal 'st', a keyword 'kw', a called name 'fn', the rest plain. The
 * editor and the page built without JavaScript both draw from it, as text, never as HTML.
 *
 * @returns {{text: string, kind?: 'st' | 'kw' | 'fn'}[]}
 */
export function tokens(line) {
  const parts = [];
  let last = 0;
  for (const match of line.matchAll(TOKEN)) {
    if (match.index > last) parts.push({ text: line.slice(last, match.index) });
    const text = match[0];
    parts.push({ text, kind: text.startsWith('"') ? 'st' : KEYWORDS.has(text) ? 'kw' : 'fn' });
    last = match.index + text.length;
  }
  if (last < line.length) parts.push({ text: line.slice(last) });
  return parts;
}
