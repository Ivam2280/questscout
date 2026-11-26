const express = require("express");
const http = require("node:http");
const path = require("node:path");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@as-integrations/express5");
const { ApolloServerPluginDrainHttpServer } = require("@apollo/server/plugin/drainHttpServer");
const { rateLimit } = require("express-rate-limit");
const { GraphQLError } = require("graphql");
const { env, validateServerEnv } = require("./config/env");
const { publicFirebaseConfig } = require("./config/firebase");
const { authMiddleware } = require("./utils/auth");
const { signInWithGoogle } = require("./services/google");
const { emailEnabled } = require("./utils/sendEmail");
const { expireBookings } = require("./services/bookings");
const { typeDefs, resolvers } = require("./schemas");

function limitDepth(context) {
  return { Document(document) {
    const fragments = new Map(document.definitions.filter((node) => node.kind === "FragmentDefinition").map((node) => [node.name.value, node]));
    let fields = 0;
    let reported = false;
    const inspect = (selectionSet, depth, visited = new Set()) => {
      if (!selectionSet || reported) return;
      for (const selection of selectionSet.selections) {
        if (selection.kind === "Field") {
          fields += 1;
          if (depth > 12 || fields > 1000) {
            context.reportError(new GraphQLError("Query is too complex.", { nodes: selection }));
            reported = true;
            return;
          }
          inspect(selection.selectionSet, depth + 1, visited);
        } else if (selection.kind === "InlineFragment") inspect(selection.selectionSet, depth, visited);
        else if (!visited.has(selection.name.value)) {
          const fragment = fragments.get(selection.name.value);
          inspect(fragment?.selectionSet, depth, new Set([...visited, selection.name.value]));
        }
      }
    };
    for (const node of document.definitions) if (node.kind === "OperationDefinition") inspect(node.selectionSet, 1);
  } };
}

async function createApp() {
  validateServerEnv();
  const app = express();
  app.disable("x-powered-by");
  if (env.nodeEnv === "production") app.set("trust proxy", 1);
  const httpServer = http.createServer(app);
  app.get("/health", (_, res) => res.json({ status: "ok" }));
  app.get("/api/config", (_, res) => res.set("Cache-Control", "no-store").json({
    firebaseConfig: publicFirebaseConfig(),
    emailEnabled: emailEnabled(),
    demoPayments: env.demoPayments,
    paypalClientId: env.paypalClientId && env.paypalClientSecret ? env.paypalClientId : "",
    paypalRate: env.paypalRate,
    timezone: env.timezone,
  }));
  app.use(express.json({ limit: "3mb" }));
  const authLimiter = rateLimit({ windowMs: 60000, limit: env.authRateLimit, standardHeaders: "draft-8", legacyHeaders: false, message: { errors: [{ message: "Too many attempts. Please wait a minute." }] } });
  const apiLimiter = rateLimit({ windowMs: 60000, limit: env.apiRateLimit, standardHeaders: "draft-8", legacyHeaders: false });
  const sensitiveFields = /\b(login|createUser|sendAuthCode|verifyAuthCode|loginWithCode|forgotPassword|verifyResetCode|resetPassword|requestEmailUpdate|confirmEmailUpdate|updatePassword|addPassword)\b/;
  app.post("/auth/google", authLimiter, async (req, res) => {
    if (!publicFirebaseConfig()) return res.status(503).json({ error: "Google sign-in is not configured. Use email and password." });
    try {
      return res.json(await signInWithGoogle(req.body.idToken));
    } catch (error) {
      return res.status(error.extensions?.code === "FORBIDDEN" ? 403 : 401).json({ error: error.extensions ? error.message : "Google authentication failed." });
    }
  });
  const apollo = new ApolloServer({
    typeDefs, resolvers,
    introspection: env.nodeEnv !== "production",
    includeStacktraceInErrorResponses: false,
    validationRules: [limitDepth],
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    formatError(formatted, error) {
      if (formatted.extensions?.code === "INTERNAL_SERVER_ERROR") {
        const original = error.originalError;
        if (original?.name?.startsWith("Sequelize")) return { message: "The change could not be saved. Check the values and try again.", extensions: { code: "BAD_USER_INPUT" } };
        console.error("GraphQL request failed:", original?.name || "Error");
        return { message: "Something went wrong. Please try again.", extensions: { code: "INTERNAL_SERVER_ERROR" } };
      }
      return formatted;
    },
  });
  await apollo.start();
  app.use("/graphql", apiLimiter, (req, res, next) => sensitiveFields.test(req.body?.query || req.query.query || "") ? authLimiter(req, res, next) : next(), expressMiddleware(apollo, {
    context: async ({ req }) => {
      await expireBookings();
      return authMiddleware({ req });
    },
  }));
  if (env.nodeEnv === "production") {
    const dist = path.resolve(__dirname, "../client/dist");
    app.use("/assets", express.static(path.join(dist, "assets"), { immutable: true, maxAge: "1y" }));
    app.use(express.static(dist, { maxAge: "1h", setHeaders(res, filename) { if (filename.endsWith("index.html")) res.set("Cache-Control", "no-cache"); } }));
    app.get("/{*route}", (req, res, next) => {
      if (/^\/(api|auth|graphql|health|assets|images)(\/|$)/.test(req.path) || path.extname(req.path) || !req.accepts("html")) return next();
      res.set("Cache-Control", "no-cache").sendFile(path.join(dist, "index.html"));
    });
  }
  app.use((_, res) => res.status(404).json({ error: "Not found." }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    res.status(error.status === 413 ? 413 : 400).json({ error: error.status === 413 ? "Request is too large." : "Invalid request." });
  });
  return { app, httpServer, apollo };
}

module.exports = { createApp };
