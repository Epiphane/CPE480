var x = 0;
var y = 0;
function up(N) {
  if (N === 0) return;
  y -= N;
  process.stdout.write('\033[' + N + 'A');
}
function down(N) {
  if (N === 0) return;
  y += N;
  process.stdout.write('\033[' + N + 'B');
}
function right(N) {
  if (N === 0) return;
  x += N;
  process.stdout.write('\033[' + N + 'C');
}
function left(N) {
  if (N === 0) return;
  x -= N;
  process.stdout.write('\033[' + N + 'A');
}
function moveTo(L, C) {
  process.stdout.write('\033[' + L + ';' + C + 'f');
}

var FgBlack = "\x1b[30m"
var FgRed = "\x1b[31m"
var FgGreen = "\x1b[32m"
var FgYellow = "\x1b[33m"
var FgBlue = "\x1b[34m"
var FgMagenta = "\x1b[35m"
var FgCyan = "\x1b[36m"
var FgWhite = "\x1b[37m"

var BgBlack = "\x1b[40m"
var BgRed = "\x1b[41m"
var BgGreen = "\x1b[42m"
var BgYellow = "\x1b[43m"
var BgBlue = "\x1b[44m"
var BgMagenta = "\x1b[45m"
var BgCyan = "\x1b[46m"
var BgWhite = "\x1b[47m"
function color(fg, bg) {
  process.stdout.write((fg || '') + (bg || ''));
}
function resetColor() {
  process.stdout.write('\x1b[0m');
}

function renderScreen() {
  process.stdout.write('\033[2J');
  moveTo(0, 0);

  // Set up "UI"
  console.log(new Array(26).join('-'));
  console.log('| Games remaining: 0000 |');
  console.log(new Array(26).join('-'));
  console.log('');
  console.log(new Array(26).join('-'));
  console.log('| Games remaining: 0000 |');
  console.log(new Array(26).join('-'));
}
function goToEnd() {
  resetColor();
  moveTo(20, 0);
}

function printGamesRemaining(remaining) {
  remaining = '' + remaining;
  while (remaining.length < 4)
    remaining = ' ' + remaining;

  moveTo(2, 20);
  color(FgCyan);
  console.log(remaining);
  goToEnd();
}

renderScreen();
printGamesRemaining(12);