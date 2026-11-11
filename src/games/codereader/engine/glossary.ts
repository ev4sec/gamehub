import type { Term } from './types';

/** The general definition behind each label a lesson puts on a piece of code. */
export const GLOSSARY: Record<string, Term> = {
  comment: {
    name: 'Comment',
    definition: 'A note for people. Everything after # on a line (or // in TypeScript) is ignored when the code runs.',
  },
  statement: {
    name: 'Statement',
    definition: 'One instruction. Usually one line. A file is a list of statements carried out from the top down.',
  },
  variable: {
    name: 'Variable',
    definition: 'A name that stands for a value, so the value can be used again later.',
  },
  assignment: {
    name: 'Assignment',
    definition: 'A line of the form name = value. It makes the name on the left stand for the value on the right. It is not a claim that the two are equal.',
  },
  string: {
    name: 'String',
    definition: 'Text, written between quotes.',
  },
  number: {
    name: 'Number',
    definition: 'A numeric value, whole or with a decimal point, written without quotes.',
  },
  boolean: {
    name: 'Boolean',
    definition: 'One of two values, true or false. Python writes True and False.',
  },
  none: {
    name: 'None',
    definition: 'The value that means "nothing here". TypeScript has two of them, null and undefined.',
  },
  list: {
    name: 'List',
    definition: 'Values kept in order, written in square brackets. TypeScript calls it an array.',
  },
  dict: {
    name: 'Dict',
    definition: 'A lookup table of keys and values, written in curly braces. TypeScript calls it an object.',
  },
  index: {
    name: 'Indexing',
    definition: 'Square brackets after a value pick one piece out of it: a position in a list, or a key in a dict.',
  },
  fstring: {
    name: 'Formatted string',
    definition: 'A string that fills in values. Python marks it with f and uses {braces}. TypeScript uses backticks and ${braces}.',
  },
  call: {
    name: 'Call',
    definition: 'A name followed by parentheses. It runs the function of that name and stands for whatever the function gives back.',
  },
  argument: {
    name: 'Argument',
    definition: 'A value handed to a function when it is called, written inside the parentheses of the call.',
  },
  block: {
    name: 'Block',
    definition: 'A group of lines that belong together under a line ending in a colon. Python marks a block by indenting it. TypeScript wraps it in curly braces.',
  },
  loop: {
    name: 'Loop',
    definition: 'A block that runs repeatedly. for runs it once per item. while runs it as long as a test holds.',
  },
  loopvar: {
    name: 'Loop variable',
    definition: 'The name that holds the current item on each pass of a for loop.',
  },
  condition: {
    name: 'Condition',
    definition: 'A test that is either true or false. if runs its block only when the test is true.',
  },
  else: {
    name: 'Else branch',
    definition: 'The block that runs when the if above it did not.',
  },
  function: {
    name: 'Function',
    definition: 'A named, reusable piece of code. It is defined once and can be called from many places.',
  },
  signature: {
    name: 'Signature',
    definition: 'The first line of a function: its name and the parameters it takes. It tells you how to use the function without reading its body.',
  },
  parameter: {
    name: 'Parameter',
    definition: "A name in a function's signature. It stands for a value the caller will supply.",
  },
  default: {
    name: 'Default value',
    definition: 'A value a parameter takes when the caller leaves it out, written with = in the signature.',
  },
  docstring: {
    name: 'Docstring',
    definition: 'A string placed first in a function, class or file to describe it. It does nothing when the code runs.',
  },
  body: {
    name: 'Body',
    definition: 'The block under a signature. It is what runs when the function is called.',
  },
  return: {
    name: 'Return',
    definition: 'Ends the function and hands a value back to the caller. A function with no return hands back None.',
  },
  method: {
    name: 'Method',
    definition: 'A function that belongs to a value and is called with a dot: text.strip().',
  },
  chain: {
    name: 'Chain',
    definition: 'Several calls joined by dots. Each one works on the result of the one before, left to right.',
  },
  comprehension: {
    name: 'Comprehension',
    definition: 'A one-line way to build a list from another: what to keep, where it comes from, and an optional test.',
  },
  accumulator: {
    name: 'Running result',
    definition: 'A variable set before a loop and updated inside it: a count, a total, or the best item seen so far.',
  },
  import: {
    name: 'Import',
    definition: 'A line that brings in code from somewhere else so this file can use it.',
  },
  stdlib: {
    name: 'Standard library',
    definition: 'Modules that ship with the language itself. Nothing has to be installed to use them.',
  },
  package: {
    name: 'Third-party package',
    definition: 'Code written by someone else and installed separately. It is a dependency: the project trusts it.',
  },
  localmod: {
    name: 'Local module',
    definition: 'Another file in the same project. You can open it and read it.',
  },
  constant: {
    name: 'Constant',
    definition: 'A value set once near the top of a file and never changed. By convention its name is in capitals.',
  },
  entry: {
    name: 'Entry point',
    definition: 'Where a program starts doing its work. The first place to read.',
  },
  mainguard: {
    name: 'Main guard',
    definition: 'The line if __name__ == "__main__":. Its block runs only when the file is run directly, not when it is imported.',
  },
  helper: {
    name: 'Helper function',
    definition: 'A small function that does one job for the rest of the file. Read its name first and its body only when you need to.',
  },
  with: {
    name: 'With block',
    definition: 'Opens something, such as a file, and guarantees it is closed again when the block ends.',
  },
  source: {
    name: 'Source',
    definition: 'A place where a value enters from outside: a request, a form, a file, a command-line argument. Whoever controls it controls the value.',
  },
  sink: {
    name: 'Sink',
    definition: 'A place where a value is used in a way that matters: a database query, a shell command, a file path, a page shown to someone else.',
  },
  hop: {
    name: 'Hop',
    definition: 'A step where a value is passed along or renamed without being checked or changed.',
  },
  try: {
    name: 'Try block',
    definition: 'Code that is allowed to fail. If a line in it raises an error, control jumps to the matching except.',
  },
  except: {
    name: 'Except block',
    definition: 'What runs instead when the try block fails with the named kind of error.',
  },
  finally: {
    name: 'Finally block',
    definition: 'Runs after a try block whether it worked or failed.',
  },
  raise: {
    name: 'Raise',
    definition: 'Stops the function at once and sends an error up to the caller.',
  },
  swallow: {
    name: 'Swallowed error',
    definition: 'An except block that catches a failure and does nothing with it. The program carries on as if nothing happened.',
  },
  class: {
    name: 'Class',
    definition: 'A blueprint for objects: what data each one carries and what it can do.',
  },
  init: {
    name: 'Constructor',
    definition: "The method that runs when an object is created. In Python it is named __init__. It sets up the object's data.",
  },
  self: {
    name: 'self',
    definition: 'Inside a method, the particular object the method was called on.',
  },
  attribute: {
    name: 'Attribute',
    definition: 'A piece of data stored on an object, read and written with a dot: self.host.',
  },
  object: {
    name: 'Object',
    definition: 'One thing built from a class. Each object has its own copy of the attributes.',
  },
  decorator: {
    name: 'Decorator',
    definition: 'A line starting with @ above a function or class. It wraps or registers what is below it.',
  },
  typehint: {
    name: 'Type annotation',
    definition: 'A note after a colon or arrow saying what kind of value is expected. It is checked by tools, not when the code runs.',
  },
  dependency: {
    name: 'Dependency list',
    definition: 'The file that names every outside package a project installs: requirements.txt in Python, package.json in TypeScript.',
  },
  pin: {
    name: 'Version pin',
    definition: 'An exact version of a dependency, so every install gets the same code.',
  },
  interface: {
    name: 'Interface',
    definition: "A TypeScript description of an object's shape: which fields it has and the type of each.",
  },
  union: {
    name: 'Union type',
    definition: 'A type that allows one of several options, written with | between them.',
  },
  optional: {
    name: 'Optional field',
    definition: 'A field marked with ? that may be left out.',
  },
  const: {
    name: 'const',
    definition: 'Declares a name that cannot be reassigned. let declares one that can.',
  },
  ternary: {
    name: 'Inline if',
    definition: 'test ? a : b gives a when the test is true and b otherwise.',
  },
  export: {
    name: 'Export',
    definition: 'Marks a name as available to other files.',
  },
  arrow: {
    name: 'Arrow function',
    definition: 'A function written as (parameters) => result.',
  },
  destructuring: {
    name: 'Destructuring',
    definition: 'Pulling named fields out of an object, or items out of an array, in one step.',
  },
  callback: {
    name: 'Callback',
    definition: 'A function handed to another function, to be called by it later.',
  },
  async: {
    name: 'Async function',
    definition: 'A function that can wait for slow work. Calling it gives a promise of a result.',
  },
  await: {
    name: 'await',
    definition: 'Pauses an async function until a promise is ready, then gives the value inside it.',
  },
  promise: {
    name: 'Promise',
    definition: 'A placeholder for a result that is not ready yet.',
  },
  component: {
    name: 'Component',
    definition: 'A function that returns markup. Using it as a tag calls it.',
  },
  props: {
    name: 'Props',
    definition: 'The values a component is given by whatever uses it. They arrive as one object.',
  },
  state: {
    name: 'State',
    definition: 'A value a component remembers between draws. Changing it through its setter redraws the component.',
  },
  handler: {
    name: 'Event handler',
    definition: 'A function that runs when something happens on the page, such as a click.',
  },
  jsx: {
    name: 'JSX',
    definition: 'Markup written inside code. Curly braces within it mean "put this value here".',
  },
  effect: {
    name: 'Effect',
    definition: 'Code a component runs after it is on screen, for work that reaches outside it, such as fetching data.',
  },
  deps: {
    name: 'Dependency array',
    definition: 'The list at the end of an effect. The effect runs again when anything in it changes.',
  },
  route: {
    name: 'Route',
    definition: 'A line that ties a URL to the function that answers requests for it. Each one is an entry point anyone can reach.',
  },
  neutralize: {
    name: 'Neutralizing step',
    definition: 'A conversion or check that makes a value safe for one particular use, such as turning text into a number.',
  },
  weakcheck: {
    name: 'Weak check',
    definition: 'A check that blocks the obvious bad input and misses others.',
  },
  authn: {
    name: 'Authentication check',
    definition: 'Confirms that the caller is logged in. It says who they are, not what they may touch.',
  },
  authz: {
    name: 'Authorization check',
    definition: 'Confirms that this caller may act on this particular thing.',
  },
  secret: {
    name: 'Secret',
    definition: 'A value that grants access: a token, a password, a key.',
  },
  escaped: {
    name: 'Escaped output',
    definition: 'A value shown as plain text, with any markup in it made harmless.',
  },
};
