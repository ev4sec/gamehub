import type { Level, World } from './types';

export const WORLDS: World[] = [
  { id: 'basics', title: 'Names and Types', blurb: 'Values, variables, and what a dot means.' },
  { id: 'loops', title: 'Loops', blurb: 'for, while, break, continue.' },
  { id: 'functions', title: 'Functions', blurb: 'What goes in, what comes out, what sticks around.' },
  { id: 'collections', title: 'Lists and Dicts', blurb: 'Arrays, lookups, and shared references.' },
  { id: 'imports', title: 'Imports and Libraries', blurb: 'Where code comes from, and how to find it.' },
  { id: 'wild', title: 'Reading the Wild', blurb: 'Real-looking scripts. Say what they do.' },
];

/*
 * Every predict answer and every write solution here is executed against real
 * Python by `npm run verify:levels`. The text in this file is never trusted on
 * its own, which is the point: a level that teaches the wrong output is worse
 * than no level.
 */
export const LEVELS: Level[] = [
  // ---------------------------------------------------------------- basics
  {
    id: 'basics-1',
    world: 'basics',
    title: 'Top to bottom',
    kind: 'predict',
    concept: [
      'A variable is a name stuck onto a value. The = sign does not mean "equals". It means "make this name point at that value".',
      'Python runs a file from the first line to the last. To read code, do the same: keep a running list of what each name holds.',
    ],
    wild: 'Every script you will ever read starts with names being assigned. Track them on paper if you have to.',
    prompt: 'What does this print?',
    code: `width = 6
height = 4
area = width * height
print(area + 1)`,
    answer: '25',
    hints: ['Work out area first.', 'area is 24 before the +1.'],
    explain: 'area held 24 when print ran, and print showed 24 + 1.',
  },
  {
    id: 'basics-2',
    world: 'basics',
    title: 'Dots and methods',
    kind: 'predict',
    concept: [
      'A dot after a value means "use something that belongs to this". user.upper() calls the upper method that strings have.',
      'Square brackets pick a piece out. user[0] is the first character, because Python counts from zero.',
    ],
    wild: 'When you see thing.something(), ask what type thing is. The answer tells you where to look up what something does.',
    prompt: 'What does this print? Three lines.',
    code: `user = "ada"
print(user.upper() + "!")
print(len(user))
print(user[0])`,
    answer: 'ADA!\n3\na',
    hints: ['+ joins two strings.', 'len counts characters. Index 0 is the first one.'],
    explain: 'upper() returned a new string, "ADA", and + glued the exclamation point on. The original user never changed.',
  },
  {
    id: 'basics-3',
    world: 'basics',
    title: 'Build a string',
    kind: 'write',
    concept: [
      'An f-string is a string with an f in front. Anything inside braces is replaced by its value: f"{host}" becomes whatever host holds.',
    ],
    wild: 'f-strings are how most modern Python builds log lines, URLs, and file paths.',
    prompt: 'Print web01:8080 using the two variables. Do not type the finished text.',
    code: `host = "web01"
port = 8080
# print host and port joined by a colon
`,
    tests: [{ call: '', expect: 'web01:8080' }],
    forbid: [
      { text: '"web01:8080"', why: 'Use the variables instead of the finished text.' },
      { text: "'web01:8080'", why: 'Use the variables instead of the finished text.' },
    ],
    solution: `host = "web01"
port = 8080
print(f"{host}:{port}")`,
    hints: ['Start with print(f"...").', 'Put {host} and {port} inside, with a : between them.'],
    explain: 'The braces were filled from the variables, so changing host or port would change the output with no other edits.',
  },

  // ----------------------------------------------------------------- loops
  {
    id: 'loops-1',
    world: 'loops',
    title: 'The for loop',
    kind: 'predict',
    concept: [
      'for n in range(1, 5) runs the indented block once per value. range(1, 5) starts at 1 and stops before 5, so n takes 1, 2, 3, 4.',
      'Indentation is the structure. Everything indented under the for line is the loop body. The first unindented line is after the loop.',
    ],
    wild: 'A for loop is almost always "do this to every item". Find the thing being looped over, then read the body once.',
    prompt: 'What does this print?',
    code: `total = 0
for n in range(1, 5):
    total += n
print(total)`,
    answer: '10',
    hints: ['n is 1, 2, 3, 4. Not 5.', 'print is not indented, so it runs once, after the loop.'],
    explain: 'total += n adds to total each pass: 1, then 3, then 6, then 10.',
  },
  {
    id: 'loops-2',
    world: 'loops',
    title: 'The while loop',
    kind: 'predict',
    concept: [
      'while repeats as long as its condition is true. Something inside the body has to change the condition, or the loop never ends.',
    ],
    wild: 'while True: with a break inside is the usual shape for retry logic, servers, and polling.',
    prompt: 'What does this print?',
    code: `n = 1
while n < 50:
    n = n * 2
print(n)`,
    answer: '64',
    hints: ['Write down n after each pass: 1, 2, 4, ...', 'The loop stops the first time n is 50 or more.'],
    explain: 'n went 1, 2, 4, 8, 16, 32, 64. 32 was still under 50, so it doubled once more.',
  },
  {
    id: 'loops-3',
    world: 'loops',
    title: 'Write a loop',
    kind: 'write',
    concept: ['You can compute with the loop variable. n * n is n squared.'],
    wild: 'Writing the loop yourself is how you learn to spot the off-by-one in somebody else\'s.',
    prompt: 'Print the squares of 1 through 5, one per line.',
    code: `# print 1, 4, 9, 16, 25 on separate lines
`,
    tests: [{ call: '', expect: '1\n4\n9\n16\n25' }],
    forbid: [{ text: 'print(16)', why: 'Compute the squares in a loop.' }],
    solution: `for n in range(1, 6):
    print(n * n)`,
    hints: ['range(1, 6) gives 1 through 5.', 'print(n * n) inside the loop.'],
    explain: 'range(1, 6) stops before 6, which is why the upper bound is one past the last number you want.',
  },
  {
    id: 'loops-4',
    world: 'loops',
    title: 'continue and break',
    kind: 'predict',
    concept: [
      'continue skips the rest of this pass and moves to the next value. break leaves the loop entirely.',
      '% is the remainder. n % 2 == 0 is true for even numbers.',
    ],
    wild: 'continue and break are how scripts skip bad rows and stop early. They are easy to miss when skimming.',
    prompt: 'What does this print?',
    code: `for n in range(1, 12):
    if n % 2 == 0:
        continue
    if n > 7:
        break
    print(n)`,
    answer: '1\n3\n5\n7',
    hints: ['Even numbers are skipped by continue.', 'At 9 the break fires and the loop ends.'],
    explain: 'Odd numbers printed until 9 tripped the break. 9 never printed, because break came first.',
  },
  {
    id: 'loops-5',
    world: 'loops',
    title: 'Loop plus decision',
    kind: 'write',
    concept: ['Put an if inside the loop to treat some values differently. else covers everything the if did not.'],
    wild: 'Loop, test, act. A huge share of real scripts are exactly this shape.',
    prompt: 'Print 1 to 15, one per line, but print Fizz instead of any multiple of 3.',
    code: `# 1, 2, Fizz, 4, 5, Fizz, ...
`,
    tests: [
      {
        call: '',
        expect: '1\n2\nFizz\n4\n5\nFizz\n7\n8\nFizz\n10\n11\nFizz\n13\n14\nFizz',
      },
    ],
    solution: `for n in range(1, 16):
    if n % 3 == 0:
        print("Fizz")
    else:
        print(n)`,
    hints: ['n % 3 == 0 means n is a multiple of 3.', 'Use if and else inside the for.'],
    explain: 'The condition picked which branch ran on each pass. Same loop, two behaviors.',
  },

  // ------------------------------------------------------------- functions
  {
    id: 'functions-1',
    world: 'functions',
    title: 'Arguments and defaults',
    kind: 'predict',
    concept: [
      'def defines a function. The names in parentheses are parameters. A parameter with = has a default, used when the caller leaves it out.',
      'return hands a value back to whoever called the function.',
    ],
    wild: 'To read a call, find its def. The def tells you what each argument means and what comes back.',
    prompt: 'What does this print? Two lines.',
    code: `def area(w, h=2):
    return w * h

print(area(3))
print(area(3, 5))`,
    answer: '6\n15',
    hints: ['The first call leaves h out.', 'The second call overrides the default.'],
    explain: 'area(3) used h=2 and returned 6. area(3, 5) used h=5.',
  },
  {
    id: 'functions-2',
    world: 'functions',
    title: 'Printing is not returning',
    kind: 'predict',
    concept: [
      'print shows something on screen. return gives a value to the caller. They are different things.',
      'A function with no return line hands back None, Python\'s "nothing here".',
    ],
    wild: 'A very common bug is a function that prints a result when the caller wanted it returned.',
    prompt: 'What does this print? Two lines.',
    code: `def shout(word):
    print(word.upper())

result = shout("hey")
print(result)`,
    answer: 'HEY\nNone',
    hints: ['shout prints once on its own.', 'What does a function with no return give back?'],
    explain: 'The call itself printed HEY. Then result held None, because shout never returned anything.',
  },
  {
    id: 'functions-3',
    world: 'functions',
    title: 'Validate input',
    kind: 'write',
    concept: [
      'A function that answers a yes/no question usually returns a bool, True or False.',
      'Chained comparisons work: 1 <= p <= 65535 reads the way you would say it.',
    ],
    wild: 'Validation helpers are everywhere in scripts that touch ports, IDs, or user input.',
    prompt: 'Return True if p is a valid TCP port, a whole number from 1 to 65535. Otherwise return False.',
    code: `def is_valid_port(p):
    pass
`,
    tests: [
      { call: 'print(is_valid_port(80))', expect: 'True' },
      { call: 'print(is_valid_port(65535))', expect: 'True' },
      { call: 'print(is_valid_port(0))', expect: 'False' },
      { call: 'print(is_valid_port(65536))', expect: 'False' },
      { call: 'print(is_valid_port(-1))', expect: 'False' },
    ],
    solution: `def is_valid_port(p):
    return 1 <= p <= 65535`,
    hints: ['return a comparison directly.', '1 <= p <= 65535'],
    explain: 'A comparison is already a bool, so the function can return it without an if.',
  },
  {
    id: 'functions-4',
    world: 'functions',
    title: 'The mutable default trap',
    kind: 'predict',
    concept: [
      'A default value is built once, when def runs, not each time the function is called.',
      'If that default is a list, every call that uses it shares the same list.',
    ],
    wild: 'This is one of the most famous Python gotchas. Spotting def f(x, items=[]) in review is a real skill.',
    prompt: 'What does this print? Two lines.',
    code: `def add(item, bucket=[]):
    bucket.append(item)
    return bucket

print(add("a"))
print(add("b"))`,
    answer: "['a']\n['a', 'b']",
    hints: ['Is a fresh list made on the second call?', 'Both calls used the default list, the same object.'],
    explain: 'The default list was created once and reused, so the second call saw the first call\'s item. The usual fix is bucket=None and a new list inside.',
  },

  // ----------------------------------------------------------- collections
  {
    id: 'collections-1',
    world: 'collections',
    title: 'Lists and indexes',
    kind: 'predict',
    concept: [
      'A list holds values in order. Positions start at 0, and negative positions count from the end: -1 is the last item.',
      'A slice, ports[1:3], takes items from position 1 up to but not including 3.',
    ],
    wild: 'Lists are what other languages call arrays. Indexes and slices are the bulk of log and data parsing.',
    prompt: 'What does this print? Four lines.',
    code: `ports = [22, 80, 443, 8080]
print(ports[0])
print(ports[-1])
print(len(ports))
print(ports[1:3])`,
    answer: '22\n8080\n4\n[80, 443]',
    hints: ['-1 is the last item.', 'The slice stops before position 3.'],
    explain: 'Slices include the start and exclude the end, the same rule as range.',
  },
  {
    id: 'collections-2',
    world: 'collections',
    title: 'Two names, one list',
    kind: 'predict',
    concept: [
      'b = a does not copy a list. It makes a second name for the same list. Change it through one name and the other sees it.',
      'To get a real copy, use a.copy() or a[:].',
    ],
    wild: 'Surprise edits to data you thought was separate are a classic bug source, and a classic thing to look for in a code review.',
    prompt: 'What does this print? Two lines.',
    code: `a = [1, 2, 3]
b = a
b.append(4)
print(a)
print(len(b))`,
    answer: '[1, 2, 3, 4]\n4',
    hints: ['Is b a copy of a?', 'append changes the list itself.'],
    explain: 'a and b both pointed at one list. The append through b was visible through a.',
  },
  {
    id: 'collections-3',
    world: 'collections',
    title: 'Accumulate with a loop',
    kind: 'write',
    concept: ['Start a result variable before the loop, update it inside, return it after.'],
    wild: 'Start, loop, update, return. The same skeleton shows up in nearly every data-handling function.',
    prompt: 'Return the sum of the numbers in nums using a loop. Do not use sum().',
    code: `def total(nums):
    pass
`,
    tests: [
      { call: 'print(total([1, 2, 3]))', expect: '6' },
      { call: 'print(total([]))', expect: '0' },
      { call: 'print(total([10, -4]))', expect: '6' },
    ],
    forbid: [{ text: 'sum(', why: 'Write the loop yourself. This level is about the loop.' }],
    solution: `def total(nums):
    result = 0
    for n in nums:
        result += n
    return result`,
    hints: ['Start with result = 0.', 'for n in nums: result += n'],
    explain: 'An empty list never enters the loop, so result stays 0. Starting value matters.',
  },
  {
    id: 'collections-4',
    world: 'collections',
    title: 'Find the longest',
    kind: 'write',
    concept: ['Track the best item so far. Compare each new item against it, and swap when the new one wins.'],
    wild: 'Max, min, first match, last match: all of them are "keep the best so far" loops.',
    prompt: 'Return the longest string in words. You may assume the list is not empty.',
    code: `def longest(words):
    pass
`,
    tests: [
      { call: 'print(longest(["tea", "coffee", "milk"]))', expect: 'coffee' },
      { call: 'print(longest(["a"]))', expect: 'a' },
      { call: 'print(longest(["aa", "b", "ccc", "dd"]))', expect: 'ccc' },
    ],
    solution: `def longest(words):
    best = words[0]
    for word in words:
        if len(word) > len(best):
            best = word
    return best`,
    hints: ['Start best as the first word.', 'Compare len(word) to len(best).'],
    explain: 'best was updated only when a word was strictly longer, so ties keep the earlier word.',
  },
  {
    id: 'collections-5',
    world: 'collections',
    title: 'List comprehensions',
    kind: 'write',
    concept: [
      '[n for n in nums if n % 2 == 0] builds a new list in one line: take each n, keep it if the test passes.',
      'Read it left to right as "n, for each n in nums, if the test passes".',
    ],
    wild: 'Comprehensions are dense, so you will meet them constantly in other people\'s code. Reading them is the skill that matters.',
    prompt: 'Return a new list with only the even numbers from nums.',
    code: `def evens(nums):
    pass
`,
    tests: [
      { call: 'print(evens([1, 2, 3, 4]))', expect: '[2, 4]' },
      { call: 'print(evens([7, 9]))', expect: '[]' },
      { call: 'print(evens([0, 10, 11]))', expect: '[0, 10]' },
    ],
    solution: `def evens(nums):
    return [n for n in nums if n % 2 == 0]`,
    hints: ['A for loop with append works too.', '[n for n in nums if ...]'],
    explain: 'Either a loop with append or a comprehension is correct. The comprehension says the same thing in one line.',
  },
  {
    id: 'collections-6',
    world: 'collections',
    title: 'Dictionaries',
    kind: 'predict',
    concept: [
      'A dict maps keys to values. d[key] looks up, d[key] = v stores. .items() gives (key, value) pairs to loop over.',
      '.get(key, fallback) looks up without crashing when the key is missing. "key in d" asks whether it exists.',
    ],
    wild: 'JSON, configs, API responses, and logs all become dicts. Lookups are the most common operation you will read.',
    prompt: 'What does this print? Five lines.',
    code: `ports = {"ssh": 22, "http": 80}
ports["https"] = 443
for name, number in ports.items():
    print(name, number)
print(ports.get("ftp", "unknown"))
print("http" in ports)`,
    answer: 'ssh 22\nhttp 80\nhttps 443\nunknown\nTrue',
    hints: ['Dicts keep insertion order.', 'ftp is not a key, so get returns the fallback.'],
    explain: 'The new key was added at the end. get gave the fallback because ftp was never stored.',
  },
  {
    id: 'collections-7',
    world: 'collections',
    title: 'Count things',
    kind: 'write',
    concept: ['Use a dict as a tally: if the key is there, add 1, otherwise start it at 1. d.get(key, 0) + 1 does both in one step.'],
    wild: 'Counting is the heart of log analysis: failed logins per IP, hits per URL, events per host.',
    prompt: 'Return a dict mapping each word to how many times it appears. Do not import anything yet.',
    code: `def count_words(words):
    pass
`,
    tests: [
      { call: 'print(sorted(count_words(["a", "b", "a"]).items()))', expect: "[('a', 2), ('b', 1)]" },
      { call: 'print(count_words([]))', expect: '{}' },
      { call: 'print(count_words(["x", "x", "x"]))', expect: "{'x': 3}" },
    ],
    forbid: [{ text: 'Counter', why: 'Count by hand this time. Counter shows up in the next world.' }],
    solution: `def count_words(words):
    counts = {}
    for word in words:
        counts[word] = counts.get(word, 0) + 1
    return counts`,
    hints: ['Start with an empty dict.', 'counts[word] = counts.get(word, 0) + 1'],
    explain: 'get with a default of 0 handled the first sighting of each word without an if.',
  },

  // --------------------------------------------------------------- imports
  {
    id: 'imports-1',
    world: 'imports',
    title: 'Where does json live?',
    kind: 'locate',
    concept: [
      'Code you did not write comes from one of three places. The standard library ships with Python itself. Third-party packages are installed with pip into a folder called site-packages. Local modules are .py files in your own project.',
      'When Python sees import json it looks in the script\'s own folder first, then the standard library, then site-packages. The first match wins.',
      'The inspector at the bottom of this screen asks real Python where a module is. Use it.',
    ],
    wild: 'This is the first question to ask of any import in unfamiliar code: whose code is this, and where is it on disk?',
    prompt: 'Where does the json module come from? Try the inspector first.',
    code: `import json

data = json.loads('{"user": "ada"}')
print(data["user"])`,
    choices: [
      'The standard library. It ships with Python.',
      'A third-party package someone must pip install.',
      'A file in this project.',
    ],
    correct: 0,
    inspect: 'json',
    hints: ['Look at the origin path in the inspector.', 'A path inside Python\'s own lib folder means standard library.'],
    explain: 'The origin path is inside Python\'s lib folder, so json is standard library. You can open that file and read exactly what json.loads does.',
  },
  {
    id: 'imports-2',
    world: 'imports',
    title: 'Where does requests live?',
    kind: 'locate',
    concept: [
      'A name that is not in the standard library and not in the project must be installed. Projects list those in a file such as requirements.txt, and pip install -r requirements.txt fetches them.',
      'Here the inspector reports requests as not installed, because this sandbox has no pip packages. On a real machine after installing, the origin would point into site-packages.',
    ],
    wild: 'Reading requirements.txt (or pyproject.toml) tells you every outside dependency a project trusts. In a security review, that list is the supply chain.',
    prompt: 'Where does requests come from?',
    code: `import requests

resp = requests.get("https://example.com/api")
print(resp.status_code)`,
    files: [{ name: 'requirements.txt', code: 'requests==2.32.3' }],
    choices: [
      'The standard library.',
      'A third-party package, installed with pip.',
      'A file in this project.',
    ],
    correct: 1,
    inspect: 'requests',
    hints: ['Check the inspector, then read the second file.', 'requirements.txt lists it by name and version.'],
    explain: 'requests is not in the standard library, and it is pinned in requirements.txt. That makes it a third-party dependency.',
  },
  {
    id: 'imports-3',
    world: 'imports',
    title: 'A neighbor file',
    kind: 'locate',
    concept: [
      'from netutils import clean_host means: open the module netutils, take the name clean_host out of it. The first word is the module. The second is the thing inside.',
      'If a file named netutils.py sits next to the script, that is the module Python finds first.',
    ],
    wild: 'In a large project, most imports are local. Following them across files is the core reading skill, like following a function call in a debugger.',
    prompt: 'Where does clean_host come from?',
    code: `from netutils import clean_host

print(clean_host("  Web01.Example.COM "))`,
    files: [
      {
        name: 'netutils.py',
        code: `def clean_host(raw):
    return raw.strip().lower()`,
      },
    ],
    choices: [
      'The standard library.',
      'A third-party package, installed with pip.',
      'netutils.py, a file in this project.',
    ],
    correct: 2,
    inspect: 'netutils',
    hints: ['Look at the second file in the panel.', 'The def is right there.'],
    explain: 'The def for clean_host is in netutils.py, a local file. The inspector cannot find netutils here because the file only exists in this lesson.',
  },
  {
    id: 'imports-4',
    world: 'imports',
    title: 'collections.Counter',
    kind: 'predict',
    concept: [
      'from collections import Counter pulls one name out of a standard library module.',
      'Counter is a dict subclass for tallying. Counter("abc") counts characters. .most_common(n) returns the n biggest as (item, count) pairs. A missing key counts as 0 instead of crashing.',
    ],
    wild: 'Counter is how a lot of real scripts turn raw logs into "top offenders". You just wrote the by-hand version.',
    prompt: 'What does this print? Two lines.',
    code: `from collections import Counter

counts = Counter("mississippi")
print(counts.most_common(2))
print(counts["z"])`,
    answer: "[('i', 4), ('s', 4)]\n0",
    inspect: 'collections',
    hints: ['i and s each appear four times.', 'Ties keep the order they were first seen.'],
    explain: 'i appeared before s, so it comes first among the ties. And z was never counted, so it reads as 0.',
  },
  {
    id: 'imports-5',
    world: 'imports',
    title: 'Aliases',
    kind: 'predict',
    concept: [
      'import math as m gives the module a shorter local name. from math import floor as f pulls one name out and renames it.',
      'Aliases hide the origin. If you see m.sqrt, you have to scroll up to learn that m is math.',
    ],
    wild: 'import numpy as np and import pandas as pd are universal conventions. Unusual aliases are worth a second look.',
    prompt: 'What does this print? Three lines.',
    code: `import math as m
from math import floor as f

print(m.pi > 3)
print(f(2.7))
print(m.sqrt(49))`,
    answer: 'True\n2\n7.0',
    inspect: 'math',
    hints: ['floor rounds down.', 'sqrt always returns a float.'],
    explain: 'floor(2.7) is 2, a whole number. sqrt(49) is 7.0 because sqrt returns floats even when the answer is whole.',
  },
  {
    id: 'imports-6',
    world: 'imports',
    title: 'Use json',
    kind: 'write',
    concept: [
      'json.loads(text) turns JSON text into Python dicts, lists, strings and numbers. After that you index it like any dict.',
    ],
    wild: 'APIs, configs, and log pipelines are mostly JSON. loads is the doorway.',
    prompt: 'Return the value stored under "user" in the JSON text raw. Import json to do it.',
    code: `def get_user(raw):
    pass
`,
    tests: [
      { call: 'print(get_user(\'{"user": "ada", "id": 7}\'))', expect: 'ada' },
      { call: 'print(get_user(\'{"id": 1, "user": "bob"}\'))', expect: 'bob' },
    ],
    forbid: [{ text: 'split(', why: 'Parse it with the json module instead of cutting the text.' }],
    solution: `import json

def get_user(raw):
    return json.loads(raw)["user"]`,
    inspect: 'json',
    hints: ['import json at the top.', 'json.loads(raw) gives a dict.'],
    explain: 'The order of keys in the text did not matter, because after loads it is a dict and you looked the value up by key.',
  },
  {
    id: 'imports-7',
    world: 'imports',
    title: 'Hash it with hashlib',
    kind: 'write',
    concept: [
      'hashlib is in the standard library. hashlib.sha256(data).hexdigest() returns the SHA-256 hash as a hex string.',
      'Hashing works on bytes, not text. text.encode() turns a string into bytes.',
    ],
    wild: 'Hashing files and strings is routine in malware triage, integrity checks, and de-duplication. Recognizing it on sight matters.',
    prompt: 'Return the first 8 hex characters of the SHA-256 hash of text.',
    code: `def short_hash(text):
    pass
`,
    tests: [
      { call: 'print(short_hash("hello"))', expect: '2cf24dba' },
      { call: 'print(short_hash(""))', expect: 'e3b0c442' },
    ],
    solution: `import hashlib

def short_hash(text):
    return hashlib.sha256(text.encode()).hexdigest()[:8]`,
    inspect: 'hashlib',
    hints: ['import hashlib', 'hashlib.sha256(text.encode()).hexdigest() then slice with [:8]'],
    explain: 'The slice at the end took the first 8 characters of the 64-character digest.',
  },

  // ------------------------------------------------------------------ wild
  {
    id: 'wild-1',
    world: 'wild',
    title: 'The log parser',
    kind: 'read',
    concept: [
      'Read a script the way you read a report: first the imports for capabilities, then the data it takes in, then what it does to it, then what it puts out.',
      'line.split() cuts a line into words. [-4] counts from the end.',
    ],
    wild: 'Tiny parsers like this one sit behind a lot of detection and reporting work.',
    prompt: 'What does this script report? A typical matching line looks like: Failed password for root from 203.0.113.9 port 4242 ssh2',
    code: `from collections import Counter

failed = []
with open("auth.log") as log:
    for line in log:
        if "Failed password" in line:
            ip = line.split()[-4]
            failed.append(ip)

for ip, hits in Counter(failed).most_common(3):
    print(ip, hits)`,
    choices: [
      'The three IP addresses with the most failed password attempts, with their counts.',
      'The three most recent failed logins.',
      'Every IP address that logged in successfully.',
      'The three usernames with the most failures.',
    ],
    correct: 0,
    inspect: 'collections',
    hints: ['Which word does [-4] pick out of the sample line?', 'Counter(...).most_common(3) is a top-three tally.'],
    explain: '[-4] lands on the IP in that line format. Counting those and taking the top three gives the noisiest sources.',
  },
  {
    id: 'wild-2',
    world: 'wild',
    title: 'What do the imports admit?',
    kind: 'read',
    concept: [
      'Imports are a capability list. urllib reaches the network. os touches the file system. subprocess runs other programs. Seeing all three together is a pattern.',
    ],
    wild: 'Before reading any script line by line, read its imports. They tell you what the author could possibly be doing.',
    prompt: 'Which description fits this script best?',
    code: `import os
import subprocess
import urllib.request

url = "http://files.example.net/update.bin"
urllib.request.urlretrieve(url, "/tmp/update.bin")
os.chmod("/tmp/update.bin", 0o755)
subprocess.run(["/tmp/update.bin"])`,
    choices: [
      'It downloads a file over plain HTTP, makes it executable, and runs it.',
      'It reads a local configuration file.',
      'It only checks whether an update exists.',
      'It installs a Python package.',
    ],
    correct: 0,
    inspect: 'subprocess',
    hints: ['What does 0o755 do?', 'The last line runs the file that was just downloaded.'],
    explain: 'Download, mark executable, run. Nothing verifies what was fetched, and plain HTTP can be tampered with in transit. That pattern deserves scrutiny.',
  },
  {
    id: 'wild-3',
    world: 'wild',
    title: 'Do not run it',
    kind: 'read',
    concept: [
      'base64 is an encoding, not encryption. Anyone can reverse it. exec() runs whatever text or bytes it is given, as code.',
      'Encoded blobs fed into exec are a standard way to hide what a script does from a casual reader.',
    ],
    wild: 'You will see this exact shape in obfuscated scripts. The safe move is to turn exec into print and read the output.',
    prompt: 'What is the safest way to find out what this script does?',
    code: `import base64

payload = "cHJpbnQoJ2hlbGxvJyk="
exec(base64.b64decode(payload))`,
    choices: [
      'Run it and see what happens.',
      'Decode the payload and read it, without calling exec.',
      'Trust it. base64 is just encoding.',
      'Check whether base64 is installed.',
    ],
    correct: 1,
    inspect: 'base64',
    hints: ['Which line is dangerous?', 'b64decode alone does not run anything.'],
    explain: 'Replacing exec(...) with print(...) shows the decoded text without running it. Here it decodes to print(\'hello\'). In a hostile sample it would not be so friendly.',
  },
  {
    id: 'wild-4',
    world: 'wild',
    title: 'Follow the chain',
    kind: 'read',
    concept: [
      'Real programs are several files. To know what main.py prints, follow each import to the file that defines the name, and read the function bodies from the inside out.',
    ],
    wild: 'This is exactly what "where is it and what is it" means when reading a repository.',
    prompt: 'What does main.py print?',
    code: `from report import summary

print(summary([3, 9, 4]))`,
    files: [
      {
        name: 'report.py',
        code: `from stats import biggest

def summary(values):
    return "max=" + str(biggest(values))`,
      },
      {
        name: 'stats.py',
        code: `def biggest(values):
    return max(values)`,
      },
    ],
    choices: ['9', 'max=9', 'max=[3, 9, 4]', 'It raises an ImportError.'],
    correct: 1,
    hints: ['Start from the innermost function, biggest.', 'summary adds the text "max=" in front.'],
    explain: 'biggest returned 9, summary turned it into "max=9", and main printed that. Three files, one line of output.',
  },
  {
    id: 'wild-5',
    world: 'wild',
    title: 'The string-built query',
    kind: 'read',
    concept: [
      'When code builds a query by gluing strings together with +, anything inside name becomes part of the query itself.',
      'The safe form passes the value separately: cursor.execute("... WHERE name = ?", (name,)).',
    ],
    wild: 'String-built SQL is a long-running source of injection bugs. Spotting it takes seconds once you know the shape.',
    prompt: 'What is the problem with this code?',
    code: `query = "SELECT * FROM users WHERE name = '" + name + "'"
cursor.execute(query)`,
    choices: [
      'Nothing. This is the standard way to write it.',
      'If name contains a quote and extra SQL, it changes the query: SQL injection.',
      'SELECT * is slow.',
      'The variable should be called sql, not query.',
    ],
    correct: 1,
    hints: ['What if name were: x\' OR \'1\'=\'1 ?', 'The value is pasted into the query text itself.'],
    explain: 'A name like x\' OR \'1\'=\'1 turns the WHERE clause into something that matches every row. Parameterized queries keep data and query separate.',
  },
];

export function levelById(id: string): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}

export function levelsIn(world: string): Level[] {
  return LEVELS.filter((l) => l.world === world);
}
