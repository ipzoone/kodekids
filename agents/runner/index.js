// agents/runner/index.js — agent minimal khusus eksekusi kode via EdgeOne Sandbox.
// Dipanggil oleh frontend (atau cloud function) untuk menjalankan kode user,
// karena cloud functions tidak memiliki akses ke context.sandbox.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, makers-conversation-id",
};

function buildPythonTestHarness(tests, userCode) {
  // Dua jenis test yang didukung:
  // - { call, expected }  : bandingkan return value dari ekspresi
  // - { output }          : bandingkan seluruh teks yang di-print (trim)
  const checks = tests
    .map((t, i) => {
      if (typeof t.output === "string") {
        return `    _results.append(("test${i}", _printed.strip(), ${JSON.stringify(t.output)}))`;
      }
      const isBool = /^(True|False)$/.test(String(t.expected));
      const isNumber = /^-?\d+(\.\d+)?$/.test(String(t.expected));
      const expected =
        typeof t.expected === "string" && !isBool && !isNumber
          ? JSON.stringify(t.expected)
          : String(t.expected);
      return `    _results.append(("test${i}", repr(${t.call}), repr(${expected})))`;
    })
    .join("\n");

  const indentedUserCode = userCode
    .replace(/\n+$/, "")
    .split("\n")
    .map((l) => ("        " + l).trimEnd())
    .join("\n");

  return `import json as _json
import io as _io
import contextlib as _contextlib
_results = []
_printed = ""
try:
    _buf = _io.StringIO()
    with _contextlib.redirect_stdout(_buf):
${indentedUserCode}
        _printed = _buf.getvalue()
${checks}
except Exception as _e:
    print(_json.dumps({"passed": False, "message": f"Error: {_e}"}))
else:
    _failed = [r for r in _results if r[1] != r[2]]
    print(_json.dumps({
        "passed": len(_failed) == 0,
        "message": ("Semua test lulus!" if not _failed else f"Gagal pada {len(_failed)} test. Contoh: {_failed[0][0]} dapat {_failed[0][1]}, seharusnya {_failed[0][2]}")
    }))`;
}

function buildJavaScriptTestHarness(tests, userCode) {
  // Sama seperti Python: { call, expected } untuk return value,
  // { output } untuk mengecek hasil console.log (digabung dengan newline, trim).
  const checks = tests
    .map((t, i) => {
      if (typeof t.output === "string") {
        return `  __results.push(["test${i}", __printed.trim(), ${JSON.stringify(t.output)}]);`;
      }
      const expected = JSON.stringify(t.expected);
      return `  __results.push(["test${i}", JSON.stringify(${t.call}), JSON.stringify(${expected})]);`;
    })
    .join("\n");

  const indentedUserCode = userCode
    .replace(/\n+$/, "")
    .split("\n")
    .map((l) => "  " + l)
    .join("\n");

  return `const __results = [];
let __error = null;
  try {
  let __lines = [];
  const __origLog = console.log;
  console.log = (...__a) => { __lines.push(__a.map((v) => String(v)).join(" ")); };
  try {
${indentedUserCode}
  var __printed = __lines.join("\\n");
${checks}
  } finally {
    console.log = __origLog;
  }
} catch (__e) {
  __error = __e;
}
if (__error) {
  console.log(JSON.stringify({ passed: false, message: "Error: " + __error.message }));
} else {
  const __failed = __results.filter((r) => r[1] !== r[2]);
  console.log(JSON.stringify({
    passed: __failed.length === 0,
    message: __failed.length === 0 ? "Semua test lulus!" : ("Gagal pada " + __failed.length + " test. Contoh: " + __failed[0][0] + " dapat " + __failed[0][1] + ", seharusnya " + __failed[0][2])
  }));
}`;
}

// Jalankan file di sandbox tanpa membuat runtime throw saat exit code != 0.
// Trik: merge stderr ke stdout lalu paksa exit 0 via `; true` (shell).
// Jadi traceback error kode user tetap tampil di output, bukan SANDBOX_UNKNOWN_ERROR.
async function execFileInSandbox(context, language, fileName, timeout) {
  async function attempt(bin) {
    try {
      const result = await context.sandbox.commands.run(
        `${bin} 2>&1; true`,
        { timeout },
      );
      return [result?.stdout, result?.stderr].filter(Boolean).join("\n");
    } catch (e) {
      // Fallback untuk runtime lama yang tetap melempar error pada exit != 0
      return String(e.message);
    }
  }

  // C++: compile dulu pakai g++, lalu jalankan hasil binerinya
  if (language === "cpp") {
    const outBin = `${fileName}.out`;
    let compileOut = await attempt(
      `g++ ${fileName} -o ${outBin} -std=c++17 -O2`,
    );
    let exists = false;
    try {
      exists = await context.sandbox.files.exists(outBin);
    } catch {}
    if (!exists) {
      const clean = String(compileOut || "").trim();
      return clean
        ? `Gagal kompilasi C++:\n${clean}`
        : "Gagal kompilasi C++. Kemungkinan g++ tidak tersedia di sandbox ini.";
    }
    const runOut = await attempt(`${outBin}`);
    context.sandbox.files.remove(outBin).catch(() => {});
    return [String(compileOut || "").trim(), String(runOut || "")].filter(Boolean).join("\n");
  }

  const primary = language === "python" ? "python3" : "node";
  let out = await attempt(`${primary} ${fileName}`);
  // python3 kadang tidak ada di image sandbox — coba fallback ke `python`
  if (
    language === "python" &&
    /not found|no such file|cannot find/i.test(out)
  ) {
    out = await attempt(`python ${fileName}`);
  }
  return out;
}

export async function onRequest(context) {  if (context.request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  let body = {};
  try {
    body = await context.request.json();
  } catch {
    body = context.request.body || {};
  }

  const lang = body.language;
  const language =
    lang === "javascript" ? "javascript" : lang === "cpp" ? "cpp" : "python";
  const ext =
    language === "python" ? "py" : language === "cpp" ? "cpp" : "js";
  const tests = Array.isArray(body.tests) ? body.tests : [];
  const userCode = String(body.code || "");
  const mode =
    body.mode === "run" || language === "cpp" ? "run" : "test";

  if (!userCode || (mode === "test" && !tests.length)) {
    return new Response(
      JSON.stringify({ ok: false, error: "'code' dan 'tests' wajib diisi" }),
      { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
    );
  }

  try {
    if (!context.sandbox?.files || !context.sandbox?.commands) {
      return new Response(
        JSON.stringify({ ok: false, error: "Sandbox tidak tersedia di runtime ini" }),
        { status: 503, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
      );
    }

    // Mode "run": eksekusi kode apa adanya (untuk preview output realtime),
    // tanpa test harness.
    if (mode === "run") {
      const fileName = `/tmp/kidcode_run_${Date.now()}.${ext}`;
      await context.sandbox.files.write(fileName, userCode);
      let output = "";
      try {
        output = await execFileInSandbox(context, language, fileName, 10);
      } catch (e) {
        output = String(e.message);
      } finally {
        context.sandbox.files.remove(fileName).catch(() => {});
      }
      return new Response(
        JSON.stringify({ ok: true, output: output.slice(0, 1000), verdict: null }),
        { headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
      );
    }

    const testCode =
      language === "python"
        ? buildPythonTestHarness(tests, userCode)
        : buildJavaScriptTestHarness(tests, userCode);

    const fileName = `/tmp/kidcode_${Date.now()}.${ext}`;
    await context.sandbox.files.write(fileName, testCode);

    let output = "";
    try {
      output = await execFileInSandbox(context, language, fileName, 15);
    } catch (e) {
      output = String(e.message);
    } finally {
      context.sandbox.files.remove(fileName).catch(() => {});
    }

    // Deteksi error eksekusi yang benar-benar fatal (bukan error kode user)
    const isFatal =
      !output ||
      /SANDBOX_UNKNOWN_ERROR|Sandbox command failed|Sandbox tidak/i.test(output);
    if (isFatal) {
      return new Response(
        JSON.stringify({
          ok: true,
          verdict: { passed: false, message: "Kode error saat dijalankan. Periksa sintaks programmu." },
          output: output.slice(0, 1000),
        }),
        { headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
      );
    }

    const jsonMatch = output.match(/\{[\s\S]*\}/);
    const verdict = jsonMatch
      ? JSON.parse(jsonMatch[0])
      : /SyntaxError|IndentationError/i.test(output)
        ? {
            passed: false,
            message:
              "Ada kesalahan penulisan kode (syntax error). Coba periksa tanda kutip, titik dua, dan spasi indentasimu ya!",
          }
        : /Traceback|Error/i.test(output)
          ? {
              passed: false,
              message: "Kode error saat dijalankan. Periksa sintaks programmu.",
            }
          : { passed: false, message: "Tidak ada output dari sandbox" };

    return new Response(
      JSON.stringify({ ok: true, verdict, output: output.slice(0, 1000) }),
      { headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
}

// Diekspor untuk pengujian lokal harness
export { buildPythonTestHarness, buildJavaScriptTestHarness };
