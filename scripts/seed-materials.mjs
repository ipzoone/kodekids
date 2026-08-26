// scripts/seed-materials.mjs — mengisi tabel materials di Turso DB.
// Jalankan setiap kali update materi: node scripts/seed-materials.mjs
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

const MATERIALS = [
  // ================= 5-7 TAHUN =================
  {
    age_group: "5-7",
    order_num: 1,
    title: "Apa Itu Koding?",
    subtitle: "Kenalan sama si komputer",
    icon: "FaLightbulb",
    color: "amber",
    content: {
      intro: "Koding itu artinya memberi perintah ke komputer supaya dia melakukan apa yang kita mau!",
      sections: [
        {
          heading: "Komputer itu pintar tapi patuh",
          body: "Komputer tidak bisa berpikir sendiri. Dia hanya melakukan apa yang kita perintahkan. Kalau perintahnya jelas, dia bisa melakukan hal keren!",
        },
        {
          heading: "Contohnya seperti apa?",
          body: "Kalau kamu bilang ke robot: \"Ambil bola\" — robot akan bingung. Ambil dari mana? Dibawa ke mana? Koding adalah menulis perintah yang jelas langkah demi langkah.",
        },
      ],
      tip: "Mainkan game Block Puzzle untuk memberi perintah ke kucing dan robot!",
    },
  },
  {
    age_group: "5-7",
    order_num: 2,
    title: "Urutan Itu Penting",
    subtitle: "Langkah demi langkah",
    icon: "FaSortNumericDown",
    color: "emerald",
    content: {
      intro: "Urutan perintah disebut SEQUENCE. Kalau urutannya salah, hasilnya juga salah!",
      sections: [
        {
          heading: "Coba bayangkan",
          body: "Pakai kaos kaki dulu, baru sepatu — benar! Tapi kalau pakai sepatu dulu baru kaos kaki? Aduh, susah banget kan?",
        },
        {
          heading: "Komputer juga gitu",
          body: "Perintah \"majuputarkananmajukecil\" tidak bisa dibaca. Perintah harus diurutkan: MAJU, PUTAR KANAN, MAJU. Satu per satu, rapi.",
        },
      ],
      tip: "Di game Block Puzzle, susun ikon dari atas ke bawah sesuai urutan yang diminta ya!",
    },
  },
  {
    age_group: "5-7",
    order_num: 3,
    title: "Mengenal Pola",
    subtitle: "Hal yang berulang",
    icon: "FaShapes",
    color: "sky",
    content: {
      intro: "Pola (pattern) adalah bentuk atau gerakan yang berulang-ulang.",
      sections: [
        {
          heading: "Pola di sekitar kita",
          body: "Clap-tap-clap-tap-clap-tap. Itu pola! Hujan-teduh-hujan-teduh juga pola. Pola membuat kita tahu apa yang terjadi selanjutnya.",
        },
        {
          heading: "Pola di koding",
          body: "Kalau kamu harus melangkah MAJU 5 kali, kamu menemukan pola: maju, maju, maju, maju, maju. Komputer suka sekali pola karena dia bisa mengulang tanpa capek!",
        },
      ],
      tip: "Coba perhatikan target puzzle — biasanya ada pola gerakan yang berulang!",
    },
  },
  {
    age_group: "5-7",
    order_num: 4,
    title: "Ya atau Tidak?",
    subtitle: "Belajar logika",
    icon: "FaBalanceScale",
    color: "rose",
    content: {
      intro: "Logika itu memilih: kalau benar lakukan ini, kalau salah lakukan itu.",
      sections: [
        {
          heading: "Contoh mudah",
          body: "KALAU hujan, MAKA pakai payung. KALAU tidak hujan, MAKA main di luar. Kamu sudah pakai logika setiap hari!",
        },
        {
          heading: "Komputer juga memilih",
          body: "Robot kita juga mikir: KALAU ada tembok di depan, JANGAN maju. Komputer memilih berdasarkan perintah yang kita tulis.",
        },
      ],
      tip: "Sebelum menyusun jawaban, pikirkan dulu: kalau aku maju, apakah aku menabrak?",
    },
  },
  {
    age_group: "5-7",
    order_num: 5,
    title: "Detektif Kesalahan",
    subtitle: "Mencari bug",
    icon: "FaSearch",
    color: "violet",
    content: {
      intro: "Kesalahan dalam koding disebut BUG. Mencari dan memperbaikinya disebut DEBUGGING.",
      sections: [
        {
          heading: "Semua programmer pernah salah",
          body: "Programmer hebat pun sering salah. Yang membedakan, mereka sabar mencari di mana letak salahnya.",
        },
        {
          heading: "Cara jadi detektif",
          body: "Kalau jawabanmu salah: baca lagi urutannya pelan-pelan, ikuti jalannya satu per satu, dan cari langkah mana yang bikin tersesat. Ketemu? Perbaiki dan coba lagi!",
        },
      ],
      tip: "Salah itu bukan hal buruk — itu artinya kamu sedang belajar!",
    },
  },

  // ================= 8-10 TAHUN =================
  // Catatan: field `blocks` = workspace Blockly dalam format serialisasi,
  // ditampilkan sebagai gambar blok asli di halaman materi.
  {
    age_group: "8-10",
    order_num: 1,
    title: "Apa Itu Program?",
    subtitle: "Resep untuk komputer",
    icon: "FaBook",
    color: "emerald",
    content: {
      intro: "Program adalah daftar perintah yang ditulis untuk komputer, seperti resep masakan.",
      sections: [
        {
          heading: "Seperti resep kue",
          body: "Resep punya langkah urut: campur tepung, tuang telur, aduk, panggang. Program juga sama — baris demi baris dibaca dari atas ke bawah.",
        },
        {
          heading: "Program pertamamu dalam blok",
          body: "Di bawah ini program yang terdiri dari DUA blok. Komputer membacanya dari atas ke bawah: cetak Halo Dunia dulu, baru cetak Sampai Jumpa!",
          blocks: {
            blocks: {
              languageVersion: 0,
              blocks: [
                { type: "text_print", x: 20, y: 20, inputs: { TEXT: { block: { type: "text", fields: { TEXT: "Halo Dunia" } } } } },
                { type: "text_print", x: 20, y: 90, inputs: { TEXT: { block: { type: "text", fields: { TEXT: "Sampai Jumpa!" } } } } },
              ],
            },
          },
        },
        {
          heading: "Bahasa pemrograman",
          body: "Komputer tidak paham blok secara langsung — blok diubah menjadi bahasa pemrograman seperti Python dan JavaScript. Beda bahasa, beda cara nulisnya, tapi idenya sama!",
        },
      ],
      tip: "Dalam Blockly Coding, kamu sudah membuat program — hanya saja dengan blok!",
    },
  },
  {
    age_group: "8-10",
    order_num: 2,
    title: "Menampilkan Tulisan",
    subtitle: "Output: print & console.log",
    icon: "FaTerminal",
    color: "sky",
    content: {
      intro: "Menampilkan sesuatu ke layar disebut OUTPUT. Ini biasanya program pertama yang dipelajari orang.",
      sections: [
        {
          heading: "Blok 'cetak teks'",
          body: "Ini blok untuk menampilkan teks. Tarik bloknya, lalu ketik teks yang mau ditampilkan di lubangnya:",
          blocks: {
            blocks: {
              languageVersion: 0,
              blocks: [
                { type: "text_print", x: 20, y: 20, inputs: { TEXT: { shadow: { type: "text", fields: { TEXT: "Halo Dunia" } } } } },
              ],
            },
          },
        },
        {
          heading: "Blok yang sama, jadi kode Python",
          body: "Di Python, blok cetak ini berubah menjadi perintah print():",
          code: { language: "python", snippet: 'print("Halo Dunia")' },
        },
        {
          heading: "Blok yang sama, jadi kode JavaScript",
          body: "Di JavaScript, blok yang SAMA ini berubah menjadi console.log(). Lihat kan — bloknya satu, kodenya bisa dua bahasa!",
          code: { language: "javascript", snippet: 'console.log("Halo Dunia");' },
        },
        {
          heading: "Tanda kutip itu penting!",
          body: "Teks yang mau ditampilkan harus dibungkus tanda kutip \"...\" supaya komputer tahu itu teks, bukan perintah.",
        },
      ],
      tip: "Di Blockly Coding, blok 'cetak teks' otomatis jadi print di Python dan console.log di JavaScript!",
    },
  },
  {
    age_group: "8-10",
    order_num: 3,
    title: "Kotak Ajaib: Variabel",
    subtitle: "Tempat menyimpan nilai",
    icon: "FaBoxOpen",
    color: "amber",
    content: {
      intro: "Variabel itu seperti kotak berlabel yang dipakai untuk menyimpan sesuatu, misalnya angka atau teks.",
      sections: [
        {
          heading: "Cara kerjanya",
          body: "Buat kotak bernama 'warna', lalu isi dengan teks hitam. Nanti kalau dicetak isinya, yang muncul adalah hitam.",
        },
        {
          heading: "Susunan blok variabel",
          body: "Pertama isi kotaknya pakai blok 'set warna ke', lalu cetak pakai blok lonjong 'warna':",
          blocks: {
            blocks: {
              languageVersion: 0,
              variables: [{ id: "varWarna", name: "warna", type: "" }],
              blocks: [
                {
                  type: "variables_set",
                  x: 20,
                  y: 20,
                  fields: { VAR: { id: "varWarna" } },
                  inputs: { VALUE: { shadow: { type: "text", fields: { TEXT: "hitam" } } } },
                },
                {
                  type: "text_print",
                  x: 20,
                  y: 90,
                  inputs: { TEXT: { block: { type: "variables_get", fields: { VAR: { id: "varWarna" } } } } },
                },
              ],
            },
          },
        },
        {
          heading: "Hasil kodenya",
          body: "Di Python jadi begini:",
          code: {
            language: "python",
            snippet: 'warna = "hitam"\nprint(warna)',
          },
        },
        {
          heading: "Isinya bisa diganti!",
          body: "Nama variabel boleh tetap, isinya boleh diganti kapan saja. Itulah kenapa dia dinamai VARI-abel (bisa berubah).",
        },
      ],
      tip: "Skor poinmu di game ini juga disimpan dalam variabel loh!",
    },
  },
  {
    age_group: "8-10",
    order_num: 4,
    title: "Ulangi-Ulangi: Perulangan",
    subtitle: "Loop biar nggak pegal",
    icon: "FaSyncAlt",
    color: "rose",
    content: {
      intro: "Kalau disuruh menulis 'Halo' 100 kali, capek kan? Komputer tidak — dia pakai LOOP!",
      sections: [
        {
          heading: "Blok 'ulangi'",
          body: "Blok ulangi punya lubang angka (berapa kali) dan celah di tengah untuk blok yang mau diulang. Di sini kita ulangi cetak Halo sebanyak 3 kali:",
          blocks: {
            blocks: {
              languageVersion: 0,
              blocks: [
                {
                  type: "controls_repeat_ext",
                  x: 20,
                  y: 20,
                  inputs: {
                    TIMES: { shadow: { type: "math_number", fields: { NUM: 3 } } },
                    DO: {
                      block: {
                        type: "text_print",
                        inputs: { TEXT: { shadow: { type: "text", fields: { TEXT: "Halo" } } } },
                      },
                    },
                  },
                },
              ],
            },
          },
        },
        {
          heading: "Jadi kode Python",
          body: "Perintah for range(3) artinya ulangi 3 kali:",
          code: {
            language: "python",
            snippet: 'for i in range(3):\n    print("Halo")',
          },
        },
        {
          heading: "Jadi kode JavaScript",
          body: "JavaScript punya gaya penulisan sendiri — lebih panjang tapi idenya sama persis:",
          code: {
            language: "javascript",
            snippet: 'for (let count = 0; count < 3; count++) {\n  console.log("Halo");\n}',
          },
        },
      ],
      tip: "Level 'Halo Berkali-kali' di Blockly Coding melatihmu memakai blok ulangi!",
    },
  },
  {
    age_group: "8-10",
    order_num: 5,
    title: "Jika... Maka!: Kondisi",
    subtitle: "Komputer bisa memilih",
    icon: "FaCodeBranch",
    color: "violet",
    content: {
      intro: "Kondisi (if) membuat program bisa MEMILIH: kalau sesuatu benar, lakukan ini.",
      sections: [
        {
          heading: "Blok 'jika ... maka'",
          body: "Blok jika punya lubang syarat (kita isi blok benar/true) dan celah untuk perintahnya (cetak BENAR):",
          blocks: {
            blocks: {
              languageVersion: 0,
              blocks: [
                {
                  type: "controls_if",
                  x: 20,
                  y: 20,
                  values: { IF0: { shadow: { type: "logic_boolean", fields: { BOOL: "TRUE" } } } },
                  inputs: {
                    DO0: {
                      block: {
                        type: "text_print",
                        inputs: { TEXT: { shadow: { type: "text", fields: { TEXT: "BENAR" } } } },
                      },
                    },
                  },
                },
              ],
            },
          },
        },
        {
          heading: "Jadi kode Python",
          body: "Nilai benar/salah di Python ditulis True dan False (huruf besar di awal):",
          code: {
            language: "python",
            snippet: 'if True:\n    print("BENAR")',
          },
        },
        {
          heading: "Jadi kode JavaScript",
          body: "Di JavaScript ditulis true (huruf kecil semua) dan ada kurung kurawal { }:",
          code: {
            language: "javascript",
            snippet: 'if (true) {\n  console.log("BENAR");\n}',
          },
        },
      ],
      tip: "Level terakhir Blockly Coding menantimu memakai blok jika/maka!",
    },
  },

  // ================= 11-15 TAHUN =================
  {
    age_group: "11-15",
    order_num: 1,
    title: "Hello World!",
    subtitle: "Output pertamamu",
    icon: "FaGlobe",
    color: "emerald",
    content: {
      intro: "Tradisi programmer dunia: program pertama selalu menampilkan 'Hello World!'.",
      sections: [
        {
          heading: "Python — fungsi print()",
          body: "print() menampilkan teks ke layar. Teks dibungkus kutip tunggal atau ganda, dua-duanya boleh:",
          code: {
            language: "python",
            snippet: "print('Halo Dunia')\nprint(\"Saya belajar Python\")",
          },
        },
        {
          heading: "JavaScript — console.log()",
          body: "Di JavaScript, akhir perintah diberi titik koma ; (opsional tapi disarankan):",
          code: {
            language: "javascript",
            snippet: 'console.log("Halo Dunia");\nconsole.log(\'Saya belajar JavaScript\');',
          },
        },
        {
          heading: "Comment (komentar)",
          body: "Catatan untuk manusia yang tidak dijalankan komputer: Python pakai #, JavaScript pakai //.",
          code: {
            language: "javascript",
            snippet: "# ini komentar Python\n// ini komentar JavaScript",
          },
        },
      ],
      tip: "Coba tulis program Hello World-mu sendiri di editor General Coding!",
    },
  },
  {
    age_group: "11-15",
    order_num: 2,
    title: "Variabel",
    subtitle: "Menyimpan & mengubah data",
    icon: "FaBoxOpen",
    color: "sky",
    content: {
      intro: "Variabel adalah wadah bernama untuk menyimpan data: angka, teks, atau boolean.",
      sections: [
        {
          heading: "Python — langsung isi",
          body: "Python tidak perlu kata kunci. Tipe datanya dideteksi otomatis:",
          code: {
            language: "python",
            snippet: 'nama = "Sinta"\numur = 13\ntinggi = 152.5',
          },
        },
        {
          heading: "JavaScript — let & const",
          body: "let = nilainya boleh diganti. const = konstanta, tidak bisa diganti:",
          code: {
            language: "javascript",
            snippet: 'let nama = "Sinta";\nconst umur = 13;\nnama = "Budi"; // boleh\n// umur = 14; // ERROR!',
          },
        },
        {
          heading: "Gabungkan teks (concatenation)",
          body: "Python pakai f-string, JavaScript pakai template literal backtick:",
          code: {
            language: "javascript",
            snippet: "// Python: print(f'Halo, {nama}!')\nconsole.log(`Halo, ${nama}!`);",
          },
        },
      ],
      tip: "Aturan penamaan: mulai huruf, tanpa spasi, jangan pakai kata kunci seperti let/if/for.",
    },
  },
  {
    age_group: "11-15",
    order_num: 3,
    title: "Operator",
    subtitle: "Hitung & bandingkan",
    icon: "FaCalculator",
    color: "amber",
    content: {
      intro: "Operator adalah simbol untuk menghitung atau membandingkan nilai.",
      sections: [
        {
          heading: "Operator matematika",
          body: "+ tambah, - kurang, * kali, / bagi, % sisa bagi (modulo). Sama di kedua bahasa!",
          code: {
            language: "javascript",
            snippet: "console.log(7 % 2); // 1, sisa pembagian",
          },
        },
        {
          heading: "Perbandingan",
          body: "== sama (longgar), === identik (ketat, khusus JS), != tidak sama, > lebih besar, < lebih kecil. Di Python gunakan == dan !=.",
          code: {
            language: "python",
            snippet: "print(5 > 3)   # True\nprint(5 == 4)  # False",
          },
        },
        {
          heading: "=== vs == di JavaScript",
          body: "== membandingkan nilai saja (5 == \"5\" → true). === membandingkan nilai DAN tipe (5 === \"5\" → false). Programmer modern selalu pakai ===.",
        },
      ],
      tip: "Modulo % sering dipakai untuk cek genap/ganjil: n % 2 == 0 artinya genap!",
    },
  },
  {
    age_group: "11-15",
    order_num: 4,
    title: "If / Else",
    subtitle: "Program pengambil keputusan",
    icon: "FaCodeBranch",
    color: "rose",
    content: {
      intro: "Struktur kondisi menjalankan kode tertentu HANYA jika syaratnya terpenuhi.",
      sections: [
        {
          heading: "Python — pakai indentasi",
          body: "Python tidak pakai kurung kurawal, tapi spasi di awal baris (indentasi 4 spasi):",
          code: {
            language: "python",
            snippet: "nilai = 80\nif nilai >= 75:\n    print(\"Lulus\")\nelse:\n    print(\"Remedial\")",
          },
        },
        {
          heading: "JavaScript — pakai kurung kurawal",
          code: {
            language: "javascript",
            snippet: 'let nilai = 80;\nif (nilai >= 75) {\n  console.log("Lulus");\n} else {\n  console.log("Remedial");\n}',
          },
        },
        {
          heading: "Else if / elif",
          body: "Untuk banyak pilihan: Python pakai elif, JavaScript pakai else if. Syarat dicek dari atas ke bawah, yang cocok pertama itulah yang dijalankan.",
        },
      ],
      tip: "Lupa titik dua : di Python atau kurung () di JavaScript adalah penyebab error paling umum!",
    },
  },
  {
    age_group: "11-15",
    order_num: 5,
    title: "Perulangan For",
    subtitle: "Kerja berulang otomatis",
    icon: "FaSyncAlt",
    color: "violet",
    content: {
      intro: "Loop menjalankan kode berkali-kali tanpa harus menulis ulang.",
      sections: [
        {
          heading: "Python — for in range()",
          body: "range(3) menghasilkan 0, 1, 2 (mulai dari nol!):",
          code: {
            language: "python",
            snippet: "for i in range(3):\n    print(i)",
          },
        },
        {
          heading: "JavaScript — tiga bagian",
          body: "for (mulai; syarat; perubahan). Baca: mulai dari i=0, jalan selama i<3, tiap selesai tambah i++:",
          code: {
            language: "javascript",
            snippet: "for (let i = 0; i < 3; i++) {\n  console.log(i);\n}",
          },
        },
        {
          heading: "Balik string pakai loop-thinking",
          body: "Python punya trik slicing kata[::-1] untuk membalik string. JavaScript pakai split-reverse-join. Beda cara, hasil sama!",
          code: {
            language: "javascript",
            snippet: '// Python: kata[::-1]\n"kodi".split("").reverse().join(""); // "idok"',
          },
        },
      ],
      tip: "Infinite loop (loop tak berhenti) terjadi kalau syarat tidak pernah false — hati-hati!",
    },
  },
];

await db.execute(`
  CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    age_group TEXT NOT NULL,
    order_num INTEGER NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL DEFAULT '',
    icon TEXT NOT NULL DEFAULT 'FaBook',
    color TEXT NOT NULL DEFAULT 'emerald',
    content TEXT NOT NULL DEFAULT '{}',
    UNIQUE(age_group, order_num)
  )
`);

for (const m of MATERIALS) {
  await db.execute({
    sql: `INSERT INTO materials (age_group, order_num, title, subtitle, icon, color, content)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(age_group, order_num) DO UPDATE SET
            title = excluded.title, subtitle = excluded.subtitle,
            icon = excluded.icon, color = excluded.color, content = excluded.content`,
    args: [
      m.age_group,
      m.order_num,
      m.title,
      m.subtitle,
      m.icon,
      m.color,
      JSON.stringify(m.content),
    ],
  });
}

const count = await db.execute("SELECT COUNT(*) AS n FROM materials");
console.log(`Seed materi selesai. Total ${count.rows[0].n} materi di DB.`);
