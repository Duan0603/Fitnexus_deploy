export async function applyMapTo({ fields, answers, userId, transaction, models }) {
  for (const f of fields) {
    const mapTo = f?.metadata?.mapTo;
    if (!mapTo || answers[f.field_key] == null) continue;

    const val = answers[f.field_key];
    if (mapTo.model === "user_progress" && mapTo.column) {
      const { UserProgress } = models; // import model của bạn
      await UserProgress.upsert(
        { user_id: userId, [mapTo.column]: val },
        { transaction }
      );
    }
    // Có thể mở rộng các model khác sau
  }
}