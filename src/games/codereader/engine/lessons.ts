import type { Lesson, Stage } from './types';

/*
 * The course, in the order it is taught. Regions are anchored by text, and
 * `resolve` in course.ts fails loudly on any anchor that does not match exactly
 * one line, so an edit to a snippet cannot silently move a label. Every snippet
 * is parsed by the real language tools in `npm run verify:levels`.
 */
export const STAGES: Stage[] = [
  {
    id: 'file',
    title: 'What a file is',
    blurb: 'Lines, values and blocks.',
    canNow: 'You can tell comments, values and instructions apart in any Python file.',
  },
  {
    id: 'func',
    title: 'Anatomy of a function',
    blurb: 'Signature, body, return, call.',
    canNow: "You can read a function's first line and say what it needs and what it gives back.",
  },
  {
    id: 'data',
    title: 'Data',
    blurb: 'Lists, dicts and getting values out of them.',
    canNow: 'You can follow a value through lists and dicts, including nested ones.',
  },
  {
    id: 'script',
    title: 'The shape of a script',
    blurb: 'Imports, settings, functions, entry point.',
    canNow: 'You can open a Python script and point to its imports, its settings, its functions and where it starts.',
  },
  {
    id: 'start',
    title: 'Where to start reading',
    blurb: 'An order for reading any file.',
    canNow: 'You can read any file in a set order: imports, entry point, names, one value, bodies.',
  },
  {
    id: 'errors',
    title: 'When things go wrong',
    blurb: 'try, except, raise, and silent failure.',
    canNow: 'You can see what a function does when something fails, not only when it works.',
  },
  {
    id: 'classes',
    title: 'Classes and objects',
    blurb: 'What an object carries and what it can do.',
    canNow: 'You can read a class: what each object carries, and what it can do.',
  },
  {
    id: 'files',
    title: 'Across files',
    blurb: 'Following a name to where it is defined.',
    canNow: 'You can follow a name from the file that uses it to the file that defines it.',
  },
  {
    id: 'ts',
    title: 'TypeScript shapes',
    blurb: 'The same ideas in the other language.',
    canNow: 'You can read a TypeScript function: its types, its arguments and what it returns.',
  },
  {
    id: 'react',
    title: 'A React component',
    blurb: 'What it is given, remembers and shows.',
    canNow: 'You can read a component: what it is given, what it remembers and what it shows.',
  },
  {
    id: 'input',
    title: 'Following untrusted input',
    blurb: 'From where an outsider controls it to where it lands.',
    canNow: 'You can trace a value from where an outsider controls it to where it can do damage.',
  },
  {
    id: 'whole',
    title: 'Whole files',
    blurb: 'No walkthrough. Find your own way.',
    canNow: 'You can open an unfamiliar file, find your way around it and say what deserves a closer look.',
  },
];

export const LESSONS: Lesson[] = [
  {
    id: 'file-1',
    stage: 'file',
    title: 'Lines, top to bottom',
    lang: 'python',
    fileName: 'status.py',
    tour: true,
    intro: [
      'A code file is a list of instructions. Python carries them out one at a time, from the first line to the last.',
      'Every line here is one of a few kinds of thing. This lesson names them.',
    ],
    code: `# Report how many hosts are up.
hosts = ["web01", "db01", "cache01"]
up = 2
total = len(hosts)
print(f"{up} of {total} hosts are up")`,
    regions: [
      {
        id: 'comment',
        kind: 'Comment',
        term: 'comment',
        at: '# Report how',
        note: 'A note to the reader. Python skips it. Comments say why the code exists, so read them first.',
      },
      {
        id: 'assign',
        kind: 'Assignment',
        term: 'assignment',
        at: 'up = 2',
        note: 'Makes the name up stand for the number 2. From here on, wherever up appears, read 2.',
      },
      {
        id: 'var',
        kind: 'Variable',
        term: 'variable',
        at: 'hosts = [',
        token: 'hosts',
        note: 'hosts is a name chosen by the author. It now stands for the list on the right of the = sign.',
      },
      {
        id: 'list',
        kind: 'List',
        term: 'list',
        at: 'hosts = [',
        token: '["web01", "db01", "cache01"]',
        note: 'Three pieces of text, in order, inside square brackets.',
      },
      {
        id: 'call',
        kind: 'Call',
        term: 'call',
        at: 'total = len',
        token: 'len(hosts)',
        note: 'len is a function that ships with Python. The parentheses run it on hosts, and it gives back 3.',
      },
      {
        id: 'fstr',
        kind: 'Formatted string',
        term: 'fstring',
        at: 'print(f"',
        token: 'f"{up} of {total} hosts are up"',
        note: 'The f in front means the braces get filled in: {up} becomes 2 and {total} becomes 3.',
      },
      {
        id: 'stmt',
        kind: 'Statement',
        term: 'statement',
        at: 'print(f"',
        note: 'One instruction: show this text on screen. It is the only line here with an effect you can see.',
      },
    ],
    steps: [
      {
        kind: 'find',
        prompt: 'Click the line that Python ignores.',
        target: 'comment',
        miss: 'Look for the line that starts with #.',
      },
      {
        kind: 'name',
        region: 'var',
        choices: [
          { text: 'A variable', why: '' },
          { text: 'A function', why: 'A function is followed by parentheses when it is used. hosts is followed by =, so it is a name being given a value.' },
          { text: 'A string', why: 'A string is text inside quotes. hosts has no quotes around it.' },
        ],
      },
      {
        kind: 'name',
        region: 'call',
        choices: [
          { text: 'A call', why: '' },
          { text: 'A variable', why: 'len is a name, but the parentheses after it mean "run this". That makes the whole thing a call.' },
          { text: 'A list', why: 'A list is written in square brackets. These are parentheses.' },
        ],
      },
      {
        kind: 'ask',
        prompt: 'Which line puts something on the screen?',
        choices: [
          { text: 'The last line, with print.', why: '' },
          { text: 'The line total = len(hosts).', why: 'That line works something out and stores it. Nothing is shown until print runs.' },
          { text: 'Every line shows its value.', why: 'Assignments are silent. Only a call such as print produces output.' },
        ],
      },
    ],
    takeaway: 'Four of these five lines only give names to values. One line does something visible. Most code has that proportion: a lot of naming, a little doing.',
  },
  {
    id: 'file-2',
    stage: 'file',
    title: 'Kinds of value',
    lang: 'python',
    fileName: 'settings.py',
    tour: true,
    intro: [
      'Every value has a kind, and you can tell the kind from how it is written. Recognizing them on sight is most of what makes a line readable.',
    ],
    code: `name = "scanner"
port = 8080
timeout = 2.5
verbose = False
last_error = None
target = {"host": "web01", "port": port}`,
    regions: [
      {
        id: 'str',
        kind: 'String',
        term: 'string',
        at: 'name = ',
        token: '"scanner"',
        note: 'Text. The quotes are the marker and are not part of the value.',
      },
      {
        id: 'int',
        kind: 'Number',
        term: 'number',
        at: 'port = 8080',
        token: '8080',
        note: 'A whole number. No quotes, so it can be compared and counted with.',
      },
      {
        id: 'float',
        kind: 'Number',
        term: 'number',
        at: 'timeout = ',
        token: '2.5',
        note: 'A number with a decimal point.',
      },
      {
        id: 'bool',
        kind: 'Boolean',
        term: 'boolean',
        at: 'verbose = ',
        token: 'False',
        note: 'True or False, written with a capital and no quotes. Settings that switch something on or off look like this.',
      },
      {
        id: 'none',
        kind: 'None',
        term: 'none',
        at: 'last_error = ',
        token: 'None',
        note: 'Nothing yet. There has been no error, so the name stands for no value at all.',
      },
      {
        id: 'dict',
        kind: 'Dict',
        term: 'dict',
        at: 'target = {',
        token: '{"host": "web01", "port": port}',
        note: 'A lookup table. The key "host" leads to "web01", and the key "port" leads to whatever port stands for, which is 8080.',
      },
    ],
    steps: [
      {
        kind: 'name',
        region: 'bool',
        choices: [
          { text: 'A boolean', why: '' },
          { text: 'A string', why: "A string would be in quotes. False has none, and the capital F marks it as one of Python's two truth values." },
          { text: 'A variable', why: 'False is not a name the author chose. It is a value built into the language.' },
        ],
      },
      {
        kind: 'find',
        prompt: 'Click the line whose value means "nothing here".',
        target: 'none',
        miss: 'Look for None.',
      },
      {
        kind: 'ask',
        prompt: 'In the last line, what is the difference between "port" and port?',
        choices: [
          { text: '"port" in quotes is text used as a key. port without quotes is the variable, so its value 8080 is stored.', why: '' },
          { text: 'There is none. Quotes are optional.', why: 'Quotes change the meaning completely: with them it is the four letters p-o-r-t, without them it is whatever the name stands for.' },
          { text: 'Both are the number 8080.', why: 'Only the one without quotes is. The quoted one is the text "port", used as a label.' },
        ],
      },
    ],
    takeaway: 'Quotes mean text. No quotes means a number, a built-in value such as True or None, or a name standing for something else. That one distinction resolves most confusion on a line.',
  },
  {
    id: 'file-3',
    stage: 'file',
    title: 'Blocks',
    lang: 'python',
    fileName: 'ports.py',
    tour: true,
    intro: [
      'Not every line runs exactly once. A line ending in a colon controls the indented lines beneath it: whether they run, and how many times.',
      'In Python the indentation is the structure. Reading it correctly is the single most important habit.',
    ],
    code: `ports = [22, 80, 443]

for port in ports:
    if port < 100:
        print(port, "is a low port")
    else:
        print(port, "is a high port")

print("done")`,
    regions: [
      {
        id: 'loop',
        kind: 'Loop',
        term: 'loop',
        at: 'for port in ports:',
        to: 'is a high port',
        note: 'Everything indented under this line runs once for each item in ports: three times.',
      },
      {
        id: 'lv',
        kind: 'Loop variable',
        term: 'loopvar',
        at: 'for port in ports:',
        token: 'port',
        note: 'On each pass, port stands for the current item: 22, then 80, then 443.',
      },
      {
        id: 'cond',
        kind: 'Condition',
        term: 'condition',
        at: 'if port < 100:',
        token: 'port < 100',
        note: 'A test. It is true for 22 and 80 and false for 443.',
      },
      {
        id: 'ifblock',
        kind: 'Block',
        term: 'block',
        at: 'is a low port',
        note: 'Indented under the if, so it runs only on passes where the test was true.',
      },
      {
        id: 'else',
        kind: 'Else branch',
        term: 'else',
        at: 'else:',
        to: 'is a high port',
        note: 'Runs on the passes where the test was false.',
      },
      {
        id: 'after',
        kind: 'Statement',
        term: 'statement',
        at: 'print("done")',
        note: 'Back at the left edge, so it is not part of the loop. It runs once, after the loop has finished.',
      },
    ],
    steps: [
      {
        kind: 'find',
        prompt: 'Click a line that runs exactly once, after the loop is over.',
        target: 'after',
        miss: 'Find the line that is not indented under for.',
      },
      {
        kind: 'name',
        region: 'lv',
        choices: [
          { text: 'The loop variable', why: '' },
          { text: 'The list being looped over', why: 'The list is ports, after the word in. port, before it, is the name each item takes in turn.' },
          { text: 'A condition', why: 'A condition is a test such as port < 100. This is only a name.' },
        ],
      },
      {
        kind: 'ask',
        prompt: 'How many lines of output does this produce?',
        choices: [
          { text: 'Four: one per port, then done.', why: '' },
          { text: 'Seven: both prints run on every pass.', why: 'On each pass exactly one branch runs, the if block or the else block, never both.' },
          { text: 'Three.', why: 'The loop produces three. The last print is outside the loop and adds one more.' },
        ],
      },
    ],
    takeaway: 'To read a block, find the line with the colon that owns it and ask one question: does that line mean "maybe" (if), "repeatedly" (for, while), or "later" (def)?',
  },
  {
    id: 'func-1',
    stage: 'func',
    title: 'Definition and call',
    lang: 'python',
    fileName: 'probe.py',
    tour: true,
    intro: [
      'A function is a block with a name. Defining it runs nothing. The block runs later, each time the name is called.',
      'Every function has the same parts. Once you can name them, the first line of any function tells you most of what you need.',
    ],
    code: `def is_open(port, timeout=2):
    """Return True if the port answered in time."""
    reply = probe(port, timeout)
    return reply == "open"


if is_open(443):
    print("https is up")`,
    regions: [
      {
        id: 'sig',
        kind: 'Signature',
        term: 'signature',
        at: 'def is_open(',
        note: 'def starts a definition. This line says the function is called is_open and takes up to two values.',
      },
      {
        id: 'param',
        kind: 'Parameter',
        term: 'parameter',
        at: 'def is_open(',
        token: 'port',
        note: 'A placeholder. Inside the function, port stands for whatever the caller passed first.',
      },
      {
        id: 'default',
        kind: 'Default value',
        term: 'default',
        at: 'def is_open(',
        token: 'timeout=2',
        note: 'If the caller does not pass a second value, timeout is 2.',
      },
      {
        id: 'doc',
        kind: 'Docstring',
        term: 'docstring',
        at: '"""Return True',
        note: "The author's one-line description. It does nothing when the code runs, and it is the fastest way to learn what the function is for.",
      },
      {
        id: 'body',
        kind: 'Body',
        term: 'body',
        at: 'reply = probe',
        to: 'return reply',
        note: 'The lines that run when is_open is called.',
      },
      {
        id: 'ret',
        kind: 'Return',
        term: 'return',
        at: 'return reply',
        note: 'Ends the function and hands back True or False: whether reply is the text "open".',
      },
      {
        id: 'callsite',
        kind: 'Call',
        term: 'call',
        at: 'if is_open(443):',
        token: 'is_open(443)',
        note: 'Here the function actually runs. The whole call stands for the value it returns, so the if is testing True or False.',
      },
      {
        id: 'arg',
        kind: 'Argument',
        term: 'argument',
        at: 'if is_open(443):',
        token: '443',
        note: 'The value handed over. Inside the function, port will be 443. No second value is given, so timeout is 2.',
      },
    ],
    steps: [
      {
        kind: 'find',
        prompt: 'Click the line where is_open actually runs.',
        target: 'callsite',
        miss: 'Defining is not running. Look for the name followed by a value in parentheses, outside the def.',
      },
      {
        kind: 'name',
        region: 'param',
        choices: [
          { text: 'A parameter', why: '' },
          { text: 'An argument', why: 'An argument is the actual value at the call, here 443. In the def line, port is the placeholder waiting for it.' },
          { text: 'A variable defined above', why: 'Nothing above defines port. It gets its value from whoever calls the function.' },
        ],
      },
      {
        kind: 'name',
        region: 'ret',
        choices: [
          { text: 'The return', why: '' },
          { text: 'A call', why: 'Nothing is being run here. This line ends the function and hands a value back.' },
          { text: 'The docstring', why: 'The docstring is the quoted description on the second line.' },
        ],
      },
      {
        kind: 'ask',
        prompt: 'During the call is_open(443), what is timeout?',
        choices: [
          { text: '2, the default, because the caller passed only one value.', why: '' },
          { text: '443.', why: '443 is the first value passed, so it fills the first parameter, port.' },
          { text: 'Nothing. It is an error to leave it out.', why: 'A parameter with = in the signature may be left out. That is what the default is for.' },
        ],
      },
    ],
    takeaway: 'Read a function in this order: name, parameters, docstring, return. That is its contract. The body is detail you can often skip.',
  },
  {
    id: 'func-2',
    stage: 'func',
    title: 'What comes back',
    lang: 'python',
    fileName: 'labels.py',
    tour: true,
    intro: [
      'Functions talk to the rest of the program in two different ways. Some hand a value back. Some do something visible and hand back nothing. Telling them apart prevents the most common misreading there is.',
    ],
    code: `def label(host, port):
    return f"{host}:{port}"


def report(host, port):
    print("checking", label(host, port))


target = label("web01", 443)
report("db01", 5432)`,
    regions: [
      {
        id: 'ret',
        kind: 'Return',
        term: 'return',
        at: 'return f"',
        note: 'label builds a piece of text and hands it back. It shows nothing on screen.',
      },
      {
        id: 'noret',
        kind: 'Function',
        term: 'function',
        at: 'def report(',
        to: 'print("checking"',
        note: 'report has no return line. It prints, and hands back None.',
      },
      {
        id: 'nested',
        kind: 'Call',
        term: 'call',
        at: 'print("checking"',
        token: 'label(host, port)',
        note: 'A call inside a call. label runs first, and its result becomes the second thing print shows.',
      },
      {
        id: 'store',
        kind: 'Assignment',
        term: 'assignment',
        at: 'target = label',
        note: 'The value label hands back is kept under the name target. This is the usual thing to do with a returned value.',
      },
      {
        id: 'bare',
        kind: 'Statement',
        term: 'statement',
        at: 'report("db01"',
        note: 'Called for its effect. Nothing is stored, because there is nothing worth storing.',
      },
    ],
    steps: [
      {
        kind: 'find',
        prompt: 'Click the line that gives label its result.',
        target: 'ret',
        miss: 'Look inside label for the word return.',
      },
      {
        kind: 'ask',
        prompt: 'What does target hold after the second-to-last line?',
        choices: [
          { text: 'The text web01:443.', why: '' },
          { text: 'None.', why: 'label has a return line, so it hands back the text it built. report is the one that hands back None.' },
          { text: 'The function label.', why: 'The parentheses ran the function. target holds what came back, not the function itself.' },
        ],
      },
      {
        kind: 'ask',
        prompt: 'If the last line were result = report("db01", 5432), what would result be?',
        choices: [
          { text: 'None, because report prints and returns nothing.', why: '' },
          { text: 'The text checking db01:5432.', why: 'That text goes to the screen. It is not handed back to the caller.' },
          { text: 'An error.', why: 'It is allowed. The name simply ends up standing for None, which is how this mistake stays hidden.' },
        ],
      },
    ],
    takeaway: "print shows. return hands back. When a function's result is stored or tested, find its return line. If there is none, the result is None.",
  },
  {
    id: 'func-3',
    stage: 'func',
    title: 'Methods and chains',
    lang: 'python',
    fileName: 'clean.py',
    tour: true,
    intro: [
      'A dot after a value means "use something that belongs to this". Functions that belong to a value are called methods, and they are how most text and list handling is written.',
    ],
    code: `line = "  Failed password for ROOT from 203.0.113.9  "
clean = line.strip().lower()
words = clean.split()
ip = words[-1]
words.append("flagged")
print(ip, len(words))`,
    regions: [
      {
        id: 'method',
        kind: 'Method',
        term: 'method',
        at: 'clean = line',
        token: 'line.strip()',
        note: 'strip belongs to strings. It gives back a new string with the spaces at both ends removed. line itself is not changed.',
      },
      {
        id: 'chain',
        kind: 'Chain',
        term: 'chain',
        at: 'clean = line',
        token: 'line.strip().lower()',
        note: 'Read left to right: strip the spaces, then make the result lowercase.',
      },
      {
        id: 'split',
        kind: 'Method',
        term: 'method',
        at: 'words = clean',
        token: 'clean.split()',
        note: 'Cuts the text into a list of words wherever there is a space.',
      },
      {
        id: 'index',
        kind: 'Indexing',
        term: 'index',
        at: 'ip = words',
        token: 'words[-1]',
        note: 'Square brackets pick one item. Positions start at 0, and negative positions count from the end, so -1 is the last word.',
      },
      {
        id: 'mutate',
        kind: 'Method',
        term: 'method',
        at: 'words.append',
        note: 'Some methods change the value in place. append adds to the list itself and gives nothing back, so nothing is stored.',
      },
      {
        id: 'builtin',
        kind: 'Call',
        term: 'call',
        at: 'print(ip',
        token: 'len(words)',
        note: 'len is not a method. It is a plain function, called with the value inside the parentheses.',
      },
    ],
    steps: [
      {
        kind: 'name',
        region: 'chain',
        choices: [
          { text: 'A chain of method calls', why: '' },
          { text: 'A single call with two arguments', why: 'Arguments go inside one pair of parentheses, separated by commas. These are two calls joined by a dot.' },
          { text: 'An import', why: 'An import starts with the word import. This is a value having methods called on it.' },
        ],
      },
      {
        kind: 'find',
        prompt: 'Click the line that changes a list in place.',
        target: 'mutate',
        miss: 'Look for a method call whose result is not stored.',
      },
      {
        kind: 'ask',
        prompt: 'What does ip hold?',
        choices: [
          { text: '203.0.113.9', why: '' },
          { text: 'root', why: 'That is the fourth word. -1 counts from the end and picks the last one.' },
          { text: 'The whole line.', why: 'The line was split into words, and the brackets picked one of them.' },
        ],
      },
    ],
    takeaway: 'value.method() reads as "do this to that". Chains run left to right. Notice whether a result is stored: if it is not, the method changed the value itself.',
  },
  {
    id: 'data-1',
    stage: 'data',
    title: 'Getting values out',
    lang: 'python',
    fileName: 'finding.py',
    tour: true,
    intro: [
      'Real data is nested: a dict that holds a list, a dict inside a dict. Reading it is a matter of following the brackets one step at a time.',
    ],
    code: `finding = {
    "host": "web01",
    "ports": [22, 443],
    "owner": {"team": "platform", "oncall": "ada"},
}

first_port = finding["ports"][0]
oncall = finding["owner"]["oncall"]
severity = finding.get("severity", "low")
finding["checked"] = True`,
    regions: [
      {
        id: 'dict',
        kind: 'Dict',
        term: 'dict',
        at: 'finding = {',
        to: '"owner": {',
        note: 'One dict with three keys. Each key leads to a different kind of value: text, a list, and another dict.',
      },
      {
        id: 'two',
        kind: 'Indexing',
        term: 'index',
        at: 'first_port = ',
        token: 'finding["ports"][0]',
        note: 'Two steps. ["ports"] gives the list, then [0] gives its first item, 22.',
      },
      {
        id: 'deep',
        kind: 'Indexing',
        term: 'index',
        at: 'oncall = ',
        token: 'finding["owner"]["oncall"]',
        note: 'Two steps again. ["owner"] gives the inner dict, then ["oncall"] gives "ada".',
      },
      {
        id: 'get',
        kind: 'Method',
        term: 'method',
        at: 'severity = ',
        token: 'finding.get("severity", "low")',
        note: 'A careful lookup. There is no "severity" key, so instead of failing, get hands back the fallback, "low".',
      },
      {
        id: 'store',
        kind: 'Assignment',
        term: 'assignment',
        at: 'finding["checked"]',
        note: 'Brackets on the left of = store instead of read. This adds a fourth key to the dict.',
      },
    ],
    steps: [
      {
        kind: 'find',
        prompt: 'Click the line that adds a new key to the dict.',
        target: 'store',
        miss: 'Look for brackets on the left side of an = sign.',
      },
      {
        kind: 'ask',
        prompt: 'What would finding["severity"] do, written with brackets instead of get?',
        choices: [
          { text: 'Fail with a KeyError, because that key was never stored.', why: '' },
          { text: 'Give "low".', why: 'The fallback only exists inside the call to get. Plain brackets have no fallback.' },
          { text: 'Give None.', why: 'get with no fallback would give None. Plain brackets raise an error for a missing key.' },
        ],
      },
      {
        kind: 'ask',
        prompt: 'What is finding["owner"]["team"]?',
        choices: [
          { text: '"platform"', why: '' },
          { text: '"ada"', why: 'That is under the key "oncall". "team" leads to "platform".' },
          { text: 'The whole inner dict.', why: 'One pair of brackets would give the inner dict. The second pair picks a value out of it.' },
        ],
      },
    ],
    takeaway: 'Read chained brackets left to right, saying what you are holding after each step. When a lookup uses .get, the author expected the key to be missing sometimes.',
  },
  {
    id: 'data-2',
    stage: 'data',
    title: 'Lists of records',
    lang: 'python',
    fileName: 'rank.py',
    tour: true,
    intro: [
      'The most common shape of data is a list of dicts: rows from a file, results from a scan, items from an API. Two patterns handle nearly all of it.',
    ],
    code: `findings = [
    {"host": "web01", "score": 9.1},
    {"host": "db01", "score": 4.0},
    {"host": "cache01", "score": 7.5},
]

high = [f["host"] for f in findings if f["score"] >= 7]

worst = findings[0]
for f in findings:
    if f["score"] > worst["score"]:
        worst = f`,
    regions: [
      {
        id: 'rows',
        kind: 'List',
        term: 'list',
        at: 'findings = [',
        to: '"cache01", "score"',
        note: 'A list of three dicts. Each dict is one record with the same two keys.',
      },
      {
        id: 'comp',
        kind: 'Comprehension',
        term: 'comprehension',
        at: 'high = [',
        note: 'Builds a new list in one line. Read it in three parts.',
      },
      {
        id: 'keep',
        kind: 'Indexing',
        term: 'index',
        at: 'high = [',
        token: 'f["host"]',
        note: 'What goes into the new list: the host of each record.',
      },
      {
        id: 'test',
        kind: 'Condition',
        term: 'condition',
        at: 'high = [',
        token: 'f["score"] >= 7',
        note: 'The filter. Only records that pass this test contribute.',
      },
      {
        id: 'acc',
        kind: 'Running result',
        term: 'accumulator',
        at: 'worst = findings[0]',
        note: 'Start with the first record as the worst seen so far.',
      },
      {
        id: 'loop',
        kind: 'Loop',
        term: 'loop',
        at: 'for f in findings:',
        to: 'worst = f',
        note: 'Compare every record with the current worst, and replace it when one scores higher.',
      },
    ],
    steps: [
      {
        kind: 'name',
        region: 'test',
        choices: [
          { text: 'The filter of the comprehension', why: '' },
          { text: 'What goes into the new list', why: 'That is the part before for: f["host"]. The part after if only decides which records count.' },
          { text: 'A separate if statement', why: 'It is inside the square brackets, so it is part of the comprehension, not a statement of its own.' },
        ],
      },
      {
        kind: 'ask',
        prompt: 'What does high hold?',
        choices: [
          { text: '["web01", "cache01"]', why: '' },
          { text: 'The two full records.', why: 'The part before for is f["host"], so only the host of each matching record is kept.' },
          { text: '["web01", "db01", "cache01"]', why: 'db01 scores 4.0, which fails the test.' },
        ],
      },
      {
        kind: 'find',
        prompt: 'Click the line that sets the starting value for the search.',
        target: 'acc',
        miss: 'It is the line just before the loop.',
      },
    ],
    takeaway: 'A comprehension is "this, for each of those, if that". A loop with a variable set just above it is keeping a running result. Name the pattern and you can skip the details.',
  },
  {
    id: 'script-1',
    stage: 'script',
    title: 'The parts of a script',
    lang: 'python',
    fileName: 'check_hosts.py',
    tour: true,
    intro: [
      'Almost every Python script is laid out the same way, top to bottom: what it brings in, its settings, its functions, and one line at the very bottom that starts everything.',
      'Learn the layout once and you will know where to look in any script.',
    ],
    code: `"""Report which hosts in a file answer on port 443."""
import socket
import sys

from netutils import clean_host

PORT = 443
TIMEOUT = 2


def is_up(host):
    try:
        socket.create_connection((host, PORT), TIMEOUT).close()
        return True
    except OSError:
        return False


def main():
    path = sys.argv[1]
    with open(path) as f:
        hosts = [clean_host(line) for line in f]
    for host in hosts:
        print(host, "up" if is_up(host) else "down")


if __name__ == "__main__":
    main()`,
    regions: [
      {
        id: 'doc',
        kind: 'Docstring',
        term: 'docstring',
        at: '"""Report which',
        note: 'The first line of the file says what the whole script is for. Always read it.',
      },
      {
        id: 'std',
        kind: 'Standard library',
        term: 'stdlib',
        at: 'import socket',
        to: 'import sys',
        note: 'Two modules that ship with Python. socket means it talks to the network. sys means it reads its command line.',
      },
      {
        id: 'local',
        kind: 'Local module',
        term: 'localmod',
        at: 'from netutils',
        note: 'clean_host comes from netutils.py, another file in this project.',
      },
      {
        id: 'const',
        kind: 'Constant',
        term: 'constant',
        at: 'PORT = 443',
        to: 'TIMEOUT = 2',
        note: 'Settings, named in capitals and set once. Changing behavior usually means changing these.',
      },
      {
        id: 'helper',
        kind: 'Helper function',
        term: 'helper',
        at: 'def is_up(',
        to: 'return False',
        note: 'One small job: can this host be reached? Defined here, used below.',
      },
      {
        id: 'main',
        kind: 'Function',
        term: 'function',
        at: 'def main():',
        to: '"up" if is_up',
        note: "The script's real work, in order: get a file name, read hosts from it, check each one.",
      },
      {
        id: 'guard',
        kind: 'Main guard',
        term: 'mainguard',
        at: 'if __name__',
        note: 'True only when this file is run directly. It keeps the script from firing when another file imports it.',
      },
      {
        id: 'entry',
        kind: 'Entry point',
        term: 'entry',
        at: '    main()',
        note: 'The one line that starts everything. Nothing above it does any work until this runs.',
      },
    ],
    steps: [
      {
        kind: 'find',
        prompt: 'Click the line where the program starts doing its work.',
        target: 'entry',
        miss: 'Everything above the bottom only defines things. Look at the last line.',
      },
      {
        kind: 'find',
        prompt: "Click the import that is this project's own code.",
        target: 'local',
        miss: 'socket and sys ship with Python. Look for the other one.',
      },
      {
        kind: 'name',
        region: 'const',
        choices: [
          { text: 'Constants', why: '' },
          { text: 'Function calls', why: 'A call has parentheses. These are plain assignments.' },
          { text: 'Imports', why: 'Imports start with import or from. These lines give names to two numbers.' },
        ],
      },
      {
        kind: 'ask',
        prompt: 'The file is run. Which of these happens first?',
        choices: [
          { text: 'The imports and constants are processed, and the two functions are defined but not run.', why: '' },
          { text: 'is_up runs, because it is the first function in the file.', why: 'A def only defines. is_up runs when main calls it, once per host.' },
          { text: 'main runs, because it is called main.', why: 'The name is a convention with no special power. It runs because the last line calls it.' },
        ],
      },
    ],
    takeaway: 'Top of the file: what it uses. Middle: what it can do. Bottom: where it starts. To read a script, go to the bottom, find the call, and follow it up.',
  },
  {
    id: 'script-2',
    stage: 'script',
    title: 'Whose code is it?',
    lang: 'python',
    fileName: 'imports.py',
    tour: true,
    intro: [
      'An import line tells you where code comes from, and that tells you whether you can read it, and whether you should trust it.',
      'There are three sources. By convention they are grouped in this order, with a blank line between groups.',
    ],
    code: `import json
import os
from pathlib import Path

import requests
from rich.table import Table

from scanner.config import load_settings
from .report import write_report`,
    regions: [
      {
        id: 'std',
        kind: 'Standard library',
        term: 'stdlib',
        at: 'import json',
        to: 'from pathlib',
        note: 'Ships with Python. Nothing was installed for these.',
      },
      {
        id: 'from',
        kind: 'Import',
        term: 'import',
        at: 'from pathlib',
        note: 'from X import Y takes one name out of a module. Afterward the code says Path, not pathlib.Path.',
      },
      {
        id: 'third',
        kind: 'Package',
        term: 'package',
        at: 'import requests',
        note: 'Installed from the internet. Someone outside the project wrote it. requests makes web requests.',
      },
      {
        id: 'sub',
        kind: 'Package',
        term: 'package',
        at: 'from rich.table',
        note: 'A dot in the module name means a module inside a package: the table part of rich.',
      },
      {
        id: 'abs',
        kind: 'Local module',
        term: 'localmod',
        at: 'from scanner.config',
        note: "scanner is this project's own package. load_settings lives in scanner/config.py.",
      },
      {
        id: 'rel',
        kind: 'Local module',
        term: 'localmod',
        at: 'from .report',
        note: "A leading dot means \"the folder this file is in\". Always the project's own code.",
      },
    ],
    steps: [
      {
        kind: 'find',
        prompt: 'Click an import of code written outside this project and installed separately.',
        target: 'third',
        miss: 'Not the first group, which ships with Python, and not the last, which belongs to the project.',
      },
      {
        kind: 'name',
        region: 'rel',
        choices: [
          { text: 'A local module, in the same folder as this file', why: '' },
          { text: 'A third-party package', why: 'The leading dot rules that out. A dot at the start always means a neighbor file.' },
          { text: 'The standard library', why: 'Standard library imports never start with a dot.' },
        ],
      },
      {
        kind: 'ask',
        prompt: 'You are checking what this project trusts. Which imports matter most?',
        choices: [
          { text: "requests and rich. They are other people's code running with this program's permissions.", why: '' },
          { text: 'json, os and pathlib.', why: 'Those ship with Python itself. They are trusted as far as Python is.' },
          { text: 'The two local ones.', why: "Those are the project's own files, which you can open and read directly." },
        ],
      },
    ],
    takeaway: 'Group one ships with Python. Group two is installed, and is the supply chain. Group three is the project, and is where you go next to keep reading.',
  },
  {
    id: 'script-3',
    stage: 'script',
    title: 'Find the parts yourself',
    lang: 'python',
    fileName: 'audit.py',
    tour: false,
    intro: [
      'No walkthrough this time. This is a script you have not seen, laid out the same way. Find the parts.',
    ],
    code: `import argparse
import csv

from audit.rules import RULES

MAX_ROWS = 10_000


def load(path):
    with open(path, newline="") as f:
        return list(csv.DictReader(f))[:MAX_ROWS]


def check(rows):
    return [r for r in rows if any(rule(r) for rule in RULES)]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("path")
    args = parser.parse_args()
    flagged = check(load(args.path))
    print(len(flagged), "rows flagged")


if __name__ == "__main__":
    main()`,
    regions: [
      {
        id: 'std',
        kind: 'Standard library',
        term: 'stdlib',
        at: 'import argparse',
        to: 'import csv',
        note: 'argparse reads command-line options. csv reads spreadsheet-style files.',
      },
      {
        id: 'local',
        kind: 'Local module',
        term: 'localmod',
        at: 'from audit.rules',
        note: "RULES comes from the project's own audit/rules.py. It is the list of checks.",
      },
      {
        id: 'const',
        kind: 'Constant',
        term: 'constant',
        at: 'MAX_ROWS = ',
        note: 'A limit, set once. The underscore in the number is only for readability.',
      },
      {
        id: 'load',
        kind: 'Helper function',
        term: 'helper',
        at: 'def load(',
        to: '[:MAX_ROWS]',
        note: 'Reads the file into a list of rows, cut off at the limit.',
      },
      {
        id: 'check',
        kind: 'Helper function',
        term: 'helper',
        at: 'def check(',
        to: 'for rule in RULES)]',
        note: 'Keeps the rows that any rule objects to.',
      },
      {
        id: 'main',
        kind: 'Function',
        term: 'function',
        at: 'def main():',
        to: '"rows flagged")',
        note: 'Gets the file name from the command line, loads, checks, reports.',
      },
      {
        id: 'entry',
        kind: 'Entry point',
        term: 'entry',
        at: '    main()',
        note: 'Where it starts.',
      },
    ],
    steps: [
      {
        kind: 'find',
        prompt: 'Click the line where the program starts.',
        target: 'entry',
        miss: 'Go to the bottom of the file.',
      },
      {
        kind: 'find',
        prompt: 'Click the line that tells you where the rules are defined.',
        target: 'local',
        miss: 'Rules are used in check. Look at the top for where that name comes from.',
      },
      {
        kind: 'find',
        prompt: 'Click the setting you would change to process larger files.',
        target: 'const',
        miss: 'Settings are named in capitals near the top.',
      },
      {
        kind: 'ask',
        prompt: 'Without reading load or check, what does this script do?',
        choices: [
          { text: 'It reads a file named on the command line, applies some rules to each row and prints how many rows were flagged.', why: '' },
          { text: 'It cannot be known without reading every function.', why: 'The names in main are enough: parse arguments, load, check, print a count.' },
          { text: 'It writes a cleaned copy of the file.', why: 'Nothing in main writes a file. The only output is the print.' },
        ],
      },
    ],
    takeaway: 'You just read a script you had never seen in four clicks, by knowing where things live. That layout holds for nearly every Python script you will be handed.',
  },
  {
    id: 'start-1',
    stage: 'start',
    title: 'Read the names first',
    lang: 'python',
    fileName: 'scan.py',
    tour: true,
    intro: [
      'Nobody reads code from line 1 to the end. The first pass through a file reads names only and opens nothing.',
      'A well-named main function is a table of contents. Here is one. Every line is a call to a function defined somewhere else.',
    ],
    code: `def main():
    settings = load_settings("scan.toml")
    hosts = read_targets(settings.targets_file)
    results = [scan(host, settings.ports) for host in hosts]
    alerts = [r for r in results if r.open_ports]
    write_report(alerts, settings.output)
    notify(settings.webhook, len(alerts))`,
    regions: [
      {
        id: 's1',
        kind: 'Call',
        term: 'call',
        at: 'load_settings(',
        note: 'Step one: read settings from a file. The name says so. Do not open it yet.',
      },
      {
        id: 's2',
        kind: 'Call',
        term: 'call',
        at: 'read_targets(',
        note: 'Step two: get the list of hosts, from a file named in the settings.',
      },
      {
        id: 's3',
        kind: 'Comprehension',
        term: 'comprehension',
        at: 'scan(host',
        note: 'Step three: scan every host. This is the line that touches other machines.',
      },
      {
        id: 's4',
        kind: 'Comprehension',
        term: 'comprehension',
        at: 'if r.open_ports',
        note: 'Step four: keep only the results that found something open. No function call here, just a filter.',
      },
      {
        id: 's5',
        kind: 'Call',
        term: 'call',
        at: 'write_report(',
        note: 'Step five: write the alerts somewhere, to a place named in the settings.',
      },
      {
        id: 's6',
        kind: 'Call',
        term: 'call',
        at: 'notify(',
        note: 'Step six: send a count to a webhook, which is a web address. This also reaches the network.',
      },
    ],
    steps: [
      {
        kind: 'ask',
        prompt: 'From the names alone, what does this program do?',
        choices: [
          { text: 'Loads settings, reads a list of hosts, scans them, and reports the ones with open ports to a file and a webhook.', why: '' },
          { text: 'It cannot be known without opening each function.', why: 'The six names are a summary. Opening the functions adds detail, not the outline.' },
          { text: 'It installs a scanner on each host.', why: 'Nothing here installs anything. The verbs are load, read, scan, write and notify.' },
        ],
      },
      {
        kind: 'find',
        prompt: 'You want to know exactly what is sent to the outside service. Click the line whose function you would open.',
        target: 's6',
        miss: 'Which name suggests sending something out?',
      },
      {
        kind: 'find',
        prompt: 'You want to know which ports are probed on each host. Click the line that answers it.',
        target: 's3',
        miss: 'Look for where the ports setting is handed to something.',
      },
      {
        kind: 'ask',
        prompt: 'You only want to know where the report is saved. How many function bodies do you need to open?',
        choices: [
          { text: 'Possibly none. The path is settings.output, so the settings file may answer it directly.', why: '' },
          { text: 'All six.', why: 'Five of the six lines have nothing to do with where the report goes.' },
          { text: 'Only scan.', why: 'scan produces results. Where they are written is decided two lines later.' },
        ],
      },
    ],
    takeaway: 'First pass: names only. Then ask one question and open only the function that answers it. Reading everything is how people get lost.',
  },
  {
    id: 'start-2',
    stage: 'start',
    title: 'Follow one value',
    lang: 'python',
    fileName: 'reports.py',
    tour: true,
    intro: [
      'The second pass picks one value and follows it, ignoring every line that does not touch it. For security work, the value to pick is one that comes from outside.',
      'A value that enters from outside is called a source. The place it ends up being used is called a sink. The steps between are hops.',
    ],
    code: `def handle(request):
    name = request.args["file"]
    path = build_path(name)
    data = read_file(path)
    return render(data)


def build_path(name):
    return "/srv/reports/" + name


def read_file(path):
    with open(path) as f:
        return f.read()`,
    regions: [
      {
        id: 'src',
        kind: 'Source',
        term: 'source',
        at: 'request.args["file"]',
        note: 'The value enters here. request.args is whatever the visitor put in the URL, so the visitor chooses name.',
      },
      {
        id: 'hop1',
        kind: 'Hop',
        term: 'hop',
        at: 'path = build_path',
        note: 'name is handed to build_path. Follow it there.',
      },
      {
        id: 'glue',
        kind: 'Hop',
        term: 'hop',
        at: 'return "/srv/reports/"',
        note: "The visitor's text is glued onto a folder. Nothing checks what it contains.",
      },
      {
        id: 'hop2',
        kind: 'Hop',
        term: 'hop',
        at: 'data = read_file',
        note: 'The result, now called path, is handed on again. Same value, new name.',
      },
      {
        id: 'sink',
        kind: 'Sink',
        term: 'sink',
        at: 'with open(path)',
        note: 'The value is used: a file is opened at a location the visitor influenced.',
      },
      {
        id: 'out',
        kind: 'Return',
        term: 'return',
        at: 'return render',
        note: "The file's contents go back to the visitor.",
      },
    ],
    steps: [
      {
        kind: 'find',
        prompt: 'Click the line where a value from outside the program enters.',
        target: 'src',
        miss: 'Look for the word request.',
      },
      {
        kind: 'find',
        prompt: 'Click the line where that value is finally used to do something.',
        target: 'sink',
        miss: 'Follow it: name, then path, then into read_file.',
      },
      {
        kind: 'name',
        region: 'glue',
        choices: [
          { text: 'A hop: the value is passed along without being checked', why: '' },
          { text: 'A check that makes the value safe', why: 'Nothing is tested or rejected here. The text is only joined to a prefix.' },
          { text: 'The source', why: 'The source is where the value first appears, on the line with request.args.' },
        ],
      },
      {
        kind: 'ask',
        prompt: 'The value changed names twice on the way. What stayed the same?',
        choices: [
          { text: 'It is still text the visitor chose, with a folder name in front.', why: '' },
          { text: 'Nothing. A new name means a new, safe value.', why: 'Renaming changes the label, not the contents. path still contains whatever the visitor typed.' },
          { text: 'It was validated when it became path.', why: 'build_path only joins two strings. No line rejects anything.' },
        ],
      },
    ],
    takeaway: 'Pick the value that comes from outside. Follow it through every rename and every function until it is used. Lines it does not pass through can wait.',
  },
  {
    id: 'start-3',
    stage: 'start',
    title: 'Skip what does not matter',
    lang: 'python',
    fileName: 'users.py',
    tour: false,
    intro: [
      'No walkthrough. Use both passes on this file: find where it starts, then follow the outside value to where it lands.',
      'Most of the lines here are plumbing. Part of the skill is letting them go by.',
    ],
    code: `import logging
import sqlite3

log = logging.getLogger("users")
DB = "users.db"


def connect():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn


def find_user(conn, username):
    log.info("lookup for %s", username)
    query = "SELECT * FROM users WHERE name = '" + username + "'"
    return conn.execute(query).fetchone()


def handler(request):
    conn = connect()
    user = find_user(conn, request.form["username"])
    return {"found": user is not None}`,
    regions: [
      {
        id: 'std',
        kind: 'Standard library',
        term: 'stdlib',
        at: 'import logging',
        to: 'import sqlite3',
        note: 'Logging and a database, both shipped with Python.',
      },
      {
        id: 'plumb',
        kind: 'Helper function',
        term: 'helper',
        at: 'def connect():',
        to: 'conn.row_factory',
        note: 'Opens the database. It takes no outside value, so it can be skipped when following input.',
      },
      {
        id: 'entry',
        kind: 'Entry point',
        term: 'entry',
        at: 'def handler(request):',
        note: 'It takes a request, so this is what the outside world calls.',
      },
      {
        id: 'src',
        kind: 'Source',
        term: 'source',
        at: 'request.form["username"]',
        note: 'Text typed into a form by whoever is making the request.',
      },
      {
        id: 'build',
        kind: 'Hop',
        term: 'hop',
        at: 'query = "SELECT',
        note: 'The typed text is glued into the middle of a database command.',
      },
      {
        id: 'sink',
        kind: 'Sink',
        term: 'sink',
        at: 'conn.execute(query)',
        note: 'The command, including the typed text, is run by the database.',
      },
    ],
    steps: [
      {
        kind: 'find',
        prompt: 'Click the first line of the function the outside world calls.',
        target: 'entry',
        miss: 'Look for the function that receives a request.',
      },
      {
        kind: 'find',
        prompt: 'Click the line where the outside value enters.',
        target: 'src',
        miss: 'Look for request inside that function.',
      },
      {
        kind: 'find',
        prompt: 'Click the line where that value reaches the database.',
        target: 'sink',
        miss: 'Follow username into find_user, then find where the query is run.',
      },
      {
        kind: 'ask',
        prompt: 'Which function could you skip entirely while following username?',
        choices: [
          { text: 'connect. The value never passes through it.', why: '' },
          { text: 'find_user.', why: 'username is its second parameter. This is where the value goes.' },
          { text: 'handler.', why: 'handler is where the value enters.' },
        ],
      },
      {
        kind: 'ask',
        prompt: 'What does following the value reveal?',
        choices: [
          { text: 'Text typed by a visitor becomes part of the database command itself, so a visitor can change what the command does.', why: '' },
          { text: 'Nothing wrong. The value is logged first.', why: 'Logging records it. It does not change or check it.' },
          { text: 'The database is opened too often.', why: 'Possibly true, and not what following the value shows.' },
        ],
      },
    ],
    takeaway: 'Twenty-odd lines, and four of them mattered. You found them by starting at the entry point and following one value, not by reading from the top.',
  },
  {
    id: 'errors-1',
    stage: 'errors',
    title: 'Planned failure',
    lang: 'python',
    fileName: 'config.py',
    tour: true,
    intro: [
      'Code has two stories: what happens when everything works, and what happens when something does not. The second story is told with four words: raise, try, except and finally.',
    ],
    code: `def load_config(path):
    if not path.endswith(".json"):
        raise ValueError(f"not a JSON file: {path}")
    try:
        with open(path) as f:
            return json.load(f)
    except FileNotFoundError:
        log.warning("no config at %s, using defaults", path)
        return {}
    finally:
        log.debug("config load attempted")`,
    regions: [
      {
        id: 'raise',
        kind: 'Raise',
        term: 'raise',
        at: 'raise ValueError',
        note: 'The function refuses. It stops here and sends an error to whoever called it. Nothing below runs.',
      },
      {
        id: 'try',
        kind: 'Try block',
        term: 'try',
        at: 'try:',
        to: 'return json.load',
        note: 'The lines that might fail: opening the file and parsing it.',
      },
      {
        id: 'with',
        kind: 'With block',
        term: 'with',
        at: 'with open(path)',
        to: 'return json.load',
        note: 'Opens the file and guarantees it is closed afterward, even if parsing fails.',
      },
      {
        id: 'except',
        kind: 'Except block',
        term: 'except',
        at: 'except FileNotFoundError:',
        to: 'return {}',
        note: 'Runs only if the file does not exist. The function recovers by returning an empty dict.',
      },
      {
        id: 'finally',
        kind: 'Finally block',
        term: 'finally',
        at: 'finally:',
        to: 'config load attempted',
        note: 'Runs on the way out, whether the try worked or failed.',
      },
    ],
    steps: [
      {
        kind: 'find',
        prompt: 'Click the line that sends an error to the caller.',
        target: 'raise',
        miss: 'Look for the word raise.',
      },
      {
        kind: 'ask',
        prompt: 'What does the caller get when the file does not exist?',
        choices: [
          { text: 'An empty dict, and a warning is logged.', why: '' },
          { text: 'A FileNotFoundError.', why: 'That error is caught by the except block, which returns {} instead.' },
          { text: 'None.', why: 'The except block has an explicit return of an empty dict.' },
        ],
      },
      {
        kind: 'ask',
        prompt: 'The file exists but contains broken JSON. What happens?',
        choices: [
          { text: 'The parsing error is not caught here, so it travels up to the caller.', why: '' },
          { text: 'An empty dict is returned.', why: 'The except names only FileNotFoundError. A parsing error is a different kind and passes straight through.' },
          { text: 'Nothing. finally cancels the error.', why: 'finally runs, and then the error continues on its way.' },
        ],
      },
    ],
    takeaway: 'For any try block, ask: which errors are named, and what is returned for each? Any error not named keeps going up.',
  },
  {
    id: 'errors-2',
    stage: 'errors',
    title: 'The quiet failure',
    lang: 'python',
    fileName: 'owners.py',
    tour: true,
    intro: [
      'The most dangerous error handling is the kind that hides the error. The code looks careful. In fact a failure has been turned into a missing value that causes trouble somewhere else.',
    ],
    code: `def get_owner(host):
    try:
        record = inventory.lookup(host)
        return record["owner"]
    except Exception:
        pass


owner = get_owner("web01")
send_alert(owner.email, "port 23 is open")`,
    regions: [
      {
        id: 'broad',
        kind: 'Except block',
        term: 'except',
        at: 'except Exception:',
        note: 'Exception matches almost every kind of failure: a network error, a missing key, a typo in the code.',
      },
      {
        id: 'pass',
        kind: 'Swallowed error',
        term: 'swallow',
        at: '        pass',
        note: 'pass means "do nothing". The failure is thrown away. No log line, no message.',
      },
      {
        id: 'fall',
        kind: 'Function',
        term: 'function',
        at: 'def get_owner(',
        to: '        pass',
        note: 'After the except block there is no return, so on any failure the function hands back None.',
      },
      {
        id: 'crash',
        kind: 'Statement',
        term: 'statement',
        at: 'send_alert(owner.email',
        note: 'If owner is None, asking for its .email fails here, on a line that looks innocent.',
      },
    ],
    steps: [
      {
        kind: 'find',
        prompt: 'Click the line that throws a failure away.',
        target: 'pass',
        miss: 'Look for the line that does nothing.',
      },
      {
        kind: 'ask',
        prompt: 'The inventory lookup fails. What does get_owner hand back?',
        choices: [
          { text: 'None, because the except block does nothing and the function ends without a return.', why: '' },
          { text: 'An error.', why: 'The error was caught and discarded. The caller never sees it.' },
          { text: 'An empty string.', why: 'Nothing returns an empty string. A function that ends without return hands back None.' },
        ],
      },
      {
        kind: 'ask',
        prompt: 'Where does the program finally crash, and what does the message say?',
        choices: [
          { text: 'On the last line, with a complaint that None has no email. The real cause, the failed lookup, is not mentioned.', why: '' },
          { text: 'Inside get_owner, naming the failed lookup.', why: 'That failure was swallowed. It leaves no trace.' },
          { text: 'It does not crash. The alert is sent to nobody.', why: 'owner.email is evaluated before send_alert runs, and it fails on None.' },
        ],
      },
    ],
    takeaway: 'except Exception: pass is worth stopping on every time. It means failures here are invisible, and their effects will surface somewhere unrelated.',
  },
  {
    id: 'classes-1',
    stage: 'classes',
    title: 'A class and its objects',
    lang: 'python',
    fileName: 'scanner.py',
    tour: true,
    intro: [
      'A class bundles data with the functions that work on it. It is a blueprint. An object is one thing built from it.',
      'To read a class, start with __init__. It lists what every object carries.',
    ],
    code: `class Scanner:
    """Checks one host for open ports."""

    def __init__(self, host, ports):
        self.host = host
        self.ports = ports
        self.open_ports = []

    def run(self):
        for port in self.ports:
            if probe(self.host, port):
                self.open_ports.append(port)
        return self.open_ports


scanner = Scanner("web01", [22, 443])
found = scanner.run()`,
    regions: [
      {
        id: 'class',
        kind: 'Class',
        term: 'class',
        at: 'class Scanner:',
        to: 'return self.open_ports',
        note: 'Everything indented under this line belongs to Scanner.',
      },
      {
        id: 'init',
        kind: 'Constructor',
        term: 'init',
        at: 'def __init__(',
        to: 'self.open_ports = []',
        note: 'Runs automatically when a Scanner is created. Its job is to set up the new object.',
      },
      {
        id: 'self',
        kind: 'self',
        term: 'self',
        at: 'def __init__(',
        token: 'self',
        note: 'The object being set up. Python passes it in automatically. The caller never writes it.',
      },
      {
        id: 'attr',
        kind: 'Attribute',
        term: 'attribute',
        at: 'self.host = host',
        note: 'Stores the host on the object, so the other methods can read it later as self.host.',
      },
      {
        id: 'method',
        kind: 'Method',
        term: 'method',
        at: 'def run(self):',
        to: 'return self.open_ports',
        note: "Something a Scanner can do. It reads and updates the object's own data through self.",
      },
      {
        id: 'make',
        kind: 'Object',
        term: 'object',
        at: 'scanner = Scanner(',
        note: 'Calling the class builds one object. The two values go to __init__ as host and ports.',
      },
      {
        id: 'use',
        kind: 'Call',
        term: 'call',
        at: 'found = scanner.run()',
        note: 'Calls run on that particular object. Inside run, self is scanner.',
      },
    ],
    steps: [
      {
        kind: 'find',
        prompt: 'Click the first line of the code that runs when a Scanner is created.',
        target: 'init',
        miss: 'Look for the method with underscores around its name.',
      },
      {
        kind: 'name',
        region: 'attr',
        choices: [
          { text: 'Storing an attribute on the object', why: '' },
          { text: 'Creating a local variable', why: 'A plain variable would be host = something. The self. in front puts the value on the object, where it outlasts this method.' },
          { text: 'Calling a method', why: 'There are no parentheses. This is an assignment.' },
        ],
      },
      {
        kind: 'ask',
        prompt: 'Scanner("web01", [22, 443]) passes two values, but __init__ lists three parameters. Why does that work?',
        choices: [
          { text: "Python supplies self, the new object. The caller's values fill host and ports.", why: '' },
          { text: 'The third parameter has a default.', why: 'None of them has a default. The first one, self, is filled in by Python.' },
          { text: 'It does not work.', why: 'It works. self is always supplied automatically.' },
        ],
      },
      {
        kind: 'ask',
        prompt: 'Two Scanners are created for different hosts. Do they share open_ports?',
        choices: [
          { text: 'No. Each object gets its own list in __init__.', why: '' },
          { text: 'Yes. It is defined once, in the class.', why: '__init__ runs once per object, and each run makes a fresh list.' },
          { text: 'Only if run is called on both.', why: 'Calling run does not link the objects. Each works on its own self.' },
        ],
      },
    ],
    takeaway: 'Read __init__ to learn what an object carries. Read the method names to learn what it can do. self is just "this one".',
  },
  {
    id: 'classes-2',
    stage: 'classes',
    title: 'Decorators and annotations',
    lang: 'python',
    fileName: 'finding.py',
    tour: true,
    intro: [
      'Modern Python decorates its classes and annotates its values. Both look like noise until you know what they are for, and then they turn out to be the most informative lines in the file.',
    ],
    code: `from dataclasses import dataclass


@dataclass
class Finding:
    host: str
    port: int
    severity: str = "low"

    def is_urgent(self) -> bool:
        return self.severity == "high" and self.port < 1024


f = Finding("web01", 23, severity="high")`,
    regions: [
      {
        id: 'deco',
        kind: 'Decorator',
        term: 'decorator',
        at: '@dataclass',
        note: 'A line starting with @ changes the thing below it. This one writes the __init__ for you, from the fields listed.',
      },
      {
        id: 'field',
        kind: 'Type annotation',
        term: 'typehint',
        at: '    host: str',
        note: 'A field named host that is expected to hold text. The colon introduces the type.',
      },
      {
        id: 'fdef',
        kind: 'Default value',
        term: 'default',
        at: 'severity: str = "low"',
        note: 'A field with a default. It may be left out when a Finding is created.',
      },
      {
        id: 'ret',
        kind: 'Type annotation',
        term: 'typehint',
        at: 'def is_urgent',
        token: '-> bool',
        note: 'The arrow says what the method hands back: a boolean.',
      },
      {
        id: 'kw',
        kind: 'Argument',
        term: 'argument',
        at: 'f = Finding(',
        token: 'severity="high"',
        note: 'An argument passed by name. It goes to the field called severity, whatever position that field is in.',
      },
    ],
    steps: [
      {
        kind: 'name',
        region: 'deco',
        choices: [
          { text: 'A decorator', why: '' },
          { text: 'A comment', why: 'A comment starts with #. A line starting with @ is real code, and it changes what follows.' },
          { text: 'An import', why: 'The import is the line above. This line uses what was imported.' },
        ],
      },
      {
        kind: 'find',
        prompt: 'Click the line that tells you what is_urgent gives back, without reading its body.',
        target: 'ret',
        miss: 'Look for the arrow.',
      },
      {
        kind: 'ask',
        prompt: 'There is no __init__ in this class. How does Finding("web01", 23, severity="high") work?',
        choices: [
          { text: '@dataclass builds one from the three fields, in the order they are listed.', why: '' },
          { text: 'It does not. The class cannot be created.', why: 'It can. The decorator supplied the missing method.' },
          { text: 'Python guesses from the argument types.', why: 'Nothing is guessed. The decorator reads the field list and writes the method.' },
        ],
      },
    ],
    takeaway: 'An @ line means "something extra happens to what is below". A colon or arrow followed by a type is the author stating what kind of value is expected. Read both before the body.',
  },
  {
    id: 'files-1',
    stage: 'files',
    title: 'Follow an import',
    lang: 'python',
    fileName: 'three files',
    tour: true,
    intro: [
      'Real programs are many files. A name used in one is often defined in another, and reading means jumping between them.',
      'The lines beginning with # ---- mark where each file starts. They are three separate files shown one after another.',
    ],
    code: `# ---- main.py ----
from report import summary

print(summary([3, 9, 4]))

# ---- report.py ----
from stats import biggest

def summary(values):
    return "max=" + str(biggest(values))

# ---- stats.py ----
def biggest(values):
    return max(values)`,
    regions: [
      {
        id: 'imp1',
        kind: 'Import',
        term: 'import',
        at: 'from report import summary',
        note: 'main.py does not define summary. This line says where to find it: in report.py.',
      },
      {
        id: 'use1',
        kind: 'Call',
        term: 'call',
        at: 'print(summary(',
        note: 'The name is used. To know what it does, go to the file the import named.',
      },
      {
        id: 'def1',
        kind: 'Function',
        term: 'function',
        at: 'def summary(',
        to: 'return "max="',
        note: 'Here it is. And it uses another name it does not define.',
      },
      {
        id: 'imp2',
        kind: 'Import',
        term: 'import',
        at: 'from stats import biggest',
        note: 'The same move again: biggest lives in stats.py.',
      },
      {
        id: 'def2',
        kind: 'Function',
        term: 'function',
        at: 'def biggest(',
        to: 'return max(values)',
        note: 'The end of the trail. This one uses only max, which is built into Python.',
      },
    ],
    steps: [
      {
        kind: 'find',
        prompt: 'You are in main.py and want to know what summary does. Click the line that tells you which file to open.',
        target: 'imp1',
        miss: 'Look at the top of main.py.',
      },
      {
        kind: 'find',
        prompt: 'Click the first line of the function that does the actual calculation.',
        target: 'def2',
        miss: 'Follow the chain to its last file.',
      },
      {
        kind: 'ask',
        prompt: 'What does main.py print?',
        choices: [
          { text: 'max=9', why: '' },
          { text: '9', why: 'biggest gives 9, and then summary puts the text max= in front of it.' },
          { text: '[3, 9, 4]', why: 'The list is passed down two levels and reduced to its largest item on the way.' },
        ],
      },
    ],
    takeaway: 'An unfamiliar name is a question with a mechanical answer: find its import, open that file, find its def. Repeat until you reach something built in.',
  },
  {
    id: 'files-2',
    stage: 'files',
    title: 'What the project installs',
    lang: 'text',
    fileName: 'two files',
    tour: true,
    intro: [
      'Some imports lead out of the project altogether, into code that was downloaded. A separate file lists everything that is downloaded, and it is one of the first things to read in any review.',
    ],
    code: `# ---- requirements.txt ----
requests==2.32.3
pyyaml>=6.0
audit-lib @ git+https://git.example.com/sec/audit.git

# ---- fetch.py ----
import requests
import yaml
from audit import rules`,
    regions: [
      {
        id: 'reqs',
        kind: 'Dependency list',
        term: 'dependency',
        at: 'requests==2.32.3',
        to: 'audit-lib @',
        note: 'Every outside package the project needs. Installing the project downloads all of these.',
      },
      {
        id: 'pin',
        kind: 'Version pin',
        term: 'pin',
        at: 'requests==2.32.3',
        token: '==2.32.3',
        note: 'Exactly this version. Every install gets identical code.',
      },
      {
        id: 'loose',
        kind: 'Package',
        term: 'package',
        at: 'pyyaml>=6.0',
        note: 'Version 6.0 or anything newer. A future release would be picked up automatically, reviewed or not.',
      },
      {
        id: 'git',
        kind: 'Package',
        term: 'package',
        at: 'audit-lib @',
        note: 'Not from the public index. This one is fetched straight from a code repository.',
      },
      {
        id: 'name',
        kind: 'Import',
        term: 'import',
        at: 'import yaml',
        note: 'The package is called pyyaml when installed and yaml when imported. The two names do not always match.',
      },
    ],
    steps: [
      {
        kind: 'find',
        prompt: 'Click the dependency that could change by itself between two installs.',
        target: 'loose',
        miss: 'Look for the one that allows newer versions.',
      },
      {
        kind: 'name',
        region: 'pin',
        choices: [
          { text: 'A version pin', why: '' },
          { text: 'A comparison that is checked when the code runs', why: 'This file is not code. It is read by the installer, which uses == to mean "exactly this version".' },
          { text: 'A comment', why: 'Comments in this file start with #.' },
        ],
      },
      {
        kind: 'ask',
        prompt: 'fetch.py imports yaml, but requirements.txt has no line for yaml. Is something missing?',
        choices: [
          { text: 'No. The package is listed under its install name, pyyaml.', why: '' },
          { text: 'Yes. The import will fail.', why: 'It will not. pyyaml is the name used to install it, and yaml is the name used to import it.' },
          { text: 'yaml ships with Python.', why: 'It does not. It is installed, under the name pyyaml.' },
        ],
      },
    ],
    takeaway: 'The dependency file is the list of code the project trusts without having written it. Check what is pinned, what is loose, and what comes from somewhere unusual.',
  },
  {
    id: 'ts-1',
    stage: 'ts',
    title: 'Types up front',
    lang: 'ts',
    fileName: 'finding.ts',
    tour: true,
    intro: [
      'TypeScript is the other language you will be handed. The ideas are the ones you already know: values, functions, blocks. The spelling differs: curly braces mark blocks instead of indentation, and types are written out.',
      'The types are a gift to a reader. They say what every value is before you read a line of logic.',
    ],
    code: `interface Finding {
  host: string;
  port: number;
  severity: "low" | "high";
  note?: string;
}

function describe(f: Finding, verbose: boolean = false): string {
  const base = \`\${f.host}:\${f.port}\`;
  return verbose ? \`\${base} (\${f.severity})\` : base;
}`,
    regions: [
      {
        id: 'iface',
        kind: 'Interface',
        term: 'interface',
        at: 'interface Finding {',
        to: 'note?: string;',
        note: 'Describes the shape of an object: four named fields and the type of each.',
      },
      {
        id: 'union',
        kind: 'Union type',
        term: 'union',
        at: 'severity:',
        token: '"low" | "high"',
        note: 'Only these two exact strings are allowed. Anything else is rejected before the code runs.',
      },
      {
        id: 'opt',
        kind: 'Optional field',
        term: 'optional',
        at: 'note?: string;',
        note: 'The ? means a Finding may have no note at all.',
      },
      {
        id: 'ptype',
        kind: 'Type annotation',
        term: 'typehint',
        at: 'function describe(',
        token: 'f: Finding',
        note: 'The first parameter must be a Finding, as described above.',
      },
      {
        id: 'pdef',
        kind: 'Default value',
        term: 'default',
        at: 'function describe(',
        token: 'verbose: boolean = false',
        note: 'A boolean parameter that is false unless the caller says otherwise.',
      },
      {
        id: 'rtype',
        kind: 'Type annotation',
        term: 'typehint',
        at: 'function describe(',
        token: '): string',
        note: 'After the closing parenthesis: what the function hands back. Here, text.',
      },
      {
        id: 'const',
        kind: 'const',
        term: 'const',
        at: 'const base = ',
        note: 'A name that will not be reassigned. Most names in TypeScript are declared this way.',
      },
      {
        id: 'tmpl',
        kind: 'Formatted string',
        term: 'fstring',
        at: 'const base = ',
        token: '`${f.host}:${f.port}`',
        note: 'Backticks, with ${...} filled in. The same idea as a Python f-string.',
      },
      {
        id: 'tern',
        kind: 'Inline if',
        term: 'ternary',
        at: 'return verbose ?',
        note: 'If verbose is true, the longer text. Otherwise base.',
      },
    ],
    steps: [
      {
        kind: 'find',
        prompt: 'Click the line that says a Finding may have a field missing.',
        target: 'opt',
        miss: 'Look for the question mark.',
      },
      {
        kind: 'name',
        region: 'rtype',
        choices: [
          { text: 'The return type', why: '' },
          { text: 'A parameter', why: 'Parameters are inside the parentheses. This comes after them.' },
          { text: 'A default value', why: 'A default is written with =. A colon introduces a type.' },
        ],
      },
      {
        kind: 'ask',
        prompt: 'Without reading the body, what do you know about describe?',
        choices: [
          { text: 'It takes a Finding and an optional true or false, and gives back text.', why: '' },
          { text: 'Nothing. The body has to be read.', why: 'The signature states the two inputs and the output. That is the contract.' },
          { text: 'It changes the Finding it is given.', why: 'Nothing in the signature says so, and the return type shows it produces new text.' },
        ],
      },
    ],
    takeaway: 'In TypeScript, read the interface and the signature first. Between them they tell you what goes in, what comes out and what shape the data has.',
  },
  {
    id: 'ts-2',
    stage: 'ts',
    title: 'Imports, exports and arrows',
    lang: 'ts',
    fileName: 'urgent.ts',
    tour: true,
    intro: [
      'TypeScript files are modules, like Python files. The import lines sort into the same groups, and functions are very often written in a compact arrow form.',
    ],
    code: `import { readFile } from "node:fs/promises";
import { z } from "zod";
import type { Finding } from "./types";

export const isUrgent = ({ severity, port }: Finding): boolean =>
  severity === "high" && port < 1024;

export function hosts(findings: Finding[]): string[] {
  return findings.filter(isUrgent).map((f) => f.host);
}`,
    regions: [
      {
        id: 'builtin',
        kind: 'Standard library',
        term: 'stdlib',
        at: 'node:fs/promises',
        note: 'The node: prefix marks something that ships with the runtime.',
      },
      {
        id: 'pkg',
        kind: 'Package',
        term: 'package',
        at: 'from "zod"',
        note: 'A bare name with no ./ in front is an installed package.',
      },
      {
        id: 'local',
        kind: 'Local module',
        term: 'localmod',
        at: 'from "./types"',
        note: 'Starting with ./ means a file next to this one. The word type means only a type is imported, nothing that runs.',
      },
      {
        id: 'export',
        kind: 'Export',
        term: 'export',
        at: 'export const isUrgent',
        token: 'export',
        note: 'export makes the name usable from other files. Names without it stay private to this file.',
      },
      {
        id: 'arrow',
        kind: 'Arrow function',
        term: 'arrow',
        at: 'export const isUrgent',
        to: 'port < 1024;',
        note: 'A function stored in a const. Parameters on the left of =>, the result on the right. No return keyword is needed for a single expression.',
      },
      {
        id: 'destr',
        kind: 'Destructuring',
        term: 'destructuring',
        at: 'export const isUrgent',
        token: '{ severity, port }',
        note: 'Instead of naming the whole Finding, the function pulls out the two fields it needs.',
      },
      {
        id: 'chain',
        kind: 'Chain',
        term: 'chain',
        at: 'findings.filter(',
        token: 'findings.filter(isUrgent).map((f) => f.host)',
        note: 'Keep the urgent ones, then turn each into its host. Left to right, like a Python method chain.',
      },
      {
        id: 'cb',
        kind: 'Callback',
        term: 'callback',
        at: 'findings.filter(',
        token: '(f) => f.host',
        note: 'A small function passed to map, which calls it once per item.',
      },
    ],
    steps: [
      {
        kind: 'find',
        prompt: 'Click the import that is another file in this project.',
        target: 'local',
        miss: 'Look for the path that starts with ./',
      },
      {
        kind: 'name',
        region: 'destr',
        choices: [
          { text: 'Destructuring: taking two fields out of the argument', why: '' },
          { text: 'An object being created', why: 'It is in the parameter position, so it takes values apart instead of putting them together.' },
          { text: 'A block of code', why: 'A block follows the arrow or the parameter list. This is inside the parentheses.' },
        ],
      },
      {
        kind: 'name',
        region: 'cb',
        choices: [
          { text: 'A callback', why: '' },
          { text: 'A type annotation', why: 'There is no colon and no type here. It is a small function.' },
          { text: 'A comparison', why: 'The => is an arrow, not greater-than-or-equal. Comparisons are written >=.' },
        ],
      },
      {
        kind: 'ask',
        prompt: 'What does hosts return?',
        choices: [
          { text: 'The host of every urgent finding, as a list of text.', why: '' },
          { text: 'The urgent findings themselves.', why: 'filter gives those. The map after it then reduces each one to its host.' },
          { text: 'true or false.', why: 'isUrgent gives a boolean. hosts uses it as a test and returns a list.' },
        ],
      },
    ],
    takeaway: 'Arrows are functions. Curly braces in a parameter list are taking an object apart. A path starting with ./ is the project, and a bare name is a package.',
  },
  {
    id: 'ts-3',
    stage: 'ts',
    title: 'Waiting',
    lang: 'ts',
    fileName: 'targets.ts',
    tour: true,
    intro: [
      'Reading a file or calling a server takes time. TypeScript marks code that waits with two words, async and await, and marks its results with the type Promise.',
    ],
    code: `import { readFile } from "node:fs/promises";

export async function loadTargets(path: string): Promise<string[]> {
  try {
    const text = await readFile(path, "utf8");
    return text.split("\\n").filter((line) => line.trim() !== "");
  } catch {
    return [];
  }
}

const targets = await loadTargets("targets.txt");
console.log(targets.length);`,
    regions: [
      {
        id: 'async',
        kind: 'Async function',
        term: 'async',
        at: 'export async function',
        note: 'async means this function can wait. Calling it gives a promise straight away, and the real result arrives later.',
      },
      {
        id: 'prom',
        kind: 'Promise',
        term: 'promise',
        at: 'export async function',
        token: 'Promise<string[]>',
        note: 'Eventually, a list of text. The angle brackets say what the promise will hold.',
      },
      {
        id: 'await',
        kind: 'await',
        term: 'await',
        at: 'const text = await',
        token: 'await readFile(path, "utf8")',
        note: 'Pause here until the file has been read, then carry on with its contents.',
      },
      {
        id: 'try',
        kind: 'Try block',
        term: 'try',
        at: 'try {',
        to: 'filter((line)',
        note: 'The same idea as in Python. catch is the word used instead of except.',
      },
      {
        id: 'catch',
        kind: 'Except block',
        term: 'except',
        at: '} catch {',
        to: 'return [];',
        note: 'Any failure at all gives an empty list. The reason is discarded.',
      },
      {
        id: 'use',
        kind: 'await',
        term: 'await',
        at: 'const targets = await',
        token: 'await loadTargets("targets.txt")',
        note: 'The caller has to wait too. Without await here, targets would be a promise and not a list.',
      },
    ],
    steps: [
      {
        kind: 'find',
        prompt: 'Click the line inside loadTargets where the function pauses.',
        target: 'await',
        miss: 'Look for the word await inside the function.',
      },
      {
        kind: 'ask',
        prompt: 'The file does not exist. What does loadTargets give?',
        choices: [
          { text: 'An empty list. The catch block returns it and says nothing about why.', why: '' },
          { text: 'An error for the caller to handle.', why: 'The catch block absorbs every error and returns [] instead.' },
          { text: 'undefined.', why: 'The catch block has an explicit return of an empty list.' },
        ],
      },
      {
        kind: 'ask',
        prompt: 'What would targets be if the word await were removed from the second-to-last line?',
        choices: [
          { text: 'A promise. The next line would not find a list length on it.', why: '' },
          { text: 'The same list. await is optional.', why: 'An async function always gives a promise. await is what takes the value out.' },
          { text: 'An error at once.', why: 'There is no error at that point. The mistake shows up later, when the promise is used as if it were a list.' },
        ],
      },
    ],
    takeaway: 'async marks a function that waits. await marks each place it does. When results seem to arrive in the wrong order, look for a call to an async function with no await in front.',
  },
  {
    id: 'react-1',
    stage: 'react',
    title: 'Anatomy of a component',
    lang: 'tsx',
    fileName: 'HostRow.tsx',
    tour: true,
    intro: [
      'A web interface built with React is made of components. A component is a function that returns markup, and every one has the same parts.',
      'The questions to ask of any component: what is it given, what does it remember, what does it show, and what happens when something is clicked?',
    ],
    code: `import { useState } from "react";

interface Props {
  host: string;
  onScan: (host: string) => void;
}

export function HostRow({ host, onScan }: Props) {
  const [busy, setBusy] = useState(false);

  function handleClick() {
    setBusy(true);
    onScan(host);
  }

  return (
    <li>
      <span>{host}</span>
      <button onClick={handleClick} disabled={busy}>
        {busy ? "Scanning" : "Scan"}
      </button>
    </li>
  );
}`,
    regions: [
      {
        id: 'props',
        kind: 'Props',
        term: 'props',
        at: 'interface Props {',
        to: 'onScan: (host',
        note: 'What the component is given: a host to show, and a function to call when a scan is wanted.',
      },
      {
        id: 'comp',
        kind: 'Component',
        term: 'component',
        at: 'export function HostRow',
        note: 'A function whose name starts with a capital and which returns markup. That makes it a component.',
      },
      {
        id: 'destr',
        kind: 'Destructuring',
        term: 'destructuring',
        at: 'export function HostRow',
        token: '{ host, onScan }',
        note: 'The props arrive as one object and are taken apart here.',
      },
      {
        id: 'state',
        kind: 'State',
        term: 'state',
        at: 'const [busy, setBusy]',
        note: 'What the component remembers. busy is the current value. setBusy changes it and redraws the component. It starts as false.',
      },
      {
        id: 'handler',
        kind: 'Event handler',
        term: 'handler',
        at: 'function handleClick()',
        to: 'onScan(host);',
        note: 'What happens on a click: remember that it is busy, then tell the parent to scan this host.',
      },
      {
        id: 'jsx',
        kind: 'JSX',
        term: 'jsx',
        at: 'return (',
        to: '  );',
        note: 'What the component shows. It looks like HTML and lives inside the code.',
      },
      {
        id: 'brace',
        kind: 'JSX',
        term: 'jsx',
        at: '<span>{host}</span>',
        token: '{host}',
        note: 'Curly braces inside markup mean "put this value here".',
      },
      {
        id: 'wire',
        kind: 'Event handler',
        term: 'handler',
        at: '<button onClick',
        token: 'onClick={handleClick}',
        note: 'Connects the button to the function. Note there are no parentheses: the function is handed over, not called.',
      },
    ],
    steps: [
      {
        kind: 'find',
        prompt: 'Click the line that declares what this component remembers.',
        target: 'state',
        miss: 'Look for useState.',
      },
      {
        kind: 'find',
        prompt: 'Click the first line of the code that runs when the button is clicked.',
        target: 'handler',
        miss: 'The button names a function in its onClick.',
      },
      {
        kind: 'name',
        region: 'props',
        choices: [
          { text: 'The props: what the component is given', why: '' },
          { text: 'The state: what the component remembers', why: 'State is declared with useState inside the function. This interface describes what comes in from outside.' },
          { text: 'The markup it shows', why: 'The markup is in the return, further down.' },
        ],
      },
      {
        kind: 'ask',
        prompt: 'After a click, what does the button say, and why?',
        choices: [
          { text: 'Scanning, because setBusy(true) redraws the component and the inline if picks the first text.', why: '' },
          { text: 'Scan. Nothing changes the text.', why: 'The text depends on busy, and the click handler sets busy to true.' },
          { text: 'Nothing until the scan has finished.', why: 'The redraw happens as soon as setBusy is called. It does not wait for the parent.' },
        ],
      },
    ],
    takeaway: 'Props come in at the top. State is declared next. Handlers say what a click does. The return says what is shown. Every component you open will have those four.',
  },
  {
    id: 'react-2',
    stage: 'react',
    title: 'A component that loads data',
    lang: 'tsx',
    fileName: 'AlertList.tsx',
    tour: true,
    intro: [
      'Most screens show data that comes from a server. The component asks for it after it appears, stores the answer in state, and draws again.',
    ],
    code: `import { useEffect, useState } from "react";

export function AlertList({ team }: { team: string }) {
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    fetch(\`/api/alerts?team=\${team}\`)
      .then((res) => res.json())
      .then(setAlerts);
  }, [team]);

  if (alerts.length === 0) {
    return <p>No alerts.</p>;
  }

  return (
    <ul>
      {alerts.map((a) => (
        <li key={a}>{a}</li>
      ))}
    </ul>
  );
}`,
    regions: [
      {
        id: 'state',
        kind: 'State',
        term: 'state',
        at: 'const [alerts, setAlerts]',
        note: 'The list of alerts. It starts empty and is filled in when the server answers.',
      },
      {
        id: 'effect',
        kind: 'Effect',
        term: 'effect',
        at: 'useEffect(() => {',
        to: '}, [team]);',
        note: 'Runs after the component is on screen. This is where it reaches out to the server.',
      },
      {
        id: 'fetch',
        kind: 'Call',
        term: 'call',
        at: 'fetch(`/api/alerts',
        note: 'The request. The team name from the props becomes part of the address.',
      },
      {
        id: 'store',
        kind: 'Callback',
        term: 'callback',
        at: '.then(setAlerts);',
        note: 'When the answer arrives, hand it to the setter. That stores it and redraws.',
      },
      {
        id: 'deps',
        kind: 'Dependency array',
        term: 'deps',
        at: '}, [team]);',
        token: '[team]',
        note: 'Run the effect again whenever team changes. With an empty list it would run only once.',
      },
      {
        id: 'empty',
        kind: 'Condition',
        term: 'condition',
        at: 'if (alerts.length === 0)',
        to: 'return <p>No alerts.</p>;',
        note: 'An early return for the empty case. This is what shows first, before the server has answered.',
      },
      {
        id: 'list',
        kind: 'JSX',
        term: 'jsx',
        at: '{alerts.map((a) => (',
        to: '      ))}',
        note: 'One list item per alert. map turns the data into markup.',
      },
    ],
    steps: [
      {
        kind: 'find',
        prompt: 'Click the first line of the code that contacts the server.',
        target: 'effect',
        miss: 'Look for useEffect.',
      },
      {
        kind: 'name',
        region: 'deps',
        choices: [
          { text: 'The dependency array', why: '' },
          { text: 'The data that is sent to the server', why: 'What is sent is in the fetch address. This list only decides when the effect runs again.' },
          { text: 'The starting value of the state', why: 'That is the [] inside useState, further up.' },
        ],
      },
      {
        kind: 'ask',
        prompt: 'What is on screen in the first instant, before the server has answered?',
        choices: [
          { text: 'No alerts. The state starts as an empty list.', why: '' },
          { text: 'Nothing at all.', why: 'The component returns the paragraph for the empty case straight away.' },
          { text: 'The list of alerts.', why: 'The list is empty until the effect has run and the answer has been stored.' },
        ],
      },
      {
        kind: 'ask',
        prompt: 'What causes the list to appear?',
        choices: [
          { text: 'setAlerts stores the answer, which redraws the component with a list that is no longer empty.', why: '' },
          { text: 'The effect draws it directly.', why: 'Effects do not draw. They change state, and the change causes the redraw.' },
          { text: 'The page is reloaded.', why: 'Only this component runs again.' },
        ],
      },
    ],
    takeaway: 'Draw, then fetch, then store, then draw again. When a screen shows the wrong data, the fetch address and the dependency array are the two places to look.',
  },
  {
    id: 'input-1',
    stage: 'input',
    title: 'Sources and sinks',
    lang: 'python',
    fileName: 'ping_service.py',
    tour: true,
    intro: [
      'This stage puts the method to work on the question that matters in security review: can someone outside control something they should not?',
      'It is always the same trace. Find a source. Follow it. See whether anything makes it safe before it reaches a sink.',
    ],
    code: `@app.post("/ping")
def ping():
    host = request.form["host"]
    count = int(request.form.get("count", 1))
    cmd = f"ping -c {count} {host}"
    output = subprocess.run(cmd, shell=True, capture_output=True)
    return output.stdout`,
    regions: [
      {
        id: 'route',
        kind: 'Route',
        term: 'route',
        at: '@app.post("/ping")',
        note: 'Ties the address /ping to the function below. Anyone who can reach the server can call it, so this is an entry point.',
      },
      {
        id: 'src1',
        kind: 'Source',
        term: 'source',
        at: 'host = request.form',
        note: 'Text from the request. The caller chooses it freely.',
      },
      {
        id: 'src2',
        kind: 'Source',
        term: 'source',
        at: 'count = int(',
        note: 'Also from the request, but look at what happens to it on the same line.',
      },
      {
        id: 'safe',
        kind: 'Made safe',
        term: 'neutralize',
        at: 'count = int(',
        token: 'int(request.form.get("count", 1))',
        note: 'int() either produces a whole number or fails. After this, count cannot contain anything but digits.',
      },
      {
        id: 'build',
        kind: 'Hop',
        term: 'hop',
        at: 'cmd = f"ping',
        note: 'Both values are placed into a command line. count is a number. host is still raw text.',
      },
      {
        id: 'sink',
        kind: 'Sink',
        term: 'sink',
        at: 'subprocess.run(cmd',
        note: 'The text is handed to a shell to run. shell=True means characters such as ; and | keep their special meaning.',
      },
    ],
    steps: [
      {
        kind: 'find',
        prompt: 'Click the line where the dangerous value enters.',
        target: 'src1',
        miss: 'Two values come from the request. One of them is converted to a number.',
      },
      {
        kind: 'find',
        prompt: 'Click the line where it does its damage.',
        target: 'sink',
        miss: 'Follow host into cmd, then find where cmd is used.',
      },
      {
        kind: 'name',
        region: 'safe',
        choices: [
          { text: 'A neutralizing step: the value is forced to be a number', why: '' },
          { text: 'A sink', why: 'Nothing is done with the value here except converting it.' },
          { text: 'A hop', why: 'A hop passes the value along unchanged. This changes what it can possibly be.' },
        ],
      },
      {
        kind: 'ask',
        prompt: 'Why is count safe and host not?',
        choices: [
          { text: 'count has been turned into a number. host is still whatever text the caller sent, and it reaches a shell.', why: '' },
          { text: 'Both are unsafe.', why: 'count went through int(), which cannot produce anything but a number.' },
          { text: 'Both are safe, because the command starts with ping.', why: 'A shell treats ; and && as "run another command". Text after one of those is not an argument to ping.' },
        ],
      },
    ],
    takeaway: 'A finding is three lines: the source, the sink, and the absence of anything between them that makes the value safe. Look for all three.',
  },
  {
    id: 'input-2',
    stage: 'input',
    title: 'Checks that hold and checks that do not',
    lang: 'python',
    fileName: 'files_service.py',
    tour: true,
    intro: [
      'Finding a check between source and sink is not the end of the trace. The check has to actually stop the bad input. Some only look as if they do.',
    ],
    code: `UPLOADS = Path("/srv/uploads").resolve()


@app.get("/files/<name>")
def get_file(name):
    if ".." in name:
        abort(400)
    target = (UPLOADS / name).resolve()
    if not target.is_relative_to(UPLOADS):
        abort(403)
    return target.read_text()`,
    regions: [
      {
        id: 'src',
        kind: 'Source',
        term: 'source',
        at: '@app.get("/files/<name>")',
        note: 'The part of the address in angle brackets is passed in as name. The caller types it.',
      },
      {
        id: 'weak',
        kind: 'Weak check',
        term: 'weakcheck',
        at: 'if ".." in name:',
        to: 'abort(400)',
        note: 'Rejects the classic ../ trick. It does nothing about a name that is already a full path, such as /etc/passwd.',
      },
      {
        id: 'norm',
        kind: 'Hop',
        term: 'hop',
        at: 'target = (UPLOADS / name)',
        note: 'Joins the folder and the name, then resolve() works out where that really points. A full path in name replaces the folder entirely.',
      },
      {
        id: 'real',
        kind: 'Access check',
        term: 'authz',
        at: 'if not target.is_relative_to',
        to: 'abort(403)',
        note: 'Asks the question that matters: is the final location inside the uploads folder? Anything else is refused.',
      },
      {
        id: 'sink',
        kind: 'Sink',
        term: 'sink',
        at: 'return target.read_text()',
        note: 'The file is read and returned to the caller.',
      },
    ],
    steps: [
      {
        kind: 'find',
        prompt: 'Click the check that actually keeps the caller inside the uploads folder.',
        target: 'real',
        miss: 'One check looks at the text of the name. The other looks at where the path ends up.',
      },
      {
        kind: 'name',
        region: 'weak',
        choices: [
          { text: 'A weak check', why: '' },
          { text: 'A sink', why: 'Nothing is read or run here. It is a test.' },
          { text: 'The source', why: 'The source is the route line, where name comes in.' },
        ],
      },
      {
        kind: 'ask',
        prompt: 'The second check is removed. A caller asks for the name /etc/passwd. What happens?',
        choices: [
          { text: 'It passes the first check, since there is no .. in it, and the file is read.', why: '' },
          { text: 'The first check refuses it.', why: 'The first check only looks for two dots. This name has none.' },
          { text: 'It is read from /srv/uploads/etc/passwd.', why: 'Joining a folder with a name that is already a full path gives the full path. The folder is dropped.' },
        ],
      },
    ],
    takeaway: 'When you find a check, ask what input gets past it. A check on the final result is usually stronger than a check on the raw text.',
  },
  {
    id: 'input-3',
    stage: 'input',
    title: 'Who is allowed',
    lang: 'python',
    fileName: 'accounts_service.py',
    tour: true,
    intro: [
      'Some flaws have no dangerous-looking line at all. The code is clean, the query is safe, and the problem is a question that was never asked: is this person allowed to do this to that thing?',
    ],
    code: `@app.delete("/accounts/<int:account_id>")
@login_required
def delete_account(account_id):
    account = Account.query.get_or_404(account_id)
    db.session.delete(account)
    db.session.commit()
    return "", 204`,
    regions: [
      {
        id: 'src',
        kind: 'Source',
        term: 'source',
        at: '@app.delete("/accounts/',
        note: 'The caller supplies the account number in the address. int: guarantees it is a number, and nothing more.',
      },
      {
        id: 'authn',
        kind: 'Login check',
        term: 'authn',
        at: '@login_required',
        note: 'Refuses anyone who is not logged in. It establishes who the caller is.',
      },
      {
        id: 'lookup',
        kind: 'Call',
        term: 'call',
        at: 'Account.query.get_or_404',
        note: 'Fetches the account with that number, whoever it belongs to.',
      },
      {
        id: 'sink',
        kind: 'Sink',
        term: 'sink',
        at: 'db.session.delete(account)',
        note: 'The account is deleted.',
      },
    ],
    steps: [
      {
        kind: 'find',
        prompt: 'Click the line that checks the caller is logged in.',
        target: 'authn',
        miss: 'Look at the decorators.',
      },
      {
        kind: 'ask',
        prompt: 'What is never checked?',
        choices: [
          { text: 'That the account belongs to the person deleting it.', why: '' },
          { text: 'That account_id is a number.', why: 'int: in the address guarantees that.' },
          { text: 'That the caller is logged in.', why: '@login_required does that.' },
        ],
      },
      {
        kind: 'find',
        prompt: 'Click the line after which an ownership check should have been added.',
        target: 'lookup',
        miss: 'The check needs the account in hand, and has to happen before anything is deleted.',
      },
      {
        kind: 'ask',
        prompt: 'Which describes this flaw?',
        choices: [
          { text: 'Any logged-in person can delete any account by changing the number in the address.', why: '' },
          { text: 'Anyone on the internet can delete accounts.', why: 'Not quite: they must be logged in. The trouble is that being logged in is all that is asked.' },
          { text: 'The database command can be altered by the caller.', why: 'The value is a number and is used through the library, so the command is not at risk.' },
        ],
      },
    ],
    takeaway: "Logged in is not the same as allowed. For every sink that changes or reveals something, look for a line comparing the thing's owner with the caller. Its absence is the finding.",
  },
  {
    id: 'input-4',
    stage: 'input',
    title: 'The same trace in a component',
    lang: 'tsx',
    fileName: 'Comment.tsx',
    tour: true,
    intro: [
      'The method does not change in the browser. Sources are props and anything fetched from a server. Sinks are the places where text becomes live markup, or where a secret ends up somewhere it can leak.',
    ],
    code: `export function Comment({ author, html }: { author: string; html: string }) {
  const token = localStorage.getItem("session");

  return (
    <article>
      <h3>{author}</h3>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <a href={\`/report?token=\${token}\`}>Report</a>
    </article>
  );
}`,
    regions: [
      {
        id: 'src',
        kind: 'Source',
        term: 'source',
        at: 'export function Comment',
        token: '{ author, html }',
        note: 'Both values were written by another visitor and stored on the server. Treat them as hostile.',
      },
      {
        id: 'safe',
        kind: 'Escaped output',
        term: 'escaped',
        at: '<h3>{author}</h3>',
        note: 'Curly braces insert the value as plain text. If author contains markup, it is shown as characters and does nothing.',
      },
      {
        id: 'sink',
        kind: 'Sink',
        term: 'sink',
        at: 'dangerouslySetInnerHTML',
        note: 'Inserts the value as real markup. A script inside it runs in the browser of whoever views the comment.',
      },
      {
        id: 'secret',
        kind: 'Secret',
        term: 'secret',
        at: 'localStorage.getItem("session")',
        note: 'A session token kept where any script on the page can read it, including one injected through the line above.',
      },
      {
        id: 'leak',
        kind: 'Sink',
        term: 'sink',
        at: '<a href={`/report',
        note: 'The token is placed in an address. Addresses are saved in history and server logs, and passed along to other sites.',
      },
    ],
    steps: [
      {
        kind: 'find',
        prompt: "Click the line where a visitor's text becomes live markup.",
        target: 'sink',
        miss: 'One of the two values is inserted with curly braces. The other is not.',
      },
      {
        kind: 'name',
        region: 'safe',
        choices: [
          { text: 'Escaped output: the value is shown as plain text', why: '' },
          { text: 'A sink', why: 'Curly braces make the value harmless text. This is the safe way to show it.' },
          { text: 'The source', why: 'The source is the parameter list, where the values arrive.' },
        ],
      },
      {
        kind: 'ask',
        prompt: 'Why do the two flaws make each other worse?',
        choices: [
          { text: 'A script injected through the comment can read the token from storage and send it away.', why: '' },
          { text: 'They are unrelated.', why: 'The token sits exactly where an injected script can reach it.' },
          { text: 'The token makes the markup safe.', why: 'The token has no effect on how the markup is inserted.' },
        ],
      },
    ],
    takeaway: 'In a component, search for dangerouslySetInnerHTML and for anything read from storage. Then trace where the value came from and where it goes, exactly as on the server.',
  },
  {
    id: 'whole-1',
    stage: 'whole',
    title: 'A whole service',
    lang: 'python',
    fileName: 'reports_service.py',
    tour: false,
    intro: [
      'A complete file, about sixty lines, with no walkthrough. It has three entry points. Two of them have a flaw and one is done properly.',
      'Do not read it top to bottom. Imports, then entry points, then follow what comes from outside.',
    ],
    code: `"""Small service for sharing scan reports."""
import hashlib
import logging
import os
import sqlite3
import subprocess
from pathlib import Path

from flask import Flask, abort, g, request

from .auth import current_user, login_required

app = Flask(__name__)
log = logging.getLogger("reports")

REPORT_DIR = Path(os.environ.get("REPORT_DIR", "/srv/reports"))
DB_PATH = "reports.db"


def db():
    if "conn" not in g:
        g.conn = sqlite3.connect(DB_PATH)
    return g.conn


def checksum(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def owned_by(report_id, user):
    row = db().execute(
        "SELECT owner FROM reports WHERE id = ?", (report_id,)
    ).fetchone()
    return row is not None and row[0] == user.id


@app.get("/reports/<int:report_id>")
@login_required
def show(report_id):
    if not owned_by(report_id, current_user()):
        abort(403)
    path = REPORT_DIR / f"{report_id}.txt"
    return {"body": path.read_text(), "sha256": checksum(path)}


@app.get("/search")
@login_required
def search():
    term = request.args.get("q", "")
    rows = db().execute(
        "SELECT id, title FROM reports WHERE title LIKE '%" + term + "%'"
    ).fetchall()
    return {"results": [{"id": r[0], "title": r[1]} for r in rows]}


@app.post("/reports/<int:report_id>/export")
@login_required
def export(report_id):
    fmt = request.form.get("format", "pdf")
    src = REPORT_DIR / f"{report_id}.txt"
    out = REPORT_DIR / f"{report_id}.{fmt}"
    log.info("export %s as %s", report_id, fmt)
    subprocess.run(f"pandoc {src} -o {out}", shell=True, check=True)
    return {"file": out.name}`,
    regions: [
      {
        id: 'third',
        kind: 'Package',
        term: 'package',
        at: 'from flask import',
        note: 'Flask, a web framework. request is where outside values will come from.',
      },
      {
        id: 'local',
        kind: 'Local module',
        term: 'localmod',
        at: 'from .auth import',
        note: "The project's own login code.",
      },
      {
        id: 'const',
        kind: 'Constant',
        term: 'constant',
        at: 'REPORT_DIR = Path(',
        to: 'DB_PATH = ',
        note: 'Settings. The folder comes from the environment, with a fallback.',
      },
      {
        id: 'owned',
        kind: 'Access check',
        term: 'authz',
        at: 'def owned_by(',
        to: 'row[0] == user.id',
        note: "Compares a report's owner with a user. The query passes its value separately, with a ? placeholder, which is the safe form.",
      },
      {
        id: 'show',
        kind: 'Route',
        term: 'route',
        at: '@app.get("/reports/<int:report_id>")',
        to: '"sha256": checksum(path)}',
        note: 'Entry point one. Checks ownership before reading anything.',
      },
      {
        id: 'search',
        kind: 'Route',
        term: 'route',
        at: '@app.get("/search")',
        to: 'for r in rows]}',
        note: 'Entry point two.',
      },
      {
        id: 'qsrc',
        kind: 'Source',
        term: 'source',
        at: 'term = request.args.get',
        note: 'Text from the address, chosen by the caller.',
      },
      {
        id: 'qsink',
        kind: 'Sink',
        term: 'sink',
        at: "LIKE '%\" + term",
        note: 'The text is glued into the database command.',
      },
      {
        id: 'export',
        kind: 'Route',
        term: 'route',
        at: '/export")',
        to: 'return {"file": out.name}',
        note: 'Entry point three.',
      },
      {
        id: 'fsrc',
        kind: 'Source',
        term: 'source',
        at: 'fmt = request.form.get',
        note: 'Text from a form, chosen by the caller.',
      },
      {
        id: 'fsink',
        kind: 'Sink',
        term: 'sink',
        at: 'subprocess.run(f"pandoc',
        note: 'The text, by way of the output file name, reaches a shell.',
      },
    ],
    steps: [
      {
        kind: 'find',
        prompt: 'Start with the imports. Click the line that tells you outside values will arrive through an object called request.',
        target: 'third',
        miss: 'Which import brings in a web framework?',
      },
      {
        kind: 'find',
        prompt: 'Click the first line of any entry point.',
        target: 'show',
        miss: 'Entry points here are marked by a decorator that names an address.',
      },
      {
        kind: 'find',
        prompt: 'In search, click the line where an outside value enters.',
        target: 'qsrc',
        miss: 'Look for request inside the search function.',
      },
      {
        kind: 'find',
        prompt: 'Click the line where that value becomes part of a database command.',
        target: 'qsink',
        miss: 'Follow term to where the text of the query is built.',
      },
      {
        kind: 'ask',
        prompt: 'owned_by also builds a query from a value. Why is it not a problem there?',
        choices: [
          { text: 'The value is passed separately, in place of a ?, so it can never become part of the command.', why: '' },
          { text: 'It is a problem there too.', why: 'The command text is fixed. The value travels beside it and is treated only as data.' },
          { text: 'Because report_id is small.', why: 'Size has nothing to do with it. The difference is how the value reaches the database.' },
        ],
      },
      {
        kind: 'find',
        prompt: "In export, click the line where a caller's text reaches a shell.",
        target: 'fsink',
        miss: 'Follow fmt into out, then find where out is used.',
      },
      {
        kind: 'ask',
        prompt: 'export has a second flaw that is not on any single line. What is it?',
        choices: [
          { text: 'It never checks that the report belongs to the caller. show does, and export does not.', why: '' },
          { text: 'It does not require a login.', why: '@login_required is there. Being logged in is all it asks.' },
          { text: 'It logs the format.', why: 'Logging the value is harmless here.' },
        ],
      },
      {
        kind: 'ask',
        prompt: 'Which function could you have skipped entirely?',
        choices: [
          { text: 'checksum. It takes no outside value and only describes a file already chosen.', why: '' },
          { text: 'search.', why: 'search takes text straight from the request.' },
          { text: 'owned_by.', why: 'It is the authorization check, and seeing where it is called and where it is not is the point.' },
        ],
      },
    ],
    takeaway: 'Sixty lines, three entry points, three findings, and you never read from the top. This is the whole method: sort the imports, list the entry points, follow each outside value to its sink, and ask at each sink who is allowed.',
  },
  {
    id: 'whole-2',
    stage: 'whole',
    title: 'A whole component',
    lang: 'tsx',
    fileName: 'NotePage.tsx',
    tour: false,
    intro: [
      'The last lesson. A complete component file with no walkthrough.',
      'Same order as always: imports, the exported component, what it is given and remembers, then follow what comes from outside.',
    ],
    code: `import { useEffect, useState } from "react";
import { marked } from "marked";

import { api } from "./api";
import type { Note } from "./types";

const MAX_TITLE = 80;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US");
}

function shorten(title: string): string {
  return title.length > MAX_TITLE ? title.slice(0, MAX_TITLE) + "..." : title;
}

export function NotePage({ noteId }: { noteId: string }) {
  const [note, setNote] = useState<Note | null>(null);
  const [error, setError] = useState("");
  const isAdmin = localStorage.getItem("role") === "admin";

  useEffect(() => {
    api
      .get<Note>(\`/notes/\${noteId}\`)
      .then(setNote)
      .catch(() => setError("Could not load the note."));
  }, [noteId]);

  async function remove() {
    await api.delete(\`/notes/\${noteId}\`);
    window.location.href = "/notes";
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }
  if (!note) {
    return <p>Loading.</p>;
  }

  return (
    <article>
      <h1>{shorten(note.title)}</h1>
      <p>
        {note.author}, {formatDate(note.created)}
      </p>
      <div dangerouslySetInnerHTML={{ __html: marked.parse(note.body) }} />
      {isAdmin && <button onClick={remove}>Delete note</button>}
    </article>
  );
}`,
    regions: [
      {
        id: 'pkg',
        kind: 'Package',
        term: 'package',
        at: 'from "marked"',
        note: 'A package that turns Markdown text into HTML.',
      },
      {
        id: 'local',
        kind: 'Local module',
        term: 'localmod',
        at: 'from "./api"',
        note: "The project's own code for talking to its server.",
      },
      {
        id: 'helpers',
        kind: 'Helper function',
        term: 'helper',
        at: 'function formatDate(',
        to: 'MAX_TITLE) + "..." : title;',
        note: 'Two small formatting helpers. Their names say enough.',
      },
      {
        id: 'comp',
        kind: 'Component',
        term: 'component',
        at: 'export function NotePage',
        note: 'The exported component. This is where to start.',
      },
      {
        id: 'state',
        kind: 'State',
        term: 'state',
        at: 'const [note, setNote]',
        to: 'const [error, setError]',
        note: 'What it remembers: the note once loaded, and an error message.',
      },
      {
        id: 'role',
        kind: 'Weak check',
        term: 'weakcheck',
        at: 'const isAdmin = ',
        note: 'Decides who is an admin from a value kept in the browser, which the visitor can edit.',
      },
      {
        id: 'effect',
        kind: 'Effect',
        term: 'effect',
        at: 'useEffect(() => {',
        to: '}, [noteId]);',
        note: 'Loads the note from the server when the component appears.',
      },
      {
        id: 'remove',
        kind: 'Event handler',
        term: 'handler',
        at: 'async function remove()',
        to: 'window.location.href',
        note: 'Asks the server to delete the note, then leaves the page.',
      },
      {
        id: 'safe',
        kind: 'Escaped output',
        term: 'escaped',
        at: '<h1>{shorten(note.title)}</h1>',
        note: 'The title is inserted as plain text.',
      },
      {
        id: 'sink',
        kind: 'Sink',
        term: 'sink',
        at: 'dangerouslySetInnerHTML',
        note: 'The note body, written by someone else, is converted to HTML and inserted as live markup.',
      },
      {
        id: 'gate',
        kind: 'Condition',
        term: 'condition',
        at: '{isAdmin && <button',
        note: 'The delete button is shown only when isAdmin is true.',
      },
    ],
    steps: [
      {
        kind: 'find',
        prompt: 'Click the import of code that was installed, not written here.',
        target: 'pkg',
        miss: 'Look for a name with no ./ in front, other than react.',
      },
      {
        kind: 'find',
        prompt: 'Click the first line of the component.',
        target: 'comp',
        miss: 'It is the exported function that returns markup.',
      },
      {
        kind: 'find',
        prompt: 'Click the first line of the code that fetches the note.',
        target: 'effect',
        miss: 'Work that reaches the server lives in an effect.',
      },
      {
        kind: 'find',
        prompt: 'Click the line where text written by another person becomes live markup.',
        target: 'sink',
        miss: 'Two parts of the note are shown. One uses plain curly braces.',
      },
      {
        kind: 'ask',
        prompt: 'The note body passes through marked.parse first. Does that make it safe?',
        choices: [
          { text: 'No. Converting Markdown to HTML keeps any HTML already in the text. Nothing here removes scripts.', why: '' },
          { text: 'Yes. Any processing makes it safe.', why: 'What matters is what the step does. This one produces HTML. It does not clean it.' },
          { text: 'Yes, because the title is escaped.', why: 'The title and the body are inserted in two different ways. Only the title is escaped.' },
        ],
      },
      {
        kind: 'find',
        prompt: 'Click the line that decides whether this visitor is an admin.',
        target: 'role',
        miss: 'Look near the top of the component.',
      },
      {
        kind: 'ask',
        prompt: 'A visitor sets role to admin in their own browser storage. What follows?',
        choices: [
          { text: 'The delete button appears. Whether the delete succeeds depends entirely on a check on the server, which this file does not show.', why: '' },
          { text: 'Nothing. Browser storage cannot be edited.', why: 'It can, by anyone, with the tools built into every browser.' },
          { text: 'They become a real admin.', why: 'They see the button. Real permission is decided by the server when the request arrives.' },
        ],
      },
      {
        kind: 'ask',
        prompt: 'Which parts of the file could you skip?',
        choices: [
          { text: 'formatDate and shorten. Neither sends anything anywhere or decides what a visitor may do.', why: '' },
          { text: 'The effect.', why: 'The effect is where outside data enters the component.' },
          { text: 'The remove function.', why: 'It performs the one destructive action in the file.' },
        ],
      },
    ],
    takeaway: 'That is the course. You opened an unfamiliar file, found its entry point, traced what came from outside, and named what deserved a closer look, including a question this file cannot answer by itself. That last part is what a good review note contains.',
  },
];
