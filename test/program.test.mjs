import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BLOCKS } from '../src/demo/blocks.mjs';
import { EMPTY, START, add, remove, setValue, togglePlugin, toJava, runSteps, flat } from '../src/demo/program.mjs';

const java = (program) => toJava(program).lines;
const callLine = (lines, text) => lines.find((line) => line.includes(text));
const indent = (line) => line.length - line.trimStart().length;

test('a block added to an empty program lands in main, inside the class', () => {
  const lines = java(add(EMPTY, 'print'));
  assert.ok(lines.includes('public class MyProgram {'));
  assert.ok(lines.includes('    public static void main(String[] args) {'));
  assert.ok(lines.includes('        System.out.println("Hello!");'));
  assert.equal(lines.at(-1), '}');
});

test('a block added after a loop goes inside it, one level deeper', () => {
  const program = add(add(EMPTY, 'counting'), 'print');
  const lines = java(program);
  const loop = callLine(lines, 'for (int i = 0; i < 3; i++) {');
  const print = callLine(lines, 'System.out.println');
  assert.equal(indent(print), indent(loop) + 4);
  assert.equal(program.blocks.length, 1);
  assert.equal(program.blocks[0].children.length, 1);
});

test('a loop added after a loop is not nested in it', () => {
  const program = add(add(EMPTY, 'counting'), 'while');
  assert.equal(program.blocks.length, 2);
});

test('a block of a plugin that is off is not added', () => {
  assert.equal(add(EMPTY, 'navigate'), EMPTY);
  assert.equal(add(EMPTY, 'nonsense'), EMPTY);
});

test('ticking the SDK loads the sample program, and its imports', () => {
  const lines = java(togglePlugin(EMPTY, 'sdk', true));
  assert.ok(lines.includes('import com.botmaker.sdk.api.screens.Navigate;'));
  assert.ok(lines.includes('import com.botmaker.sdk.api.vision.ImageClicker;'));
  assert.ok(lines.includes('import com.myprogram.plugins.sdk.Pictures;'));
  assert.ok(callLine(lines, 'ImageClicker.click(Pictures.COLLECT);'));
});

test('ticking the SDK keeps the Basics blocks the visitor added', () => {
  let program = togglePlugin(add(EMPTY, 'counting'), 'basics', true);
  program = add(program, 'duration');
  program = togglePlugin(program, 'sdk', true);
  assert.equal(program.blocks[0].block, 'duration');
  assert.equal(program.blocks[1].block, 'while');
  assert.ok(!flat(program).some((placed) => placed.block === 'counting'));
});

test('unticking a plugin removes its blocks, inside a loop too, and its imports', () => {
  let program = togglePlugin(EMPTY, 'sdk', true);
  program = add(program, 'print');
  program = togglePlugin(program, 'sdk', false);
  const lines = java(program);
  assert.ok(!lines.some((line) => line.startsWith('import ')));
  assert.ok(!lines.some((line) => /Navigate|ImageClicker|Wait/.test(line)));
  assert.deepEqual(flat(program).map((placed) => placed.block), ['while', 'print']);
});

test('Basics: a duration is written the way Basics writes one, and two do not share a name', () => {
  let program = togglePlugin(EMPTY, 'basics', true);
  program = add(add(program, 'duration'), 'duration');
  program = setValue(program, 1, '5 min');
  const lines = java(program);
  assert.ok(lines.includes('import java.time.Duration;'));
  assert.ok(lines.includes('        Duration pause = Duration.ofMillis(2000);'));
  assert.ok(lines.includes('        Duration pause2 = Duration.ofMillis(300000);'));
});

test('setValue takes only a value the block offers', () => {
  const program = add(EMPTY, 'counting');
  assert.equal(setValue(program, 0, '5').blocks[0].value, '5');
  assert.equal(setValue(program, 0, '1e9'), program);
  assert.equal(setValue(program, 7, '5'), program);
});

test('remove takes a block by its place in the program, a loop with what is inside it', () => {
  const program = add(add(add(EMPTY, 'print'), 'counting'), 'print');
  assert.deepEqual(flat(remove(program, 2)).map((placed) => placed.block), ['print', 'counting']);
  assert.deepEqual(flat(remove(program, 1)).map((placed) => placed.block), ['print']);
  assert.equal(remove(program, 9), program);
});

test('lineOf points at the line holding each block', () => {
  const program = togglePlugin(add(EMPTY, 'print'), 'sdk', true);
  const { lines, lineOf } = toJava(program);
  assert.equal(lineOf.length, flat(program).length);
  flat(program).forEach((placed, i) => {
    assert.equal(lines[lineOf[i]].trim(), BLOCKS[placed.block].java(placed.value, 1).trim());
  });
});

test('a forever loop with two blocks inside runs three turns: six steps, after the blocks before it', () => {
  let program = add(add(EMPTY, 'print'), 'while');
  program = add(add(program, 'print'), 'print');
  const steps = runSteps(program);
  assert.equal(steps.length, 1 + 6);
  assert.deepEqual(steps.map((step) => step.blockIndex), [0, 2, 3, 2, 3, 2, 3]);
  assert.deepEqual(steps.slice(1).map((step) => step.turn), [1, 1, 2, 2, 3, 3]);
  const { lineOf } = toJava(program);
  steps.forEach((step) => assert.equal(step.javaLine, lineOf[step.blockIndex]));
});

test('a counting loop runs as many turns as it says', () => {
  const program = setValue(add(add(EMPTY, 'counting'), 'print'), 0, '5');
  assert.equal(runSteps(program).length, 5);
});

test('the starting program is core blocks only, and every block offers its first value', () => {
  assert.ok(flat(START).every((placed) => BLOCKS[placed.block].plugin === 'core'));
  for (const block of Object.values(BLOCKS)) assert.ok(block.values.length > 0, block.label);
});

test('a Java line splits into strings, keywords and calls, and joins back to itself', async () => {
  const { tokens } = await import('../src/demo/program.mjs');
  const line = '        for (int i = 0; i < 3; i++) { System.out.println("Hi (there)"); }';
  const parts = tokens(line);
  assert.equal(parts.map((part) => part.text).join(''), line);
  const kinds = parts.filter((part) => part.kind).map((part) => [part.kind, part.text]);
  assert.deepEqual(kinds, [['kw', 'for'], ['kw', 'int'], ['fn', 'println'], ['st', '"Hi (there)"']]);
});
