const { test, expect } = require("@playwright/test");
const { randomUUID } = require("node:crypto");

async function graphql(request, query, variables = {}, token) {
  const response = await request.post("/graphql", { data: { query, variables }, headers: token ? { authorization: `Bearer ${token}` } : {} });
  const result = await response.json();
  expect(result.errors, JSON.stringify(result.errors)).toBeUndefined();
  return result.data;
}
async function visitor(request) {
  const email = `browser-${randomUUID()}@example.test`;
  const data = await graphql(request, "mutation($email: String!) { createUser(firstName: \"Browser\", lastName: \"Visitor\", email: $email, password: \"browser-test-password\") { token } }", { email });
  return { email, token: data.createUser.token };
}
async function signIn(page, token) {
  await page.addInitScript((value) => localStorage.setItem("id_token", value), token);
}

test("public pages load and deep links work", async ({ page, request }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("header")).toBeVisible();
  await page.goto("/escaperooms");
  await expect(page.getByText("The Forgotten Asylum", { exact: true }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByText("Signal From Orbit", { exact: true }).first()).toBeVisible();
  const config = await (await request.get("/api/config")).json();
  expect(config.demoPayments).toBe(true);
  expect(config.emailEnabled).toBe(false);
  expect(config.firebaseConfig).toBeNull();
  expect(JSON.stringify(config)).not.toContain("SECRET");
  expect(errors).toEqual([]);
});

test("registration works without Google or an email provider", async ({ page }) => {
  await page.goto("/signup");
  await page.locator('input[name="firstName"]').fill("Taylor");
  await page.locator('input[name="lastName"]').fill("Visitor");
  await page.locator('input[name="email"]').fill(`signup-${randomUUID()}@example.test`);
  await page.locator('input[name="password"]').fill("browser-test-password");
  await page.locator('input[name="confirmpassword"]').fill("browser-test-password");
  await page.getByRole("button", { name: "Register Profile" }).click();
  await expect(page).toHaveURL(/\/home$/);
  await page.goto("/myaccount");
  await expect(page.getByText("Taylor", { exact: true }).first()).toBeVisible();
});

test("email and password sign-in works with optional providers disabled", async ({ page, request }) => {
  const user = await visitor(request);
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(user.email);
  await page.locator('button[type="submit"]').click();
  await page.locator('input[name="password"]').fill("browser-test-password");
  await page.getByRole("button", { name: "Initialize Session" }).click();
  await expect(page).toHaveURL(/\/home$/);
});

test("Google buttons remain available and explain missing provider configuration", async ({ page, request }) => {
  await page.goto("/signup");
  await expect(page.getByRole("button", { name: "Sign up with Google" })).toBeVisible();
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await expect(page.getByText("Google sign-in is temporarily unavailable. Please try again later.")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
  const response = await request.post("/auth/google", { data: { idToken: "test-token" } });
  expect(response.status()).toBe(503);
});

test("email-code login remains accessible and completes the code-entry flow", async ({ page, request }) => {
  const { email, token } = await visitor(request);
  await page.route("**/graphql", async (route) => {
    const query = route.request().postDataJSON()?.query || "";
    if (/\bsendAuthCode\s*\(/.test(query)) return route.fulfill({ json: { data: { sendAuthCode: "00000000-0000-4000-8000-000000000001" } } });
    if (/\bloginWithCode\s*\(/.test(query)) return route.fulfill({ json: { data: { loginWithCode: { __typename: "Auth", token, user: null } } } });
    return route.continue();
  });
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('button[type="submit"]').click();
  await expect(page.getByRole("button", { name: "Forgot Key?" })).toBeVisible();
  await page.getByRole("button", { name: "Login with Verification Code" }).click();
  await page.locator('input[name="code"]').fill("123456");
  await page.getByRole("button", { name: "Verify Code" }).click();
  await expect(page).toHaveURL(/\/home$/);
});

test("password recovery remains accessible and accepts a new password after verification", async ({ page, request }) => {
  const { email } = await visitor(request);
  await page.route("**/graphql", (route) => {
    const query = route.request().postDataJSON()?.query || "";
    for (const name of ["forgotPassword", "verifyResetCode", "resetPassword"]) {
      if (new RegExp(`\\b${name}\\s*\\(`).test(query)) return route.fulfill({ json: { data: { [name]: true } } });
    }
    return route.continue();
  });
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('button[type="submit"]').click();
  await page.getByRole("button", { name: "Forgot Key?" }).click();
  await page.locator('input[name="code"]').fill("123456");
  await page.getByRole("button", { name: "Verify Code" }).click();
  await page.locator('input[name="newPassword"]').fill("newpass88");
  await page.locator('input[name="confirmPassword"]').fill("newpass88");
  await page.getByRole("button", { name: "Save & Authenticate" }).click();
  await expect(page.getByRole("button", { name: "Initialize Session" })).toBeVisible();
});

test("calendar booking, demo payment and cancellation work together", async ({ page, request }) => {
  const { token } = await visitor(request);
  await signIn(page, token);
  const { getAllEscapeRooms: rooms } = await graphql(request, "{ getAllEscapeRooms { id duration } }");
  await page.goto(`/booking/${rooms.find((room) => room.duration === 60).id}`);
  await page.getByRole("button", { name: /Next/ }).click();
  await expect(page.locator(".bc-time-slot:not(.unavailable)").first()).toBeEnabled();
  await page.locator(".bc-time-slot:not(.unavailable)").first().click();
  const saved = page.waitForResponse((response) => response.url().endsWith("/graphql") && response.request().postData()?.includes("createBooking"));
  await page.locator('#booking-form button[type="submit"]').click();
  const result = await (await saved).json();
  expect(result.errors).toBeUndefined();
  expect(result.data.createBooking.id).toBeTruthy();
  await page.goto("/mybookings");
  await page.getByRole("button", { name: "Pay Now", exact: true }).first().click();
  await page.getByRole("button", { name: "Simulate payment" }).click();
  await expect(page.getByRole("heading", { name: "Payment Complete" })).toBeVisible();
  await page.getByRole("button", { name: "Close modal" }).click();
  await expect(page.getByRole("button", { name: "Details", exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).first().click();
  await page.getByRole("button", { name: "Yes, Cancel", exact: true }).click();
  await expect(page.getByRole("heading", { name: "No Active Bookings" })).toBeVisible();
  const { getAllUserBookings } = await graphql(request, "{ getAllUserBookings { id } }", {}, token);
  expect(getAllUserBookings).toEqual([]);
});

test("admin dashboard can load database-backed pages", async ({ page, request }) => {
  const { login } = await graphql(request, "mutation { login(email: \"browser-admin@example.test\", password: \"browser-admin-password\") { token } }");
  await signIn(page, login.token);
  const failures = [];
  page.on("pageerror", (error) => failures.push(error.message));
  for (const route of ["/admin", "/admin/rooms", "/admin/bookings", "/admin/users", "/admin/reviews"]) {
    await page.goto(route);
    await expect(page).toHaveURL(route);
    await expect(page.locator("main h1").first()).toBeVisible();
    await expect(page.getByText("Admin access required.", { exact: true })).toHaveCount(0);
  }
  expect(failures).toEqual([]);
});
