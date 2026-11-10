import { TS_LEVELS, TS_WORLDS } from './tsLevels';
import type { Level, Track, World } from './types';

const PYTHON_WORLDS: World[] = [
  { id: 'basics', track: 'python', title: 'Names and Types', blurb: 'Values, variables, and what a dot means.' },
  { id: 'loops', track: 'python', title: 'Loops', blurb: 'for, while, break, continue.' },
  { id: 'functions', track: 'python', title: 'Functions', blurb: 'What goes in, what comes out, what sticks around.' },
  { id: 'collections', track: 'python', title: 'Lists and Dicts', blurb: 'Arrays, lookups, and shared references.' },
  { id: 'imports', track: 'python', title: 'Imports and Libraries', blurb: 'Where code comes from, and how to find it.' },
  {
    id: 'handed',
    track: 'python',
    title: 'Code You Are Handed',
    blurb: 'The shapes modern Python reaches for, and what each one is doing there.',
  },
  { id: 'wild', track: 'python', title: 'Reading the Wild', blurb: 'Real-looking scripts. Say what they do.' },
];

/*
 * Every predict answer and every write solution here is executed against real
 * Python by `npm run verify:levels`. The text in this file is never trusted on
 * its own, which is the point: a level that teaches the wrong output is worse
 * than no level.
 */
const PYTHON_LEVELS: Level[] = [
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
    mistakes: [
      { answer: '24', why: 'That is what area holds. The last line prints area + 1.' },
    ],
    variants: [
      {
        code: `price = 8
count = 3
total = price * count
count = 5
print(total)`,
        answer: '24',
        mistakes: [
          { answer: '40', why: 'total was worked out on line 3, when count was 3. Changing count afterward does not go back and redo that line.' },
        ],
        explain: 'total was computed once, from the values at that moment. Reassigning count later changed count and nothing else.',
      },
      {
        code: `x = 5
y = x
x = 9
print(y)
print(x + y)`,
        answer: '5\n14',
        mistakes: [
          { answer: '9\n18', why: 'y = x gave y the value x held at that moment, 5. It did not tie y to x, so the later x = 9 left y alone.' },
        ],
        explain: 'y took the value 5 on line 2 and kept it. Only x was changed on line 3.',
      },
    ],
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
    mistakes: [
      { answer: 'ADA!\n3\nA', why: 'upper() handed print a new string. user itself is still "ada", so user[0] is lowercase.' },
      { answer: 'ADA!\n3\nd', why: 'Positions start at 0, so user[0] is the first character, not the second.' },
    ],
    variants: [
      {
        code: `host = "Web01"
print(host.lower())
print(host[1])
print(host[-1])
print(host)`,
        answer: 'web01\ne\n1\nWeb01',
        mistakes: [
          { answer: 'web01\ne\n1\nweb01', why: 'lower() hands back a new string. host was never reassigned, so the last line still shows the original.' },
          { answer: 'web01\nW\n1\nWeb01', why: 'Positions start at 0. host[1] is the second character.' },
        ],
        explain: 'String methods return new strings. Unless the result is assigned back to host, host is unchanged.',
      },
      {
        code: `word = "python"
print(word[0] + word[-1])
print(len(word) * 2)
print(word.replace("p", "j"))`,
        answer: 'pn\n12\njython',
        mistakes: [
          { answer: 'p n\n12\njython', why: '+ joins two strings with nothing between them.' },
        ],
        explain: 'word[0] and word[-1] are the first and last characters, and + glued them together directly.',
      },
    ],
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

  {
    id: 'basics-4',
    world: 'basics',
    title: 'Reading an f-string',
    kind: 'predict',
    concept: [
      'An f-string is a string with an f in front. Anything inside braces is worked out and replaced by its value: f"{host}" becomes whatever host holds.',
      'The braces can hold more than a name. f"{port + 1}" does the arithmetic first. Without the f, braces are just characters.',
    ],
    wild: 'f-strings are how most modern Python builds log lines, URLs, error messages and file paths. You will see one in nearly every function you are handed.',
    prompt: 'What does this print? Three lines.',
    code: `host = "web01"
port = 8080
label = f"{host}:{port}"
print(label)
print(f"{port + 1} is next")
print(len(label))`,
    answer: 'web01:8080\n8081 is next\n10',
    mistakes: [
      { answer: 'web01:8080\n8080 + 1 is next\n10', why: 'Whatever is inside the braces is worked out first. port + 1 is computed, then placed in the text.' },
    ],
    variants: [
      {
        code: `name = "ada"
tries = 3
print(f"{name.upper()} has {tries} tries")
print("{name} has {tries} tries")
print(f"{tries * 2}{name[0]}")`,
        answer: 'ADA has 3 tries\n{name} has {tries} tries\n6a',
        mistakes: [
          { answer: 'ADA has 3 tries\nada has 3 tries\n6a', why: 'The second string has no f in front, so its braces are ordinary characters and nothing is filled in.' },
        ],
        explain: 'Only the strings marked with f were filled in. A missing f is a common real bug, and it looks exactly like the middle line.',
      },
    ],
    hints: ['The colon between the braces is just a colon.', 'label is 10 characters: five, a colon, and four.'],
    explain: 'Each pair of braces was replaced by a value, and the rest of the text was kept as written.',
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
    mistakes: [
      { answer: '15', why: 'range(1, 5) stops before 5, so n is 1, 2, 3, 4.' },
      { answer: '1\n3\n6\n10', why: 'print is not indented under the for, so it runs once, after the loop ends.' },
    ],
    variants: [
      {
        code: `count = 0
for n in range(3):
    count += 2
    print(count)
print("done")`,
        answer: '2\n4\n6\ndone',
        mistakes: [
          { answer: '6\ndone', why: 'The first print is indented, so it is inside the loop and runs on every pass.' },
          { answer: '2\n4\n6\n8\ndone', why: 'range(3) gives 0, 1, 2. That is three passes, not four.' },
        ],
        explain: 'The indented print ran once per pass. The unindented one ran once, after the loop.',
      },
      {
        code: `total = 1
for n in range(2, 5):
    total = total * n
print(total)`,
        answer: '24',
        mistakes: [
          { answer: '120', why: 'range(2, 5) stops before 5, so n is 2, 3, 4.' },
        ],
        explain: 'total went 1, 2, 6, 24. The loop multiplied by 2, 3 and 4, and never saw 5.',
      },
    ],
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
    mistakes: [
      { answer: '32', why: 'The check happens before each pass. When n is 32, 32 < 50 is still true, so the body runs once more.' },
    ],
    variants: [
      {
        code: `n = 100
steps = 0
while n > 10:
    n = n // 2
    steps += 1
print(n, steps)`,
        answer: '6 4',
        mistakes: [
          { answer: '12 3', why: '12 > 10 is still true, so the loop runs once more.' },
          { answer: '6.25 4', why: '// is whole-number division. It drops the fraction, so 25 // 2 is 12.' },
        ],
        explain: 'n went 100, 50, 25, 12, 6. The loop only stopped once n was 10 or less.',
      },
      {
        code: `n = 3
while n > 0:
    print(n)
    n -= 1
print("go")`,
        answer: '3\n2\n1\ngo',
        mistakes: [
          { answer: '3\n2\n1\n0\ngo', why: 'When n reaches 0, the check n > 0 is false and the body does not run again.' },
        ],
        explain: 'The condition was tested before each pass. At 0 it failed, so 0 was never printed.',
      },
    ],
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
    mistakes: [
      { answer: '1\n3\n5\n7\n9', why: 'At 9, break runs before print is reached.' },
      { answer: '1\n3\n5\n7\n9\n11', why: 'break leaves the loop entirely. Nothing after 9 is looked at.' },
    ],
    variants: [
      {
        code: `for word in ["ok", "skip", "ok", "stop", "ok"]:
    if word == "skip":
        continue
    if word == "stop":
        break
    print(word)
print("end")`,
        answer: 'ok\nok\nend',
        mistakes: [
          { answer: 'ok\nok\nok\nend', why: 'break ends the loop. The last ok is never reached.' },
          { answer: 'ok\nok', why: 'The final print is not indented, so it runs after the loop, even when the loop ended with break.' },
        ],
        explain: 'continue skipped one item. break ended the loop with one item still unread. Code after the loop ran either way.',
      },
      {
        code: `n = 0
while True:
    n += 3
    if n % 2 == 0:
        continue
    if n > 12:
        break
    print(n)`,
        answer: '3\n9',
        mistakes: [
          { answer: '3\n9\n15', why: '15 is greater than 12, so break runs before print.' },
        ],
        explain: '6 and 12 were skipped by continue. 15 tripped the break, which is the only way out of while True.',
      },
    ],
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

  {
    id: 'loops-6',
    world: 'loops',
    title: 'Off by one',
    kind: 'fix',
    concept: [
      'range(start, stop, step) counts by step and stops before stop. With a step of -1 it counts down, and it still never produces stop itself.',
      'Most loop bugs live at the edges. Before reading anything else, work out the first value and the last value by hand.',
    ],
    wild: 'Fixing code you did not write starts the same way every time: reproduce the report, then find the one line that disagrees with it.',
    prompt: 'Bug report: countdown(3) should print 3, 2, 1 and then Liftoff. It stops at 2. Fix it.',
    code: `def countdown(start):
    for n in range(start, 1, -1):
        print(n)
    print("Liftoff")
`,
    tests: [
      { call: 'countdown(3)', expect: '3\n2\n1\nLiftoff' },
      { call: 'countdown(1)', expect: '1\nLiftoff' },
    ],
    solution: `def countdown(start):
    for n in range(start, 0, -1):
        print(n)
    print("Liftoff")`,
    hints: ['What is the last value range(3, 1, -1) produces?', 'The stop value is never produced. To include 1, stop at 0.'],
    explain: 'range never produces its stop value, counting up or down. Stopping at 0 is what makes 1 the last number printed.',
  },

  {
    id: 'loops-7',
    world: 'loops',
    title: 'Name what a loop does',
    kind: 'read',
    concept: [
      'To say what a loop is for, find the variable that survives the loop, then look only at the lines that change it.',
      'Three shapes cover most loops. A counter goes up by 1. A total goes up by the item. A best-so-far is replaced by the item.',
    ],
    wild: 'Most functions you are handed are one of these loops with a condition in front. Naming the shape is faster than tracing every pass.',
    prompt: 'What does summarize return?',
    code: `def summarize(readings):
    high = 0
    for value in readings:
        if value < 0:
            continue
        if value > 100:
            high += 1
    return high`,
    choices: [
      'How many readings are above 100.',
      'The largest reading.',
      'The sum of the readings above 100.',
      'How many readings are not negative.',
    ],
    correct: 0,
    whyNot: [
      '',
      'high is never set to a reading. It only ever has 1 added to it.',
      'high += 1 adds one per match. Adding the reading itself would be high += value.',
      'Negative readings are skipped, but the count only goes up inside the second if.',
    ],
    hints: ['Which line changes high?', 'It adds 1, and only when value > 100.'],
    explain: 'high starts at 0 and goes up by one for each reading over 100. That is a counter. The continue only removes negatives, which could never have counted anyway.',
  },
  {
    id: 'loops-8',
    world: 'loops',
    title: 'Spot the off-by-one',
    kind: 'read',
    concept: [
      'range(start, stop, step) counts by step and stops before stop. With a step of -1 it counts down, and it still never produces stop itself.',
      'When output is one item short or one item long, look at the edges of the loop before anything else.',
    ],
    wild: 'Off-by-one is the most common loop bug there is. When you review code, check the first and last value of every range by hand.',
    prompt: 'countdown(3) should print 3, 2, 1, Liftoff. It prints 3, 2, Liftoff. Why?',
    code: `def countdown(start):
    for n in range(start, 1, -1):
        print(n)
    print("Liftoff")`,
    choices: [
      'range stops before its stop value, so stopping at 1 never produces 1.',
      'The step of -1 skips every other number.',
      'print("Liftoff") is inside the loop.',
      'range cannot count down.',
    ],
    correct: 0,
    whyNot: [
      '',
      'A step of -1 moves one at a time. 3 and 2 both printed, so nothing was skipped.',
      'It is indented level with for, so it runs once, after the loop. Liftoff printed once.',
      'It can, with a negative step. It printed 3 then 2.',
    ],
    hints: ['What is the last value range(3, 1, -1) produces?', 'The stop value is never produced, counting up or down.'],
    explain: 'range(3, 1, -1) gives 3 and 2. To include 1 the stop has to be 0.',
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
    mistakes: [
      { answer: '3\n15', why: 'With h left out, the default h=2 is used, so the first call multiplies 3 by 2.' },
    ],
    variants: [
      {
        code: `def label(name, sep="-", times=2):
    return name + sep * times

print(label("a"))
print(label("b", "+"))
print(label("c", times=1))`,
        answer: 'a--\nb++\nc-',
        mistakes: [
          { answer: 'a--\nb++\nc--', why: 'times=1 names the parameter directly, so it overrides the default of 2.' },
        ],
        explain: 'Arguments fill parameters left to right. A named argument such as times=1 can skip over ones in between.',
      },
      {
        code: `def scale(n, factor=10):
    return n * factor

x = scale(2)
y = scale(x, 2)
print(x)
print(y)`,
        answer: '20\n40',
        mistakes: [
          { answer: '20\n4', why: 'The second call passes x, and x holds 20 by then.' },
        ],
        explain: 'The first call returned 20 using the default. The second call was given that 20 and a factor of 2.',
      },
    ],
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
    mistakes: [
      { answer: 'HEY\nHEY', why: 'shout prints HEY and returns nothing. result is not the text. It is what shout handed back.' },
      { answer: 'HEY', why: 'There are two prints: one inside shout, and print(result) on the last line.' },
      { answer: 'None', why: 'Calling shout("hey") runs its body, and its body prints.' },
    ],
    variants: [
      {
        code: `def double(n):
    return n * 2

def show(n):
    print(n * 2)

a = double(4)
b = show(4)
print(a, b)`,
        answer: '8\n8 None',
        mistakes: [
          { answer: '8 8', why: 'show printed 8 on its own line when it was called. It returned nothing, so b is None.' },
          { answer: '8 None', why: 'show(4) prints 8 at the moment it is called. That is a line of output before the last print.' },
        ],
        explain: 'double handed 8 back without printing. show printed 8 and handed back None. Same arithmetic, different result for the caller.',
      },
      {
        code: `def first_even(nums):
    for n in nums:
        if n % 2 == 0:
            return n
    print("none found")

print(first_even([3, 8, 10]))
print(first_even([1, 5]))`,
        answer: '8\nnone found\nNone',
        mistakes: [
          { answer: '8\nnone found', why: 'The second call prints none found, then reaches the end with no return. The outer print shows what came back.' },
          { answer: '8\n10\nnone found\nNone', why: 'return leaves the function at once. The loop never reaches 10.' },
        ],
        explain: 'return ended the first call at 8. The second call fell off the end of the function, which hands back None.',
      },
    ],
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
    mistakes: [
      { answer: "['a']\n['b']", why: 'That is what most people expect. The default list is built once, when def runs, and both calls share it.' },
    ],
    variants: [
      {
        code: `def tag(item, seen=[]):
    seen.append(item)
    return len(seen)

print(tag("x"))
print(tag("y", []))
print(tag("z"))`,
        answer: '1\n1\n2',
        mistakes: [
          { answer: '1\n1\n1', why: 'The third call uses the default list again, and it still holds x from the first call.' },
          { answer: '1\n2\n3', why: 'The second call passes its own fresh list, so the default is not touched that time.' },
        ],
        explain: 'Only the calls that left seen out shared the default list. The call that passed its own list did not.',
      },
      {
        code: `def add(item, bucket=None):
    if bucket is None:
        bucket = []
    bucket.append(item)
    return bucket

print(add("a"))
print(add("b"))`,
        answer: "['a']\n['b']",
        mistakes: [
          { answer: "['a']\n['a', 'b']", why: 'This is the repaired version. The default is None, and a new list is made inside on every call.' },
        ],
        explain: 'None is the default, so each call that leaves bucket out builds its own list. This is the standard fix for the shared-default trap.',
      },
    ],
    hints: ['Is a fresh list made on the second call?', 'Both calls used the default list, the same object.'],
    explain: 'The default list was created once and reused, so the second call saw the first call\'s item. The usual fix is bucket=None and a new list inside.',
  },

  {
    id: 'functions-5',
    world: 'functions',
    title: 'Printed, not returned',
    kind: 'fix',
    concept: [
      'When one function uses another, it gets whatever that function returns. If the inner one only prints, the outer one receives None.',
      'An error that mentions NoneType usually means a value was expected from a function that never returned one.',
    ],
    wild: 'TypeError with NoneType in it is one of the most common errors in real Python. The line it names is rarely the line that is wrong.',
    prompt: 'Bug report: is_hot(40) crashes with a TypeError about NoneType. Fix it.',
    code: `def fahrenheit(c):
    print(c * 9 / 5 + 32)

def is_hot(c):
    return fahrenheit(c) > 90
`,
    tests: [
      { call: 'print(is_hot(40))', expect: 'True' },
      { call: 'print(is_hot(20))', expect: 'False' },
      { call: 'print(fahrenheit(100))', expect: '212.0' },
    ],
    solution: `def fahrenheit(c):
    return c * 9 / 5 + 32

def is_hot(c):
    return fahrenheit(c) > 90`,
    hints: ['The error is raised in is_hot. Which value on that line is None?', 'fahrenheit shows its result and hands back nothing. is_hot needs the number.'],
    explain: 'The crash was reported in is_hot, and the fix was in fahrenheit. The error names where None was used, not where it came from.',
  },
  {
    id: 'functions-6',
    world: 'functions',
    title: 'Repair the shared default',
    kind: 'fix',
    concept: [
      'The repair for a mutable default is always the same shape: default to None, then build the real value inside the function.',
    ],
    wild: 'You have seen this trap in a predict level. Recognizing it is half the skill. Knowing the standard repair is the other half.',
    prompt: 'Bug report: the second call to collect returns items left over from the first call. Fix it.',
    code: `def collect(item, found=[]):
    found.append(item)
    return found
`,
    tests: [
      { call: 'print(collect("a"))\nprint(collect("b"))', expect: "['a']\n['b']" },
      { call: 'print(collect("c", ["x"]))', expect: "['x', 'c']" },
    ],
    solution: `def collect(item, found=None):
    if found is None:
        found = []
    found.append(item)
    return found`,
    hints: ['The list in the def line is built once and reused.', 'Make the default None, and create a new list inside when found is None.'],
    explain: 'With None as the default, every call that leaves found out gets a list of its own. A caller who passes a list still gets that list used.',
  },

  {
    id: 'functions-7',
    world: 'functions',
    title: 'A function that answers yes or no',
    kind: 'predict',
    concept: [
      'A function that answers a yes/no question returns a bool, True or False. A comparison already is one, so return 1 <= p <= 65535 needs no if.',
      'Chained comparisons read the way you would say them: p is at least 1 and at most 65535.',
    ],
    wild: 'Small is_something helpers guard ports, IDs, paths and user input. When you see one called inside an if, read the helper to learn the rule.',
    prompt: 'What does this print? Three lines.',
    code: `def is_valid_port(p):
    return 1 <= p <= 65535

print(is_valid_port(80))
print(is_valid_port(0))
if is_valid_port(70000):
    print("open")
else:
    print("refused")`,
    answer: 'True\nFalse\nrefused',
    mistakes: [
      { answer: 'True\nTrue\nrefused', why: '1 <= p means p must be at least 1. Zero fails the left half.' },
    ],
    variants: [
      {
        code: `def in_office_hours(hour):
    return 9 <= hour < 17

print(in_office_hours(9))
print(in_office_hours(17))
print(not in_office_hours(12))`,
        answer: 'True\nFalse\nFalse',
        mistakes: [
          { answer: 'True\nTrue\nFalse', why: 'The right side is <, not <=. 17 itself is outside.' },
        ],
        explain: '9 is included because of <=. 17 is excluded because of <. Which ends are included is the first thing to check in any range test.',
      },
    ],
    hints: ['Each call hands back True or False.', '70000 is above 65535.'],
    explain: 'The comparison was the return value. The if at the bottom used that bool directly to choose a branch.',
  },
  {
    id: 'functions-8',
    world: 'functions',
    title: 'Where did None come from?',
    kind: 'read',
    concept: [
      'When one function uses another, it gets whatever that function returns. If the inner one only prints, the outer one receives None.',
      'An error that mentions NoneType usually means a value was expected from a function that never returned one. The line the error names is where None was used, not where it came from.',
    ],
    wild: 'TypeError with NoneType in it is one of the most common errors in real Python. Reading it correctly saves a lot of looking in the wrong place.',
    prompt: 'is_hot(40) raises a TypeError on the comparison line. Where is the actual mistake?',
    code: `def fahrenheit(c):
    print(c * 9 / 5 + 32)

def is_hot(c):
    return fahrenheit(c) > 90`,
    choices: [
      'In fahrenheit. It prints the result instead of returning it.',
      'In is_hot. 90 should be written as 90.0.',
      'In is_hot. The > should be >=.',
      'In the call. 40 should be passed as c=40.',
    ],
    correct: 0,
    whyNot: [
      '',
      'Python compares whole numbers and decimals without complaint. The problem is the other side of the >.',
      'Either operator fails the same way when the left side is None.',
      'Both forms pass 40 to c. How the argument is named changes nothing here.',
    ],
    hints: ['What does fahrenheit(40) hand back?', 'A function with no return gives None.'],
    explain: 'fahrenheit showed 104.0 on screen and returned None, so is_hot was comparing None > 90. The crash was reported in one function and caused in the other.',
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
    mistakes: [
      { answer: '80\n8080\n4\n[80, 443]', why: 'Positions start at 0, so ports[0] is the first item.' },
      { answer: '22\n8080\n4\n[80, 443, 8080]', why: 'A slice stops before its end position. ports[1:3] is positions 1 and 2.' },
      { answer: '22\n8080\n3\n[80, 443]', why: 'len counts items, and there are four. The last position is 3 only because counting starts at 0.' },
    ],
    variants: [
      {
        code: `names = ["ann", "bo", "cy", "di", "ed"]
print(names[1])
print(names[-2])
print(names[:2])
print(names[3:])`,
        answer: "bo\ndi\n['ann', 'bo']\n['di', 'ed']",
        mistakes: [
          { answer: "bo\ned\n['ann', 'bo']\n['di', 'ed']", why: '-1 is the last item, so -2 is the one before it.' },
        ],
        explain: 'A slice with one side left out runs to that end of the list: [:2] is the first two, [3:] is position 3 onward.',
      },
      {
        code: `nums = [5, 10, 15, 20]
nums[1] = 99
print(nums)
print(nums[1:3])
print(nums[len(nums) - 1])`,
        answer: '[5, 99, 15, 20]\n[99, 15]\n20',
        mistakes: [
          { answer: '[99, 10, 15, 20]\n[10, 15]\n20', why: 'Position 1 is the second item. Position 0 is the first.' },
        ],
        explain: 'Assigning to nums[1] replaced the second item in place. len(nums) - 1 is always the last position.',
      },
    ],
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
    mistakes: [
      { answer: '[1, 2, 3]\n4', why: 'b = a did not copy the list. Both names point at the same one, so the append shows through a too.' },
    ],
    variants: [
      {
        code: `a = [1, 2, 3]
b = a.copy()
b.append(4)
a[0] = 9
print(a)
print(b)`,
        answer: '[9, 2, 3]\n[1, 2, 3, 4]',
        mistakes: [
          { answer: '[9, 2, 3, 4]\n[9, 2, 3, 4]', why: 'copy() made a second, separate list. After that, changes to one do not reach the other.' },
        ],
        explain: 'copy() is what b = a is often mistaken for. With a real copy, each list changed on its own.',
      },
      {
        code: `def clear_first(items):
    items[0] = 0

data = [7, 8, 9]
clear_first(data)
print(data)

n = 5
m = n
m += 1
print(n)`,
        answer: '[0, 8, 9]\n5',
        mistakes: [
          { answer: '[7, 8, 9]\n5', why: 'Passing a list to a function does not copy it. items and data are the same list.' },
          { answer: '[0, 8, 9]\n6', why: 'm += 1 makes m point at a new number. A number cannot be changed in place, so n still holds 5.' },
        ],
        explain: 'A list can be changed in place, so every name for it sees the change. A number cannot, so m += 1 only moved m.',
      },
    ],
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
    mistakes: [
      { answer: 'ssh 22\nhttp 80\nhttps 443\nNone\nTrue', why: 'get was given a fallback, "unknown", and returns it when the key is missing.' },
    ],
    variants: [
      {
        code: `stock = {"pens": 3, "ink": 0}
stock["pens"] += 2
stock["paper"] = 10
print(stock["pens"])
print(len(stock))
print(stock.get("tape"))
print("ink" in stock)`,
        answer: '5\n3\nNone\nTrue',
        mistakes: [
          { answer: '5\n3\nNone\nFalse', why: 'in asks whether the key exists. ink is a key. Its value being 0 does not matter.' },
          { answer: '5\n3\n0\nTrue', why: 'get with no fallback returns None for a missing key.' },
        ],
        explain: 'A key with a value of 0 is still a key. A key that was never stored is the only kind get reports as missing.',
      },
      {
        code: `codes = {"ok": 200, "missing": 404}
for name in codes:
    print(name)
codes["ok"] = 201
print(codes)
print(404 in codes)`,
        answer: "ok\nmissing\n{'ok': 201, 'missing': 404}\nFalse",
        mistakes: [
          { answer: "ok\nmissing\n{'ok': 201, 'missing': 404}\nTrue", why: 'in checks keys, not values. 404 is a value here.' },
        ],
        explain: 'Looping over a dict gives its keys. Storing to an existing key replaced the value and kept its place.',
      },
    ],
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

  {
    id: 'collections-8',
    world: 'collections',
    title: 'The list that changed behind your back',
    kind: 'fix',
    concept: [
      'A function that is handed a list is handed the caller\'s list, not a copy. Changing it inside the function changes it for the caller.',
      'If a function promises a new list, it has to make one: users.copy(), list(users), or users + ["admin"].',
    ],
    wild: 'Functions that quietly modify their arguments cause bugs that show up far from the function. Look for append, sort, and item assignment on parameters.',
    prompt: 'Bug report: with_admin should return a new list and leave the original alone. The original grows too. Fix it.',
    code: `def with_admin(users):
    result = users
    result.append("admin")
    return result
`,
    tests: [
      { call: 'team = ["ann"]\nprint(with_admin(team))\nprint(team)', expect: "['ann', 'admin']\n['ann']" },
      { call: 'print(with_admin([]))', expect: "['admin']" },
    ],
    solution: `def with_admin(users):
    result = users.copy()
    result.append("admin")
    return result`,
    hints: ['Is result a new list, or a second name for users?', 'result = users.copy()'],
    explain: 'result = users only added a name. The copy is what made the returned list separate from the one the caller passed in.',
  },
  {
    id: 'collections-9',
    world: 'collections',
    title: 'The missing key',
    kind: 'fix',
    concept: [
      'counts[code] += 1 reads the old value first, then stores the new one. If the key is not there yet, the read fails with KeyError.',
    ],
    wild: 'KeyError is the dict saying "I was never given that". The fix is to decide what a first sighting should mean.',
    prompt: 'Bug report: count_status([200, 404, 200]) crashes with KeyError: 200. Fix it.',
    code: `def count_status(codes):
    counts = {}
    for code in codes:
        counts[code] += 1
    return counts
`,
    tests: [
      { call: 'print(count_status([200, 404, 200]))', expect: '{200: 2, 404: 1}' },
      { call: 'print(count_status([]))', expect: '{}' },
    ],
    solution: `def count_status(codes):
    counts = {}
    for code in codes:
        counts[code] = counts.get(code, 0) + 1
    return counts`,
    hints: ['What does counts hold the first time 200 is seen?', 'counts.get(code, 0) gives 0 for a key that is not there yet.'],
    explain: 'The first time each code appeared there was nothing to add to. get with a default of 0 gave it a starting point.',
  },

  {
    id: 'collections-10',
    world: 'collections',
    title: 'Best so far',
    kind: 'predict',
    concept: [
      'A best-so-far loop keeps one winner. Each new item is compared against it and replaces it only if the test passes.',
      'The comparison decides ties. With > the first of the equals stays. With >= the last one wins.',
    ],
    wild: 'Max, min, newest, longest, first match, last match: all the same loop with a different test. Read the test to know which.',
    prompt: 'What does this print? Two lines.',
    code: `def longest(words):
    best = words[0]
    for word in words:
        if len(word) > len(best):
            best = word
    return best

print(longest(["tea", "coffee", "milk"]))
print(longest(["aa", "b", "cc"]))`,
    answer: 'coffee\naa',
    mistakes: [
      { answer: 'coffee\ncc', why: 'best is only replaced when a word is strictly longer. cc ties with aa, so aa stays.' },
    ],
    variants: [
      {
        code: `def last_longest(words):
    best = words[0]
    for word in words:
        if len(word) >= len(best):
            best = word
    return best

print(last_longest(["aa", "b", "cc"]))
print(last_longest(["x", "yy"]))`,
        answer: 'cc\nyy',
        mistakes: [
          { answer: 'aa\nyy', why: 'This one uses >=, so a tie replaces best. The last of the longest words wins.' },
        ],
        explain: 'One character, > against >=, changed which word wins a tie. That is the detail to look for in any loop of this shape.',
      },
    ],
    hints: ['best starts as the first word.', 'Is cc strictly longer than aa?'],
    explain: 'best changed only when a word was strictly longer, so on a tie the earlier word was kept.',
  },
  {
    id: 'collections-11',
    world: 'collections',
    title: 'Reading a comprehension',
    kind: 'predict',
    concept: [
      '[n for n in nums if n > 4] builds a new list in one line. Read it in three parts: what goes in the new list, where the items come from, and the test that keeps or drops each one.',
      'With no if, every item is kept and only transformed. With braces and a colon, {k: v for ...}, the same idea builds a dict.',
    ],
    wild: 'Comprehensions are dense, and modern code uses them constantly. Reading them fluently matters far more than writing them.',
    prompt: 'What does this print? Three lines.',
    code: `nums = [3, 8, 5, 12]
big = [n for n in nums if n > 4]
doubled = [n * 2 for n in nums]
print(big)
print(doubled)
print(len([n for n in nums if n % 2 == 0]))`,
    answer: '[8, 5, 12]\n[6, 16, 10, 24]\n2',
    mistakes: [
      { answer: '[8, 12]\n[6, 16, 10, 24]\n2', why: '5 is greater than 4, so it passes the test too.' },
    ],
    variants: [
      {
        code: `names = ["ann", "Bo", "cy"]
upper = [n.upper() for n in names]
short = [n for n in names if len(n) < 3]
lengths = {n: len(n) for n in names}
print(upper)
print(short)
print(lengths)`,
        answer: "['ANN', 'BO', 'CY']\n['Bo', 'cy']\n{'ann': 3, 'Bo': 2, 'cy': 2}",
        mistakes: [
          { answer: "['ANN', 'BO', 'CY']\n['BO', 'CY']\n{'ANN': 3, 'BO': 2, 'CY': 2}", why: 'Each comprehension starts from names, which was never changed. upper is a separate new list.' },
        ],
        explain: 'Three comprehensions, three new collections, and the original list untouched throughout.',
      },
    ],
    hints: ['big keeps the items where n > 4 is true.', 'doubled has no if, so all four items appear.'],
    explain: 'The part before for decided what went into each new list. The if, where there was one, decided which items got in.',
  },
  {
    id: 'collections-12',
    world: 'collections',
    title: 'What is this dict for?',
    kind: 'read',
    concept: [
      'A dict used as a tally has one line that gives it away: d[key] = d.get(key, 0) + 1. Read it as "one more for this key, starting from zero".',
    ],
    wild: 'Counting is the heart of log analysis: failed logins per address, hits per URL, events per host. This line is how it is done by hand.',
    prompt: 'What does tally return?',
    code: `def tally(lines):
    seen = {}
    for line in lines:
        ip = line.split()[0]
        seen[ip] = seen.get(ip, 0) + 1
    return seen`,
    choices: [
      'A dict from each first word to how many lines start with it.',
      'A dict from each line to its first word.',
      'A list of the first word of every line.',
      'How many lines there are.',
    ],
    correct: 0,
    whyNot: [
      '',
      'The key is ip, the first word, not the line. The value is a number that goes up by one.',
      'seen starts as {} and is filled by key, so it is a dict. Repeats add to a count instead of adding an entry.',
      'It returns seen, the whole dict, not a single number.',
    ],
    hints: ['What is the key? What is the value?', 'get(ip, 0) + 1 is the count so far plus one.'],
    explain: 'line.split()[0] took the first word of the line. The get with a default of 0 handled the first sighting, and every later one added 1.',
  },
  {
    id: 'collections-13',
    world: 'collections',
    title: 'Who changed my list?',
    kind: 'read',
    concept: [
      "A function that is handed a list is handed the caller's list, not a copy. Changing it inside the function changes it for the caller.",
      'result = users does not make a new list either. It gives the same list a second name.',
    ],
    wild: 'Functions that quietly modify their arguments cause bugs that show up far from the function. Look for append, sort and item assignment on anything that came in as a parameter.',
    prompt: 'After extra = with_admin(team), team has grown too. Which line is responsible?',
    code: `def with_admin(users):
    result = users
    result.append("admin")
    return result`,
    choices: [
      'result = users. It makes a second name for the same list.',
      'result.append("admin"). append should have made a copy.',
      'return result. It hands back the original.',
      'The def line. users has no default value.',
    ],
    correct: 0,
    whyNot: [
      '',
      'append never copies, and it is doing its job. The trouble is which list it has been pointed at.',
      "By the time this line runs, the caller's list has already been changed.",
      'A missing default only means the caller must pass a list.',
    ],
    hints: ['Is result a new list?', 'users.copy() would have made one.'],
    explain: 'result and users were one list under two names, so the append reached the caller. result = users.copy() is the one-line repair.',
  },
  {
    id: 'collections-14',
    world: 'collections',
    title: 'Read the KeyError',
    kind: 'read',
    concept: [
      'counts[code] += 1 is two steps: read the old value, then store the new one. If the key is not there yet, the read fails with KeyError.',
      'KeyError: 200 means "I was asked for the key 200 and was never given it". The value after the colon is the missing key.',
    ],
    wild: 'You will meet KeyError whenever code assumes a key exists: a config setting, a JSON field, a first sighting in a count.',
    prompt: 'count_status([200, 404, 200]) raises KeyError: 200. Why?',
    code: `def count_status(codes):
    counts = {}
    for code in codes:
        counts[code] += 1
    return counts`,
    choices: [
      'counts[code] += 1 reads the old value first, and on the first sighting there is none.',
      'Dict keys must be strings, and 200 is a number.',
      'counts was never created.',
      'The loop runs one time too many.',
    ],
    correct: 0,
    whyNot: [
      '',
      'Numbers are fine as keys. The complaint is that this key is missing, not that it is the wrong type.',
      'It is created empty on the line above the loop. Empty is the problem, not absent.',
      'It fails on the very first pass, before any counting has happened.',
    ],
    hints: ['What does counts hold when the first 200 arrives?', 'counts.get(code, 0) would give 0 instead of failing.'],
    explain: 'The dict was empty, so there was no old value to add 1 to. counts[code] = counts.get(code, 0) + 1 is the usual form.',
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
      'The inspector below the code asks real Python where a module is. Use it.',
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
    whyNot: [
      '',
      "Nothing had to be installed for this to run. The inspector shows a path inside Python's own lib folder, not site-packages.",
      'There is no json.py in this project. The inspector shows where the file really is.',
    ],
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
    whyNot: [
      'The standard library is always present, and the inspector cannot find requests.',
      '',
      'No file named requests.py is shown. The only other file is requirements.txt, which names requests as a dependency.',
    ],
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
    whyNot: [
      'The standard library has no module named netutils. The file is shown beside the script.',
      'Nothing lists netutils as a dependency, and a file with that name sits next to the script.',
      '',
    ],
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
    mistakes: [
      { answer: "[('s', 4), ('i', 4)]\n0", why: 'On a tie, most_common keeps the order the items were first seen. i comes before s in the word.' },
    ],
    variants: [
      {
        code: `from collections import Counter

hits = Counter(["a", "b", "a", "c", "a", "b"])
print(hits["a"])
print(hits.most_common(1))
print(len(hits))
print(hits["q"])`,
        answer: "3\n[('a', 3)]\n3\n0",
        mistakes: [
          { answer: "3\n[('a', 3)]\n6\n0", why: 'len counts the distinct items being tallied, not how many things were counted.' },
        ],
        explain: 'most_common always returns a list of pairs, even when asked for one. A key never counted reads as 0.',
      },
      {
        code: `from collections import Counter

words = "the cat and the hat and the bat".split()
top = Counter(words).most_common(2)
print(top[0])
print(top[1][0])`,
        answer: "('the', 3)\nand",
        mistakes: [
          { answer: "('the', 3)\n('and', 2)", why: 'top[1] is the pair. The extra [0] takes the first thing out of that pair.' },
        ],
        explain: 'most_common(2) returned two (word, count) pairs. Indexing twice went into the list, then into the pair.',
      },
    ],
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
    mistakes: [
      { answer: 'True\n2\n7', why: 'sqrt always returns a float, so it prints 7.0.' },
      { answer: 'True\n3\n7.0', why: 'floor rounds down, toward the smaller whole number.' },
    ],
    variants: [
      {
        code: `import string as s
from string import digits as d

print(d)
print(len(s.ascii_lowercase))
print(s.digits == d)`,
        answer: '0123456789\n26\nTrue',
        mistakes: [
          { answer: '0123456789\n26\nFalse', why: 'd and s.digits are two routes to the same thing inside the string module.' },
        ],
        explain: 's is the whole module under a short name. d is one value pulled out of it and renamed. Both lead back to string.',
      },
      {
        code: `import json as j
from json import dumps as to_text

data = j.loads("[1, 2, 3]")
print(len(data))
print(to_text({"a": 1}))
print(to_text is j.dumps)`,
        answer: '3\n{"a": 1}\nTrue',
        mistakes: [
          { answer: "3\n{'a': 1}\nTrue", why: 'dumps produces JSON text, and JSON uses double quotes.' },
        ],
        explain: 'to_text is json.dumps under another name. An alias changes what you type, not what runs.',
      },
    ],
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

  {
    id: 'imports-8',
    world: 'imports',
    title: 'Reading JSON handling',
    kind: 'predict',
    concept: [
      'json.loads(text) turns JSON text into Python values: objects become dicts, arrays become lists, true becomes True. After that it is ordinary indexing.',
      'data["roles"][0] is two steps. First the value under "roles", which is a list. Then item 0 of that list.',
    ],
    wild: 'API responses, config files and log pipelines are mostly JSON. Chains of brackets after a loads call are the most common thing you will read.',
    prompt: 'What does this print? Four lines.',
    code: `import json

raw = '{"user": "ada", "roles": ["admin", "dev"], "active": true}'
data = json.loads(raw)
print(data["user"])
print(data["roles"][0])
print(len(data["roles"]))
print(data["active"])`,
    answer: 'ada\nadmin\n2\nTrue',
    mistakes: [
      { answer: 'ada\nadmin\n2\ntrue', why: 'After loads the value is a Python bool. JSON writes true. Python prints True.' },
    ],
    variants: [
      {
        code: `import json

raw = '[{"id": 1, "tags": []}, {"id": 2, "tags": ["x"]}]'
items = json.loads(raw)
print(len(items))
print(items[1]["id"])
print(items[0]["tags"])
print(type(items).__name__)`,
        answer: '2\n2\n[]\nlist',
        mistakes: [
          { answer: '2\n2\n[]\ndict', why: 'The text starts with a square bracket, so the outermost value is a list. The dicts are inside it.' },
        ],
        explain: 'The outer brackets made a list of two dicts. Each chain of brackets after that walked one level further in.',
      },
    ],
    inspect: 'json',
    hints: ['data is a dict with three keys.', 'roles is a list of two strings.'],
    explain: "loads built a dict. Each bracket after that picked one level deeper, and the JSON true arrived as Python's True.",
  },
  {
    id: 'imports-9',
    world: 'imports',
    title: 'What a hash is for',
    kind: 'read',
    concept: [
      'hashlib.sha256(data).hexdigest() turns any amount of data into a fixed 64-character hex string. The same data always gives the same string, and any change gives a completely different one.',
      'A hash goes one way. You cannot get the data back from it, so it is a fingerprint, not a lock.',
    ],
    wild: 'Hashing shows up in integrity checks, de-duplication, caching, and malware triage. Recognizing it on sight, and not mistaking it for encryption, matters.',
    prompt: 'What is fingerprint for?',
    code: `import hashlib

def fingerprint(path):
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()`,
    choices: [
      'It returns a fixed-length string that changes if the file changes at all.',
      'It encrypts the file so it cannot be read.',
      'It compresses the file.',
      'It returns the file contents as text.',
    ],
    correct: 0,
    whyNot: [
      '',
      'The file is opened for reading only and is never modified. A hash also cannot be turned back into the file, so nothing is being locked away.',
      'The result is 64 characters however large the file is, and the file cannot be rebuilt from it.',
      'The contents go into sha256, and only the digest comes back out.',
    ],
    inspect: 'hashlib',
    hints: ['"rb" opens the file for reading, as bytes.', 'hexdigest is always the same length.'],
    explain: 'Two files with the same fingerprint are the same file for all practical purposes. That is what makes it useful for checking a download or spotting a duplicate.',
  },

  // ---------------------------------------------------------------- handed
  {
    id: 'handed-1',
    world: 'handed',
    title: 'Type hints and docstrings',
    kind: 'read',
    concept: [
      'A type hint says what the author expects. value: str means "this should be a string". -> int means "this hands back an int". The text in triple quotes directly under def is a docstring, a description of the function.',
      'Neither changes what the code does. Read them first anyway. Together they are the author telling you what the function is for before you read how it works.',
    ],
    wild: 'Well-kept code is almost always hinted and documented like this. The signature line and the docstring are the fastest summary you will get.',
    prompt: 'What do ": str" and "-> int" do when this code runs?',
    code: `def parse_port(value: str, default: int = 8080) -> int:
    """Return value as a port number, or default if it is not one."""
    if value.isdigit():
        return int(value)
    return default`,
    choices: [
      'Nothing. They are notes for readers and tools, and Python does not enforce them.',
      'They convert the argument to a string and the result to an int.',
      'They raise an error if the wrong type is passed.',
      'They set the default values.',
    ],
    correct: 0,
    whyNot: [
      '',
      'No conversion happens. The only conversion here is the explicit int(value) in the body.',
      'Python does not check hints when the code runs. parse_port(80) would fail later, at value.isdigit(), not at the hint.',
      'The default is the = 8080 part. The hint is the : int in front of it.',
    ],
    hints: ['Which line actually turns text into a number?', 'Hints are read by people and by checking tools, not by Python itself.'],
    explain: 'The hints describe the intended types and the docstring describes the purpose. The body is still the only part that does anything.',
  },
  {
    id: 'handed-2',
    world: 'handed',
    title: 'try and except',
    kind: 'predict',
    concept: [
      'try runs its block. If a line in it raises the error named after except, Python jumps straight to the except block and carries on from there.',
      'The rest of the try block is skipped once something fails. A finally block, if there is one, runs either way.',
    ],
    wild: 'Anything that touches files, networks or user input is wrapped like this. To read it, ask two things: what can fail, and what happens instead.',
    prompt: 'What does this print? Two lines.',
    code: `def to_int(text):
    try:
        return int(text)
    except ValueError:
        print("bad:", text)
        return 0

total = to_int("4") + to_int("x") + to_int("10")
print(total)`,
    answer: 'bad: x\n14',
    mistakes: [
      { answer: '14', why: 'The middle call fails inside int and lands in the except block, which prints before it returns 0.' },
    ],
    variants: [
      {
        code: `values = {"a": 1}
try:
    print(values["a"])
    print(values["b"])
    print("after")
except KeyError:
    print("missing")
finally:
    print("done")`,
        answer: '1\nmissing\ndone',
        mistakes: [
          { answer: '1\nmissing\nafter\ndone', why: 'When a line in try fails, the rest of the try block is skipped. after is never reached.' },
          { answer: '1\nmissing', why: 'finally runs no matter what happened above it.' },
        ],
        explain: 'The first print worked, the second raised KeyError, and control jumped past after into except. finally ran last, as it always does.',
      },
    ],
    hints: ['int("x") cannot work. What catches it?', 'The failed call still returns something.'],
    explain: 'Two calls returned real numbers. The failing one printed its message and returned 0, so the sum was 4 + 0 + 10.',
  },
  {
    id: 'handed-3',
    world: 'handed',
    title: 'The with block',
    kind: 'read',
    concept: [
      'with opens something and guarantees it is closed again when the indented block ends, whether the block finished normally or failed partway.',
      'The name after as is the open thing. It is only good inside the block.',
    ],
    wild: 'Files, network connections, database sessions and locks are all handled with with. When you see one, the block beneath it is the only place that resource is in use.',
    prompt: 'What is the with line for?',
    code: `from pathlib import Path

def count_errors(log_path: Path) -> int:
    count = 0
    with log_path.open() as log:
        for line in log:
            if "ERROR" in line:
                count += 1
    return count`,
    choices: [
      'It opens the file and guarantees it is closed when the block ends, even if something fails inside.',
      'It loops over the file.',
      'It checks that the file exists and skips the block if it does not.',
      'It loads the whole file into memory as log.',
    ],
    correct: 0,
    whyNot: [
      '',
      'The loop is the for line beneath it. with runs its block once.',
      'A missing file raises an error at this line. with does not skip anything.',
      'log is an open file, read one line at a time by the for loop. Nothing is loaded up front.',
    ],
    inspect: 'pathlib',
    hints: ['What would have to be remembered if with were not there?', 'Opening a file means someone has to close it.'],
    explain: 'with took care of closing the file. The for loop did the reading, and the function is a counter of lines containing ERROR.',
  },
  {
    id: 'handed-4',
    world: 'handed',
    title: 'Classes and self',
    kind: 'predict',
    concept: [
      'A class is a blueprint. Calling it, Counter(), builds one object from the blueprint and runs __init__ to set it up.',
      'self is the particular object a method was called on. self.value is a piece of data stored on that object, and each object has its own.',
    ],
    wild: 'Most code beyond a short script is organized into classes. Reading one starts with __init__, because it lists what every object carries around.',
    prompt: 'What does this print? Two lines.',
    code: `class Counter:
    def __init__(self, start=0):
        self.value = start

    def bump(self, by=1):
        self.value += by
        return self.value

a = Counter()
b = Counter(10)
a.bump()
a.bump(5)
print(a.value)
print(b.bump())`,
    answer: '6\n11',
    mistakes: [
      { answer: '6\n17', why: 'a and b are separate objects, each with its own value. Bumping a does not touch b.' },
    ],
    variants: [
      {
        code: `class Account:
    def __init__(self, owner):
        self.owner = owner
        self.entries = []

    def add(self, amount):
        self.entries.append(amount)

    def balance(self):
        return sum(self.entries)

acct = Account("ada")
acct.add(50)
acct.add(-20)
print(acct.owner)
print(acct.balance())
print(len(acct.entries))`,
        answer: 'ada\n30\n2',
        mistakes: [
          { answer: 'ada\n30\n1', why: 'Each add appends one entry. Two calls, two entries, whatever their sum.' },
        ],
        explain: "__init__ gave the object an owner and an empty list. Each method then read or changed that one object's data through self.",
      },
    ],
    hints: ['a starts at 0, b starts at 10.', 'a.bump() adds 1, a.bump(5) adds 5.'],
    explain: 'Two objects were built from one class. Every self.value belonged to whichever object the method was called on.',
  },
  {
    id: 'handed-5',
    world: 'handed',
    title: 'Dataclasses',
    kind: 'read',
    concept: [
      'A line starting with @ above a class or function is a decorator. It hands the thing below it to another function, which can add to it.',
      '@dataclass reads the listed fields and writes the __init__ for you. host: str and port: int become required arguments. severity: str = "low" becomes an optional one.',
    ],
    wild: 'When modern code needs to pass a few related values around, it usually defines a dataclass. The field list is the whole story: there is no hidden behavior to go and find.',
    prompt: 'What does @dataclass give this class?',
    code: `from dataclasses import dataclass

@dataclass
class Finding:
    host: str
    port: int
    severity: str = "low"

f = Finding("web01", 443)`,
    choices: [
      'An __init__ built from the listed fields, so f.host is "web01", f.port is 443 and f.severity is "low".',
      'Nothing. The fields still have to be assigned by hand.',
      'It makes every Finding read-only.',
      'It saves each Finding to a database.',
    ],
    correct: 0,
    whyNot: [
      '',
      'The decorator writes __init__ for you. That is why a call with two arguments works with no __init__ in sight.',
      'A plain dataclass can be changed after it is created. Read-only needs @dataclass(frozen=True).',
      'Nothing here touches storage. The name only means the class mostly holds values.',
    ],
    inspect: 'dataclasses',
    hints: ['There is no def __init__ here. Something must be supplying one.', 'severity has a default, so it can be left out.'],
    explain: 'The three annotated lines were turned into a constructor. Two arguments filled host and port in order, and severity fell back to its default.',
  },
  {
    id: 'handed-6',
    world: 'handed',
    title: 'The __main__ guard',
    kind: 'read',
    concept: [
      "Python sets __name__ to \"__main__\" in the file you run directly. In a file that is imported, __name__ is the module's own name instead.",
      'So if __name__ == "__main__": means "only do this when I am the program being run". It lets one file be both a script and a library.',
    ],
    wild: 'Nearly every script you are handed ends with these two lines. Start reading at main(): it is the top of the program even though it is near the bottom of the file.',
    prompt: 'When does main() run?',
    code: `import sys

def main() -> int:
    if len(sys.argv) < 2:
        print("usage: scan.py HOST")
        return 1
    print("scanning", sys.argv[1])
    return 0

if __name__ == "__main__":
    sys.exit(main())`,
    choices: [
      'Only when this file is run directly, not when another file imports it.',
      'Every time the file is loaded, including on import.',
      'Never, until some other file calls it.',
      'Only when no arguments are given.',
    ],
    correct: 0,
    whyNot: [
      '',
      'On import, __name__ is the module name, not "__main__", so the if is false and nothing is called.',
      'Running the file directly makes __name__ equal "__main__", and the last two lines call it.',
      'The argument check is inside main. It decides what main does, not whether main runs.',
    ],
    inspect: 'sys',
    hints: ['What is __name__ when you run python scan.py?', 'What is it when another file says import scan?'],
    explain: 'The guard keeps the script from firing off when it is imported for its functions. sys.argv holds the command-line words, and the number main returns becomes the exit status.',
  },
  {
    id: 'handed-7',
    world: 'handed',
    title: 'enumerate, zip and unpacking',
    kind: 'predict',
    concept: [
      'enumerate(items) hands out (position, item) pairs, so a loop can have both. zip(a, b) pairs up two lists item by item and stops at the shorter one.',
      'Two names on the left of = or after for split a pair apart: for i, host in ... puts the position in i and the item in host. A starred name, *rest, collects whatever is left over.',
    ],
    wild: 'These replace the index juggling older code does by hand. You will rarely see range(len(x)) in recent code. You will see these.',
    prompt: 'What does this print? Five lines.',
    code: `hosts = ["web", "db", "cache"]
ports = [80, 5432, 6379]

for i, host in enumerate(hosts, start=1):
    print(i, host)

pairs = dict(zip(hosts, ports))
print(pairs["db"])
first, *rest = ports
print(first, rest)`,
    answer: '1 web\n2 db\n3 cache\n5432\n80 [5432, 6379]',
    mistakes: [
      { answer: '0 web\n1 db\n2 cache\n5432\n80 [5432, 6379]', why: 'start=1 makes the count begin at 1 instead of 0.' },
    ],
    variants: [
      {
        code: `names = ["a", "b", "c"]
scores = [7, 9]

for name, score in zip(names, scores):
    print(name, score)

for i, name in enumerate(names):
    if i == 2:
        print(i, name)

x, y = scores
print(y, x)`,
        answer: 'a 7\nb 9\n2 c\n9 7',
        mistakes: [
          { answer: 'a 7\nb 9\nc None\n2 c\n9 7', why: 'zip stops at the shorter list. c has no partner, so it is dropped without any error.' },
        ],
        explain: 'zip quietly dropped the unmatched item, which is worth remembering when two lists are supposed to be the same length and are not.',
      },
    ],
    hints: ['zip pairs web with 80, db with 5432, cache with 6379.', 'first takes one item. rest takes the others, as a list.'],
    explain: 'enumerate supplied the numbering, zip built the pairs that dict turned into a lookup, and the star collected the tail of the list.',
  },
  {
    id: 'handed-8',
    world: 'handed',
    title: '*args and **kwargs',
    kind: 'predict',
    concept: [
      'In a def line, *parts collects any extra positional arguments into a tuple, and **fields collects any extra named arguments into a dict.',
      'In a call the same symbols do the reverse: f(*items) spreads a list out into separate arguments, and f(**options) spreads a dict into named ones.',
    ],
    wild: 'Wrappers, loggers and anything that forwards its arguments to another function use these. When you see them, the function is saying "I accept whatever you give me".',
    prompt: 'What does this print? Two lines.',
    code: `def log(level, *parts, sep=" ", **fields):
    print(level, sep.join(parts), fields)

log("INFO", "disk", "full")
log("WARN", "retry", sep="-", attempt=2)`,
    answer: "INFO disk full {}\nWARN retry {'attempt': 2}",
    mistakes: [
      { answer: "INFO disk full {}\nWARN retry {'sep': '-', 'attempt': 2}", why: 'sep is a named parameter of its own, so it is taken out first. Only the leftover named arguments land in fields.' },
    ],
    variants: [
      {
        code: `def total(*nums, scale=1):
    return sum(nums) * scale

args = [1, 2, 3]
opts = {"scale": 10}
print(total(1, 2))
print(total(*args))
print(total(*args, **opts))`,
        answer: '3\n6\n60',
        mistakes: [
          { answer: '3\n6\n6', why: '**opts spreads the dict into named arguments, so scale=10 is passed.' },
        ],
        explain: 'In the def, the star gathered arguments together. In the calls, the stars spread a list and a dict back out into arguments.',
      },
    ],
    hints: ['level takes the first argument. parts takes the other positional ones.', 'With one item in parts, join has nothing to put sep between.'],
    explain: 'The first positional argument went to level and the rest to parts. Named arguments that matched a parameter went there, and the remainder went to fields.',
  },
  {
    id: 'handed-9',
    world: 'handed',
    title: 'Decorators',
    kind: 'predict',
    concept: [
      '@announce above def add means: build add, pass it to announce, and keep whatever announce returns under the name add.',
      'A decorator usually returns a wrapper, a new function that does something before and after calling the original.',
    ],
    wild: 'Web routes, retries, caching, timing and permission checks are all attached with an @ line. To learn what really happens on a call, read the decorator as well as the function.',
    prompt: 'What does this print? Three lines.',
    code: `def announce(func):
    def wrapper(*args):
        print("calling", func.__name__)
        result = func(*args)
        print("done")
        return result
    return wrapper

@announce
def add(a, b):
    return a + b

print(add(2, 3))`,
    answer: 'calling add\ndone\n5',
    mistakes: [
      { answer: '5', why: 'The @announce line replaced add with wrapper, so the two prints inside wrapper run around the real call.' },
      { answer: 'calling add\n5\ndone', why: 'The outer print cannot show 5 until add has returned, and wrapper prints done before it returns.' },
    ],
    variants: [
      {
        code: `def twice(func):
    def wrapper(x):
        return func(func(x))
    return wrapper

@twice
def bump(n):
    return n + 3

print(bump(1))
print(bump.__name__)`,
        answer: '7\nwrapper',
        mistakes: [
          { answer: '4\nbump', why: 'bump now names the wrapper, which calls the original twice.' },
          { answer: '7\nbump', why: 'The name bump points at wrapper now, and wrapper reports its own name.' },
        ],
        explain: "After the @ line, bump is the wrapper. Calling it ran the original twice, and asking its name gave the wrapper's.",
      },
    ],
    hints: ['Which function does the name add refer to after the @ line?', 'wrapper prints, calls the original, prints again, then returns.'],
    explain: 'add(2, 3) was really wrapper(2, 3). It printed, called the original add, printed again, and handed 5 back to the outer print.',
  },
  {
    id: 'handed-10',
    world: 'handed',
    title: 'raise',
    kind: 'read',
    concept: [
      'raise stops the function on the spot and sends an error up to whoever called it. Nothing after it in the function runs.',
      'The caller either catches it with try and except, or the error keeps going up until the program stops with a traceback.',
    ],
    wild: 'Functions you are handed often start with a few checks that raise. They are the function stating what it refuses to accept, so read them as its rules.',
    prompt: 'What does the raise line do when path is "notes.txt"?',
    code: `import json

def load_config(path):
    if not path.endswith(".json"):
        raise ValueError(f"not a JSON file: {path}")
    with open(path) as f:
        return json.load(f)`,
    choices: [
      'It stops the function at once and hands an error to the caller, who must catch it or crash.',
      'It prints a warning and carries on to open the file.',
      'It returns the message text as the result.',
      'It retries with a different path.',
    ],
    correct: 0,
    whyNot: [
      '',
      'Nothing after a raise runs. The with block is never reached for this path.',
      'Raising is not returning. The caller does not receive a value at all.',
      'There is no loop and no second attempt. What happens next is up to the caller.',
    ],
    hints: ['Does the with block run for notes.txt?', 'raise is the opposite end of try and except.'],
    explain: 'The check failed, so the function ended there with a ValueError carrying the message. Only a .json path ever reaches the file-opening code.',
  },
  {
    id: 'handed-11',
    world: 'handed',
    title: 'sorted with a key',
    kind: 'predict',
    concept: [
      'sorted(items, key=f) builds a new sorted list, ordering by whatever f returns for each item. The original list is left as it was.',
      'lambda f: f["score"] is a small function written in place. It takes f and returns f["score"]. reverse=True puts the largest first.',
    ],
    wild: 'Ranking findings, picking the newest file, ordering rows by a column: all of it is sorted, max or min with a key. Read the key to learn what the ranking is by.',
    prompt: 'What does this print? Two lines.',
    code: `findings = [
    {"host": "db", "score": 7.5},
    {"host": "web", "score": 9.1},
    {"host": "cache", "score": 4.0},
]
worst = sorted(findings, key=lambda f: f["score"], reverse=True)[:2]
print([f["host"] for f in worst])
print(len(findings))`,
    answer: "['web', 'db']\n3",
    mistakes: [
      { answer: "['web', 'db']\n2", why: 'sorted builds a new list. findings itself still has all three.' },
      { answer: "['cache', 'db']\n3", why: 'reverse=True puts the highest score first.' },
    ],
    variants: [
      {
        code: `words = ["plum", "kiwi", "fig"]
print(sorted(words, key=len))
print(max(words, key=len))
print(sorted(words, key=lambda w: w[-1]))`,
        answer: "['fig', 'plum', 'kiwi']\nplum\n['fig', 'kiwi', 'plum']",
        mistakes: [
          { answer: "['fig', 'plum', 'kiwi']\nkiwi\n['fig', 'kiwi', 'plum']", why: 'On a tie, max keeps the first one it met. plum comes before kiwi in the list.' },
        ],
        explain: 'The same three words came out in different orders because the key changed: by length first, then by last letter.',
      },
    ],
    hints: ['Order the scores from highest to lowest, then take two.', 'Does sorted change findings?'],
    explain: 'The key picked out each score, reverse put the highest first, and the slice kept two. The comprehension then pulled the host out of each.',
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
    whyNot: [
      '',
      'Nothing here looks at time or order. Counter tallies how often each IP appears.',
      'The if keeps only lines that contain "Failed password". Successful logins are thrown away.',
      '[-4] picks the fourth word from the end of the line, which is the IP address. The username is further left.',
    ],
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
    whyNot: [
      '',
      'It never opens a file to read. urlretrieve writes a file that came from the network.',
      'The last line runs what was downloaded. A check would stop before that.',
      'There is no pip here and the download is never imported. It is run as a program.',
    ],
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
    whyNot: [
      'Running unknown code to see what it does is the one thing to avoid. By the time you see the result, it has happened.',
      '',
      'Being only an encoding is why it can be read safely. It is not a reason to trust what is inside.',
      'base64 is standard library and always present. That says nothing about the payload.',
    ],
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
    whyNot: [
      'summary puts the text "max=" in front before returning.',
      '',
      'biggest returns one number, max(values), not the whole list.',
      'Both imported files are shown, and each defines the name being imported from it.',
    ],
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
    whyNot: [
      'It works for ordinary names, which is why it survives. It breaks the moment name contains a quote.',
      '',
      'Possibly true, and not the problem that matters here.',
      'A name does not change what the code does.',
    ],
    hints: ['What if name were: x\' OR \'1\'=\'1 ?', 'The value is pasted into the query text itself.'],
    explain: 'A name like x\' OR \'1\'=\'1 turns the WHERE clause into something that matches every row. Parameterized queries keep data and query separate.',
  },
];

export const WORLDS: World[] = [...PYTHON_WORLDS, ...TS_WORLDS];
export const LEVELS: Level[] = [...PYTHON_LEVELS, ...TS_LEVELS];

export const TRACKS: { id: Track; title: string }[] = [
  { id: 'python', title: 'Python' },
  { id: 'ts', title: 'TypeScript' },
];

const TRACK_OF_WORLD = new Map(WORLDS.map((w) => [w.id, w.track]));

export function trackOf(level: Level): Track {
  return TRACK_OF_WORLD.get(level.world) ?? 'python';
}

export function levelById(id: string): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}

export function levelsIn(world: string): Level[] {
  return LEVELS.filter((l) => l.world === world);
}

/**
 * Writing and repairing code is practice, kept to one side. The lab is for
 * reading: the path, the progress count and the review queue are all made of
 * levels that ask what code does, never ones that ask for code.
 */
export function isPractice(level: Level): boolean {
  return level.kind === 'write' || level.kind === 'fix';
}

export const CORE: Level[] = LEVELS.filter((l) => !isPractice(l));
export const PRACTICE: Level[] = LEVELS.filter(isPractice);

/** The reading path of one track, in order. */
export function coreIn(track: Track): Level[] {
  return CORE.filter((l) => trackOf(l) === track);
}
