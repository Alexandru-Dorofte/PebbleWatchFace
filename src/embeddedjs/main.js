import Poco from "commodetto/Poco";
import Battery from "embedded:sensor/Battery";

const render = new Poco(screen);

// Colors
const black = render.makeColor(0, 0, 0);
const white = render.makeColor(255, 255, 255);

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// LCD-style pixel font: every glyph is 7 rows tall, "#" = lit pixel.
// Everything on the watchface is drawn with it, only the pixel size changes.
const GLYPHS = {
    "0": ["#####", "#...#", "#...#", "#...#", "#...#", "#...#", "#####"],
    "1": ["#", "#", "#", "#", "#", "#", "#"],
    "2": ["#####", "....#", "....#", "#####", "#....", "#....", "#####"],
    "3": ["#####", "....#", "....#", "#####", "....#", "....#", "#####"],
    "4": ["#...#", "#...#", "#...#", "#####", "....#", "....#", "....#"],
    "5": ["#####", "#....", "#....", "#####", "....#", "....#", "#####"],
    "6": ["#####", "#....", "#....", "#####", "#...#", "#...#", "#####"],
    "7": ["#####", "....#", "....#", "....#", "....#", "....#", "....#"],
    "8": ["#####", "#...#", "#...#", "#####", "#...#", "#...#", "#####"],
    "9": ["#####", "#...#", "#...#", "#####", "....#", "....#", "#####"],
    "A": ["#####", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
    "D": ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
    "E": ["#####", "#....", "#....", "#####", "#....", "#....", "#####"],
    "F": ["#####", "#....", "#....", "#####", "#....", "#....", "#...."],
    "H": ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
    "I": ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
    "M": ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
    "N": ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
    "O": ["#####", "#...#", "#...#", "#...#", "#...#", "#...#", "#####"],
    "R": ["#####", "#...#", "#...#", "#####", "#.#..", "#..#.", "#...#"],
    "S": ["#####", "#....", "#....", "#####", "....#", "....#", "#####"],
    "T": ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
    "U": ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", "#####"],
    "W": ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
    "/": ["....#", "....#", "...#.", "..#..", ".#...", "#....", "#...."],
    "%": ["##..#", "##..#", "...#.", "..#..", ".#...", "#..##", "#..##"],
    ":": [".", ".", "#", ".", "#", ".", "."],
};

// Pixel size for each row of text
const SMALL = 3;   // day and date
const LARGE = 7;   // time
const MEDIUM = 4;  // battery

let now = new Date();

const battery = new Battery({
    onSample() {
        draw();
    }
});

function pad(n) {
    return String(n).padStart(2, "0");
}

// Width in pixels, with a one-pixel gap between glyphs
function textWidth(text, p) {
    let cols = -1;
    for (const c of text) cols += GLYPHS[c][0].length + 1;
    return cols * p;
}

function drawText(text, x, y, p) {
    for (const c of text) {
        const glyph = GLYPHS[c];
        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < glyph[row].length; col++) {
                if (glyph[row][col] === "#") render.fillRectangle(white, x + col * p, y + row * p, p, p);
            }
        }
        x += (glyph[0].length + 1) * p;
    }
}

function draw() {
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const dayStr = DAYS[now.getDay()];
    const dateStr = `${pad(now.getMonth() + 1)}/${pad(now.getDate())}`;
    const batteryStr = `${battery.sample().percent}%`;

    // Three rows spaced evenly from top to bottom
    const heights = [7 * SMALL, 7 * LARGE, 7 * MEDIUM];
    const space = (render.height - heights[0] - heights[1] - heights[2]) / 4;
    const y1 = Math.round(space);
    const y2 = Math.round(y1 + heights[0] + space);
    const y3 = Math.round(y2 + heights[1] + space);

    // Day and date line up with the edges of the widest possible time, so they
    // don't move when the time gets narrower (e.g. "11:11")
    const fullWidth = textWidth("00:00", LARGE);
    const left = Math.round((render.width - fullWidth) / 2);
    const right = left + fullWidth;

    render.begin();
    render.fillRectangle(black, 0, 0, render.width, render.height);
    drawText(dayStr, left, y1, SMALL);
    drawText(dateStr, right - textWidth(dateStr, SMALL), y1, SMALL);
    drawText(timeStr, Math.round((render.width - textWidth(timeStr, LARGE)) / 2), y2, LARGE);
    drawText(batteryStr, Math.round((render.width - textWidth(batteryStr, MEDIUM)) / 2), y3, MEDIUM);
    render.end();
}

// Update every minute (fires immediately when registered)
watch.addEventListener("minutechange", e => {
    now = e.date;
    draw();
});
