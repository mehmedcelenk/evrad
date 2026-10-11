import { readFile, writeFile } from "node:fs/promises";

const arabic = JSON.parse(await readFile(process.argv[2], "utf8")).data.ayahs;
const turkish = JSON.parse(await readFile(process.argv[3], "utf8")).data.ayahs;
const output = process.argv[4];

const names = new Map([
  [78, "Nebe"], [79, "Nâziât"], [80, "Abese"], [81, "Tekvîr"], [82, "İnfitâr"], [83, "Mutaffifîn"],
  [84, "İnşikâk"], [85, "Bürûc"], [86, "Târık"], [87, "A‘lâ"], [88, "Gâşiye"], [89, "Fecr"],
  [90, "Beled"], [91, "Şems"], [92, "Leyl"], [93, "Duhâ"], [94, "İnşirâh"], [95, "Tîn"],
  [96, "Alak"], [97, "Kadir"], [98, "Beyyine"], [99, "Zilzâl"], [100, "Âdiyât"], [101, "Kâria"],
  [102, "Tekâsür"], [103, "Asr"], [104, "Hümeze"], [105, "Fîl"], [106, "Kureyş"], [107, "Mâûn"],
  [108, "Kevser"], [109, "Kâfirûn"], [110, "Nasr"], [111, "Tebbet"], [112, "İhlâs"], [113, "Felak"], [114, "Nâs"],
]);
const legacyIds = new Map([[112, "surah-al-ikhlas"], [113, "surah-al-falaq"], [114, "surah-an-nas"]]);

const grouped = new Map();
for (const [index, ayah] of arabic.entries()) {
  const number = ayah.surah.number;
  const entry = grouped.get(number) ?? { arabic: [], turkish: [] };
  entry.arabic.push(ayah.text);
  entry.turkish.push(turkish[index].text);
  grouped.set(number, entry);
}

const rows = [...grouped].map(([number, text]) => ({
  id: legacyIds.get(number) ?? `surah-${number}`,
  name: `${names.get(number)} Sûresi`,
  arabic: text.arabic.join("\n"),
  translation: [...new Set(text.turkish)].join("\n"),
  details: `Kur’an-ı Kerîm’in ${number}. sûresi; ${text.arabic.length} âyettir.`,
  source: `${names.get(number)} sûresi, ${number}/1-${text.arabic.length} · Arapça: Uthmanî metin · Meal: Diyanet İşleri`,
}));

const header = `import { memorizationTemplate } from "./memorization-template";\n\n// 30. cüz: AlQuran Cloud quran-uthmani ve tr.diyanet edisyonlarından üretilmiştir.\nconst shortSurahData = [\n`;
const body = rows.map((row) => `  ${JSON.stringify(row)},`).join("\n");
const footer = `\n] as const;\n\nexport const shortSurahCatalog = shortSurahData.map((item) => memorizationTemplate(item.id, item.name, item.arabic, item.translation, item.details, item.source));\n`;

await writeFile(output, header + body + footer, "utf8");
