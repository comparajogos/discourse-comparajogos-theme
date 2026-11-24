import Service from "@ember/service";
import { ajax } from "discourse/lib/ajax";
import getURL from "discourse/lib/get-url";

const UPLOADS_ORIGIN = "https://uploads.comparajogos.com.br";
const RESIZABLE_PATH = /^\/[\w/.-]+$/;

export function topicThumbnail(topic) {
  const url = topic.image_url?.replace(/^\/\//, "https://");
  if (!url) {
    return null;
  }
  const path = url.startsWith(`${UPLOADS_ORIGIN}/`)
    ? url.slice(UPLOADS_ORIGIN.length)
    : null;
  if (!path || !RESIZABLE_PATH.test(path) || path.includes("..")) {
    return { src: topic.image_url };
  }
  const resized = (width) => `${UPLOADS_ORIGIN}/_/w${width}/plain${path}`;
  return {
    src: resized(384),
    srcset: `${resized(384)} 384w, ${resized(828)} 828w`,
  };
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
}
