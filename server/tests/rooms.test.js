const test = require("node:test");
const assert = require("node:assert/strict");
const { validateRoom, validateImage } = require("../services/rooms");

test("room images allow local demo assets, HTTPS and bounded raster uploads", () => {
  assert.equal(validateImage("/images/rooms/orbit.webp"), "/images/rooms/orbit.webp");
  assert.equal(validateImage("https://example.com/room.webp"), "https://example.com/room.webp");
  assert.throws(() => validateImage("javascript:alert(1)"));
  assert.throws(() => validateImage("data:image/svg+xml;base64,PHN2Zz4="));
  assert.throws(() => validateImage("/images/../../.env"));
  assert.throws(() => validateImage(`data:image/webp;base64,${"A".repeat(400000)}`));
});
test("rooms reject reversed player ranges and invalid durations", () => {
  const room = { theme: "Orbit", genre: "Sci-Fi", description: "A space adventure.", playersMin: 2, playersMax: 4, price: 500, duration: 60, image_url: "/images/rooms/orbit.webp" };
  assert.deepEqual(validateRoom(room).gallery, []);
  assert.throws(() => validateRoom({ ...room, playersMax: 1 }));
  assert.throws(() => validateRoom({ ...room, price: -10 }));
  assert.throws(() => validateRoom({ ...room, duration: 0 }));
});
