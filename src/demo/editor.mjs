// The demo editor on the home page: draws program.mjs's state into the markup index.astro renders, and runs it.
// Every text lands through textContent, never innerHTML. Nothing real runs: a run walks runSteps with a timer.

import { BLOCKS, PLUGINS } from './blocks.mjs';
import { START, add, flat, remove, runSteps, setValue, toJava, togglePlugin, tokens } from './program.mjs';

const STEP_MS = 600;

/** The pictures the fake game shows, and the score its match box says. */
const SCORES = { COLLECT: '0.97', BATTLE: '0.93' };

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    if (name === 'class') node.className = value;
    else if (name in node && typeof value !== 'string') node[name] = value;
    else node.setAttribute(name, value === true ? '' : value);
  }
  node.append(...children);
  return node;
}

/** One Java line, coloured; index.astro builds the same spans without JavaScript. */
export function javaLine(line) {
  const div = el('div', { class: 'ln' });
  for (const part of tokens(line)) div.append(part.kind ? el('span', { class: part.kind }, part.text) : part.text);
  if (!line) div.append(' ');
  return div;
}

/** @param {HTMLElement} root the [data-demo] figure */
export function mount(root) {
  const $ = (name) => root.querySelector(`[data-${name}]`);
  const palette = $('palette');
  const stage = $('stage');
  const java = $('java');
  const out = $('console');
  const runButton = $('run');
  const game = $('game');
  const editor = $('editor');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  let program = START;
  let run = null; // {stop: boolean} while a run is going

  const log = (text, quiet = false) => {
    out.append(el('div', { class: quiet ? 'o' : undefined }, text));
    out.scrollTop = out.scrollHeight;
  };

  // Stopping is at once: the button reads Run again and a new run may start while the old one waits out its
  // timer, which then sees its flag and leaves everything to the new one.
  function stopRun() {
    if (!run) return;
    run.stop = true;
    run = null;
    runButton.textContent = '▶ Run';
    mark(null);
    for (const box of game.querySelectorAll('.box')) box.classList.remove('on');
    log('stopped', true);
  }

  function change(next) {
    if (next === program) return;
    stopRun();
    program = next;
    draw();
  }

  function drawPalette() {
    palette.replaceChildren();
    for (const plugin of PLUGINS) {
      if (plugin.id !== 'core' && !program.plugins.has(plugin.id)) continue;
      palette.append(el('p', { class: 'grp' }, plugin.group));
      for (const block of Object.values(BLOCKS).filter((b) => b.plugin === plugin.id)) {
        palette.append(el('button', {
          type: 'button', class: `blk k-${block.category}`, 'data-key': `add:${block.id}`,
          'aria-label': `Add ${block.label}`, onclick: () => change(add(program, block.id)),
        }, block.label));
      }
    }
    if (program.plugins.size === 0) palette.append(el('p', { class: 'hint' }, 'Tick a plugin above for more blocks.'));
  }

  function row(placed, index) {
    const block = BLOCKS[placed.block];
    const select = el('select', {
      class: 'chip', 'data-key': `value:${index}`, 'aria-label': `${block.label}: value`,
      onchange: (event) => change(setValue(program, index, event.target.value)),
    }, ...block.values.map((value) => el('option', { value, selected: value === placed.value }, value)));
    return el('li', {}, el('div', { class: 'line' },
      el('span', { class: `blk k-${block.category}`, 'data-index': String(index) }, block.label, ' ', select),
      el('button', {
        type: 'button', class: 'x', 'data-key': `remove:${index}`, 'aria-label': `Remove ${block.label}`,
        onclick: () => change(remove(program, index)),
      }, '✕')));
  }

  function drawStage() {
    stage.replaceChildren();
    let index = 0;
    for (const placed of program.blocks) {
      const li = row(placed, index++);
      if (placed.children) {
        const inner = el('ol');
        for (const child of placed.children) inner.append(row(child, index++));
        if (placed.children.length === 0) inner.append(el('li', { class: 'note' }, 'Empty: the next block goes here.'));
        li.append(inner);
      }
      stage.append(li);
    }
    if (program.blocks.length === 0) stage.append(el('li', { class: 'note' }, 'Empty: click a block in the palette.'));
  }

  function drawJava() {
    java.replaceChildren(...toJava(program).lines.map(javaLine));
  }

  function draw() {
    // A redraw replaces the controls: put the focus back on the one with the same key (after a remove, the
    // next block's ✕), or on the program.
    const key = root.contains(document.activeElement) ? document.activeElement.dataset.key : undefined;
    drawPalette();
    drawStage();
    drawJava();
    const sdk = program.plugins.has('sdk');
    game.hidden = !sdk;
    editor.classList.toggle('with-game', sdk);
    for (const box of root.querySelectorAll('[data-plugin]')) box.checked = program.plugins.has(box.dataset.plugin);
    if (key) (root.querySelector(`[data-key="${key}"]`) ?? stage).focus();
  }

  function mark(step) {
    for (const live of root.querySelectorAll('.live')) live.classList.remove('live');
    if (!step) return;
    stage.querySelector(`[data-index="${step.blockIndex}"]`)?.classList.add('live');
    java.children[step.javaLine]?.classList.add('live');
  }

  function show(step) {
    const placed = flat(program)[step.blockIndex];
    const block = BLOCKS[placed.block];
    for (const box of game.querySelectorAll('.box')) box.classList.remove('on');
    if (block.game === 'screen') $('screen').textContent = placed.value;
    if (block.game === 'click') {
      const target = game.querySelector(`[data-picture="${placed.value}"]`);
      target.querySelector('.box').classList.add('on');
      if (!reduced.matches) {
        const ripple = $('ripple');
        ripple.style.left = `${target.offsetLeft + target.offsetWidth / 2}px`;
        ripple.style.top = `${target.offsetTop + target.offsetHeight / 2}px`;
        ripple.classList.remove('on');
        void ripple.offsetWidth; // restart the animation
        ripple.classList.add('on');
      }
      if (placed.value === 'COLLECT') {
        const gold = $('gold');
        gold.textContent = (Number(gold.dataset.value) + 150).toLocaleString('en-US');
        gold.dataset.value = String(Number(gold.dataset.value) + 150);
      }
    }
  }

  async function start() {
    const mine = { stop: false };
    run = mine;
    runButton.textContent = '■ Stop';
    out.replaceChildren();
    const steps = runSteps(program);
    const forever = program.blocks.some((p) => p.block === 'while');
    log(steps.length ? `running ${toJava(program).lines.length} lines of Java` : 'nothing to run: add a block', true);
    let turn = 0;
    for (const step of steps) {
      if (mine.stop) break;
      if (step.turn && step.turn !== turn) {
        turn = step.turn;
        log(`turn ${turn}${forever && turn === 1 ? ' (a forever loop stops after 3 turns here)' : ''}`, true);
      }
      mark(step);
      log(step.log);
      if (program.plugins.has('sdk')) show(step);
      await new Promise((resolve) => setTimeout(resolve, STEP_MS));
    }
    if (mine.stop) return; // stopRun has drawn the stop already
    run = null;
    runButton.textContent = '▶ Run';
    mark(null);
    for (const box of game.querySelectorAll('.box')) box.classList.remove('on');
    log('finished', true);
  }

  runButton.addEventListener('click', () => (run ? stopRun() : start()));
  for (const box of root.querySelectorAll('[data-plugin]')) {
    box.addEventListener('change', () => change(togglePlugin(program, box.dataset.plugin, box.checked)));
  }

  $('controls').hidden = false;
  out.replaceChildren(el('span', { class: 'o' }, 'Press ▶ Run. Click a palette block to add it; ✕ removes one.'));
  draw();
}
