export function parseMeta(meta) {
  if (!meta) return {};
  if (typeof meta === "object") return meta;
  try { return JSON.parse(meta); } catch { return {}; }
}

// Chỉ giữ lại các cặp { field_key: value } có tồn tại trong định nghĩa fields
export function pickAllowedAnswers(fields, answers) {
  const out = {};
  for (const f of fields) {
    if (Object.prototype.hasOwnProperty.call(answers, f.field_key)) {
      out[f.field_key] = answers[f.field_key];
    }
  }
  return out;
}

// Validate answers dựa trên field.input_type + field.metadata (options/min/max/…)
export function validateAnswers(fields, answers) {
  for (const f of fields) {
    const meta = parseMeta(f.metadata);
    const val = answers?.[f.field_key];
    const label = f.label || f.field_key;

    // 1) bắt buộc
    if (f.required && (val === undefined || val === null || val === "")) {
      return `Thiếu giá trị cho trường bắt buộc: ${label}`;
    }

    // 2) nếu không có giá trị (và không bắt buộc) thì bỏ qua các check tiếp theo
    if (val === undefined || val === null || val === "") continue;

    // 3) theo input_type
    switch (f.input_type) {
      case "radio":
      case "select": {
        const opts = (meta.options || []).map(o => String(o.key));
        if (opts.length && !opts.includes(String(val))) {
          return `Giá trị không hợp lệ cho ${label}`;
        }
        break;
      }

      case "number": {
        const num = Number(val);
        if (Number.isNaN(num)) {
          return `Trường ${label} phải là số`;
        }
        if (meta.min !== undefined && num < meta.min) {
          return `Giá trị ${label} nhỏ hơn min ${meta.min}`;
        }
        if (meta.max !== undefined && num > meta.max) {
          return `Giá trị ${label} lớn hơn max ${meta.max}`;
        }
        break;
      }

      case "checkbox": {
        if (typeof val !== "boolean") {
          return `Trường ${label} phải là true/false`;
        }
        break;
      }

      case "text": {
        const str = String(val);
        if (meta.minLength !== undefined && str.length < meta.minLength) {
          return `Độ dài ${label} phải ≥ ${meta.minLength}`;
        }
        if (meta.maxLength !== undefined && str.length > meta.maxLength) {
          return `Độ dài ${label} phải ≤ ${meta.maxLength}`;
        }
        break;
      }

      default:
        // các kiểu khác hiện chưa cần validate thêm
        break;
    }
  }
  return null; // hợp lệ
}