// scripts/seed-challenges.mjs — memindahkan data soal game ke Turso DB.
// Jalankan setiap kali ingin update soal: node scripts/seed-challenges.mjs
import { createClient } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";

function readEnvVar(key) {
  const content = fs.readFileSync(path.join(process.cwd(), ".env"), "utf-8");
  const match = content.match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!match) throw new Error(`Variabel ${key} tidak ditemukan di .env`);
  return match[1].trim();
}

const db = createClient({
  url: readEnvVar("DB_URL_TURSO"),
  authToken: readEnvVar("TOKEN_TURSO"),
});

// ================= DATA SOAL =================
const AGE_GROUPS = [
  { age_group: "5-7", label: "Block Puzzle Ikon", max_levels: 5 },
  { age_group: "8-10", label: "Blockly Coding", max_levels: 5 },
  { age_group: "11-15", label: "Coding", max_levels: 5 },
];

const CHALLENGES = [
  // ---------- 5-7: Block Puzzle ----------
  {
    age_group: "5-7",
    level: 1,
    type: "sequence",
    title: "Kucing dan Ikan",
    body: "Bantu kucingnya sampai ke ikan!",
    data: { moves: ["up", "right", "left"], goalIcon: "fish" },
  },
  {
    age_group: "5-7",
    level: 2,
    type: "sequence",
    title: "Robot Pengejar Bintang",
    body: "Bantu robotnya mengumpulkan bintang!",
    data: { moves: ["up", "down", "right"], goalIcon: "star" },
  },
  {
    age_group: "5-7",
    level: 3,
    type: "sequence",
    title: "Kelinci dan Wortel",
    body: "Bantu kelincinya mencapai wortel!",
    data: { moves: ["up", "right", "left"], goalIcon: "carrot" },
  },
  {
    age_group: "5-7",
    level: 4,
    type: "sequence",
    title: "Kucing dan Ikan II",
    body: "Bantu kucingnya sampai ke ikan!",
    data: { moves: ["up", "right", "left"], goalIcon: "fish" },
  },
  {
    age_group: "5-7",
    level: 5,
    type: "sequence",
    title: "Robot Pengejar Bintang II",
    body: "Bantu robotnya mengumpulkan bintang!",
    data: { moves: ["up", "down", "right"], goalIcon: "star" },
  },

  // ---------- 8-10: Blockly (soal disesuaikan bahasa yang dipilih) ----------
  {
    age_group: "8-10",
    level: 1,
    type: "blockly",
    title: "Sapa Dunia",
    body: "Buat program yang mencetak teks 'Halo Dunia' satu kali.",
    data: {
      check: { type: "print", count: 1 },
      langs: {
        python: {
          desc: "Susun blok 'cetak teks' berisi tulisan Halo Dunia. Di Python, blok ini menjadi perintah print(\"Halo Dunia\").",
        },
        javascript: {
          desc: "Susun blok 'cetak teks' berisi tulisan Halo Dunia. Di JavaScript, blok ini memunculkan window.alert(\"Halo Dunia\") saat program dijalankan.",
        },
      },
    },
  },
  {
    age_group: "8-10",
    level: 2,
    type: "blockly",
    title: "Halo Berkali-kali",
    body: "Gunakan blok 'ulangi' (repeat) untuk mencetak 'Halo' sebanyak 3 kali.",
    data: {
      check: { type: "loop_print", count: 3 },
      langs: {
        python: {
          desc: "Masukkan blok 'cetak teks' berisi Halo ke dalam blok 'ulangi 3 kali'. Di Python hasilnya seperti for i in range(3): print(\"Halo\").",
        },
        javascript: {
          desc: "Masukkan blok 'cetak teks' berisi Halo ke dalam blok 'ulangi 3 kali'. Di JavaScript hasilnya seperti for (var i = 0; i < 3; i++) { window.alert(\"Halo\"); }.",
        },
      },
    },
  },
  {
    age_group: "8-10",
    level: 3,
    type: "blockly",
    title: "Hitam Putih",
    body: "Buat variabel 'warna' berisi teks, lalu cetak isinya.",
    data: {
      check: { type: "variable_print" },
      langs: {
        python: {
          desc: "Buat variabel bernama warna berisi sebuah teks (misal \"hitam\"), lalu cetak. Di Python variabel dibuat dengan perintah set warna to ... dan dicetak pakai print(warna).",
        },
        javascript: {
          desc: "Buat variabel bernama warna berisi sebuah teks (misal \"hitam\"), lalu tampilkan. Di JavaScript variabel dibuat dengan var warna = ... dan ditampilkan pakai window.alert(warna).",
        },
      },
    },
  },
  {
    age_group: "8-10",
    level: 4,
    type: "blockly",
    title: "Hitung Mundur",
    body: "Cetak angka 3, 2, 1 memakai perulangan.",
    data: {
      check: { type: "countdown" },
      langs: {
        python: {
          desc: "Cetak angka 3, lalu 2, lalu 1 memakai blok 'ulangi'. Di Python angka dicetak dengan print(3), print(2), print(1).",
        },
        javascript: {
          desc: "Cetak angka 3, lalu 2, lalu 1 memakai blok 'ulangi'. Di JavaScript angka dimunculkan dengan window.alert(3), window.alert(2), window.alert(1).",
        },
      },
    },
  },
  {
    age_group: "8-10",
    level: 5,
    type: "blockly",
    title: "Pilih Jalur",
    body: "Gunakan blok 'jika/maka' (if) untuk mencetak 'BENAR' jika sebuah variabel bernilai true.",
    data: {
      check: { type: "if_block" },
      langs: {
        python: {
          desc: "Buat variabel bernilai true (benar), lalu gunakan blok 'jika ... maka' untuk mencetak BENAR. Di Python polanya if benar: print(\"BENAR\").",
        },
        javascript: {
          desc: "Buat variabel bernilai true (benar), lalu gunakan blok 'jika ... maka' untuk menampilkan BENAR. Di JavaScript polanya if (benar) { window.alert(\"BENAR\"); }.",
        },
      },
    },
  },

  // ---------- 11-15: General Coding (urutan dari paling mudah, soal per bahasa) ----------
  {
    age_group: "11-15",
    level: 1,
    type: "code",
    title: "Halo Dunia",
    body: "Buat fungsi yang mengembalikan teks 'Halo Dunia'.",
    data: {
      langs: {
        python: {
          description: "Buat fungsi halo() TANPA parameter yang mengembalikan teks 'Halo Dunia'. Pola di Python:\n\ndef halo():\n    return 'Halo Dunia'",
          starterCode: "def halo():\n    # kembalikan teks 'Halo Dunia'\n    pass\n",
          tests: [{ call: "halo()", expected: "Halo Dunia" }],
        },
        javascript: {
          description: "Buat function halo() TANPA parameter yang mengembalikan (return) teks 'Halo Dunia'. Pola di JavaScript:\n\nfunction halo() {\n  return 'Halo Dunia';\n}",
          starterCode: "function halo() {\n  // kembalikan teks 'Halo Dunia'\n}\n",
          tests: [{ call: "halo()", expected: "Halo Dunia" }],
        },
      },
    },
  },
  {
    age_group: "11-15",
    level: 2,
    type: "code",
    title: "Sapaan Programmer",
    body: "Buat fungsi sapa(nama) yang mengembalikan teks 'Halo, <nama>!'.",
    data: {
      langs: {
        python: {
          description: "Buat fungsi sapa(nama) yang menerima satu parameter dan mengembalikan 'Halo, <nama>!'. Contoh: sapa('Budi') → 'Halo, Budi!'. Ingat, di Python gabung string pakai f-string atau +:\n\ndef sapa(nama):\n    return f'Halo, {nama}!'",
          starterCode: "def sapa(nama):\n    # kembalikan 'Halo, <nama>!'\n    pass\n",
          tests: [
            { call: "sapa('Budi')", expected: "Halo, Budi!" },
            { call: "sapa('Ani')", expected: "Halo, Ani!" },
          ],
        },
        javascript: {
          description: "Buat function sapa(nama) yang menerima satu parameter dan mengembalikan 'Halo, <nama>!'. Contoh: sapa(\"Budi\") → 'Halo, Budi!'. Di JavaScript kamu bisa pakai template literal atau +:\n\nfunction sapa(nama) {\n  return `Halo, ${nama}!`;\n}",
          starterCode: "function sapa(nama) {\n  // kembalikan 'Halo, <nama>!'\n}\n",
          tests: [
            { call: 'sapa("Budi")', expected: "Halo, Budi!" },
            { call: 'sapa("Ani")', expected: "Halo, Ani!" },
          ],
        },
      },
    },
  },
  {
    age_group: "11-15",
    level: 3,
    type: "code",
    title: "Penjumlah Sederhana",
    body: "Buat fungsi jumlah(a, b) yang mengembalikan hasil penjumlahan a dan b.",
    data: {
      langs: {
        python: {
          description: "Buat fungsi jumlah(a, b) yang mengembalikan a + b. Di Python tidak perlu menulis tipe datanya:\n\ndef jumlah(a, b):\n    return a + b",
          starterCode: "def jumlah(a, b):\n    # kembalikan hasil a + b\n    pass\n",
          tests: [
            { call: "jumlah(2, 3)", expected: 5 },
            { call: "jumlah(10, -4)", expected: 6 },
          ],
        },
        javascript: {
          description: "Buat function jumlah(a, b) yang mengembalikan a + b. Jangan lupa titik koma dan return di JavaScript:\n\nfunction jumlah(a, b) {\n  return a + b;\n}",
          starterCode: "function jumlah(a, b) {\n  // kembalikan hasil a + b\n}\n",
          tests: [
            { call: "jumlah(2, 3)", expected: 5 },
            { call: "jumlah(10, -4)", expected: 6 },
          ],
        },
      },
    },
  },
  {
    age_group: "11-15",
    level: 4,
    type: "code",
    title: "Deteksi Genap",
    body: "Buat fungsi genap(n) yang mengembalikan true jika n bilangan genap, false jika tidak.",
    data: {
      langs: {
        python: {
          description: "Buat fungsi genap(n) yang mengembalikan True jika n habis dibagi 2, selain itu False. Perhatikan, di Python nilai boolean ditulis True/False (huruf besar di depan):\n\ndef genap(n):\n    return n % 2 == 0",
          starterCode: "def genap(n):\n    # kembalikan True jika n genap, False jika tidak\n    pass\n",
          tests: [
            { call: "genap(4)", expected: "True" },
            { call: "genap(7)", expected: "False" },
          ],
        },
        javascript: {
          description: "Buat function genap(n) yang mengembalikan true jika n habis dibagi 2, selain itu false. Di JavaScript boolean ditulis true/false (huruf kecil semua):\n\nfunction genap(n) {\n  return n % 2 === 0;\n}",
          starterCode: "function genap(n) {\n  // kembalikan true jika n genap, false jika tidak\n}\n",
          tests: [
            { call: "genap(4)", expected: true },
            { call: "genap(7)", expected: false },
          ],
        },
      },
    },
  },
  {
    age_group: "11-15",
    level: 5,
    type: "code",
    title: "Balik Kata",
    body: "Buat fungsi balik(kata) yang mengembalikan kata terbalik. Contoh: balik('kodi') -> 'idok'",
    data: {
      langs: {
        python: {
          description: "Buat fungsi balik(kata) yang mengembalikan kata terbalik. Contoh: balik('kodi') → 'idok'. Trik di Python pakai slicing [::-1]:\n\ndef balik(kata):\n    return kata[::-1]",
          starterCode: "def balik(kata):\n    # kembalikan kata terbalik\n    pass\n",
          tests: [
            { call: "balik('kodi')", expected: "idok" },
            { call: "balik('abc')", expected: "cba" },
          ],
        },
        javascript: {
          description: "Buat function balik(kata) yang mengembalikan kata terbalik. Contoh: balik(\"kodi\") → 'idok'. Di JavaScript, ubah ke array lalu balik: kata.split('').reverse().join(''):\n\nfunction balik(kata) {\n  return kata.split('').reverse().join('');\n}",
          starterCode: "function balik(kata) {\n  // kembalikan kata terbalik\n}\n",
          tests: [
            { call: "balik('kodi')", expected: "idok" },
            { call: "balik('abc')", expected: "cba" },
          ],
        },
      },
    },
  },
];

// ================= SEED =================
await db.execute(`
  CREATE TABLE IF NOT EXISTS age_groups (
    age_group TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    max_levels INTEGER NOT NULL
  )
`);
await db.execute(`
  CREATE TABLE IF NOT EXISTS challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    age_group TEXT NOT NULL,
    level INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    data TEXT NOT NULL DEFAULT '{}',
    UNIQUE(age_group, level)
  )
`);

for (const g of AGE_GROUPS) {
  await db.execute({
    sql: `INSERT INTO age_groups (age_group, label, max_levels) VALUES (?, ?, ?)
          ON CONFLICT(age_group) DO UPDATE SET label = excluded.label, max_levels = excluded.max_levels`,
    args: [g.age_group, g.label, g.max_levels],
  });
}

for (const c of CHALLENGES) {
  await db.execute({
    sql: `INSERT INTO challenges (age_group, level, type, title, body, data)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(age_group, level) DO UPDATE SET
            type = excluded.type, title = excluded.title,
            body = excluded.body, data = excluded.data`,
    args: [c.age_group, c.level, c.type, c.title, c.body, JSON.stringify(c.data)],
  });
}

const count = await db.execute("SELECT COUNT(*) AS n FROM challenges");
console.log(`Seed selesai. Total ${count.rows[0].n} soal di DB.`);
