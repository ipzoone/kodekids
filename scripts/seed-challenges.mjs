// scripts/seed-challenges.mjs — memindahkan data soal game ke Turso DB.
// Jalankan setiap kali ingin update soal: node scripts/seed-challenges.mjs
//
// Semua game pakai struktur sama: tiap LEVEL berisi 5 SOAL (step 1..5).
// Soal berikutnya terkunci sampai soal sebelumnya dijawab benar.
//
//  5-7  Block Puzzle : cerita susun ikon, makin panjang tiap step
//  8-10 Blockly      : L1 pesan -> L2 variabel & matematika -> L3 percabangan
//                      -> L4 perulangan -> L5 boss campuran
//  11-15 Coding      : L1 output & variabel -> L2 percabangan -> L3 perulangan
//                      -> L4 fungsi -> L5 tantangan cerita / boss final
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

// Test types (untuk 11-15):
// - { call: "...", expected: ... } -> cocokkan return value
// - { output: "..." }              -> cocokkan seluruh teks hasil print (multi-baris dipisah \n)

// Helper Block Puzzle: satu level punya tema + 5 cerita (step), panjang ikon naik bertahap
function puzzleRows(level, moves, goalIcon, steps) {
  return steps.map((s, i) => ({
    age_group: "5-7",
    level,
    step: i + 1,
    type: "sequence",
    title: s.title,
    body: s.body,
    data: { moves, goalIcon, length: s.length },
  }));
}

// Helper Blockly: satu entri ringkas per soal
function blocklyRow(level, step, title, body, check, descPy, descJs) {
  return {
    age_group: "8-10",
    level,
    step,
    type: "blockly",
    title,
    body,
    data: {
      check,
      langs: {
        python: { desc: descPy },
        javascript: { desc: descJs },
      },
    },
  };
}

const CHALLENGES = [
  // =====================================================================
  // ---------- 5-7: Block Puzzle — 5 level x 5 soal ----------
  // =====================================================================
    // Level 1: Kucing dan Ikan
    ...puzzleRows(1, ["up", "down", "left", "right", "cat", "fish", "robot"], "star", [
    { title: "Kucing Laper", body: "Kucingnya kelaparan! Susun langkah supaya sampai ke ikan.", length: 2 },
    { title: "Jalan Panjang", body: "Ikannya agak jauh. Susun langkah yang lebih banyak!", length: 3 },
    { title: "Putar Dulu", body: "Kucingnya harus belok dulu sebelum maju ke ikan.", length: 3 },
    { title: "Labirin Mini", body: "Jalan berbelok-belok. Bantu kucing sampai ke ikan!", length: 4 },
    { title: "Petualangan Besar", body: "Perjalanan terpanjang menuju ikan. Kamu pasti bisa!", length: 5 },
  ]),
    // Level 2: Robot Pengejar Bintang
    ...puzzleRows(2, ["up", "down", "left", "right", "star", "robot", "carrot"], "fish", [
    { title: "Robot Mulai Jalan", body: "Bantu robot mengambil bintang pertamanya!", length: 2 },
    { title: "Naik Turun", body: "Robot harus naik dan turun untuk mencapai bintang.", length: 3 },
    { title: "Bintang Malas", body: "Bintangnya sembunyi. Rencanakan langkah robot dengan teliti!", length: 4 },
    { title: "Misi Ganda", body: "Perjalanan panjang menuju bintang. Jangan salah urutan ya!", length: 4 },
    { title: "Robot Super", body: "Misi paling seru: langkah terpanjang si robot pengejar bintang!", length: 5 },
  ]),
    // Level 3: Kelinci dan Wortel
    ...puzzleRows(3, ["up", "down", "left", "right", "cat", "fish"], "carrot", [
    { title: "Kelinci Kecil", body: "Kelinci mau makan wortel. Susun dua langkahnya!", length: 2 },
    { title: "Lompat Tiga Langkah", body: "Tiga langkah menuju wortel lezat.", length: 3 },
    { title: "Zig Zag Kelinci", body: "Naik, kanan, naik lagi! Bantu kelincinya ya.", length: 4 },
    { title: "Wortel Emas", body: "Wortel emas ada di tempat yang jauh. Susun dengan hati-hati!", length: 4 },
    { title: "Pesta Wortel", body: "Perjalanan terpanjang kelinci ke pesta wortel!", length: 5 },
  ]),
    // Level 4: Kucing Pulang
    ...puzzleRows(4, ["up", "down", "left", "right", "fish", "cat", "star"], "robot", [
    { title: "Cari Rumah", body: "Bantu anak kucing menemukan rumahnya!", length: 3 },
    { title: "Belok Kiri Dulu", body: "Rumahnya di sebelah kiri. Susun langkahnya!", length: 3 },
    { title: "Melewati Taman", body: "Jalan pulang melewati taman. Ikuti jalurnya!", length: 4 },
    { title: "Hujan Turun", body: "Ceapat pulang sebelum hujan! Susun langkah tercepatmu.", length: 4 },
    { title: "Sampai Rumah", body: "Perjalanan pulang terpanjang. Kelucinya menunggumu!", length: 5 },
  ]),
    // Level 5: Misi Roket ke Bintang
    ...puzzleRows(5, ["up", "down", "left", "right", "cat", "fish", "robot", "star", "carrot"], "star", [
    { title: "Roket Berangkat", body: "Astronaut kecil berangkat ke bintang. Susun tiga langkahnya!", length: 3 },
    { title: "Melewati Awan", body: "Turun, kanan, lalu naik melewati awan!", length: 4 },
    { title: "Hampir Sampai", body: "Bintang sudah terlihat! Empat langkah lagi.", length: 4 },
    { title: "Badai Luar Angkasa", body: "Awas badai! Ikuti jalur aman menuju bintang.", length: 5 },
    { title: "Sentuh Bintangnya!", body: "Misi pamungkas astronaut KodeKids. Kamu hebat!", length: 5 },
  ]),

  // =====================================================================
  // ---------- 8-10: Blockly Coding — 5 level x 5 soal ----------
  // =====================================================================

  // ========== LEVEL 1: MENAMPILKAN PESAN ==========
  blocklyRow(1, 1, "Sapa Dunia", "Buat program yang mencetak teks 'Halo Dunia' satu kali.",
    { type: "print", count: 1 },
    "Susun blok 'cetak teks' berisi tulisan Halo Dunia. Di Python blok ini menjadi print(\"Halo Dunia\").",
    "Susun blok 'cetak teks' berisi tulisan Halo Dunia. Di JavaScript blok ini memunculkan window.alert(\"Halo Dunia\")."),
  blocklyRow(1, 2, "Panggil KodeKids", "Cetak teks 'Halo KodeKids!' satu kali.",
    { type: "print", count: 1 },
    "Sama seperti sebelumnya, pakai blok 'cetak teks' lalu isi dengan Halo KodeKids!. Di Python menjadi print(\"Halo KodeKids!\").",
    "Sama seperti sebelumnya, pakai blok 'cetak teks' lalu isi dengan Halo KodeKids!. Di JavaScript memunculkan window.alert(\"Halo KodeKids!\")."),
  blocklyRow(1, 3, "Dua Pesan", "Cetak dua pesan berbeda: 'Selamat pagi' lalu 'Selamat belajar'.",
    { type: "print", count: 2 },
    "Pakai dua blok 'cetak teks', satu berisi Selamat pagi dan satu lagi Selamat belajar. Di Python menjadi dua perintah print.",
    "Pakai dua blok 'cetak teks'. Di JavaScript memunculkan dua window.alert berurutan."),
  blocklyRow(1, 4, "Mesin Penjumlah", "Gunakan blok matematika untuk mencetak hasil dari 7 + 5.",
    { type: "math_print" },
    "Gabungkan blok angka 7 dan 5 dengan blok tambah (+), lalu masukkan ke blok 'cetak'. Di Python seperti print(7 + 5). Hasilnya 12.",
    "Gabungkan blok angka 7 dan 5 dengan blok tambah (+), lalu masukkan ke blok 'cetak'. Di JavaScript seperti window.alert(7 + 5). Hasilnya 12."),
  blocklyRow(1, 5, "Kalimat Gabungan", "Gabungkan teks 'Aku suka' dan 'koding' menjadi satu kalimat, lalu cetak.",
    { type: "text_join" },
    "Pakai blok gabung teks untuk menyambung 'Aku suka' dan 'koding', lalu cetak. Di Python seperti print('Aku suka' + 'koding').",
    "Pakai blok gabung teks untuk menyambung 'Aku suka' dan 'koding', lalu tampilkan. Di JavaScript memunculkan window.alert('Aku suka' + 'koding')."),

  // ========== LEVEL 2: VARIABEL & MATEMATIKA ==========
  blocklyRow(2, 1, "Kotak Hewan", "Buat variabel bernama 'hewan' berisi sebuah teks, lalu cetak isinya.",
    { type: "variable_print" },
    "Buat variabel hewan berisi teks (misal \"kucing\"), lalu cetak. Di Python: set hewan to \"kucing\" lalu print(hewan).",
    "Buat variabel hewan berisi teks (misal \"kucing\"), lalu tampilkan. Di JavaScript: var hewan = \"kucing\" lalu window.alert(hewan)."),
  blocklyRow(2, 2, "Angka Favorit", "Buat variabel bernama 'angka' berisi angka kesukaanmu, lalu cetak.",
    { type: "variable_print" },
    "Set variabel angka dengan sebuah bilangan (misal 7), lalu print(angka).",
    "Buat var angka dengan sebuah bilangan (misal 7), lalu window.alert(angka)."),
  blocklyRow(2, 3, "Umurku", "Buat variabel 'umur' berisi angka, lalu gabungkan dalam kalimat 'Umurku ... tahun' dan cetak.",
    { type: "variable_math_print" },
    "Set umur ke sebuah bilangan, lalu cetak kalimat gabungan teks dan umur. Di Python seperti print(f\"Umurku {umur} tahun\") atau print('Umurku ' + str(umur) + ' tahun').",
    "Buat var umur, lalu gabungkan teks 'Umurku ', umur, dan ' tahun' dengan blok gabung teks, kemudian tampilkan."),
  blocklyRow(2, 4, "Dua Kotak Dijumlah", "Buat variabel a berisi 12 dan b berisi 8, lalu cetak hasil a + b.",
    { type: "math_variables_print" },
    "Set a ke 12 dan b ke 8, lalu cetak hasil penjumlahannya: print(a + b). Hasilnya 20.",
    "Buat var a = 12 dan var b = 8, lalu tampilkan a + b. Hasilnya 20."),
  blocklyRow(2, 5, "Ganti Isi Kotak", "Buat variabel 'skor' berisi 0, cetak, lalu ubah isinya menjadi 50 dan cetak lagi.",
    { type: "reassign_print" },
    "Set skor ke 0 lalu cetak, kemudian set skor lagi ke 50 dan cetak sekali lagi. Dua angka yang dicetak: 0 lalu 50.",
    "Buat var skor = 0 lalu tampilkan, kemudian ubah var skor menjadi 50 dan tampilkan lagi. Dua angka yang muncul: 0 lalu 50."),

  // ========== LEVEL 3: PERCABANGAN ==========
  blocklyRow(3, 1, "Pilih Jalur", "Gunakan blok 'jika/maka' (if) untuk mencetak 'BENAR' jika sebuah variabel bernilai true.",
    { type: "if_block" },
    "Buat variabel benar bernilai true (benar), lalu gunakan blok 'jika benar maka' untuk mencetak BENAR. Di Python polanya if benar: print(\"BENAR\").",
    "Buat variabel benar bernilai true, lalu gunakan blok 'jika benar maka' untuk menampilkan BENAR. Di JavaScript polanya if (benar) { window.alert(\"BENAR\"); }."),
  blocklyRow(3, 2, "Lulus atau Tidak", "Buat variabel nilai berisi 80. Jika nilai >= 75 cetak 'LULUS', jika tidak cetak 'TIDAK LULUS'.",
    { type: "if_else" },
    "Gunakan blok jika/maka/lainnya (if/else): jika nilai >= 75 cetak LULUS, selain itu cetak TIDAK LULUS. Di Python: if nilai >= 75: print(\"LULUS\") else: print(\"TIDAK LULUS\").",
    "Gunakan blok if/else: jika nilai >= 75 tampilkan LULUS, selain itu TIDAK LULUS. Di JavaScript: if (nilai >= 75) { window.alert(\"LULUS\"); } else { window.alert(\"TIDAK LULUS\"); }."),
  blocklyRow(3, 3, "Mana Lebih Besar?", "Buat variabel x berisi 10 dan y berisi 3. Jika x > y cetak 'x juara', jika tidak cetak 'y juara'.",
    { type: "comparison_branch" },
    "Set x ke 10 dan y ke 3, lalu bandingkan: jika x > y cetak 'x juara', selain itu 'y juara'. Di Python: if x > y: ... else: ....",
    "Set var x = 10 dan y = 3, lalu bandingkan: jika x > y tampilkan 'x juara', selain itu 'y juara'."),
  blocklyRow(3, 4, "Genap atau Ganjil", "Buat variabel angka berisi 10. Jika sisa bagi angka dengan 2 adalah 0, cetak 'GENAP', selain itu 'GANJIL'.",
    { type: "modulo_branch" },
    "Pakai blok sisa bagi (%): jika angka % 2 == 0 cetak GENAP, selain itu GANJIL. Di Python: if angka % 2 == 0: print(\"GENAP\").",
    "Pakai blok sisa bagi (%): jika angka % 2 == 0 tampilkan GENAP, selain itu GANJIL. Di JavaScript: if (angka % 2 == 0) { ... }."),
  blocklyRow(3, 5, "Penentu Medali", "Buat variabel waktu berisi 9. Cetak 'EMAS' jika waktu <= 10, 'PERAK' jika <= 15, selain itu 'PERUNGGU'.",
    { type: "multi_branch" },
    "Gunakan if / elif / else: waktu <= 10 cetak EMAS, elif waktu <= 15 cetak PERAK, selain itu PERUNGGU. Dengan waktu = 9 hasilnya EMAS.",
    "Gunakan if / else if / else: waktu <= 10 tampilkan EMAS, else if waktu <= 15 PERAK, selain itu PERUNGGU. Dengan waktu = 9 hasilnya EMAS."),

  // ========== LEVEL 4: PERULANGAN ==========
  blocklyRow(4, 1, "Halo Berkali-kali", "Gunakan blok 'ulangi' (repeat) untuk mencetak 'Halo' sebanyak 3 kali.",
    { type: "loop_print", count: 3 },
    "Masukkan blok 'cetak teks' berisi Halo ke dalam blok 'ulangi 3 kali'. Di Python seperti for i in range(3): print(\"Halo\").",
    "Masukkan blok 'cetak teks' berisi Halo ke dalam blok 'ulangi 3 kali'. Di JavaScript memunculkan window.alert(\"Halo\") tiga kali."),
  blocklyRow(4, 2, "Semangat Lima Kali", "Cetak 'Semangat!' sebanyak 5 kali menggunakan blok ulangi.",
    { type: "loop_print", count: 5 },
    "Ulangi blok 'cetak teks' berisi Semangat! sebanyak 5 kali. Di Python seperti for i in range(5): print(\"Semangat!\").",
    "Ulangi blok 'cetak teks' berisi Semangat! sebanyak 5 kali. Di JavaScript memunculkan window.alert lima kali."),
  blocklyRow(4, 3, "Hitung Mundur", "Cetak angka 3, 2, 1 memakai perulangan.",
    { type: "countdown" },
    "Cetak angka 3, lalu 2, lalu 1 memakai blok 'ulangi'. Di Python angka dicetak dengan print(3), print(2), print(1).",
    "Cetak angka 3, lalu 2, lalu 1 memakai blok 'ulangi'. Di JavaScript dimunculkan dengan window.alert(3), window.alert(2), window.alert(1)."),
  blocklyRow(4, 4, "Hitung Maju", "Cetak angka 1 sampai 5 memakai perulangan (satu angka per pencetakan).",
    { type: "loop_counter" },
    "Gunakan blok ulangi dengan variabel penghitung i dari 1 sampai 5, dan cetak i setiap putaran. Di Python seperti for i in range(1, 6): print(i).",
    "Gunakan blok ulangi dengan variabel i dari 1 sampai 5, dan tampilkan i setiap putaran."),
  blocklyRow(4, 5, "Tabungan Koin", "Cerita: kamu menabung koin 1 sampai 10. Gunakan variabel penampung dan perulangan untuk menjumlahkan 1+2+...+10, lalu cetak totalnya.",
    { type: "loop_sum" },
    "Buat variabel total = 0, ulangi 1 sampai 10 sambil menambah total dengan penghitung, lalu cetak total. Hasilnya 55.",
    "Buat var total = 0, ulangi 1 sampai 10 sambil menambah total dengan penghitung, lalu tampilkan total. Hasilnya 55."),

  // ========== LEVEL 5: BOSS CAMPURAN ==========
  blocklyRow(5, 1, "Robot Sapaan Pintar", "Buat variabel nama berisi teks, cetak 'Halo', lalu buat variabel ramah berisi true. Jika ramah benar, cetak 'Senang bertemu!' juga.",
    { type: "variable_if_combo" },
    "Gabungkan variabel dan percabangan: set nama dan cetak Halo, set ramah ke true (benar), lalu jika ramah maka cetak 'Senang bertemu!'.",
    "Gabungkan variabel dan percabangan: buat var nama dan tampilkan Halo, buat var ramah = true, lalu jika ramah tampilkan 'Senang bertemu!'."),
  blocklyRow(5, 2, "Loncat Angka Genap", "Dengan perulangan 1 sampai 10, cetak hanya angka genap (2, 4, 6, 8, 10) menggunakan kondisi sisa bagi.",
    { type: "even_loop" },
    "Di dalam blok ulangi 1..10, tambahkan kondisi jika penghitung % 2 == 0 maka cetak penghitung itu. Yang dicetak: 2, 4, 6, 8, 10.",
    "Di dalam blok ulangi 1..10, tambahkan kondisi jika penghitung % 2 == 0 maka tampilkan penghitung itu. Yang muncul: 2, 4, 6, 8, 10."),
  blocklyRow(5, 3, "Tebak Kata Sandi", "Buat variabel rahasia berisi 'bintang' dan tebakan berisi 'bintang'. Jika sama, cetak 'Boleh masuk!', jika tidak cetak 'Tetot!'.",
    { type: "guess_game" },
    "Set rahasia dan tebakan ke \"bintang\", lalu bandingkan dengan == : jika sama cetak 'Boleh masuk!', selain itu 'Tetot!'.",
    "Set var rahasia dan tebakan ke \"bintang\", lalu bandingkan dengan == : jika sama tampilkan 'Boleh masuk!', selain itu 'Tetot!'."),
  blocklyRow(5, 4, "Kasir Kafe", "Buat variabel harga berisi 15000 dan uang berisi 20000. Jika uang cukup, cetak 'Berhasil!' dan cetak kembalian uang - harga.",
    { type: "shop_simulation" },
    "Set harga 15000 dan uang 20000. Jika uang >= harga: cetak 'Berhasil!' lalu cetak hasil uang - harga (5000).",
    "Set var harga = 15000 dan uang = 20000. Jika uang >= harga: tampilkan 'Berhasil!' lalu tampilkan uang - harga (5000)."),
  blocklyRow(5, 5, "BOSS: Paduan Suara KodeKids", "Dengan perulangan 1 sampai 15: cetak 'KodeKids' jika habis dibagi 3 dan 5, 'Kode' jika habis dibagi 3, 'Kids' jika habis dibagi 5, selain itu cetak angkanya.",
    { type: "fizzbuzz_blocks" },
    "Boss final! Ulangi 1..15 dengan aturan: jika i % 3 == 0 dan i % 5 == 0 cetak KodeKids, elif i % 3 == 0 cetak Kode, elif i % 5 == 0 cetak Kids, selain itu cetak angkanya.",
    "Boss final! Ulangi 1..15 dengan aturan: jika i % 3 == 0 dan i % 5 == 0 tampilkan KodeKids, else if i % 3 == 0 Kode, else if i % 5 == 0 Kids, selain itu angkanya."),
];

// 11-15 Coding ditambahkan di bawah, lalu digabung:
const CODING_CHALLENGES = [  // ========== LEVEL 1: MENAMPILKAN OUTPUT & VARIABEL ==========
  {
    age_group: "11-15", level: 1, step: 1, type: "code",
    title: "Halo Dunia",
    body: "Cetak teks 'Halo Dunia' ke layar.",
    data: {
      topic: "output",
      langs: {
        python: {
          description: "Tugas pertama yang paling terkenal di dunia ngoding: tampilkan teks 'Halo Dunia' ke layar!\n\nDi Python, pakai perintah print dan tulis teksnya di dalam tanda kutip:\n\nprint(\"Halo Dunia\")",
          starterCode: '# Cetak "Halo Dunia" di bawah ini\n',
          tests: [{ output: "Halo Dunia" }],
        },
        javascript: {
          description: "Tugas pertama yang paling terkenal di dunia ngoding: tampilkan teks 'Halo Dunia' ke layar!\n\nDi JavaScript, pakai console.log dan tulis teksnya di dalam tanda kutip:\n\nconsole.log(\"Halo Dunia\");",
          starterCode: '// Cetak "Halo Dunia" di bawah ini\n',
          tests: [{ output: "Halo Dunia" }],
        },
      },
    },
  },
  {
    age_group: "11-15", level: 1, step: 2, type: "code",
    title: "Kartu Nama Hewan",
    body: "Buat variabel hewan berisi 'kucing', lalu cetak 'Hewan peliharaanku adalah kucing' memakai variabel itu.",
    data: {
      topic: "output",
      langs: {
        python: {
          description: "Sekarang pakai variabel! Simpan nama hewan di variabel hewan, lalu cetak kalimatnya dengan menggabungkan variabel itu (f-string):\n\nhewan = \"kucing\"\nprint(f\"Hewan peliharaanku adalah {hewan}\")",
          starterCode: "# Buat variabel hewan berisi \"kucing\"\n# Lalu cetak: Hewan peliharaanku adalah kucing\n",
          tests: [{ output: "Hewan peliharaanku adalah kucing" }],
        },
        javascript: {
          description: "Sekarang pakai variabel! Simpan nama hewan di variabel hewan, lalu cetak kalimatnya dengan template literal:\n\nvar hewan = \"kucing\";\nconsole.log(`Hewan peliharaanku adalah ${hewan}`);",
          starterCode: '// Buat variabel hewan berisi "kucing"\n// Lalu cetak: Hewan peliharaanku adalah kucing\n',
          tests: [{ output: "Hewan peliharaanku adalah kucing" }],
        },
      },
    },
  },
  {
    age_group: "11-15", level: 1, step: 3, type: "code",
    title: "Dua Baris Sapaan",
    body: "Cetak dua baris: baris pertama 'Halo!' dan baris kedua 'Sampai jumpa!'.",
    data: {
      topic: "output",
      langs: {
        python: {
          description: "Setiap print mencetak satu baris. Kalau kamu print dua kali, hasilnya jadi dua baris:\n\nprint(\"Halo!\")\nprint(\"Sampai jumpa!\")",
          starterCode: "# Cetak dua baris:\n# Halo!\n# Sampai jumpa!\n",
          tests: [{ output: "Halo!\nSampai jumpa!" }],
        },
        javascript: {
          description: "Setiap console.log mencetak satu baris. Kalau kamu console.log dua kali, hasilnya jadi dua baris:\n\nconsole.log(\"Halo!\");\nconsole.log(\"Sampai jumpa!\");",
          starterCode: "// Cetak dua baris:\n// Halo!\n// Sampai jumpa!\n",
          tests: [{ output: "Halo!\nSampai jumpa!" }],
        },
      },
    },
  },
  {
    age_group: "11-15", level: 1, step: 4, type: "code",
    title: "Kalkulator Mini",
    body: "Simpan 7 di variabel angka1 dan 5 di variabel angka2, lalu cetak hasil penjumlahannya.",
    data: {
      topic: "output",
      langs: {
        python: {
          description: "Variabel juga bisa menyimpan angka, lalu dihitung! Polanya:\n\nangka1 = 7\nangka2 = 5\nprint(angka1 + angka2)\n\nHasil yang muncul di layar: 12",
          starterCode: "# Buat variabel angka1 berisi 7 dan angka2 berisi 5\n# Lalu cetak hasil penjumlahannya\n",
          tests: [{ output: "12" }],
        },
        javascript: {
          description: "Variabel juga bisa menyimpan angka, lalu dihitung! Polanya:\n\nvar angka1 = 7;\nvar angka2 = 5;\nconsole.log(angka1 + angka2);\n\nHasil yang muncul di layar: 12",
          starterCode: "// Buat variabel angka1 berisi 7 dan angka2 berisi 5\n// Lalu cetak hasil penjumlahannya\n",
          tests: [{ output: "12" }],
        },
      },
    },
  },
  {
    age_group: "11-15", level: 1, step: 5, type: "code",
    title: "Perkenalan Diri",
    body: "Buat variabel nama berisi 'Ayu' dan umur berisi 13, lalu cetak 'Aku Ayu, umur 13 tahun' memakai kedua variabel itu.",
    data: {
      topic: "output",
      langs: {
        python: {
          description: "Gabungkan dua variabel sekaligus dalam satu kalimat. Ingat: teks pakai kutip, angka tanpa kutip:\n\nnama = \"Ayu\"\numur = 13\nprint(f\"Aku {nama}, umur {umur} tahun\")",
          starterCode: '# Buat variabel nama berisi "Ayu" dan umur berisi 13\n# Cetak: Aku Ayu, umur 13 tahun\n',
          tests: [{ output: "Aku Ayu, umur 13 tahun" }],
        },
        javascript: {
          description: "Gabungkan dua variabel sekaligus dalam satu kalimat. Pakai template literal dengan backtick:\n\nvar nama = \"Ayu\";\nvar umur = 13;\nconsole.log(`Aku ${nama}, umur ${umur} tahun`);",
          starterCode: '// Buat variabel nama berisi "Ayu" dan umur berisi 13\n// Cetak: Aku Ayu, umur 13 tahun\n',
          tests: [{ output: "Aku Ayu, umur 13 tahun" }],
        },
      },
    },
  },

  // ========== LEVEL 2: PERCABANGAN (IF/ELIF/ELSE) ==========
  {
    age_group: "11-15", level: 2, step: 1, type: "code",
    title: "Lulus atau Tidak",
    body: "Nilai ujianmu 80. Jika nilai >= 75 cetak 'LULUS', jika tidak cetak 'TIDAK LULUS'.",
    data: {
      topic: "percabangan",
      langs: {
        python: {
          description: "Percabangan membuat program mengambil keputusan. Polanya (perhatikan titik dua dan indentasi):\n\nnilai = 80\nif nilai >= 75:\n    print(\"LULUS\")\nelse:\n    print(\"TIDAK LULUS\")",
          starterCode: "nilai = 80\n# Lengkapi percabangannya: >= 75 berarti LULUS\n",
          tests: [{ output: "LULUS" }],
        },
        javascript: {
          description: "Percabangan membuat program mengambil keputusan. Polanya:\n\nvar nilai = 80;\nif (nilai >= 75) {\n  console.log(\"LULUS\");\n} else {\n  console.log(\"TIDAK LULUS\");\n}",
          starterCode: "var nilai = 80;\n// Lengkapi percabangannya: >= 75 berarti LULUS\n",
          tests: [{ output: "LULUS" }],
        },
      },
    },
  },
  {
    age_group: "11-15", level: 2, step: 2, type: "code",
    title: "Genap atau Ganjil",
    body: "Angka misterius bernilai 10. Cetak 'GENAP' jika habis dibagi 2, selain itu 'GANJIL'.",
    data: {
      topic: "percabangan",
      langs: {
        python: {
          description: "Untuk mengecek genap/ganjil, pakai sisa bagi (%). Kalau angka % 2 sama dengan 0, artinya genap:\n\nangka = 10\nif angka % 2 == 0:\n    print(\"GENAP\")\nelse:\n    print(\"GANJIL\")",
          starterCode: "angka = 10\n# Cek genap atau ganjil pakai sisa bagi %\n",
          tests: [{ output: "GENAP" }],
        },
        javascript: {
          description: "Untuk mengecek genap/ganjil, pakai sisa bagi (%). Kalau angka % 2 sama dengan 0, artinya genap:\n\nvar angka = 10;\nif (angka % 2 === 0) {\n  console.log(\"GENAP\");\n} else {\n  console.log(\"GANJIL\");\n}",
          starterCode: "var angka = 10;\n// Cek genap atau ganjil pakai sisa bagi %\n",
          tests: [{ output: "GENAP" }],
        },
      },
    },
  },
  {
    age_group: "11-15", level: 2, step: 3, type: "code",
    title: "Konverter Nilai Huruf",
    body: "Nilaimu 85. Cetak 'A' jika >= 90, 'B' jika >= 80, selain itu 'C'.",
    data: {
      topic: "percabangan",
      langs: {
        python: {
          description: "Kalau pilihannya lebih dari dua, pakai elif (else if). Dicek dari atas ke bawah, kondisi yang kena duluan yang dipakai:\n\nnilai = 85\nif nilai >= 90:\n    print(\"A\")\nelif nilai >= 80:\n    print(\"B\")\nelse:\n    print(\"C\")",
          starterCode: "nilai = 85\n# >= 90 dapat A, >= 80 dapat B, sisanya C\n",
          tests: [{ output: "B" }],
        },
        javascript: {
          description: "Kalau pilihannya lebih dari dua, pakai else if. Dicek dari atas ke bawah, kondisi yang kena duluan yang dipakai:\n\nvar nilai = 85;\nif (nilai >= 90) {\n  console.log(\"A\");\n} else if (nilai >= 80) {\n  console.log(\"B\");\n} else {\n  console.log(\"C\");\n}",
          starterCode: "var nilai = 85;\n// >= 90 dapat A, >= 80 dapat B, sisanya C\n",
          tests: [{ output: "B" }],
        },
      },
    },
  },
  {
    age_group: "11-15", level: 2, step: 4, type: "code",
    title: "Penjaga Gerbang Kastil",
    body: "Cerita: Kamu penjaga gerbang Kastil KodeKids. Kata sandinya 'bintang'. Pengunjung menebak 'bintang' — cetak 'Boleh masuk!' jika tebakan sama dengan kata sandi, selain itu 'Tetot, salah!'.",
    data: {
      topic: "percabangan",
      langs: {
        python: {
          description: "Cerita: Kamu penjaga gerbang Kastil KodeKids. Kata sandinya \"bintang\", dan pengunjung baru saja menebak \"bintang\".\n\nBandingkan dua teks dengan == :\n\nrahasia = \"bintang\"\ntebakan = \"bintang\"\nif tebakan == rahasia:\n    print(\"Boleh masuk!\")\nelse:\n    print(\"Tetot, salah!\")",
          starterCode: 'rahasia = "bintang"\ntebakan = "bintang"\n# Cek apakah tebakan sama dengan rahasia\n',
          tests: [{ output: "Boleh masuk!" }],
        },
        javascript: {
          description: "Cerita: Kamu penjaga gerbang Kastil KodeKids. Kata sandinya \"bintang\", dan pengunjung baru saja menebak \"bintang\".\n\nBandingkan dua teks dengan === :\n\nvar rahasia = \"bintang\";\nvar tebakan = \"bintang\";\nif (tebakan === rahasia) {\n  console.log(\"Boleh masuk!\");\n} else {\n  console.log(\"Tetot, salah!\");\n}",
          starterCode: 'var rahasia = "bintang";\nvar tebakan = "bintang";\n// Cek apakah tebakan sama dengan rahasia\n',
          tests: [{ output: "Boleh masuk!" }],
        },
      },
    },
  },
  {
    age_group: "11-15", level: 2, step: 5, type: "code",
    title: "Kasir Kafe KodeKids",
    body: "Cerita: Di Kafe KodeKids jajanan harganya 15000 dan uangmu 20000. Jika uang cukup, cetak 'Jajanan berhasil dibeli!' lalu 'Kembalian: <selisih>'. Jika tidak, cetak 'Uangmu kurang'.",
    data: {
      topic: "percabangan",
      langs: {
        python: {
          description: "Cerita: Kamu beli jajanan di Kafe KodeKids seharga 15000, sedangkan uangmu 20000.\n\nCek dulu apakah uang cukup, lalu hitung kembalian pakai variabel:\n\nharga = 15000\nuang = 20000\nif uang >= harga:\n    print(\"Jajanan berhasil dibeli!\")\n    print(f\"Kembalian: {uang - harga}\")\nelse:\n    print(\"Uangmu kurang\")",
          starterCode: "harga = 15000\nuang = 20000\n# Jika uang cukup: cetak berhasil dibeli + kembalian\n",
          tests: [{ output: "Jajanan berhasil dibeli!\nKembalian: 5000" }],
        },
        javascript: {
          description: "Cerita: Kamu beli jajanan di Kafe KodeKids seharga 15000, sedangkan uangmu 20000.\n\nCek dulu apakah uang cukup, lalu hitung kembalian pakai variabel:\n\nvar harga = 15000;\nvar uang = 20000;\nif (uang >= harga) {\n  console.log(\"Jajanan berhasil dibeli!\");\n  console.log(`Kembalian: ${uang - harga}`);\n} else {\n  console.log(\"Uangmu kurang\");\n}",
          starterCode: "var harga = 15000;\nvar uang = 20000;\n// Jika uang cukup: cetak berhasil dibeli + kembalian\n",
          tests: [{ output: "Jajanan berhasil dibeli!\nKembalian: 5000" }],
        },
      },
    },
  },

  // ========== LEVEL 3: PERULANGAN (LOOP) ==========
  {
    age_group: "11-15", level: 3, step: 1, type: "code",
    title: "Halo Berkali-kali",
    body: "Cetak 'Halo' sebanyak 3 kali menggunakan perulangan.",
    data: {
      topic: "perulangan",
      langs: {
        python: {
          description: "Perulangan membuat kita tidak perlu menulis perintah yang sama berkali-kali. range(3) artinya ulangi 3 kali:\n\nfor i in range(3):\n    print(\"Halo\")",
          starterCode: "# Cetak \"Halo\" sebanyak 3 kali pakai for\n",
          tests: [{ output: "Halo\nHalo\nHalo" }],
        },
        javascript: {
          description: "Perulangan membuat kita tidak perlu menulis perintah yang sama berkali-kali. Polanya mulai, syarat, lalu perubahan:\n\nfor (var i = 0; i < 3; i++) {\n  console.log(\"Halo\");\n}",
          starterCode: '// Cetak "Halo" sebanyak 3 kali pakai for\n',
          tests: [{ output: "Halo\nHalo\nHalo" }],
        },
      },
    },
  },
  {
    age_group: "11-15", level: 3, step: 2, type: "code",
    title: "Hitung Maju",
    body: "Cetak angka 1 sampai 5, satu angka per baris, memakai perulangan.",
    data: {
      topic: "perulangan",
      langs: {
        python: {
          description: "range(1, 6) menghasilkan angka 1, 2, 3, 4, 5 (angka akhirnya tidak ikut). Cetak isinya:\n\nfor i in range(1, 6):\n    print(i)",
          starterCode: "# Cetak angka 1 sampai 5, satu per baris\n",
          tests: [{ output: "1\n2\n3\n4\n5" }],
        },
        javascript: {
          description: "Mulai dari 1, lanjut selama i <= 5, naik satu-satu dengan i++:\n\nfor (var i = 1; i <= 5; i++) {\n  console.log(i);\n}",
          starterCode: "// Cetak angka 1 sampai 5, satu per baris\n",
          tests: [{ output: "1\n2\n3\n4\n5" }],
        },
      },
    },
  },
  {
    age_group: "11-15", level: 3, step: 3, type: "code",
    title: "Roket Meluncur",
    body: "Cetak hitungan mundur 3, 2, 1 (satu per baris), lalu baris terakhir 'Meluncur!'.",
    data: {
      topic: "perulangan",
      langs: {
        python: {
          description: "Hitung mundur berarti mulai dari besar menuju kecil. range(3, 0, -1) menghasilkan 3, 2, 1. Setelah loop selesai, cetak 'Meluncur!':\n\nfor i in range(3, 0, -1):\n    print(i)\nprint(\"Meluncur!\")",
          starterCode: "# Hitung mundur 3, 2, 1 lalu cetak Meluncur!\n",
          tests: [{ output: "3\n2\n1\nMeluncur!" }],
        },
        javascript: {
          description: "Hitung mundur berarti mulai dari besar menuju kecil, turun dengan i--. Setelah loop selesai, cetak 'Meluncur!':\n\nfor (var i = 3; i >= 1; i--) {\n  console.log(i);\n}\nconsole.log(\"Meluncur!\");",
          starterCode: "// Hitung mundur 3, 2, 1 lalu cetak Meluncur!\n",
          tests: [{ output: "3\n2\n1\nMeluncur!" }],
        },
      },
    },
  },
  {
    age_group: "11-15", level: 3, step: 4, type: "code",
    title: "Loncat Angka Genap",
    body: "Cetak angka genap dari 2 sampai 10 (2, 4, 6, 8, 10) memakai perulangan.",
    data: {
      topic: "perulangan",
      langs: {
        python: {
          description: "range bisa loncat! range(2, 11, 2) artinya mulai 2, sampai sebelum 11, melompat 2 setiap langkah:\n\nfor i in range(2, 11, 2):\n    print(i)",
          starterCode: "# Cetak angka genap 2, 4, 6, 8, 10\n",
          tests: [{ output: "2\n4\n6\n8\n10" }],
        },
        javascript: {
          description: "Mulai dari 2, dan naik 2 setiap langkah dengan i += 2:\n\nfor (var i = 2; i <= 10; i += 2) {\n  console.log(i);\n}",
          starterCode: "// Cetak angka genap 2, 4, 6, 8, 10\n",
          tests: [{ output: "2\n4\n6\n8\n10" }],
        },
      },
    },
  },
  {
    age_group: "11-15", level: 3, step: 5, type: "code",
    title: "Tabungan Ajaib",
    body: "Cerita: Kamu menabung Rp1 di hari pertama, Rp2 di hari kedua, terus sampai Rp100 di hari ke-100. Pakai perulangan untuk menghitung total tabunganmu, lalu cetak totalnya.",
    data: {
      topic: "perulangan",
      langs: {
        python: {
          description: "Cerita: Setiap hari kamu menambah tabungan — hari ke-1 simpan Rp1, hari ke-2 simpan Rp2, begitu terus sampai hari ke-100.\n\nGunakan variabel penampung yang terus dijumlah di dalam loop:\n\ntotal = 0\nfor i in range(1, 101):\n    total = total + i\nprint(total)\n\nBerapakah tabunganmu?",
          starterCode: "total = 0\n# Jumlahkan 1 sampai 100 ke dalam total, lalu cetak\n",
          tests: [{ output: "5050" }],
        },
        javascript: {
          description: "Cerita: Setiap hari kamu menambah tabungan — hari ke-1 simpan Rp1, hari ke-2 simpan Rp2, begitu terus sampai hari ke-100.\n\nGunakan variabel penampung yang terus dijumlah di dalam loop:\n\nvar total = 0;\nfor (var i = 1; i <= 100; i++) {\n  total = total + i;\n}\nconsole.log(total);\n\nBerapakah tabunganmu?",
          starterCode: "var total = 0;\n// Jumlahkan 1 sampai 100 ke dalam total, lalu cetak\n",
          tests: [{ output: "5050" }],
        },
      },
    },
  },

  // ========== LEVEL 4: FUNGSI (RETURN VALUE) ==========
  {
    age_group: "11-15", level: 4, step: 1, type: "code",
    title: "Fungsi Sapaan",
    body: "Buat fungsi halo() TANPA parameter yang mengembalikan (return) teks 'Halo Dunia'.",
    data: {
      topic: "fungsi",
      langs: {
        python: {
          description: "Sekarang belajar fungsi! Fungsi adalah mesin kecil yang bisa mengembalikan hasil dengan return:\n\ndef halo():\n    return 'Halo Dunia'",
          starterCode: "def halo():\n    # kembalikan teks 'Halo Dunia'\n    pass\n",
          tests: [{ call: "halo()", expected: "Halo Dunia" }],
        },
        javascript: {
          description: "Sekarang belajar fungsi! Fungsi adalah mesin kecil yang bisa mengembalikan hasil dengan return:\n\nfunction halo() {\n  return 'Halo Dunia';\n}",
          starterCode: "function halo() {\n  // kembalikan teks 'Halo Dunia'\n}\n",
          tests: [{ call: "halo()", expected: "Halo Dunia" }],
        },
      },
    },
  },
  {
    age_group: "11-15", level: 4, step: 2, type: "code",
    title: "Mesin Sapa Ramah",
    body: "Buat fungsi sapa(nama) yang mengembalikan teks 'Halo, <nama>!'. Contoh: sapa('Budi') -> 'Halo, Budi!'.",
    data: {
      topic: "fungsi",
      langs: {
        python: {
          description: "Fungsi bisa menerima masukan lewat parameter. Gabungkan parameter ke dalam hasil return:\n\ndef sapa(nama):\n    return f'Halo, {nama}!'",
          starterCode: "def sapa(nama):\n    # kembalikan 'Halo, <nama>!'\n    pass\n",
          tests: [
            { call: "sapa('Budi')", expected: "Halo, Budi!" },
            { call: "sapa('Ani')", expected: "Halo, Ani!" },
          ],
        },
        javascript: {
          description: "Fungsi bisa menerima masukan lewat parameter. Gabungkan parameter ke dalam hasil return:\n\nfunction sapa(nama) {\n  return `Halo, ${nama}!`;\n}",
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
    age_group: "11-15", level: 4, step: 3, type: "code",
    title: "Kalkulator Ajaib",
    body: "Buat fungsi jumlah(a, b) yang mengembalikan hasil penjumlahan a dan b.",
    data: {
      topic: "fungsi",
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
    age_group: "11-15", level: 4, step: 4, type: "code",
    title: "Deteksi Genap",
    body: "Buat fungsi genap(n) yang mengembalikan true jika n bilangan genap, false jika tidak.",
    data: {
      topic: "fungsi",
      langs: {
        python: {
          description: "Fungsi juga bisa mengembalikan boolean (True/False). Di Python huruf awalnya besar:\n\ndef genap(n):\n    return n % 2 == 0",
          starterCode: "def genap(n):\n    # kembalikan True jika n genap, False jika tidak\n    pass\n",
          tests: [
            { call: "genap(4)", expected: "True" },
            { call: "genap(7)", expected: "False" },
          ],
        },
        javascript: {
          description: "Fungsi juga bisa mengembalikan boolean (true/false). Di JavaScript hurufnya kecil semua:\n\nfunction genap(n) {\n  return n % 2 === 0;\n}",
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
    age_group: "11-15", level: 4, step: 5, type: "code",
    title: "Pembalik Kata",
    body: "Buat fungsi balik(kata) yang mengembalikan kata terbalik. Contoh: balik('kodi') -> 'idok'",
    data: {
      topic: "fungsi",
      langs: {
        python: {
          description: "Trik membalik string di Python adalah slicing [::-1]:\n\ndef balik(kata):\n    return kata[::-1]",
          starterCode: "def balik(kata):\n    # kembalikan kata terbalik\n    pass\n",
          tests: [
            { call: "balik('kodi')", expected: "idok" },
            { call: "balik('abc')", expected: "cba" },
          ],
        },
        javascript: {
          description: "Di JavaScript, ubah string jadi array lalu balik: kata.split('').reverse().join(''):\n\nfunction balik(kata) {\n  return kata.split('').reverse().join('');\n}",
          starterCode: "function balik(kata) {\n  // kembalikan kata terbalik\n}\n",
          tests: [
            { call: "balik('kodi')", expected: "idok" },
            { call: "balik('abc')", expected: "cba" },
          ],
        },
      },
    },
  },

  // ========== LEVEL 5: TANTANGAN CERITA (BOSS) ==========
  {
    age_group: "11-15", level: 5, step: 1, type: "code",
    title: "Warung Bu Tejo",
    body: "Cerita: Di Warung Bu Tejo, pembayar selalu membayar lebih agar tidak repot dengan uang pecahan. Buat fungsi kembalian(bayar, harga) yang mengembalikan uang kembaliannya.",
    data: {
      topic: "cerita",
      langs: {
        python: {
          description: "Cerita: Pembeli di Warung Bu Tejo selalu membayar lebih supaya tidak repot. Bu Tejo butuh program penghitung kembalian!\n\nBuat fungsi kembalian(bayar, harga) yang mengembalikan bayar - harga:\n\ndef kembalian(bayar, harga):\n    return bayar - harga",
          starterCode: "def kembalian(bayar, harga):\n    # kembalikan selisih bayar dan harga\n    pass\n",
          tests: [
            { call: "kembalian(20000, 15000)", expected: 5000 },
            { call: "kembalian(10000, 7500)", expected: 2500 },
          ],
        },
        javascript: {
          description: "Cerita: Pembeli di Warung Bu Tejo selalu membayar lebih supaya tidak repot. Bu Tejo butuh program penghitung kembalian!\n\nBuat function kembalian(bayar, harga) yang mengembalikan bayar - harga:\n\nfunction kembalian(bayar, harga) {\n  return bayar - harga;\n}",
          starterCode: "function kembalian(bayar, harga) {\n  // kembalikan selisih bayar dan harga\n}\n",
          tests: [
            { call: "kembalian(20000, 15000)", expected: 5000 },
            { call: "kembalian(10000, 7500)", expected: 2500 },
          ],
        },
      },
    },
  },
  {
    age_group: "11-15", level: 5, step: 2, type: "code",
    title: "Kejuaraan Lari KodeKids",
    body: "Cerita: Di kejuaraan lari KodeKids, waktu <= 10 detik dapat 'EMAS', <= 15 detik dapat 'PERAK', selain itu 'PERUNGGU'. Buat fungsi medali(waktu) yang mengembalikan nama medali tersebut.",
    data: {
      topic: "cerita",
      langs: {
        python: {
          description: "Cerita: Kamu juri kejuaraan lari KodeKids! Aturannya:\n- waktu <= 10 detik -> EMAS\n- waktu <= 15 detik -> PERAK\n- lebih dari itu -> PERUNGGU\n\nGunakan if / elif / else di dalam fungsi:\n\ndef medali(waktu):\n    if waktu <= 10:\n        return 'EMAS'\n    elif waktu <= 15:\n        return 'PERAK'\n    else:\n        return 'PERUNGGU'",
          starterCode: "def medali(waktu):\n    # <= 10 EMAS, <= 15 PERAK, sisanya PERUNGGU\n    pass\n",
          tests: [
            { call: "medali(9)", expected: "EMAS" },
            { call: "medali(12)", expected: "PERAK" },
            { call: "medali(20)", expected: "PERUNGGU" },
          ],
        },
        javascript: {
          description: "Cerita: Kamu juri kejuaraan lari KodeKids! Aturannya:\n- waktu <= 10 detik -> EMAS\n- waktu <= 15 detik -> PERAK\n- lebih dari itu -> PERUNGGU\n\nGunakan if / else if / else di dalam fungsi:\n\nfunction medali(waktu) {\n  if (waktu <= 10) {\n    return 'EMAS';\n  } else if (waktu <= 15) {\n    return 'PERAK';\n  } else {\n    return 'PERUNGGU';\n  }\n}",
          starterCode: "function medali(waktu) {\n  // <= 10 EMAS, <= 15 PERAK, sisanya PERUNGGU\n}\n",
          tests: [
            { call: "medali(9)", expected: "EMAS" },
            { call: "medali(12)", expected: "PERAK" },
            { call: "medali(20)", expected: "PERUNGGU" },
          ],
        },
      },
    },
  },
  {
    age_group: "11-15", level: 5, step: 3, type: "code",
    title: "Peluncuran Roket KodeKids",
    body: "Cerita: Pusat antariksa KodeKids akan meluncurkan roket. Buat fungsi hitung_mundur() yang MENCETAK hitungan 5, 4, 3, 2, 1 (satu per baris) lalu 'Meluncur!', dan PANGGIL fungsinya di akhir.",
    data: {
      topic: "cerita",
      langs: {
        python: {
          description: "Cerita: Roket KodeKids siap diluncurkan! Buat fungsi hitung_mundur() yang mencetak 5 sampai 1 lalu 'Meluncur!', kemudian panggil fungsinya:\n\ndef hitung_mundur():\n    for i in range(5, 0, -1):\n        print(i)\n    print(\"Meluncur!\")\n\nhitung_mundur()",
          starterCode: "def hitung_mundur():\n    # cetak 5..1 lalu Meluncur!\n    pass\n\n# panggil fungsinya di sini\n",
          tests: [{ output: "5\n4\n3\n2\n1\nMeluncur!" }],
        },
        javascript: {
          description: "Cerita: Roket KodeKids siap diluncurkan! Buat function hitung_mundur() yang mencetak 5 sampai 1 lalu 'Meluncur!', kemudian panggil fungsinya:\n\nfunction hitung_mundur() {\n  for (var i = 5; i >= 1; i--) {\n    console.log(i);\n  }\n  console.log('Meluncur!');\n}\n\nhitung_mundur();",
          starterCode: "function hitung_mundur() {\n  // cetak 5..1 lalu Meluncur!\n}\n\n// panggil fungsinya di sini\n",
          tests: [{ output: "5\n4\n3\n2\n1\nMeluncur!" }],
        },
      },
    },
  },
  {
    age_group: "11-15", level: 5, step: 4, type: "code",
    title: "Sandi Rahasia Mata-Mata",
    body: "Cerita: Mata-mata KodeKids menemukan pesan musuh yang dibaca terbalik DAN ditulis huruf kapital semua. Buat fungsi sandi(kata) yang mengembalikan kata terbalik huruf kapital. Contoh: sandi('kodi') -> 'IDOK'.",
    data: {
      topic: "cerita",
      langs: {
        python: {
          description: "Cerita: Pesan musuh harus dibalik dulu, lalu dikapitalkan supaya mudah dibaca.\n\nGabungkan dua trik: slicing [::-1] untuk membalik dan .upper() untuk kapital:\n\ndef sandi(kata):\n    return kata[::-1].upper()",
          starterCode: "def sandi(kata):\n    # balik kata lalu jadikan huruf kapital\n    pass\n",
          tests: [
            { call: "sandi('kodi')", expected: "IDOK" },
            { call: "sandi('abc')", expected: "CBA" },
          ],
        },
        javascript: {
          description: "Cerita: Pesan musuh harus dibalik dulu, lalu dikapitalkan supaya mudah dibaca.\n\nGabungkan dua trik: split-reverse-join untuk membalik dan .toUpperCase() untuk kapital:\n\nfunction sandi(kata) {\n  return kata.split('').reverse().join('').toUpperCase();\n}",
          starterCode: "function sandi(kata) {\n  // balik kata lalu jadikan huruf kapital\n}\n",
          tests: [
            { call: "sandi('kodi')", expected: "IDOK" },
            { call: "sandi('abc')", expected: "CBA" },
          ],
        },
      },
    },
  },
  {
    age_group: "11-15", level: 5, step: 5, type: "code",
    title: "BOSS FINAL: Nyanyian KodeKids",
    body: "Cerita: Paduan suara KodeKids menyanyikan angka 1 sampai 15, tapi ada aturan spesial: kelipatan 3 diganti 'Kode', kelipatan 5 diganti 'Kids', dan kelipatan 3 dan 5 diganti 'KodeKids'. Cetak semuanya satu baris per jawaban.",
    data: {
      topic: "cerita",
      langs: {
        python: {
          description: "Cerita: Inilah BOSS FINAL-nya! Paduan suara KodeKids punya aturan nyanyian:\n- Kelipatan 3 -> nyanyikan 'Kode'\n- Kelipatan 5 -> nyanyikan 'Kids'\n- Kelipatan 3 DAN 5 -> nyanyikan 'KodeKids'\n- Selain itu -> nyanyikan angkanya\n\nCek yang paling spesifik dulu (kelipatan 3 dan 5):\n\nfor i in range(1, 16):\n    if i % 3 == 0 and i % 5 == 0:\n        print(\"KodeKids\")\n    elif i % 3 == 0:\n        print(\"Kode\")\n    elif i % 5 == 0:\n        print(\"Kids\")\n    else:\n        print(i)",
          starterCode: "# Nyanyikan angka 1 sampai 15 dengan aturan Kode/Kids/KodeKids\n",
          tests: [
            { output: "1\n2\nKode\n4\nKids\nKode\n7\n8\nKode\nKids\n11\nKode\n13\n14\nKodeKids" },
          ],
        },
        javascript: {
          description: "Cerita: Inilah BOSS FINAL-nya! Paduan suara KodeKids punya aturan nyanyian:\n- Kelipatan 3 -> nyanyikan 'Kode'\n- Kelipatan 5 -> nyanyikan 'Kids'\n- Kelipatan 3 DAN 5 -> nyanyikan 'KodeKids'\n- Selain itu -> nyanyikan angkanya\n\nCek yang paling spesifik dulu (kelipatan 3 dan 5):\n\nfor (var i = 1; i <= 15; i++) {\n  if (i % 3 === 0 && i % 5 === 0) {\n    console.log(\"KodeKids\");\n  } else if (i % 3 === 0) {\n    console.log(\"Kode\");\n  } else if (i % 5 === 0) {\n    console.log(\"Kids\");\n  } else {\n    console.log(i);\n  }\n}",
          starterCode: "// Nyanyikan angka 1 sampai 15 dengan aturan Kode/Kids/KodeKids\n",
          tests: [
            { output: "1\n2\nKode\n4\nKids\nKode\n7\n8\nKode\nKids\n11\nKode\n13\n14\nKodeKids" },
          ],
        },
      },
    },
  },
];

CHALLENGES.push(...CODING_CHALLENGES);

// ================= MIGRASI SKEMA =================
// Tabel lama punya UNIQUE(age_group, level) — dibangun ulang agar mendukung
// beberapa soal (step 1..5) dalam satu level: UNIQUE(age_group, level, step).
async function migrateSchema() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS challenges_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      age_group TEXT NOT NULL,
      level INTEGER NOT NULL,
      step INTEGER NOT NULL DEFAULT 1,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      data TEXT NOT NULL DEFAULT '{}',
      UNIQUE(age_group, level, step)
    )
  `);
  try {
    await db.execute(`
      INSERT INTO challenges_new (age_group, level, step, type, title, body, data)
      SELECT age_group, level, 1, type, title, body, data FROM challenges
    `);
  } catch {
    // tabel lama belum ada / sudah dimigrasi — abaikan
  }
  await db.execute("DROP TABLE IF EXISTS challenges");
  await db.execute("ALTER TABLE challenges_new RENAME TO challenges");
}

// ================= SEED =================
await db.execute(`
  CREATE TABLE IF NOT EXISTS age_groups (
    age_group TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    max_levels INTEGER NOT NULL
  )
`);

await migrateSchema();

for (const g of AGE_GROUPS) {
  await db.execute({
    sql: `INSERT INTO age_groups (age_group, label, max_levels) VALUES (?, ?, ?)
          ON CONFLICT(age_group) DO UPDATE SET label = excluded.label, max_levels = excluded.max_levels`,
    args: [g.age_group, g.label, g.max_levels],
  });
}

for (const c of CHALLENGES) {
  await db.execute({
    sql: `INSERT INTO challenges (age_group, level, step, type, title, body, data)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(age_group, level, step) DO UPDATE SET
            type = excluded.type, title = excluded.title,
            body = excluded.body, data = excluded.data`,
    args: [c.age_group, c.level, c.step ?? 1, c.type, c.title, c.body, JSON.stringify(c.data)],
  });
}

const count = await db.execute("SELECT COUNT(*) AS n FROM challenges");
const perGroup = await db.execute(
  "SELECT age_group, COUNT(*) AS n FROM challenges GROUP BY age_group"
);
console.log(`Seed selesai. Total ${count.rows[0].n} soal di DB.`);
for (const row of perGroup.rows) {
  console.log(`  ${row.age_group}: ${row.n} soal`);
}
