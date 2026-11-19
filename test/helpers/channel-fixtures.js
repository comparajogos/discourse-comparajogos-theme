export function stubNonChannelAuthors(server, helper) {
  for (const username of ["uwe_keim", "bianca"]) {
    server.get(`/u/${username}.json`, () =>
      helper.response({ user: { username, groups: [] } })
    );
  }
}
