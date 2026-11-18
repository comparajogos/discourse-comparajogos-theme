export function topicActionLabel(topic, { composer = false } = {}) {
  if (!topic || topic.isPrivateMessage) {
    return;
  }

  const reviewCategories = (settings.review_categories || "")
    .split("|")
    .map(Number);
  if (reviewCategories.includes(topic.category_id)) {
    return themePrefix(
      composer ? "topic_actions.submit_review" : "topic_actions.review"
    );
  }
}
