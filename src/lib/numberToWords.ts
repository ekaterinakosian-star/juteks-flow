// Convert number to Russian words with kopecks. e.g. 1234.56 -> "одна тысяча двести тридцать четыре рубля 56 копеек"

const units0 = ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
const unitsF = ["", "одна", "две", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
const teens = ["десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"];
const tens = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"];
const hundreds = ["", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"];

function triadToWords(num: number, feminine: boolean): string {
  const out: string[] = [];
  const h = Math.floor(num / 100);
  const t = Math.floor((num % 100) / 10);
  const u = num % 10;
  if (h) out.push(hundreds[h]);
  if (t === 1) {
    out.push(teens[u]);
  } else {
    if (t) out.push(tens[t]);
    if (u) out.push(feminine ? unitsF[u] : units0[u]);
  }
  return out.join(" ");
}

function plural(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

export function numberToRubles(value: number): string {
  if (!isFinite(value) || value < 0) return "";
  const rounded = Math.round(value * 100);
  const rub = Math.floor(rounded / 100);
  const kop = rounded % 100;

  const parts: string[] = [];

  if (rub === 0) {
    parts.push("ноль");
  } else {
    const triads: number[] = [];
    let n = rub;
    while (n > 0) {
      triads.push(n % 1000);
      n = Math.floor(n / 1000);
    }
    const scales: { forms: [string, string, string]; fem: boolean }[] = [
      { forms: ["рубль", "рубля", "рублей"], fem: false }, // not used here, rub word appended separately
      { forms: ["тысяча", "тысячи", "тысяч"], fem: true },
      { forms: ["миллион", "миллиона", "миллионов"], fem: false },
      { forms: ["миллиард", "миллиарда", "миллиардов"], fem: false },
    ];
    const chunks: string[] = [];
    for (let i = triads.length - 1; i >= 0; i--) {
      const t = triads[i];
      if (t === 0) continue;
      const fem = i === 1; // thousands feminine
      const words = triadToWords(t, fem);
      if (i === 0) {
        chunks.push(words);
      } else {
        chunks.push(words + " " + plural(t, scales[i].forms));
      }
    }
    parts.push(chunks.join(" "));
  }

  parts.push(plural(rub, ["рубль", "рубля", "рублей"]));
  parts.push(`${String(kop).padStart(2, "0")} ${plural(kop, ["копейка", "копейки", "копеек"])}`);

  const result = parts.join(" ").replace(/\s+/g, " ").trim();
  return result.charAt(0).toUpperCase() + result.slice(1);
}
