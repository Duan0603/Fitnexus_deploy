import React, { useEffect, useMemo, useRef, useState } from "react";
import { Brain, ImagePlus, Leaf, Loader2 } from "lucide-react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import * as mobilenet from "@tensorflow-models/mobilenet";
import "./NutritionAI.css";
import { useAuth } from "../../context/auth.context.jsx";
import HeaderLogin from "../../components/header/HeaderLogin.jsx";
import HeaderDemo from "../../components/header/HeaderDemo.jsx";

function centerCropToSquare(imgEl, size = 224) {
  const s = Math.min(imgEl.naturalWidth, imgEl.naturalHeight);
  const sx = Math.floor((imgEl.naturalWidth - s) / 2);
  const sy = Math.floor((imgEl.naturalHeight - s) / 2);
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  ctx.drawImage(imgEl, sx, sy, s, s, 0, 0, size, size);
  return c;
}

function norm(s) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_");
}

export default function FoodCalorie() {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [ready, setReady] = useState(false);
  const [labels, setLabels] = useState([]);
  const [calo, setCalo] = useState({});
  const [portion, setPortion] = useState({});
  const [macrosMap, setMacrosMap] = useState({});
  const [result, setResult] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const gramsRef = useRef();
  const sizeRef = useRef();
  const fileRef = useRef();

  const models = useMemo(() => ({ net: null, clf: null }), []);

  const setMacrosWithNormalization = (macros) => {
    const map = {};
    if (Array.isArray(macros)) {
      for (const item of macros) {
        const k1 = item?.key || (item?.name ? norm(item.name) : null);
        if (item?.name) map[item.name] = item;
        if (k1) {
          map[k1] = item;
          map[norm(k1)] = item;
        }
      }
    } else {
      for (const [k, v] of Object.entries(macros || {})) {
        map[k] = v;
        map[norm(k)] = v;
      }
    }
    setMacrosMap(map);
  };

  useEffect(() => {
    (async () => {
      try {
        try {
          await tf.setBackend("webgl");
        } catch (_) {
          await tf.setBackend("cpu");
        }
        await tf.ready();

        const tryLocalMobileNet = async () => {
          const candidates = [
            "/model/mobilenet/model.json",
            "/model/mobilenet_v2/model.json",
            "/model/mobilenet_v2_1.0_224/model.json",
            "/model/mobilenet_v2_100_224/model.json",
            "/model/mobilenet_v2_1.0_224/classification/2/model.json",
            "/model/mobilenet_v2_100_224/classification/2/model.json",
          ];
          for (const url of candidates) {
            try {
              const res = await fetch(url, {
                method: "GET",
                cache: "no-store",
              });
              if (res.ok) {
                return await mobilenet.load({
                  version: 2,
                  alpha: 1.0,
                  modelUrl: url,
                });
              }
            } catch (_) {
              /* try next */
            }
          }
          return await mobilenet.load({ version: 2, alpha: 1.0 });
        };

        const net = await tryLocalMobileNet();
        const clf = await tf.loadLayersModel("/model/classifier/model.json");
        const lbs = await (await fetch("/model/labels.json")).json();
        const cal = await (await fetch("/tables/calorie_table.json")).json();
        const por = await (await fetch("/tables/portion_defaults.json")).json();
        let macros = {};
        try {
          const r = await fetch("/tables/macros_table.json", {
            cache: "no-store",
          });
          if (r.ok) macros = await r.json();
        } catch { }
        models.net = net;
        models.clf = clf;
        setLabels(lbs);
        setCalo(cal);
        setPortion(por?.default_portions || por || {});
        setMacrosWithNormalization(macros || {});
        setReady(true);
        setError("");
        console.log(
          "Loaded. output=",
          clf.outputs[0].shape,
          "labels=",
          lbs.length
        );
      } catch (e) {
        console.error(e);
        setError(
          "Không thể tải mô hình/dữ liệu. Nếu môi trường chặn internet, hãy thêm MobileNetV2 vào /public/model/mobilenet và kiểm tra các tệp trong /public/model và /public/tables."
        );
        setReady(false);
      }
    })();
    return () => {
      try {
        models.clf?.dispose();
      } catch { }
    };
  }, [models]);

  function computePortionGrams(key, userGrams, size) {
    const baseFromMacros =
      macrosMap[key] && macrosMap[key].serving_g
        ? Number(macrosMap[key].serving_g)
        : null;
    const base = portion[key] ?? baseFromMacros ?? 250;
    if (userGrams && userGrams > 0) return userGrams;
    if (size === "s") return Math.round(base * 0.7);
    if (size === "l") return Math.round(base * 1.3);
    return base;
  }

  function computeMacros(key, grams) {
    const entry = macrosMap[key] || null;
    if (!entry) return null;

    const src =
      entry?.per_100g && typeof entry.per_100g === "object"
        ? entry.per_100g
        : entry;

    const canon = (k) => {
      const s = String(k || "").toLowerCase();
      const base = s.replace(/_(g|mg)$/, "");
      if (["protein", "proteins", "prot"].includes(base)) return "protein";
      if (["carb", "carbs", "carbohydrate", "carbohydrates"].includes(base))
        return "carbs";
      if (["fat", "fats"].includes(base)) return "fat";
      if (["alcohol"].includes(base)) return "alcohol";
      if (["sugar", "sugars"].includes(base)) return "sugar";
      if (["fiber", "fibre"].includes(base)) return "fiber";
      if (["sodium", "salt"].includes(base)) return "sodium";
      if (["kcal", "calories", "energy"].includes(base)) return base;
      return base;
    };
    const detectUnit = (k) => {
      const s = String(k || "").toLowerCase();
      if (/_mg$/.test(s)) return "mg";
      if (/_g$/.test(s)) return "g";
      if (["kcal", "calories", "energy"].includes(s.replace(/_(g|mg)$/, "")))
        return "kcal";
      return "g";
    };
    const niceName = (id) => {
      const map = {
        protein: "Protein",
        carbs: "Carb",
        fat: "Fat",
        alcohol: "Alcohol",
        sugar: "Sugar",
        fiber: "Fiber",
        sodium: "Sodium",
        kcal: "Calories",
        calories: "Calories",
        energy: "Energy",
      };
      const s = String(id || "");
      return (
        map[s] || s.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())
      );
    };

    const per100By = {};
    const amountBy = {};
    const details = [];
    for (const [k, v] of Object.entries(src)) {
      const id = canon(k);
      const unit = detectUnit(k);
      const per100 = Number(v) || 0;
      per100By[id] = per100;
      const value =
        unit === "mg"
          ? Math.round((per100 * grams) / 100)
          : +((per100 * grams) / 100).toFixed(1);
      details.push({ id, name: niceName(id), value, unit });
      if (
        (id === "protein" ||
          id === "carbs" ||
          id === "fat" ||
          id === "alcohol") &&
        unit === "g"
      ) {
        amountBy[id] = value;
      }
    }

    const pG = amountBy.protein || 0;
    const cG = amountBy.carbs || 0;
    const fG = amountBy.fat || 0;
    const aG = amountBy.alcohol || 0;
    const pKcal = pG * 4;
    const cKcal = cG * 4;
    const fKcal = fG * 9;
    const aKcal = aG * 7;
    const kcalFromMacros = pKcal + cKcal + fKcal + aKcal;
    const kcal100Field =
      per100By.kcal ?? per100By.calories ?? per100By.energy ?? null;
    const kcal100FromMacros =
      per100By.protein || per100By.carbs || per100By.fat || per100By.alcohol
        ? (per100By.protein || 0) * 4 +
        (per100By.carbs || 0) * 4 +
        (per100By.fat || 0) * 9 +
        (per100By.alcohol || 0) * 7
        : null;
    const kcal100Effective = Number.isFinite(kcal100Field)
      ? kcal100Field
      : Number.isFinite(kcal100FromMacros)
        ? Math.round(kcal100FromMacros)
        : null;
    const pct =
      kcalFromMacros > 0
        ? {
          p: +((pKcal / kcalFromMacros) * 100).toFixed(0),
          c: +((cKcal / kcalFromMacros) * 100).toFixed(0),
          f: +((fKcal / kcalFromMacros) * 100).toFixed(0),
          a: +((aKcal / kcalFromMacros) * 100).toFixed(0),
        }
        : { p: 0, c: 0, f: 0, a: 0 };

    const order = ["protein", "carbs", "fat", "alcohol"];
    details.sort((a, b) => {
      const ia = order.indexOf(a.id);
      const ib = order.indexOf(b.id);
      if (ia !== -1 || ib !== -1)
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      return a.name.localeCompare(b.name);
    });

    return {
      grams: { p: pG, c: cG, f: fG, a: aG },
      kcal: {
        p: Math.round(pKcal),
        c: Math.round(cKcal),
        f: Math.round(fKcal),
        a: Math.round(aKcal),
        total: Math.round(kcalFromMacros),
      },
      pct,
      details,
      per100By,
      kcal100Field,
      kcal100FromMacros,
      kcal100Effective,
    };
  }

  function recalcFromControls(cur) {
    if (!cur) return;
    const userGrams = gramsRef.current?.value
      ? Number(gramsRef.current.value)
      : null;
    const size = sizeRef.current?.value || "";
    const grams = computePortionGrams(cur.key, userGrams, size);
    const macros = computeMacros(cur.key, grams);
    const kcal100Eff = macros?.kcal100Effective ?? cur.kcal100;
    const total = Math.round(((kcal100Eff || 0) * grams) / 100);
    setResult({ ...cur, grams, total, macros, kcal100: kcal100Eff });
  }

  function showDishInfo(dish, confidence) {
    try {
      const key = calo[dish] != null ? dish : norm(dish);
      const macros0 = computeMacros(key, 100);
      const kcal100 = macros0?.kcal100Effective ?? calo[key] ?? 150;
      const userGrams = gramsRef.current?.value
        ? Number(gramsRef.current.value)
        : null;
      const size = sizeRef.current?.value || "";
      const grams = computePortionGrams(key, userGrams, size);
      const total = Math.round((kcal100 * grams) / 100);
      const macros = computeMacros(key, grams);
      setResult((prev) => ({
        ...(prev || {}),
        dish,
        confidence: confidence ?? prev?.confidence ?? null,
        key,
        kcal100,
        grams,
        total,
        macros,
      }));
    } catch (e) {
      // noop
    }
  }

  async function onPickFile(e) {
    if (!ready) return;

    // Client-side usage limit for free users
    if (user?.user_type !== 'premium') {
      const usageKey = 'fitnexus_nutrition_ai_usage';
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      let usage = { date: today, count: 0 };
      try {
        const storedUsage = JSON.parse(localStorage.getItem(usageKey));
        if (storedUsage.date === today) {
          usage = storedUsage;
        }
      } catch (err) { /* Ignore parsing errors */ }

      if (usage.count >= 3) {
        alert('Bạn đã hết 3 lượt phân tích miễn phí hôm nay. Nâng cấp Premium để sử dụng không giới hạn.');
        // Clear the file input so the same file can be re-selected if the user tries again tomorrow
        if (fileRef.current) {
          fileRef.current.value = '';
        }
        return;
      }

      // Increment and save usage
      usage.count++;
      localStorage.setItem(usageKey, JSON.stringify(usage));
    }

    const f = e.target.files?.[0];
    if (!f) return;

    const img = new Image();
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    img.src = url;
    await new Promise((r) => (img.onload = () => r()));
    const canvas = centerCropToSquare(img, 224);

    const prediction = tf.tidy(() => {
      const x = tf.browser.fromPixels(canvas);
      const emb = models.net.infer(x.expandDims(0), "global_average");
      const probs = models.clf.predict(emb).dataSync();
      const arr = Array.from(probs);
      const top = arr
        .map((v, i) => ({ i, v }))
        .sort((a, b) => b.v - a.v)
        .slice(0, 3);
      return { arr, top };
    });

    const top1 = prediction.top[0];
    const dish = labels[top1.i];
    const key = calo[dish] != null ? dish : norm(dish);
    const macros0 = computeMacros(key, 100);
    const kcal100 = macros0?.kcal100Effective ?? calo[key] ?? 150;

    const userGrams = gramsRef.current?.value
      ? Number(gramsRef.current.value)
      : null;
    const size = sizeRef.current?.value || "";
    const grams = computePortionGrams(key, userGrams, size);
    const total = Math.round((kcal100 * grams) / 100);
    const macros = computeMacros(key, grams);

    setResult({
      dish,
      confidence: top1.v,
      top3: prediction.top.map((t) => ({ dish: labels[t.i], confidence: t.v })),
      grams,
      kcal100,
      total,
      key,
      macros,
    });
  }

    return (

      <div className="flex flex-col min-h-screen bg-white">

        {isAuthenticated ? <HeaderLogin /> : <HeaderDemo />}

        <div className="flex flex-col flex-grow fc-page">

          {/* Hidden global file input */}

          <input

            ref={fileRef}

            type="file"

            accept="image/*"

            onChange={onPickFile}

            hidden

            disabled={!ready}

          />

  

          {/* Main content */}

          <main className="fc-container">

            {!previewUrl ? (

              <section className="fc-hero">

                <div className="fc-card">

                  <div className="fc-hero-inner">

                    <h1 className="fc-hero-title">

                      Nhận diện món ăn & Tính calo tức thì

                    </h1>

                    <p className="fc-hero-sub">

                      Bạn không biết món ăn này có bao nhiêu calo? Đừng lo, AI

                      Nutrition của FITNEXUS sẽ giúp bạn!

                    </p>

                    <div className="fc-hero-cta">

                      <button

                        className="fc-btn-primary"

                        onClick={() => fileRef.current?.click()}

                        disabled={!ready}

                      >

                        <span

                          style={{

                            display: "inline-flex",

                            alignItems: "center",

                            gap: 8,

                          }}

                        >

                          <ImagePlus size={18} /> Chọn ảnh món ăn

                        </span>

                      </button>

                      <button

                        className="fc-btn-secondary"

                        style={{ marginLeft: 12 }}

                        onClick={() =>

                          (window.location.href = "/nutrition-ai/personalize")

                        }

                      >

                        Cá nhân hoá dinh dưỡng

                      </button>

                    </div>

                    {!ready && !error && (

                      <div

                        className="fc-loading"

                        style={{

                          display: "inline-flex",

                          alignItems: "center",

                          gap: 8,

                        }}

                      >

                        <Loader2 className="animate-spin" size={18} /> Đang tải mô

                        hình…

                      </div>

                    )}

                    <div

                      style={{

                        display: "flex",

                        justifyContent: "center",

                        gap: 12,

                        marginTop: 16,

                        flexWrap: "wrap",

                      }}

                    >

                      <div

                        className="fc-badge"

                        style={{

                          display: "inline-flex",

                          alignItems: "center",

                          gap: 6,

                        }}

                      >

                        <Brain size={16} /> Nhận diện chính xác

                      </div>

                      <div

                        className="fc-badge"

                        style={{

                          display: "inline-flex",

                          alignItems: "center",

                          gap: 6,

                        }}

                      >

                        <Leaf size={16} /> Thông tin dinh dưỡng chi tiết

                      </div>

                    </div>

                    {error && <div className="fc-error">{error}</div>}

                  </div>

                </div>

              </section>

            ) : (

              <section className="fc-scanner">

  

                <div className="fc-card">

                  <div className="fc-scanner-header">

                    <h3 className="fc-scanner-title">Kết quả phân tích</h3>

                    <p className="fc-scanner-sub">

                      Thông tin dinh dưỡng ước tính từ AI

                    </p>

                  </div>

  

                  <div className="fc-grid">

                    <div className="fc-col">

                      <div className="fc-preview">

                        {previewUrl ? (

                          <img

                            src={previewUrl}

                            alt="preview"

                            loading="lazy"

                            decoding="async"

                          />

                        ) : (

                          <div className="fc-placeholder">Chưa có ảnh</div>

                        )}

                      </div>

                    </div>

  

                    <div className="fc-col">

                      <label className="fc-label">Thiết lập khẩu phần</label>

                      <div className="fc-controls">

                        <input

                          className="fc-input"

                          ref={gramsRef}

                          type="number"

                          placeholder="Khối lượng (gram) – tuỳ chọn"

                          onChange={() => recalcFromControls(result)}

                        />

                        <select

                          className="fc-select"

                          ref={sizeRef}

                          defaultValue=""

                          onChange={() => recalcFromControls(result)}

                        >

                          <option value="">Kích cỡ khẩu phần</option>

                          <option value="s">Nhỏ (S)</option>

                          <option value="m">Vừa (M)</option>

                          <option value="l">Lớn (L)</option>

                        </select>

                        <button

                          className="fc-btn-secondary"

                          onClick={() => fileRef.current?.click()}

                          disabled={!ready}

                        >

                          Chọn/đổi ảnh

                        </button>

                      </div>

  

                      {result && (

                        <div className="fc-result" aria-live="polite">

                          <div className="fc-row">

                            <span className="fc-key">Món ăn:</span>

                            <span className="fc-val">{result.dish}</span>

                          </div>

                          <div className="fc-row">

                            <span className="fc-key">Khối lượng:</span>

                            <span className="fc-val">{result.grams} g</span>

                          </div>

                          <div className="fc-row">

                            <span className="fc-key">Calo / 100g:</span>

                            <span className="fc-val">{result.kcal100}</span>

                          </div>

                          <div className="fc-total">Tổng: {result.total} kcal</div>

                          <div className="fc-top3">

                            {result.top3.map((t, idx) => {

                              const active = result.dish === t.dish;

                              const cls = `fc-chip clickable${active ? " active" : ""

                                }`;

                              return (

                                <span

                                  key={idx}

                                  className={cls}

                                  role="button"

                                  tabIndex={0}

                                  aria-pressed={active}

                                  title="Xem dinh dưỡng món này"

                                  onClick={() => showDishInfo(t.dish, t.confidence)}

                                  onKeyDown={(e) => {

                                    if (e.key === "Enter" || e.key === " ") {

                                      e.preventDefault();

                                      showDishInfo(t.dish, t.confidence);

                                    }

                                  }}

                                >

                                  {t.dish} {(t.confidence * 100).toFixed(1)}%

                                </span>

  

  

                              );

                            })}

                            <button

                              className="fc-btn-secondary"

                              style={{ marginLeft: 12 }}

                              onClick={() =>

                                (window.location.href = "/nutrition-ai/personalize")

                              }

                            >

                              Cá nhân hoá dinh dưỡng

                            </button>

                          </div>

                        </div>

                      )}

  

                      {result &&

                        (result.macros ? (

                          <div className="fc-macros">

                            <div className="fc-macros-head">

                              <div className="fc-macros-title">

                                Thành phần dinh dưỡng ({result.grams}g)

                              </div>

                              <div className="fc-macros-sub">

                                Ước tính từ bảng macro/100g

                              </div>

                            </div>

                            <div className="fc-macro-rows">

                              {result.macros.details.map((it) => {

                                const pctBadge =

                                  it.id === "protein"

                                    ? result.macros.pct.p

                                    : it.id === "carbs"

                                      ? result.macros.pct.c

                                      : it.id === "fat"

                                        ? result.macros.pct.f

                                        : it.id === "alcohol"

                                          ? result.macros.pct.a

                                          : null;

                                return (

                                  <div key={it.id} className="fc-macro-row">

                                    <div className="fc-macro-name">{it.name}</div>

                                    <div className="fc-macro-val">

                                      {it.value} {it.unit}

                                      {pctBadge !== null &&

                                        pctBadge !== undefined ? (

                                        <>

                                          {" "}

                                          <span className="fc-badge">

                                            {pctBadge}%

                                          </span>

                                        </>

                                      ) : null}

                                    </div>

                                  </div>

                                );

                              })}

                            </div>

                            <div

                              className="fc-macro-stack"

                              aria-label="Macro energy split"

                            >

                              <div

                                className="seg protein"

                                style={{ width: `${result.macros.pct.p}%` }}

                              />

                              <div

                                className="seg carb"

                                style={{ width: `${result.macros.pct.c}%` }}

                              />

                              <div

                                className="seg fat"

                                style={{ width: `${result.macros.pct.f}%` }}

                              />

                              {result.macros.grams.a > 0 ? (

                                <div

                                  className="seg alcohol"

                                  style={{ width: `${result.macros.pct.a}%` }}

                                />

                              ) : null}

                            </div>

                            <div className="fc-macro-legend">

                              <span className="dot protein" /> Protein

                              <span className="dot carb" /> Carb

                              <span className="dot fat" /> Fat

                              {result.macros.grams.a > 0 ? (

                                <>

                                  <span className="dot alcohol" /> Alcohol

                                </>

                              ) : null}

                            </div>

                          </div>

                        ) : (

                          <div className="fc-error">

                            Chưa có dữ liệu macro chi tiết cho món này. Thêm vào

                            file /public/tables/macros_table.json để hiển thị tỉ lệ

                            protein/carb/fat.

                          </div>

                        ))}

                    </div>

                  </div>

                </div>

              </section>

            )}

          </main>

        </div>

      </div>

    );}
