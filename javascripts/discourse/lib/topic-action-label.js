export function topicActionLabel(topic, { composer = false } = {}) {
  if (!topic || topic.isPrivateMessage) {
    return;
  }

  const tags = (topic.tags || []).map((tag) => tag.name || tag);
  if (tags.includes("ficha")) {
    return themePrefix(
      composer ? "topic_actions.submit_review" : "topic_actions.review"
    );
  }
}
