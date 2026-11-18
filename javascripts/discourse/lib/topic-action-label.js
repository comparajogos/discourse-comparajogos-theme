export function topicActionLabel(topic, { composer = false } = {}) {
  if (!topic || topic.isPrivateMessage) {
    return;
  }

  const tags = (topic.tags || []).map((tag) => tag.name || tag);
  if (tags.includes("imagem")) {
    return themePrefix("topic_actions.submit_images");
  }
  if (tags.includes("ficha")) {
    return themePrefix(
      composer ? "topic_actions.submit_review" : "topic_actions.review"
    );
  }
}
