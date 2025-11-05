import Exercise from "../models/exercise.model.js";
import { sequelize } from "../config/database.js";
import ExerciseFavorite from "../models/exercise.favorite.model.js";
import { Op, fn, col } from 'sequelize';

function normalize(str = "") {
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function fetchBestImagesForIds(ids) {
  const list = Array.from(
    new Set((ids || []).filter((x) => Number.isFinite(Number(x))))
  );
  if (!list.length) return new Map();
  const [rows] = await sequelize.query(
    `SELECT exercise_id, image_url
     FROM (
       SELECT exercise_id, image_url,
              ROW_NUMBER() OVER (PARTITION BY exercise_id ORDER BY is_primary DESC, display_order ASC, image_id ASC) AS rn
       FROM image_exercise
       WHERE exercise_id = ANY($1)
     ) s
     WHERE rn = 1`,
    { bind: [list] }
  );
  return new Map(rows.map((r) => [r.exercise_id, r.image_url]));
}

const CANONICAL_CHILD = new Set([
  "upper-chest",
  "mid-chest",
  "lower-chest",
  "latissimus-dorsi",
  "trapezius",
  "rhomboids",
  "erector-spinae",
  "teres-major",
  "anterior-deltoid",
  "lateral-deltoid",
  "posterior-deltoid",
  "rotator-cuff",
  "serratus-anterior",
  "biceps-brachii",
  "brachialis",
  "brachioradialis",
  "triceps-brachii",
  "wrist-flexors",
  "wrist-extensors",
  "rectus-abdominis",
  "obliques",
  "transversus-abdominis",
  "quadriceps",
  "hamstrings",
  "gluteus-maximus",
  "gluteus-medius",
  "gluteus-minimus",
  "hip-adductors",
  "hip-flexors",
  "gastrocnemius",
  "soleus",
  "tibialis-anterior",
]);

const PARENT_ALIASES = new Map([
  [
    "chest",
    [
      "chest",
      "nguc",
      "torso",
      "pec",
      "pecs",
      "upper chest",
      "upper-chest",
      "mid chest",
      "mid-chest",
      "lower chest",
      "lower-chest",
    ],
  ],
  [
    "back",
    [
      "back",
      "lung",
      "upper-back",
      "upper back",
      "lower-back",
      "lower back",
      "lats",
      "latissimus",
      "latissimus-dorsi",
      "trapezius",
      "traps",
      "rhomboids",
      "erector-spinae",
      "teres-major",
      "neck",
    ],
  ],
  [
    "shoulders",
    [
      "shoulders",
      "shoulder",
      "vai",
      "delts",
      "deltoids",
      "anterior-deltoid",
      "lateral-deltoid",
      "posterior-deltoid",
      "rotator-cuff",
      "serratus-anterior",
    ],
  ],
  [
    "arms",
    [
      "arms",
      "tay",
      "upper arms",
      "upper-arms",
      "lower-arms",
      "lower arms",
      "forearm",
      "forearms",
      "biceps",
      "biceps-brachii",
      "triceps",
      "triceps-brachii",
      "brachialis",
      "brachioradialis",
      "wrist-flexors",
      "wrist-extensors",
    ],
  ],
  [
    "core",
    [
      "core",
      "abs",
      "abdominals",
      "rectus-abdominis",
      "obliques",
      "transversus-abdominis",
      "bung",
      "waist",
    ],
  ],
  [
    "legs",
    [
      "legs",
      "chan",
      "upper legs",
      "upper-legs",
      "lower legs",
      "lower-legs",
      "quads",
      "quadriceps",
      "hamstrings",
      "glutes",
      "glute",
      "butt",
      "gluteus-maximus",
      "gluteus-medius",
      "gluteus-minimus",
      "hip-adductors",
      "hip-flexors",
      "gastrocnemius",
      "soleus",
      "tibialis-anterior",
      "calf",
      "calves",
    ],
  ],
]);

function guessSlugOrParent(input) {
  const raw = normalize(input);
  const candidate = raw.replace(/\s+/g, "-");
  if (CANONICAL_CHILD.has(candidate)) return { childSlug: candidate };
  for (const [parent, aliases] of PARENT_ALIASES) {
    const s = new Set(aliases.map((a) => normalize(a)));
    if (s.has(raw) || s.has(candidate)) return { parentSlug: parent };
  }
  return { any: raw };
}

function parsePaging(
  query,
  defaults = { page: 1, pageSize: 15, maxPageSize: 1000 }
) {
  const page = Math.max(1, parseInt(query?.page, 10) || defaults.page);
  let pageSize = parseInt(query?.pageSize, 10) || defaults.pageSize;
  if (!Number.isFinite(pageSize) || pageSize <= 0) pageSize = defaults.pageSize;
  pageSize = Math.min(pageSize, defaults.maxPageSize);
  const limit = pageSize;
  const offset = (page - 1) * pageSize;
  return { page, pageSize, limit, offset };
}

export const getExercisesByMuscleGroup = async (req, res) => {
  try {
    const { muscleGroup } = req.params;
    const guessed = guessSlugOrParent(muscleGroup);
    const { limit, offset, page, pageSize } = parsePaging(req.query);

    let rows = [];
    let total = 0;
    if (guessed.childSlug) {
      const [result] = await sequelize.query(
        `WITH classified AS (
           SELECT e.exercise_id,
                  CASE
                    WHEN bool_or(emg.impact_level = 'primary') THEN 'primary'
                    WHEN bool_or(emg.impact_level = 'secondary') THEN 'secondary'
                    WHEN bool_or(emg.impact_level = 'stabilizer') THEN 'stabilizer'
                    ELSE NULL
                  END AS impact_level
           FROM exercises e
           JOIN exercise_muscle_group emg ON emg.exercise_id = e.exercise_id
           JOIN muscle_groups mg ON mg.muscle_group_id = emg.muscle_group_id
           WHERE mg.slug = :slug
           GROUP BY e.exercise_id
         )
         SELECT e.*, c.impact_level
         FROM classified c
         JOIN exercises e ON e.exercise_id = c.exercise_id
         ORDER BY e.popularity_score DESC NULLS LAST, e.name ASC
         LIMIT :limit OFFSET :offset`,
        { replacements: { slug: guessed.childSlug, limit, offset } }
      );
      rows = result;
      const [countRows] = await sequelize.query(
        `WITH classified AS (
           SELECT e.exercise_id
           FROM exercises e
           JOIN exercise_muscle_group emg ON emg.exercise_id = e.exercise_id
           JOIN muscle_groups mg ON mg.muscle_group_id = emg.muscle_group_id
           WHERE mg.slug = :slug
           GROUP BY e.exercise_id
         )
         SELECT COUNT(*)::int AS total FROM classified`,
        { replacements: { slug: guessed.childSlug } }
      );
      total = countRows?.[0]?.total || 0;
    } else if (guessed.parentSlug) {
      const [result] = await sequelize.query(
        `WITH classified AS (
          SELECT e.exercise_id,
                 CASE
                   WHEN bool_or(emg.impact_level = 'primary') THEN 'primary'
                   WHEN bool_or(emg.impact_level = 'secondary') THEN 'secondary'
                   WHEN bool_or(emg.impact_level = 'stabilizer') THEN 'stabilizer'
                   ELSE NULL
                 END AS impact_level
          FROM exercises e
          JOIN exercise_muscle_group emg ON emg.exercise_id = e.exercise_id
          JOIN muscle_groups mg ON mg.muscle_group_id = emg.muscle_group_id
          JOIN muscle_groups parent ON parent.muscle_group_id = mg.parent_id
          WHERE parent.slug = :parent
          GROUP BY e.exercise_id
        )
        SELECT e.*, c.impact_level
        FROM classified c
        JOIN exercises e ON e.exercise_id = c.exercise_id
         ORDER BY e.popularity_score DESC NULLS LAST, e.name ASC
         LIMIT :limit OFFSET :offset`,
        { replacements: { parent: guessed.parentSlug, limit, offset } }
      );
      rows = result;
      const [countRows] = await sequelize.query(
        `WITH classified AS (
           SELECT e.exercise_id
           FROM exercises e
           JOIN exercise_muscle_group emg ON emg.exercise_id = e.exercise_id
           JOIN muscle_groups mg ON mg.muscle_group_id = emg.muscle_group_id
           JOIN muscle_groups parent ON parent.muscle_group_id = mg.parent_id
           WHERE parent.slug = :parent
           GROUP BY e.exercise_id
         )
         SELECT COUNT(*)::int AS total FROM classified`,
        { replacements: { parent: guessed.parentSlug } }
      );
      total = countRows?.[0]?.total || 0;
    } else {
      // Fallback: try by slug, then by Vietnamese/English name
      const [bySlug] = await sequelize.query(
        `WITH classified AS (
           SELECT e.exercise_id,
                  CASE
                    WHEN bool_or(emg.impact_level = 'primary') THEN 'primary'
                    WHEN bool_or(emg.impact_level = 'secondary') THEN 'secondary'
                    WHEN bool_or(emg.impact_level = 'stabilizer') THEN 'stabilizer'
                    ELSE NULL
                  END AS impact_level
           FROM exercises e
           JOIN exercise_muscle_group emg ON emg.exercise_id = e.exercise_id
           JOIN muscle_groups mg ON mg.muscle_group_id = emg.muscle_group_id
           WHERE mg.slug = :slug
           GROUP BY e.exercise_id
         )
         SELECT e.*, c.impact_level
         FROM classified c
         JOIN exercises e ON e.exercise_id = c.exercise_id
         ORDER BY e.popularity_score DESC NULLS LAST, e.name ASC
         LIMIT :limit OFFSET :offset`,
        {
          replacements: {
            slug: muscleGroup.toLowerCase().replace(/\s+/g, "-"),
            limit,
            offset,
          },
        }
      );
      if (bySlug.length) {
        rows = bySlug;
        const [countRows] = await sequelize.query(
          `WITH classified AS (
             SELECT e.exercise_id
             FROM exercises e
             JOIN exercise_muscle_group emg ON emg.exercise_id = e.exercise_id
             JOIN muscle_groups mg ON mg.muscle_group_id = emg.muscle_group_id
             WHERE mg.slug = :slug
             GROUP BY e.exercise_id
           )
           SELECT COUNT(*)::int AS total FROM classified`,
          {
            replacements: {
              slug: muscleGroup.toLowerCase().replace(/\s+/g, "-"),
            },
          }
        );
        total = countRows?.[0]?.total || 0;
      } else {
        const [byName] = await sequelize.query(
          `WITH classified AS (
            SELECT e.exercise_id,
                   CASE
                     WHEN bool_or(emg.impact_level = 'primary') THEN 'primary'
                     WHEN bool_or(emg.impact_level = 'secondary') THEN 'secondary'
                     WHEN bool_or(emg.impact_level = 'stabilizer') THEN 'stabilizer'
                     ELSE NULL
                   END AS impact_level
            FROM exercises e
            JOIN exercise_muscle_group emg ON emg.exercise_id = e.exercise_id
            JOIN muscle_groups mg ON mg.muscle_group_id = emg.muscle_group_id
            WHERE mg.name ILIKE :q OR mg.name_en ILIKE :q
            GROUP BY e.exercise_id
          )
          SELECT e.*, c.impact_level
          FROM classified c
          JOIN exercises e ON e.exercise_id = c.exercise_id
          ORDER BY e.popularity_score DESC NULLS LAST, e.name ASC
          LIMIT :limit OFFSET :offset`,
          { replacements: { q: `%${muscleGroup}%`, limit, offset } }
        );
        rows = byName;
        const [countRows] = await sequelize.query(
          `WITH classified AS (
             SELECT e.exercise_id
             FROM exercises e
             JOIN exercise_muscle_group emg ON emg.exercise_id = e.exercise_id
             JOIN muscle_groups mg ON mg.muscle_group_id = emg.muscle_group_id
             WHERE mg.name ILIKE :q OR mg.name_en ILIKE :q
             GROUP BY e.exercise_id
           )
           SELECT COUNT(*)::int AS total FROM classified`,
          { replacements: { q: `%${muscleGroup}%` } }
        );
        total = countRows?.[0]?.total || 0;
      }
    }

    // Prefer image from image_exercise if available
    const imgMap = await fetchBestImagesForIds(rows.map((r) => r.exercise_id));
    const data = rows.map((r) => ({
      id: r.exercise_id,
      name: r.name || r.name_en,
      description: r.description,
      difficulty: r.difficulty_level,
      equipment: r.equipment_needed,
      imageUrl:
        imgMap.get(r.exercise_id) || r.thumbnail_url || r.gif_demo_url || null,
      instructions: null,
      impact_level: r.impact_level || null,
    }));

    res.status(200).json({ success: true, data, page, pageSize, total });
  } catch (error) {
    console.error("Error fetching exercises:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching exercises",
      error: error.message,
    });
  }
};

export const getAllExercises = async (_req, res) => {
  try {
    const { limit, offset, page, pageSize } = parsePaging(_req.query);
    const { count, rows } = await Exercise.findAndCountAll({
      limit,
      offset,
      order: [
        ["popularity_score", "DESC"],
        ["name", "ASC"],
      ],
    });
    const imgMap = await fetchBestImagesForIds(rows.map((r) => r.exercise_id));
    const data = rows.map((r) => ({
      id: r.exercise_id,
      name: r.name || r.name_en,
      description: r.description,
      difficulty: r.difficulty_level,
      equipment: r.equipment_needed,
      imageUrl:
        imgMap.get(r.exercise_id) || r.thumbnail_url || r.gif_demo_url || null,
      instructions: null,
      impact_level: r.impact_level || null,
    }));
    res.status(200).json({ success: true, data, page, pageSize, total: count });
  } catch (error) {
    console.error("Error fetching all exercises:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching exercises",
      error: error.message,
    });
  }
};

// Filter by exercise type (compound | isolation | cardio | flexibility)
export const getExercisesByType = async (req, res) => {
  try {
    const { type } = req.params;
    const t = normalize(type).replace(/\s+/g, "-");
    const allowed = new Set(["compound", "isolation", "cardio", "flexibility"]);
    if (!allowed.has(t)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid exercise type",
          allowed: Array.from(allowed),
        });
    }

    const { limit, offset, page, pageSize } = parsePaging(req.query);

    const [countRows] = await sequelize.query(
      `SELECT COUNT(*)::int AS total FROM exercises WHERE exercise_type = $1`,
      { bind: [t] }
    );
    const total = countRows?.[0]?.total || 0;

    const [rows] = await sequelize.query(
      `SELECT * FROM exercises WHERE exercise_type = $1
       ORDER BY popularity_score DESC NULLS LAST, name ASC
       LIMIT $2 OFFSET $3`,
      { bind: [t, limit, offset] }
    );

    const imgMap = await fetchBestImagesForIds(rows.map((r) => r.exercise_id));
    const data = rows.map((r) => ({
      id: r.exercise_id,
      name: r.name || r.name_en,
      description: r.description,
      difficulty: r.difficulty_level,
      equipment: r.equipment_needed,
      imageUrl:
        imgMap.get(r.exercise_id) || r.thumbnail_url || r.gif_demo_url || null,
      instructions: null,
      impact_level: null,
    }));

    return res.status(200).json({ success: true, data, page, pageSize, total });
  } catch (error) {
    console.error("Error fetching exercises by type:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Error fetching exercises by type",
        error: error.message,
      });
  }
};

// Return steps (JSON preferred) by exercise id
export const getExerciseStepsById = async (req, res) => {
  try {
    const { exerciseId } = req.params;
    // Prefer JSON table
    const [jsonRows] = await sequelize.query(
      `SELECT steps FROM exercise_steps_json WHERE exercise_id = $1 LIMIT 1`,
      { bind: [exerciseId] }
    );
    if (jsonRows.length) {
      return res.status(200).json({ success: true, data: jsonRows[0].steps });
    }
    // Fallback to row-level steps
    const [rows] = await sequelize.query(
      `SELECT step_number, title, instruction_text, media_url, media_type
       FROM exercise_steps WHERE exercise_id = $1 ORDER BY step_number ASC`,
      { bind: [exerciseId] }
    );
    const steps = rows.map((r) => ({
      step_number: r.step_number,
      instruction_text: r.instruction_text,
      title: r.title,
      media_url: r.media_url,
      media_type: r.media_type,
    }));
    return res.status(200).json({ success: true, data: steps });
  } catch (error) {
    console.error("Error fetching steps by id:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Error fetching steps",
        error: error.message,
      });
  }
};

// Return steps by slug
export const getExerciseStepsBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const [exRows] = await sequelize.query(
      `SELECT exercise_id FROM exercises WHERE slug = $1 LIMIT 1`,
      { bind: [slug] }
    );
    if (!exRows.length)
      return res
        .status(404)
        .json({ success: false, message: "Exercise not found" });
    const exerciseId = exRows[0].exercise_id;
    const [jsonRows] = await sequelize.query(
      `SELECT steps FROM exercise_steps_json WHERE exercise_id = $1 LIMIT 1`,
      { bind: [exerciseId] }
    );
    if (jsonRows.length) {
      return res.status(200).json({ success: true, data: jsonRows[0].steps });
    }
    const [rows] = await sequelize.query(
      `SELECT step_number, title, instruction_text, media_url, media_type
       FROM exercise_steps WHERE exercise_id = $1 ORDER BY step_number ASC`,
      { bind: [exerciseId] }
    );
    const steps = rows.map((r) => ({
      step_number: r.step_number,
      instruction_text: r.instruction_text,
      title: r.title,
      media_url: r.media_url,
      media_type: r.media_type,
    }));
    return res.status(200).json({ success: true, data: steps });
  } catch (error) {
    console.error("Error fetching steps by slug:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Error fetching steps",
        error: error.message,
      });
  }
};

// Return muscle groups with normalized intensity percentages for an exercise
export const getExerciseMusclesById = async (req, res) => {
  try {
    const exerciseId = parseInt(req.params.exerciseId, 10);
    if (!Number.isFinite(exerciseId) || exerciseId <= 0) {
      return res
        .status(422)
        .json({ success: false, message: "Invalid exercise id" });
    }

    const [rows] = await sequelize.query(
      `SELECT emg.muscle_group_id AS id,
              emg.impact_level,
              emg.intensity_percentage,
              mg.slug,
              COALESCE(mg.name, mg.name_en) AS name,
              parent.slug AS parent_slug,
              COALESCE(parent.name, parent.name_en) AS parent_name
         FROM exercise_muscle_group emg
         JOIN muscle_groups mg ON mg.muscle_group_id = emg.muscle_group_id
         LEFT JOIN muscle_groups parent ON parent.muscle_group_id = mg.parent_id
        WHERE emg.exercise_id = $1
        ORDER BY CASE emg.impact_level WHEN 'primary' THEN 1 WHEN 'secondary' THEN 2 WHEN 'stabilizer' THEN 3 ELSE 4 END,
                 COALESCE(emg.intensity_percentage, 0) DESC, mg.name ASC`,
      { bind: [exerciseId] }
    );

    function normalizeGroup(items) {
      const list = (items || []).map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        parent: r.parent_slug
          ? { slug: r.parent_slug, name: r.parent_name }
          : null,
        rawPercent: Number.isFinite(Number(r.intensity_percentage))
          ? Number(r.intensity_percentage)
          : 0,
      }));
      const sum = list.reduce((acc, it) => acc + (it.rawPercent || 0), 0);
      if (sum > 0) {
        for (const it of list)
          it.percent = Math.round((100 * (it.rawPercent || 0)) / sum);
      } else if (list.length) {
        const eq = Math.floor(100 / list.length);
        for (let i = 0; i < list.length; i++)
          list[i].percent =
            i === list.length - 1 ? 100 - eq * (list.length - 1) : eq;
      }
      // Ensure bounds
      for (const it of list) {
        if (!Number.isFinite(it.percent)) it.percent = 0;
        it.percent = Math.max(0, Math.min(100, it.percent));
      }
      // Sort by percent desc, then name
      list.sort(
        (a, b) =>
          b.percent - a.percent ||
          String(a.name || "").localeCompare(String(b.name || ""))
      );
      return {
        count: list.length,
        sum: list.reduce((acc, it) => acc + it.percent, 0),
        items: list,
      };
    }

    const primaryRows = rows.filter(
      (r) => (r.impact_level || "").toLowerCase() === "primary"
    );
    const secondaryRows = rows.filter(
      (r) => (r.impact_level || "").toLowerCase() === "secondary"
    );
    const stabilizerRows = rows.filter(
      (r) => (r.impact_level || "").toLowerCase() === "stabilizer"
    );

    const primary = normalizeGroup(primaryRows);
    const secondary = normalizeGroup(secondaryRows);
    const stabilizers = normalizeGroup(stabilizerRows);

    return res.status(200).json({
      success: true,
      data: {
        primary,
        secondary,
        stabilizers,
      },
    });
  } catch (error) {
    console.error("getExerciseMusclesById error:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Error fetching muscles",
        error: error.message,
      });
  }
};
// Related exercises by overlap of muscle groups + tie-breakers
export const getRelatedExercisesById = async (req, res) => {
  try {
    const exerciseId = parseInt(req.params.exerciseId, 10);
    if (!Number.isFinite(exerciseId) || exerciseId <= 0) {
      return res
        .status(422)
        .json({ success: false, message: "Invalid exercise id" });
    }

    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 16, 1),
      50
    );

    const [rows] = await sequelize.query(
      `WITH my_ex AS (
          SELECT exercise_id, exercise_type, equipment_needed
          FROM exercises WHERE exercise_id = $1
        ),
        my_groups AS (
          SELECT emg.muscle_group_id AS mg_id,
                 CASE emg.impact_level WHEN 'primary' THEN 3.0 WHEN 'secondary' THEN 1.0 WHEN 'stabilizer' THEN 0.5 ELSE 0 END AS w,
                 mg.parent_id AS parent_id
          FROM exercise_muscle_group emg
          JOIN muscle_groups mg ON mg.muscle_group_id = emg.muscle_group_id
          WHERE emg.exercise_id = $1
        ),
        my_parents AS (
          SELECT DISTINCT parent_id FROM my_groups WHERE parent_id IS NOT NULL
        ),
        cand_groups AS (
          SELECT e.exercise_id AS cand_id,
                 e.name, e.slug, e.difficulty_level, e.exercise_type, e.equipment_needed, e.popularity_score,
                 e.thumbnail_url, e.gif_demo_url,
                 emg.muscle_group_id AS mg_id,
                 CASE emg.impact_level WHEN 'primary' THEN 3.0 WHEN 'secondary' THEN 1.0 WHEN 'stabilizer' THEN 0.5 ELSE 0 END AS w,
                 mg.parent_id AS parent_id
          FROM exercises e
          JOIN exercise_muscle_group emg ON emg.exercise_id = e.exercise_id
          JOIN muscle_groups mg ON mg.muscle_group_id = emg.muscle_group_id
          WHERE e.exercise_id <> $1
        ),
        overlap AS (
          SELECT c.cand_id,
                 SUM(LEAST(m.w, c.w)) AS w_overlap,
                 COUNT(*) AS shared_children_count
          FROM my_groups m
          JOIN cand_groups c ON c.mg_id = m.mg_id
          GROUP BY c.cand_id
        ),
        parent_overlap AS (
          SELECT c.cand_id,
                 COUNT(DISTINCT c.parent_id) AS parents_shared
          FROM (SELECT DISTINCT cand_id, parent_id FROM cand_groups WHERE parent_id IS NOT NULL) c
          JOIN my_parents mp ON mp.parent_id = c.parent_id
          GROUP BY c.cand_id
        )
        SELECT c.cand_id AS exercise_id,
               MAX(c.name) AS name,
               MAX(c.slug) AS slug,
               MAX(c.difficulty_level) AS difficulty_level,
               MAX(c.exercise_type) AS exercise_type,
               MAX(c.equipment_needed) AS equipment_needed,
               MAX(c.popularity_score) AS popularity_score,
               MAX(c.thumbnail_url) AS thumbnail_url,
               MAX(c.gif_demo_url) AS gif_demo_url,
               o.w_overlap,
               o.shared_children_count,
               COALESCE(po.parents_shared, 0) AS parents_shared,
               (CASE WHEN MAX(c.exercise_type) = (SELECT exercise_type FROM my_ex) AND MAX(c.exercise_type) IS NOT NULL THEN 1.0 ELSE 0 END) AS same_type,
               (CASE WHEN MAX(c.equipment_needed) = (SELECT equipment_needed FROM my_ex) AND MAX(c.equipment_needed) IS NOT NULL THEN 0.5 ELSE 0 END) AS same_equipment,
               (o.w_overlap
                + (CASE WHEN COALESCE(po.parents_shared, 0) > 0 THEN 0.5 ELSE 0 END)
                + (CASE WHEN MAX(c.exercise_type) = (SELECT exercise_type FROM my_ex) AND MAX(c.exercise_type) IS NOT NULL THEN 1.0 ELSE 0 END)
                + (CASE WHEN MAX(c.equipment_needed) = (SELECT equipment_needed FROM my_ex) AND MAX(c.equipment_needed) IS NOT NULL THEN 0.5 ELSE 0 END)
               ) AS score,
               (CASE WHEN COALESCE(po.parents_shared, 0) > 0 THEN 1 ELSE 0 END) AS parent_priority
        FROM cand_groups c
        JOIN overlap o ON o.cand_id = c.cand_id
        LEFT JOIN parent_overlap po ON po.cand_id = c.cand_id
        GROUP BY c.cand_id, o.w_overlap, o.shared_children_count, po.parents_shared
      `,
      { bind: [exerciseId] }
    );

    // Dynamic thresholding: start strict, relax until we have enough
    const thresholds = [5.5, 5.0, 4.0, 0];

    // Sort by parent priority then score then popularity then name
    rows.sort((a, b) => {
      if ((b.parent_priority || 0) !== (a.parent_priority || 0))
        return (b.parent_priority || 0) - (a.parent_priority || 0);
      if ((b.score || 0) !== (a.score || 0))
        return (b.score || 0) - (a.score || 0);
      if ((b.popularity_score || 0) !== (a.popularity_score || 0))
        return (b.popularity_score || 0) - (a.popularity_score || 0);
      return String(a.name || "").localeCompare(String(b.name || ""));
    });

    // Require at least one shared child group
    const withChildOverlap = rows.filter(
      (r) => (r.w_overlap || 0) > 0 && (r.shared_children_count || 1) >= 1
    );

    // Resolve best images (do not filter out when missing images)
    const ids = withChildOverlap.map((r) => r.exercise_id);
    const imgMap = await fetchBestImagesForIds(ids);

    function bestImage(r) {
      return (
        imgMap.get(r.exercise_id) || r.thumbnail_url || r.gif_demo_url || null
      );
    }

    let chosen = [];
    for (const th of thresholds) {
      const candidate = withChildOverlap
        .filter((r) => (r.score || 0) >= th)
        .map((r) => ({ ...r, imageUrl: bestImage(r) }))
        .slice(0, limit);
      if (candidate.length >= Math.min(limit, 8)) {
        // ensure decent fill for UI
        chosen = candidate;
        break;
      }
      if (!chosen.length && candidate.length) chosen = candidate; // keep best attempt
    }

    const data = chosen.map((r) => ({
      id: r.exercise_id,
      slug: r.slug,
      name: r.name,
      difficulty: r.difficulty_level,
      equipment: r.equipment_needed,
      imageUrl: r.imageUrl,
    }));

    return res.status(200).json({ success: true, data, total: data.length });
  } catch (error) {
    console.error("getRelatedExercisesById error:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Error fetching related exercises",
        error: error.message,
      });
  }
};

// POST /api/exercises/:exerciseId/favorite
export const postFavorite = async (req, res) => {
  try {
    const userId = req.userId;
    const exerciseId = Number(req.params.exerciseId);
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!exerciseId) return res.status(400).json({ success: false, message: 'Invalid exercise id' });

    // Ensure exercise exists
    const ex = await Exercise.findByPk(exerciseId);
    if (!ex) return res.status(404).json({ success: false, message: 'Exercise not found' });

    try {
      await ExerciseFavorite.create({ user_id: userId, exercise_id: exerciseId });
    } catch (err) {
      // ignore unique constraint (already favorited)
      if (err.name !== 'SequelizeUniqueConstraintError') throw err;
    }

    // return new favorite count
    const favCount = await ExerciseFavorite.count({ where: { exercise_id: exerciseId } });
    return res.json({ success: true, data: { exercise_id: exerciseId, favorite_count: favCount } });
  } catch (err) {
    console.error('postFavorite error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// DELETE /api/exercises/:exerciseId/favorite
export const deleteFavorite = async (req, res) => {
  try {
    const userId = req.userId;
    const exerciseId = Number(req.params.exerciseId);
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!exerciseId) return res.status(400).json({ success: false, message: 'Invalid exercise id' });

    await ExerciseFavorite.destroy({ where: { user_id: userId, exercise_id: exerciseId } });

    const favCount = await ExerciseFavorite.count({ where: { exercise_id: exerciseId } });
    return res.json({ success: true, data: { exercise_id: exerciseId, favorite_count: favCount } });
  } catch (err) {
    console.error('deleteFavorite error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/exercises/:exerciseId/favorite
export const getFavoriteStatus = async (req, res) => {
  try {
    const exerciseId = Number(req.params.exerciseId);
    if (!exerciseId) return res.status(400).json({ success: false, message: 'Invalid exercise id' });

    const favCount = await ExerciseFavorite.count({ where: { exercise_id: exerciseId } });
    let favorited = false;
    // if auth header provided, try to detect whether current user favorited
    try {
      const authHeader = req.get('authorization') || req.get('Authorization') || '';
      if (authHeader.startsWith('Bearer ')) {
        // authGuard not applied for this route; try to decode token
        const token = authHeader.split(' ')[1];
        const jwt = await import('jsonwebtoken');
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const userId = payload.sub || payload.userId || payload.id;
        if (userId) {
          const row = await ExerciseFavorite.findOne({ where: { user_id: userId, exercise_id: exerciseId } });
          favorited = !!row;
        }
      }
    } catch (e) {
      // ignore token errors
    }

    return res.json({ success: true, data: { exercise_id: exerciseId, favorite_count: favCount, favorited } });
  } catch (err) {
    console.error('getFavoriteStatus error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
