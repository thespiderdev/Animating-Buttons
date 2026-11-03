import { test } from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./load-ts.mjs";
const { POST: save } = await loadTs("app/api/buttons/route.ts");
const { POST: review } = await loadTs("app/api/buttons/[id]/review/route.ts");
const code = {
  title: "Fixture button",
  html: '<button class="bg-blue-600">Save</button>',
  css: "",
  js: "",
  styling: "css",
  categories: ["hover"],
};
const request = (data, token = "fixture-token") =>
  new Request("http://test.local/api/buttons", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
let account = 0;
async function fixture(
  {
    login = "fixture-maker",
    existing,
    authFailure = false,
    dbFailure = false,
  } = {},
  run,
) {
  const originalFetch = globalThis.fetch;
  const admins = process.env.NEXT_PUBLIC_ADMIN_USERS;
  const uid = `fixture-uid-${++account}`;
  const writes = [];
  process.env.NEXT_PUBLIC_ADMIN_USERS = "fixture-admin";
  globalThis.fetch = async (url, options = {}) => {
    const target = new URL(url);
    if (target.hostname === "identitytoolkit.googleapis.com")
      return Response.json(
        authFailure
          ? { error: {} }
          : {
              users: [
                {
                  localId: uid,
                  displayName: "Fixture Maker",
                  providerUserInfo: [
                    { providerId: "github.com", rawId: String(account) },
                  ],
                },
              ],
            },
        { status: authFailure ? 400 : 200 },
      );
    if (target.hostname === "api.github.com") return Response.json({ login });
    if (target.hostname === "firestore.googleapis.com") {
      assert.equal(options.headers.Authorization, "Bearer fixture-token");
      if (options.method === "POST" || options.method === "PATCH") {
        writes.push({
          url: target,
          method: options.method,
          ...JSON.parse(options.body),
        });
        return Response.json(
          dbFailure
            ? { error: {} }
            : {
                name: "projects/fixture/databases/(default)/documents/buttons/saved-id",
              },
          { status: dbFailure ? 403 : 200 },
        );
      }
      return Response.json({ fields: existing || {} });
    }
    throw new Error("Unexpected network request in fixture");
  };
  try {
    await run({ writes, uid });
  } finally {
    globalThis.fetch = originalFetch;
    if (admins === undefined) delete process.env.NEXT_PUBLIC_ADMIN_USERS;
    else process.env.NEXT_PUBLIC_ADMIN_USERS = admins;
  }
}
test("new submissions use verified creator details and ignore forged status and compiled CSS", async () =>
  fixture({}, async ({ writes, uid }) => {
    const response = await save(
      request({
        ...code,
        githubUsername: "forged",
        ownerUid: "forged",
        status: "approved",
        compiledCss: "forged",
        categories: ["hover", "hover", "fake"],
      }),
    );
    assert.equal(response.status, 200);
    assert.equal(writes.length, 1);
    assert.equal(writes[0].fields.githubUsername.stringValue, "fixture-maker");
    assert.equal(writes[0].fields.ownerUid.stringValue, uid);
    assert.equal(writes[0].fields.status.stringValue, "pending");
    assert.equal(writes[0].fields.compiledCss.stringValue, "");
    assert.deepEqual(writes[0].fields.categories.arrayValue.values, [
      { stringValue: "hover" },
    ]);
  }));
test("owner edits return to moderation and leave likes and original attribution outside the update mask", async () =>
  fixture(
    {
      existing: {
        githubUsername: { stringValue: "FIXTURE-MAKER" },
        status: { stringValue: "approved" },
      },
    },
    async ({ writes }) => {
      const response = await save(request({ ...code, id: "original-id" }));
      assert.equal(response.status, 200);
      assert.equal(writes[0].method, "PATCH");
      assert.equal(writes[0].fields.status.stringValue, "pending");
      assert.equal(writes[0].fields.githubUsername, undefined);
      assert.equal(writes[0].fields.likeCounter, undefined);
      assert.ok(
        !writes[0].url.searchParams
          .getAll("updateMask.fieldPaths")
          .includes("remixOf"),
      );
    },
  ));
test("new ownership IDs take precedence over matching legacy usernames", async () =>
  fixture(
    {
      existing: {
        ownerUid: { stringValue: "someone-else" },
        githubUsername: { stringValue: "fixture-maker" },
      },
    },
    async ({ writes }) => {
      assert.equal(
        (await save(request({ ...code, id: "another-button" }))).status,
        403,
      );
      assert.equal(writes.length, 0);
    },
  ));
test("button-only validation rejects layouts before any database write", async () =>
  fixture({}, async ({ writes }) => {
    assert.equal(
      (
        await save(
          request({ ...code, html: "<main><button>Save</button></main>" }),
        )
      ).status,
      400,
    );
    assert.equal(writes.length, 0);
  }));
test("remixes derive source credit from the existing record", async () =>
  fixture(
    {
      existing: {
        status: { stringValue: "approved" },
        title: { stringValue: "Original title" },
        githubUsername: { stringValue: "original-maker" },
      },
    },
    async ({ writes }) => {
      assert.equal(
        (
          await save(
            request({
              ...code,
              remixId: "source-id",
              remixOf: { githubUsername: "forged" },
            }),
          )
        ).status,
        200,
      );
      assert.equal(
        writes[0].fields.remixOf.mapValue.fields.githubUsername.stringValue,
        "original-maker",
      );
      assert.equal(
        writes[0].fields.remixOf.mapValue.fields.id.stringValue,
        "source-id",
      );
    },
  ));
test("invalid Firebase sessions cannot reach Firestore", async () =>
  fixture({ authFailure: true }, async ({ writes }) => {
    assert.equal((await save(request(code))).status, 401);
    assert.equal(writes.length, 0);
  }));
test("non-administrators cannot approve and administrators must validate before approval", async () => {
  const context = { params: Promise.resolve({ id: "pending-id" }) };
  await fixture({}, async ({ writes }) => {
    assert.equal(
      (await review(request({ status: "approved" }), context)).status,
      403,
    );
    assert.equal(writes.length, 0);
  });
  await fixture(
    {
      login: "fixture-admin",
      existing: { html: { stringValue: "<main><button>Go</button></main>" } },
    },
    async ({ writes }) => {
      assert.equal(
        (await review(request({ status: "approved" }), context)).status,
        400,
      );
      assert.equal(writes.length, 0);
    },
  );
});
test("administrator approval compiles Tailwind and reports Firestore rule denials", async () => {
  const existing = {
    html: { stringValue: code.html },
    css: { stringValue: "" },
    js: { stringValue: "" },
    styling: { stringValue: "tailwind" },
  };
  await fixture({ login: "fixture-admin", existing }, async ({ writes }) => {
    assert.equal(
      (
        await review(request({ status: "approved" }), {
          params: Promise.resolve({ id: "pending-id" }),
        })
      ).status,
      200,
    );
    assert.match(writes[0].fields.compiledCss.stringValue, /\.bg-blue-600/);
    assert.equal(writes[0].fields.status.stringValue, "approved");
  });
  await fixture({ dbFailure: true }, async () => {
    assert.equal((await save(request(code))).status, 403);
  });
});
