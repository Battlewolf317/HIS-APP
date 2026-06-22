// =====================================================================
// middleware/validate.js — validasi & sanitasi input ringan (tanpa dependency).
//  Schema sederhana per-field:
//   { type, required, min, max, enum, trim, maxLen }
//   type: 'string' | 'number' | 'int'
//  Pemakaian: router.post("/", validate(schema), controller.fn)
// =====================================================================

function checkField(name, rules, value) {
  const errors = [];
  const ada = value !== undefined && value !== null && value !== "";

  if (rules.required && !ada) {
    errors.push(`${name} wajib diisi`);
    return { errors, value };
  }
  if (!ada) return { errors, value }; // optional & kosong → lewati

  let v = value;

  if (rules.type === "number" || rules.type === "int") {
    const num = Number(v);
    if (Number.isNaN(num)) { errors.push(`${name} harus berupa angka`); return { errors, value: v }; }
    if (rules.type === "int" && !Number.isInteger(num)) errors.push(`${name} harus bilangan bulat`);
    if (rules.min !== undefined && num < rules.min) errors.push(`${name} minimal ${rules.min}`);
    if (rules.max !== undefined && num > rules.max) errors.push(`${name} maksimal ${rules.max}`);
    v = num;
  } else {
    // string
    v = String(v);
    if (rules.trim !== false) v = v.trim();
    if (rules.maxLen && v.length > rules.maxLen) errors.push(`${name} maksimal ${rules.maxLen} karakter`);
    if (rules.min !== undefined && v.length < rules.min) errors.push(`${name} minimal ${rules.min} karakter`);
    if (rules.enum && !rules.enum.includes(v)) errors.push(`${name} harus salah satu: ${rules.enum.join(", ")}`);
  }

  return { errors, value: v };
}

export function validate(schema) {
  return (req, res, next) => {
    const body = req.body || {};
    const allErrors = [];
    const clean = { ...body };

    for (const [name, rules] of Object.entries(schema)) {
      const { errors, value } = checkField(name, rules, body[name]);
      allErrors.push(...errors);
      if (value !== undefined) clean[name] = value;
    }

    if (allErrors.length) {
      return res.status(400).json({ error: allErrors.join("; ") });
    }
    req.body = clean; // pakai nilai yang sudah disanitasi (trim/cast)
    next();
  };
}
