import Service from "@ember/service";
import { ajax } from "discourse/lib/ajax";
import getURL from "discourse/lib/get-url";

const PUBLICATION_THUMBNAIL_WIDTH = 512;

export function topicThumbnail(topic) {
  return (
    topic.thumbnails?.find(
      ({ max_width }) => max_width === PUBLICATION_THUMBNAIL_WIDTH
    )?.url || topic.image_url
  );
}

export function channelImage(url) {
  return typeof url === "string" && /^(https?:\/\/|\/)/.test(url) ? url : null;
}

export function channelLink(group) {
  return {
    ...group,
    image: channelImage(group.flair_url),
    label: group.full_name || group.name,
    description: new DOMParser()
      .parseFromString(group.bio_excerpt || "", "text/html")
      .body.textContent.trim(),
    href: getURL(`/g/${encodeURIComponent(group.name)}`),
  };
}

export default class CjChannels extends Service {
  #users = new Map();

  async forUser(username) {
    if (!username) {
      return [];
    }
    const key = username.toLowerCase();
    const cached = this.#users.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.promise;
    }
    const promise = ajax(`/u/${encodeURIComponent(username)}.json`)
      .then(({ user }) =>
        (user.groups || [])
          .filter((group) => group.is_channel === true)
          .map(channelLink)
      )
      .catch(() => {
        this.#users.delete(key);
        return [];
      });
    this.#users.set(key, { promise, expires: Date.now() + 60000 });
    return promise;
  }

  async publications(name) {
    const result = await ajax(
      `/topics/groups/${encodeURIComponent(name)}.json`,
      {
        data: { order: "created", ascending: false },
      }
    );
    return (result.topic_list?.topics || []).map((topic) => ({
      ...topic,
      href: getURL(`/t/${topic.slug || "topic"}/${topic.id}`),
      thumbnail: topicThumbnail(topic),
    }));
  }
}
