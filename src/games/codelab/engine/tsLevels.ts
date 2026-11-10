import type { Level, World } from './types';

/*
 * The TypeScript track. Reading only: every level shows code and asks what it
 * does. Predict snippets are type-checked by the real compiler and executed by
 * `npm run verify:levels`; the JavaScript they run as lives in tsCompiled.ts,
 * written by `npm run gen:ts` and checked for freshness by the same verifier.
 */
export const TS_WORLDS: World[] = [
  { id: 'ts-basics', track: 'ts', title: 'Values and Shapes', blurb: 'const and let, objects and arrays, and what a type annotation says.' },
  { id: 'ts-functions', track: 'ts', title: 'Functions and Arrows', blurb: 'Arrow functions, destructuring, and the three dots.' },
  { id: 'ts-data', track: 'ts', title: 'Working With Data', blurb: 'map and filter, and reading values that might be missing.' },
  { id: 'ts-async', track: 'ts', title: 'Waiting for Things', blurb: 'Promises, async and await, and what runs in what order.' },
  { id: 'ts-modules', track: 'ts', title: 'Files and Types', blurb: 'Imports, exports, generics, and where a name comes from.' },
  { id: 'ts-react', track: 'ts', title: 'Reading a Component', blurb: 'What a React component is, and what happens when its state changes.' },
];

export const TS_LEVELS: Level[] = [
  {
    id: 'tsb-1',
    world: 'ts-basics',
    title: 'const, let and template text',
    kind: 'predict',
    concept: [
      'const makes a name that cannot be pointed at anything else. let makes one that can. Most names in modern code are const, so a let is a signal: this one changes.',
      'Text in backticks can hold ${...}, which is worked out and filled in. It is the same idea as a Python f-string. In ordinary quotes, ${...} is just characters.',
      "console.log is this language's print.",
    ],
    wild: 'Nearly every line of TypeScript you are handed starts with const. Backtick strings build the URLs, messages and class names.',
    prompt: 'What does this log? Two lines.',
    code: `const host = "web01";
let port = 8080;
port = port + 1;
const label = \`\${host}:\${port}\`;
console.log(label);
console.log(label.length);`,
    answer: 'web01:8081\n10',
    mistakes: [
      { answer: 'web01:8080\n10', why: 'port was reassigned on line 3, before label was built.' },
    ],
    variants: [
      {
        code: `const name = "ada";
let tries = 2;
tries += 1;
console.log(\`\${name.toUpperCase()} has \${tries} tries\`);
console.log("\${name} has \${tries} tries");`,
        answer: 'ADA has 3 tries\n${name} has ${tries} tries',
        mistakes: [
          { answer: 'ADA has 3 tries\nada has 3 tries', why: 'Only backticks fill in ${...}. In ordinary quotes it is just text.' },
        ],
        explain: 'The backtick string was filled in. The double-quoted one was printed exactly as written, which is a real and common slip.',
      },
    ],
    hints: ['port is 8081 by the time label is built.', 'Count the characters: five, a colon, four.'],
    explain: 'let allowed port to change. The backtick string then took the current value of each name.',
  },
  {
    id: 'tsb-2',
    world: 'ts-basics',
    title: 'Objects and arrays',
    kind: 'predict',
    concept: [
      'Curly braces make an object: named values, read with a dot, user.name. It plays the part a dict plays in Python.',
      'Square brackets make an array, the same thing as a Python list. push adds to the end and length is a property, not a function call.',
      'const stops the name from being reassigned. It does not freeze the object or array the name points at.',
    ],
    wild: 'Almost all data in a web app is objects holding arrays holding objects. Reading a chain of dots and brackets is the core skill.',
    prompt: 'What does this log? Four lines.',
    code: `const user = { name: "ada", roles: ["admin", "dev"] };
user.roles.push("ops");
console.log(user.name);
console.log(user.roles.length);
console.log(user.roles[0]);
console.log(user["name"] === user.name);`,
    answer: 'ada\n3\nadmin\ntrue',
    mistakes: [
      { answer: 'ada\n2\nadmin\ntrue', why: 'const stops user from being reassigned. It does not freeze what is inside, so push still adds an item.' },
    ],
    variants: [
      {
        code: `const ports = [22, 80, 443];
const copy = ports;
copy.push(8080);
console.log(ports.length);
console.log(ports[ports.length - 1]);
console.log(ports.includes(80));`,
        answer: '4\n8080\ntrue',
        mistakes: [
          { answer: '3\n443\ntrue', why: 'copy = ports does not copy the array. Both names point at the same one, exactly as with a Python list.' },
        ],
        explain: 'Two names, one array. The push through copy was visible through ports.',
      },
    ],
    hints: ['push changes the array in place.', 'user["name"] and user.name are two ways to read the same value.'],
    explain: 'The array inside the object grew to three. Dot and bracket access reached the same value, so === gave true.',
  },
  {
    id: 'tsb-3',
    world: 'ts-basics',
    title: 'What a type says',
    kind: 'read',
    concept: [
      'An interface describes the shape of an object: which names it has and what kind of value each holds. A colon after a name, f: Finding, claims that the value has that shape.',
      'A ? after a name means it may be missing. A | between types means "one of these". When the options are exact strings, only those strings are allowed.',
      'Types are checked in the editor and at build time, then removed. They are not there when the code runs.',
    ],
    wild: 'Read the types first. An interface at the top of a file is the author telling you exactly what data the code below works on.',
    prompt: 'Which statement about Finding is true?',
    code: `interface Finding {
  host: string;
  port: number;
  severity: "low" | "high";
  note?: string;
}

const f: Finding = { host: "web01", port: 443, severity: "high" };`,
    choices: [
      'note may be left out, and severity can only be the text "low" or "high".',
      'Every Finding must have a note.',
      'severity can be any string.',
      'The interface checks each object while the program runs.',
    ],
    correct: 0,
    whyNot: [
      '',
      'The ? after note marks it optional. f has no note and is still a valid Finding.',
      'It is a choice between two exact strings. "medium" would be rejected by the type checker.',
      'Types are erased before the code runs. The checking happens earlier, in the editor and the build.',
    ],
    hints: ['What does the ? do?', 'Look at what f leaves out.'],
    explain: 'The interface lists four names. Three are required, one is optional, and one is narrowed to two exact values. That is the whole contract for a Finding.',
  },
  {
    id: 'tsb-4',
    world: 'ts-basics',
    title: 'Equal, empty and missing',
    kind: 'predict',
    concept: [
      '=== asks whether two values are the same. It is the one to expect. A double == converts types first and is avoided.',
      'In a condition, 0, "", null and undefined count as false. Everything else counts as true, including an empty array.',
      'a || b gives b whenever a counts as false. a ?? b gives b only when a is null or undefined, so a real 0 or "" is kept.',
    ],
    wild: '|| and ?? are how defaults are supplied. Telling them apart matters whenever 0 or an empty string is a legitimate value.',
    prompt: 'What does this log? Four lines.',
    code: `const count = 0;
const name = "";
console.log(count === 0);
console.log("5" === String(5));
console.log(count ? "some" : "none");
console.log(name || "anonymous");`,
    answer: 'true\ntrue\nnone\nanonymous',
    mistakes: [
      { answer: 'true\nfalse\nnone\nanonymous', why: 'String(5) makes the text "5". Two equal strings compare as true.' },
    ],
    variants: [
      {
        code: `const items: string[] = [];
const opts: { limit?: number } = { limit: 0 };
console.log(items.length === 0);
console.log(items ? "yes" : "no");
console.log(opts.limit ?? 10);
console.log(opts.limit || 10);`,
        answer: 'true\nyes\n0\n10',
        mistakes: [
          { answer: 'true\nno\n0\n10', why: 'An empty array still counts as true. Only its length is 0.' },
          { answer: 'true\nyes\n10\n10', why: '?? only falls back on null or undefined. 0 is a real value, so it is kept.' },
        ],
        explain: 'The same 0 was kept by ?? and replaced by ||. That difference is the reason ?? exists.',
      },
    ],
    hints: ['condition ? a : b picks a when the condition counts as true.', 'An empty string counts as false.'],
    explain: '0 and "" both counted as false, so the fallback side was chosen each time.',
  },
  {
    id: 'tsf-1',
    world: 'ts-functions',
    title: 'Three ways to write a function',
    kind: 'predict',
    concept: [
      'function area(w: number): number is the long form: parameter types after each colon, the return type after the closing parenthesis.',
      'An arrow function is the short form. (n) => n * 2 takes n and returns n * 2. With curly braces after the arrow it becomes a full body and needs its own return.',
      'condition ? a : b is an inline if: a when the condition holds, b otherwise.',
    ],
    wild: 'Arrow functions are everywhere: as callbacks, as event handlers, and as components. If you can read both arrow forms you can read most of a file.',
    prompt: 'What does this log? Three lines.',
    code: `function area(w: number, h: number = 2): number {
  return w * h;
}
const double = (n: number) => n * 2;
const describe = (n: number): string => {
  const kind = n % 2 === 0 ? "even" : "odd";
  return \`\${n} is \${kind}\`;
};

console.log(area(3));
console.log(double(area(3, 5)));
console.log(describe(7));`,
    answer: '6\n30\n7 is odd',
    mistakes: [
      { answer: '3\n30\n7 is odd', why: 'With h left out, the default h = 2 is used, so the first call multiplies 3 by 2.' },
    ],
    variants: [
      {
        code: `const add = (a: number, b: number) => a + b;
const greet = (name: string, loud = false) => {
  const text = \`hi \${name}\`;
  return loud ? text.toUpperCase() : text;
};

console.log(add(2, 3) * 2);
console.log(greet("ada"));
console.log(greet("bo", true));`,
        answer: '10\nhi ada\nHI BO',
        mistakes: [
          { answer: '10\nHI ADA\nHI BO', why: 'loud defaults to false, so the first greet returns the text unchanged.' },
        ],
        explain: 'The one-line arrow returned its expression directly. The one with braces chose its return value with an inline if.',
      },
    ],
    hints: ['area(3, 5) is 15.', '7 % 2 is 1, so the condition is false.'],
    explain: 'All three are functions. The arrow forms differ only in whether the result is written directly or returned from a body.',
  },
  {
    id: 'tsf-2',
    world: 'ts-functions',
    title: 'Destructuring',
    kind: 'predict',
    concept: [
      'const { name, role } = user pulls two values out of an object into names of their own. It is shorthand for const name = user.name, and the same for role.',
      'Square brackets do it by position: const [first, second] = list. Three dots collect the remainder: const [head, ...tail] = list.',
      'A function can do it to its argument right in the parentheses: function label({ name, age }) takes one object and unpacks two values from it.',
    ],
    wild: 'This is the most common thing that makes unfamiliar TypeScript look strange. Every React component starts by destructuring its argument.',
    prompt: 'What does this log? Three lines.',
    code: `const user = { name: "ada", role: "admin", age: 36 };
const { name, role } = user;
const [first, second] = ["web", "db", "cache"];

function label({ name, age }: { name: string; age: number }) {
  return \`\${name} (\${age})\`;
}

console.log(name, role);
console.log(second);
console.log(label(user));`,
    answer: 'ada admin\ndb\nada (36)',
    mistakes: [
      { answer: 'ada admin\ncache\nada (36)', why: 'Array destructuring goes by position. second is the item at position 1.' },
    ],
    variants: [
      {
        code: `const point = { x: 3, y: 4 };
const { x, y: height } = point;
const [head, ...tail] = [10, 20, 30];

console.log(x + height);
console.log(head);
console.log(tail.length);`,
        answer: '7\n10\n2',
        mistakes: [
          { answer: '7\n10\n3', why: '...tail collects what is left after head, which is two items.' },
        ],
        explain: 'y: height read the value of y and stored it under the name height. The three dots gathered everything after the first item.',
      },
    ],
    hints: ['console.log with two values puts a space between them.', 'label takes the whole user object and uses two parts of it.'],
    explain: 'Curly braces unpacked by name, square brackets by position, and the function did its unpacking in its own parameter list.',
  },
  {
    id: 'tsf-3',
    world: 'ts-functions',
    title: 'The three dots',
    kind: 'predict',
    concept: [
      'Inside a new object or array, ...thing spreads the contents of thing out into it. { ...base, port: 443 } is a copy of base with port replaced.',
      'Later entries win. That is how defaults and overrides are merged: { ...defaults, ...options }.',
      'In a parameter list the dots do the reverse and gather: (...nums) collects every argument into one array.',
    ],
    wild: 'Spreading is how modern code changes data without modifying the original. When you see it, a new object is being made and the old one is left alone.',
    prompt: 'What does this log? Three lines.',
    code: `const base = { host: "web01", port: 80 };
const secure = { ...base, port: 443 };
const ports = [22, ...[80, 443]];

console.log(base.port);
console.log(secure.host, secure.port);
console.log(ports.length);`,
    answer: '80\nweb01 443\n3',
    mistakes: [
      { answer: '443\nweb01 443\n3', why: 'The spread copied base into a new object. Setting port there left base alone.' },
    ],
    variants: [
      {
        code: `const defaults = { retries: 3, verbose: false };
const options = { verbose: true };
const config = { ...defaults, ...options };
const total = (...nums: number[]) => nums.length;

console.log(config.retries, config.verbose);
console.log(defaults.verbose);
console.log(total(4, 5, 6));`,
        answer: '3 true\nfalse\n3',
        mistakes: [
          { answer: '3 false\nfalse\n3', why: 'options is spread after defaults, so its verbose wins.' },
        ],
        explain: 'config took retries from defaults and verbose from options, because the later spread overrides the earlier one. defaults itself never changed.',
      },
    ],
    hints: ['secure is a new object.', 'The inner array is spread into the outer one.'],
    explain: 'base kept port 80. secure got a copy of host and its own port. The array spread flattened two items into the outer list.',
  },
  {
    id: 'tsf-4',
    world: 'ts-functions',
    title: 'Passing a function along',
    kind: 'read',
    concept: [
      'A function is a value. It can be handed to another function, which decides when and how often to call it. A function passed this way is called a callback.',
      'The type () => boolean reads as "a function that takes nothing and gives back true or false".',
      '() => ping("web01") does not call ping. It makes a small function that will call ping when someone calls it.',
    ],
    wild: 'Event handlers, timers, retries, and every map and filter take a callback. The question to ask is always: who calls this, and when?',
    prompt: 'What is () => ping("web01") doing on the last line?',
    code: `declare function ping(host: string): boolean;

function retry(action: () => boolean, times: number): boolean {
  for (let i = 0; i < times; i++) {
    if (action()) return true;
  }
  return false;
}

const ok = retry(() => ping("web01"), 3);`,
    choices: [
      'It hands retry a function to call later, up to three times.',
      'It calls ping once and passes the result to retry.',
      'It defines ping.',
      'It runs ping three times before retry starts.',
    ],
    correct: 0,
    whyNot: [
      '',
      'Without the () => in front it would. The arrow wraps the call so that nothing runs until retry calls action().',
      'ping is defined somewhere else. The first line only declares that it exists. This arrow wraps a call to it.',
      'Nothing on that line runs except the call to retry. The loop inside retry decides how many times.',
    ],
    hints: ['Where is the pair of parentheses that actually calls it?', 'action() inside the loop.'],
    explain: 'retry received a function and called it itself, stopping at the first true. The caller chose what to try. retry chose how many times.',
  },
  {
    id: 'tsd-1',
    world: 'ts-data',
    title: 'filter and map',
    kind: 'predict',
    concept: [
      'filter keeps the items for which the callback gives true. map turns each item into something else. Both build a new array and leave the original alone.',
      'They are the same idea as a Python comprehension, split in two: filter is the if part, map is the part before for.',
      'They chain. users.filter(...).map(...) reads left to right: narrow down first, then transform.',
    ],
    wild: 'You will almost never see a for loop building a list in modern TypeScript. You will see chains of these.',
    prompt: 'What does this log? Four lines.',
    code: `const ports = [22, 80, 443, 8080];
const high = ports.filter((p) => p > 100);
const labels = ports.map((p) => \`tcp/\${p}\`);

console.log(high.length);
console.log(labels[0]);
console.log(ports.length);
console.log(high.join(","));`,
    answer: '2\ntcp/22\n4\n443,8080',
    mistakes: [
      { answer: '2\ntcp/22\n2\n443,8080', why: 'filter builds a new array. ports still has all four.' },
    ],
    variants: [
      {
        code: `const users = [
  { name: "ada", admin: true },
  { name: "bo", admin: false },
  { name: "cy", admin: true },
];
const admins = users.filter((u) => u.admin).map((u) => u.name);
const found = users.find((u) => u.name === "bo");

console.log(admins.join(" "));
console.log(found?.admin);
console.log(users.some((u) => u.name === "di"));`,
        answer: 'ada cy\nfalse\nfalse',
        mistakes: [
          { answer: 'ada cy\nundefined\nfalse', why: "find did locate bo. The value of bo's admin is false, and that is what is logged." },
        ],
        explain: 'filter then map produced the admin names. find returned one whole object, and some answered a yes/no question about the list.',
      },
    ],
    hints: ['Two ports are above 100.', 'labels has the same number of items as ports.'],
    explain: 'filter narrowed four ports to two. map produced four labels. ports itself was never changed.',
  },
  {
    id: 'tsd-2',
    world: 'ts-data',
    title: 'Values that might be missing',
    kind: 'predict',
    concept: [
      'a?.b means "read b, unless a is missing, in which case give undefined instead of crashing". It is called optional chaining.',
      'undefined is what you get for something that is not there. null is a deliberate "nothing". Python uses None for both.',
      '?? supplies a fallback for either: value ?? "unknown".',
    ],
    wild: 'Data from a server is full of optional parts. ?. and ?? together are how code reads it without a wall of if statements.',
    prompt: 'What does this log? Four lines.',
    code: `type User = { name: string; address?: { city: string } };
const a: User = { name: "ada", address: { city: "Paris" } };
const b: User = { name: "bo" };

console.log(a.address?.city);
console.log(b.address?.city);
console.log(b.address?.city ?? "unknown");
console.log(a.name.length);`,
    answer: 'Paris\nundefined\nunknown\n3',
    mistakes: [
      { answer: 'Paris\nunknown\nunknown\n3', why: 'The fallback only appears where ?? is written. Line 6 has none, so it logs undefined.' },
    ],
    variants: [
      {
        code: `const settings: { theme?: string; retries?: number } = { retries: 0 };

console.log(settings.theme ?? "dark");
console.log(settings.retries ?? 3);
console.log(settings.theme?.toUpperCase());
console.log(settings.retries || 3);`,
        answer: 'dark\n0\nundefined\n3',
        mistakes: [
          { answer: 'dark\n3\nundefined\n3', why: 'retries is 0, which is a real value. ?? keeps it. Only || treats 0 as missing.' },
        ],
        explain: 'theme was missing, so ?? supplied a value and ?. skipped the method call. retries was present and 0, which ?? respected and || did not.',
      },
    ],
    hints: ['b has no address at all.', '?. stops and gives undefined.'],
    explain: 'For a the chain reached the city. For b it stopped at the missing address and gave undefined, which ?? then replaced.',
  },
  {
    id: 'tsd-3',
    world: 'ts-data',
    title: 'Changing without changing',
    kind: 'read',
    concept: [
      'A common pattern returns a new array in which one item is replaced by a changed copy, and everything else is passed through as it was.',
      'The pieces: map visits every item, the inline if picks out the one that matches, and { ...t, done: !t.done } builds a copy with one value flipped.',
    ],
    wild: 'This exact shape is how React apps update lists. The original data is never modified, which is what lets the page know something changed.',
    prompt: 'What does toggle do to the array it is given?',
    code: `type Todo = { id: number; text: string; done: boolean };

function toggle(todos: Todo[], id: number): Todo[] {
  return todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
}`,
    choices: [
      'Nothing. It returns a new array in which the matching item is replaced by a changed copy.',
      'It flips done on the matching item in place.',
      'It removes the matching item.',
      'It flips done on every item.',
    ],
    correct: 0,
    whyNot: [
      '',
      'The matching item is rebuilt as a new object. The original t is never assigned to.',
      'map always returns the same number of items. filter is the one that drops them.',
      'Only the item whose id matches takes the first branch. The rest are passed through as t.',
    ],
    hints: ['Does anything on the right-hand side assign to t?', 'What does the part after the colon return?'],
    explain: 'Every item was visited. One came back as a fresh copy with done flipped, the others came back untouched, and the input array was left as it was.',
  },
  {
    id: 'tsd-4',
    world: 'ts-data',
    title: 'Tallies and totals',
    kind: 'predict',
    concept: [
      'Record<string, number> is the type for an object used as a lookup table: text keys, number values. It is the nearest thing to a Python dict of counts.',
      'for (const h of hits) walks an array item by item. counts[h] = (counts[h] ?? 0) + 1 is the counting line: one more for this key, starting from zero.',
      'reduce boils an array down to one value. (sum, n) => sum + n with a starting value of 0 adds everything up.',
    ],
    wild: 'Grouping and counting records is routine in any dashboard or report. reduce looks cryptic until you read it as "carry a running result through the list".',
    prompt: 'What does this log? Three lines.',
    code: `const hits = ["a", "b", "a", "c", "a"];
const counts: Record<string, number> = {};
for (const h of hits) {
  counts[h] = (counts[h] ?? 0) + 1;
}
const total = [5, 10, 20].reduce((sum, n) => sum + n, 0);

console.log(counts.a);
console.log(Object.keys(counts).length);
console.log(total);`,
    answer: '3\n3\n35',
    mistakes: [
      { answer: '3\n5\n35', why: 'There are five hits but only three different keys. Repeats add to a count instead of adding a key.' },
    ],
    variants: [
      {
        code: `const sizes: Record<string, number> = { a: 4, b: 9 };
sizes.c = 1;
let biggest = "";
for (const [name, size] of Object.entries(sizes)) {
  if (size > (sizes[biggest] ?? 0)) biggest = name;
}

console.log(Object.keys(sizes).join(""));
console.log(biggest);
console.log(Object.values(sizes).reduce((s, n) => s + n, 0));`,
        answer: 'abc\nb\n14',
        mistakes: [
          { answer: 'abc\nc\n14', why: 'biggest is replaced only when a size beats the current best. c has size 1, which does not beat 9.' },
        ],
        explain: 'Object.entries gave name and size pairs to loop over. The loop is a best-so-far, and reduce added up the values.',
      },
    ],
    hints: ['a appears three times.', '5 + 10 + 20.'],
    explain: 'The loop built a tally with three keys. reduce carried a running sum through the second array.',
  },
  {
    id: 'tsa-1',
    world: 'ts-async',
    title: 'async and await',
    kind: 'predict',
    concept: [
      'Some work takes time: a network request, a file, a timer. A function marked async can wait for such work. Calling it gives back a promise, a placeholder for a result that is not ready yet.',
      'await pauses the function it is in until the promise is ready, then gives the value inside. Code after the await runs only once the wait is over.',
      'Calling an async function without await does not wait. The caller carries straight on.',
    ],
    wild: 'Anything that talks to a server is async. A forgotten await is one of the most common real bugs, and it shows up as things happening in the wrong order.',
    prompt: 'What does this log? Three lines.',
    code: `function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function load() {
  console.log("start");
  await wait(10);
  console.log("loaded");
  return 42;
}

const value = await load();
console.log(value);`,
    answer: 'start\nloaded\n42',
    mistakes: [
      { answer: 'start\n42\nloaded', why: 'await pauses load until the wait is over, and the outer await pauses until load has finished.' },
    ],
    variants: [
      {
        code: `function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function save() {
  await wait(10);
  console.log("saved");
}

save();
console.log("next line");`,
        answer: 'next line\nsaved',
        mistakes: [
          { answer: 'saved\nnext line', why: 'save() was called without await, so the code carried on at once. saved arrives 10 milliseconds later.' },
        ],
        explain: 'With no await in front of the call, nothing waited for save. That is the bug to look for when output arrives out of order.',
      },
    ],
    hints: ['Each await finishes before the next line runs.', 'load returns 42 only at its end.'],
    explain: 'Every step was awaited, so the lines ran in the order they are written.',
  },
  {
    id: 'tsa-2',
    world: 'ts-async',
    title: 'When waiting fails',
    kind: 'predict',
    concept: [
      'An async function that throws does not crash on the spot. The failure travels to whoever is awaiting it.',
      'try, catch and finally work around await the way try, except and finally do in Python. A failed await jumps to catch. finally runs either way.',
    ],
    wild: 'Every request to a server can fail. Read the catch block to learn what the app does when it does, because often the answer is "nothing".',
    prompt: 'What does this log? Four lines.',
    code: `async function fetchUser(id: number): Promise<string> {
  if (id < 0) throw new Error("bad id");
  return \`user\${id}\`;
}

async function show(id: number) {
  try {
    const name = await fetchUser(id);
    console.log(name);
  } catch (err) {
    console.log("failed:", (err as Error).message);
  } finally {
    console.log("done");
  }
}

await show(7);
await show(-1);`,
    answer: 'user7\ndone\nfailed: bad id\ndone',
    mistakes: [
      { answer: 'user7\nfailed: bad id\ndone', why: 'finally runs after every call to show, including the one that worked.' },
    ],
    variants: [
      {
        code: `async function size(name: string): Promise<number> {
  return name.length;
}

const sizes = await Promise.all([size("web"), size("cache")]);
console.log(sizes.length);
console.log(sizes[1]);

const pending = size("db");
console.log(typeof pending);
console.log(await pending);`,
        answer: '2\n5\nobject\n2',
        mistakes: [
          { answer: '2\n5\nnumber\n2', why: 'Without await, an async function hands back a promise, not the value inside it.' },
        ],
        explain: 'Promise.all waited for both and gave their results in order. The un-awaited call gave a promise, which only became a number once awaited.',
      },
    ],
    hints: ['The first call succeeds, the second throws.', 'finally runs both times.'],
    explain: 'The first call logged the name. The second threw inside fetchUser, and the await handed that failure to catch. finally ran after each.',
  },
  {
    id: 'tsa-3',
    world: 'ts-async',
    title: 'Reading a request',
    kind: 'read',
    concept: [
      'fetch(url) asks a server for something and gives a promise of the response. res.ok is true for a success status. res.json() reads the body as data, and is itself awaited.',
      'A return type such as Promise<number | null> reads as: eventually a number, or null when there is none to give.',
    ],
    wild: 'This is the standard shape of a function that calls an API. Find the two ways it can fail, a thrown error and a bad status, and see what each one returns.',
    prompt: 'When does getStatus give null?',
    code: `async function getStatus(url: string): Promise<number | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const body = await res.json();
    return body.status;
  } catch {
    return null;
  }
}`,
    choices: [
      'When the request fails outright, or the server answers with an error status.',
      'Only when the network is down.',
      'Never. It always gives a number.',
      'When the caller forgets to await it.',
    ],
    correct: 0,
    whyNot: [
      '',
      'That is the catch branch. The if (!res.ok) line also returns null, for answers such as 404 or 500.',
      'The return type says number | null, and two lines return null.',
      'Without await the caller gets a promise. The function itself behaves the same either way.',
    ],
    hints: ['There are two return null lines.', 'A 404 does not throw. It arrives as a response with ok set to false.'],
    explain: 'A thrown error lands in catch. A response with a bad status is caught by the if. Both paths give null, so the caller cannot tell them apart.',
  },
  {
    id: 'tsm-1',
    world: 'ts-modules',
    title: 'Where an import comes from',
    kind: 'locate',
    concept: [
      "Each file is a module. export makes a name available to other files, and import brings it in. Names in curly braces are named exports. A name outside the braces is the file's one default export.",
      'The text after from says where to look. Starting with ./ or ../ means a file in this project. A bare name such as "react" means an installed package in node_modules.',
    ],
    wild: "The imports at the top of a file are a map. They tell you which names are the project's own code, which you can open and read, and which are someone else's.",
    prompt: 'Where do formatPort and useState come from?',
    fileName: 'main.ts',
    code: `import formatPort, { isValidPort } from "./ports";
import { useState } from "react";

console.log(formatPort(443), isValidPort(70000), useState);`,
    files: [
      { name: 'ports.ts', code: `export function isValidPort(p: number): boolean {
  return p >= 1 && p <= 65535;
}

export default function formatPort(p: number): string {
  return \`tcp/\${p}\`;
}` },
    ],
    choices: [
      'formatPort is the default export of ports.ts in this project. useState comes from the react package.',
      'Both come from ports.ts.',
      'Both are built into the language.',
      'formatPort comes from a package called ports.',
    ],
    correct: 0,
    whyNot: [
      '',
      'ports.ts exports two functions and neither is useState. A path with no ./ in front names an installed package.',
      'Nothing imported is built in. Each import line names the file or package it comes from.',
      'The ./ in front makes it a file next to this one. A bare name with no ./ would be a package.',
    ],
    hints: ['Look at what follows the word from on each line.', 'Which function in ports.ts has the word default?'],
    explain: './ports is a neighbor file, and the name outside the braces takes its default export. react has no ./, so it is a package that npm installed.',
  },
  {
    id: 'tsm-2',
    world: 'ts-modules',
    title: 'What a project depends on',
    kind: 'read',
    concept: [
      'package.json lists every outside package a project uses. npm install reads it and downloads them into node_modules.',
      'dependencies are needed by the running app. devDependencies are needed only to build, check and test it.',
    ],
    wild: 'This file is the supply chain. Before trusting a project, read what it pulls in. It is the same job requirements.txt does for Python.',
    prompt: 'What is the difference between the two lists?',
    fileName: 'package.json',
    code: `{
  "dependencies": {
    "react": "^19.2.8",
    "lucide-react": "^1.28.0"
  },
  "devDependencies": {
    "typescript": "~5.9.0",
    "vite": "^8.2.0"
  }
}`,
    choices: [
      'dependencies ship with the running app. devDependencies are tools used only to build and check it.',
      'devDependencies are optional and can be deleted safely.',
      'dependencies are written by this project, devDependencies by others.',
      'There is no difference. It is only for tidiness.',
    ],
    correct: 0,
    whyNot: [
      '',
      'Without typescript and vite the project cannot be built at all. They are required, only not while the app runs.',
      "Both lists are other people's code, fetched by npm install.",
      'Build tools keep them apart. What is in devDependencies does not end up in what users download.',
    ],
    hints: ['Is TypeScript needed in the browser?', 'Think about what a visitor to the site actually downloads.'],
    explain: "react is in the page a visitor loads. typescript and vite did their work before that and stay behind on the developer's machine.",
  },
  {
    id: 'tsm-3',
    world: 'ts-modules',
    title: 'Angle brackets',
    kind: 'read',
    concept: [
      'A name in angle brackets after a function name, firstOr<T>, is a type placeholder. It lets one function work for many types while still insisting that they line up.',
      'T is filled in per call, usually worked out from the arguments. You will also see it on types themselves: Promise<number>, Record<string, number>, Array<string>.',
    ],
    wild: 'Generics look intimidating and say something simple: "whatever goes in here comes out there". Read T as "some type, the same one each time it appears".',
    prompt: 'What is the <T> for?',
    code: `function firstOr<T>(items: T[], fallback: T): T {
  return items.length > 0 ? items[0] : fallback;
}

const port = firstOr([443, 80], 0);
const name = firstOr<string>([], "none");`,
    choices: [
      'It is a placeholder for a type. Whatever the array holds, the fallback and the result must be the same kind of thing.',
      'It makes the function work only on text.',
      'It converts the items to type T.',
      'It is a variable holding the first item.',
    ],
    correct: 0,
    whyNot: [
      '',
      'T is filled in per call. Here it is number in the first call and string in the second.',
      'Nothing is converted. Types describe values and are erased before the code runs.',
      'T never holds a value. It only appears where types are written: after colons and inside angle brackets.',
    ],
    hints: ['Where does T appear in the parameter list?', 'What is T in each of the two calls?'],
    explain: 'T tied the three positions together. An array of numbers needs a number fallback and gives a number back, and the same holds for strings.',
  },
  {
    id: 'tsm-4',
    world: 'ts-modules',
    title: 'One of several shapes',
    kind: 'predict',
    concept: [
      'A type can be a choice between shapes: { ok: true; value: number } | { ok: false; error: string }. A value is one or the other, never a mix.',
      'An if that tests the shared field tells the checker which shape it is holding. Inside if (r.ok), r.value exists. After it, r.error does. This is called narrowing.',
    ],
    wild: 'Results that can succeed or fail, and messages that come in several kinds, are modeled this way. The if or switch on the shared field is where the code branches.',
    prompt: 'What does this log? Two lines.',
    code: `type Result = { ok: true; value: number } | { ok: false; error: string };

function describe(r: Result): string {
  if (r.ok) {
    return \`got \${r.value}\`;
  }
  return \`failed: \${r.error}\`;
}

console.log(describe({ ok: true, value: 7 }));
console.log(describe({ ok: false, error: "timeout" }));`,
    answer: 'got 7\nfailed: timeout',
    mistakes: [
      { answer: 'got 7\ngot undefined', why: 'The second value has ok set to false, so the if is skipped and the last line runs.' },
    ],
    variants: [
      {
        code: `function size(input: string | string[] | null): number {
  if (input === null) return 0;
  if (typeof input === "string") return input.length;
  return input.length * 10;
}

console.log(size("abc"));
console.log(size(["a", "b"]));
console.log(size(null));`,
        answer: '3\n20\n0',
        mistakes: [
          { answer: '3\n2\n0', why: 'An array gets past both ifs and reaches the last line, which multiplies its length by 10.' },
        ],
        explain: 'Each if ruled out one possibility. By the last line only the array was left, which is why the same .length meant something different there.',
      },
    ],
    hints: ['Which branch does ok: true take?', 'The second call skips the if.'],
    explain: 'The ok field decided the branch, and each branch could safely read the field that only its shape has.',
  },
  {
    id: 'tsr-1',
    world: 'ts-react',
    title: 'A component is a function',
    kind: 'read',
    concept: [
      'A React component is a function that returns markup. The markup, called JSX, looks like HTML written inside the code.',
      'Using the component as a tag, <Badge label="Open" />, calls the function. The attributes arrive together as one object, called props, which the function usually destructures in its parameter list.',
      'Inside JSX, curly braces mean "put the value of this here".',
    ],
    wild: 'A React app is components all the way down. To read one, find what it is given (its props) and what it returns.',
    prompt: 'What does <Badge label="Open" count={3} /> put on the page?',
    fileName: 'Badge.tsx',
    code: `interface BadgeProps {
  label: string;
  count?: number;
}

export function Badge({ label, count = 0 }: BadgeProps) {
  return (
    <span className="badge">
      {label}: {count}
    </span>
  );
}`,
    choices: [
      "A span reading \"Open: 3\". The attributes arrive as the function's argument.",
      'Nothing, until Badge is called by hand.',
      'A span reading "label: count".',
      'An error, because count is optional.',
    ],
    correct: 0,
    whyNot: [
      '',
      'Writing the tag is the call. React runs the function and uses what it returns.',
      'Curly braces in the markup mean "put this value here", so the values appear, not the names.',
      'Optional means it may be left out. Here it is given, and when it is not, count = 0 supplies a default.',
    ],
    hints: ['What are label and count for this tag?', 'The colon between the braces is ordinary text.'],
    explain: "The tag's attributes became { label: \"Open\", count: 3 }. The function unpacked them and returned a span with both values filled in.",
  },
  {
    id: 'tsr-2',
    world: 'ts-react',
    title: 'State',
    kind: 'read',
    concept: [
      'useState gives a component a value that it remembers between draws. It returns a pair: the current value, and a function to change it.',
      'Calling the setter does two things. It stores the new value, and it asks React to run the component function again so the page matches.',
      'onClick={...} attaches a function to run when the button is clicked. It is a callback, like any other.',
    ],
    wild: 'When something on a page changes, a setter was called somewhere. Finding which one, and what calls it, is how you trace any behavior in a React app.',
    prompt: 'What happens when the button is clicked?',
    fileName: 'Counter.tsx',
    code: `import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
}`,
    choices: [
      'setCount stores the new number, React runs Counter again, and the button shows the new count.',
      'count is changed directly and the text updates by itself.',
      'The whole page reloads.',
      'Nothing, because useState(0) sets it back to 0 each time.',
    ],
    correct: 0,
    whyNot: [
      '',
      'count is a const and is never assigned. The only way to change it is setCount, which asks React to run the function again.',
      'Only this component is run again. Nothing else on the page is touched.',
      'The 0 is only the starting value, used the first time. On later runs useState hands back whatever was stored last.',
    ],
    hints: ['What does the arrow in onClick call?', 'What does React do after a setter is called?'],
    explain: 'Each click called setCount with one more than the current count. React ran Counter again, useState returned the stored number, and the new markup showed it.',
  },
  {
    id: 'tsr-3',
    world: 'ts-react',
    title: 'Lists and conditions',
    kind: 'read',
    concept: [
      'A component can return early. An if at the top that returns different markup is how "nothing to show" cases are handled.',
      'A list is drawn by mapping an array to markup: one element per item. Each needs a key, a unique label React uses to keep track of which is which. The key is never displayed.',
    ],
    wild: 'Nearly every screen is some list drawn this way, with an empty case above it. The map tells you what one row looks like.',
    prompt: 'What does this show when findings has three items?',
    fileName: 'FindingList.tsx',
    code: `interface Finding {
  id: number;
  host: string;
}

export function FindingList({ findings }: { findings: Finding[] }) {
  if (findings.length === 0) {
    return <p>No findings.</p>;
  }

  return (
    <ul>
      {findings.map((f) => (
        <li key={f.id}>{f.host}</li>
      ))}
    </ul>
  );
}`,
    choices: [
      'A list with three entries, one host in each.',
      '"No findings." followed by the list.',
      'One entry holding all three hosts.',
      'Three entries showing the id numbers.',
    ],
    correct: 0,
    whyNot: [
      '',
      'A return ends the function, and the first one only runs when the array is empty.',
      'map runs once per item and returns one <li> each time.',
      'key={f.id} is a label for React to tell the entries apart. It is not displayed. The text shown is {f.host}.',
    ],
    hints: ['Is the length 0?', 'What is between <li> and </li>?'],
    explain: 'The empty check was skipped. map produced three list items, each showing a host, with the id used only as the key.',
  },
  {
    id: 'tsr-4',
    world: 'ts-react',
    title: 'Effects',
    kind: 'read',
    concept: [
      'useEffect is for work that reaches outside the component: fetching data, timers, subscriptions. It runs after the component is on screen.',
      'The array at the end controls when it runs again. [host] means "the first time, and whenever host changes". An empty [] means the first time only.',
      'A function returned from the effect is the cleanup. React calls it before the effect runs again, and when the component goes away.',
    ],
    wild: 'Data loading in a React app usually lives in an effect. The dependency array is where bugs hide: it decides whether the data is refetched when it should be.',
    prompt: 'When does the code inside useEffect run?',
    fileName: 'StatusLine.tsx',
    code: `import { useEffect, useState } from "react";

export function StatusLine({ host }: { host: string }) {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let cancelled = false;
    fetch(\`/api/status/\${host}\`)
      .then((res) => res.text())
      .then((text) => {
        if (!cancelled) setStatus(text);
      });
    return () => {
      cancelled = true;
    };
  }, [host]);

  return (
    <p>
      {host}: {status}
    </p>
  );
}`,
    choices: [
      'After the component first appears, and again whenever host changes.',
      'Every time the component is drawn.',
      'Only once, ever.',
      'Before anything is shown, so the page waits for the fetch.',
    ],
    correct: 0,
    whyNot: [
      '',
      'That is what happens with no array at all. [host] limits it to the first time and to changes of host.',
      'That would be an empty array. With host listed, a new host triggers it again.',
      'Effects run after the component is on screen. That is why it shows "checking" first.',
    ],
    hints: ['Look at the array on the line that closes useEffect.', 'What does the component show before the fetch finishes?'],
    explain: 'The component drew with "checking", then the effect fetched the status and stored it, which drew it again. The cancelled flag stops a slow answer for an old host from overwriting a newer one.',
  },
  {
    id: 'tsr-5',
    world: 'ts-react',
    title: 'Passing a function down',
    kind: 'read',
    concept: [
      'Data flows down through props. To send something back up, a parent passes a function down, and the child calls it.',
      'A prop typed (text: string) => void is "a function I may call with some text". By convention such props are named on-something.',
    ],
    wild: 'When a button deep in the page changes something at the top, this is the path it took. Follow the on-something prop upward to find where the state really lives.',
    prompt: 'How does what you type end up after "Searching for:"?',
    fileName: 'Page.tsx',
    code: `import { useState } from "react";

function SearchBox({ onSearch }: { onSearch: (text: string) => void }) {
  const [text, setText] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(text);
      }}
    >
      <input value={text} onChange={(e) => setText(e.target.value)} />
    </form>
  );
}

export function Page() {
  const [query, setQuery] = useState("");
  return (
    <div>
      <SearchBox onSearch={setQuery} />
      <p>Searching for: {query}</p>
    </div>
  );
}`,
    choices: [
      "SearchBox keeps the text as you type. On submit it calls onSearch, which is Page's setQuery, and Page redraws with the new query.",
      'SearchBox changes query directly.',
      'Page reads the input box each time it draws.',
      'It updates on every keystroke.',
    ],
    correct: 0,
    whyNot: [
      '',
      'SearchBox never sees query. It is only given a function to call.',
      'Page has no access to the input. The value reaches it only when onSearch is called.',
      'Each keystroke updates text inside SearchBox. query changes only on submit.',
    ],
    hints: ['What is passed as onSearch?', 'Which state changes on each keystroke, and which on submit?'],
    explain: 'There are two pieces of state. text lives in SearchBox and follows the keyboard. query lives in Page and changes only when SearchBox calls the function it was handed.',
  },
];
