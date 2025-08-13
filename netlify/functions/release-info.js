// netlify/functions/release-info.js
// ESM handler that reports build + deploy metadata. Safe to call anytime.

export async function handler() {
  const payload = {
    runtime: {
      node: process.version,
      now: new Date().toISOString(),
    },
    netlify: {
      commit: process.env.COMMIT_REF || null,          // git SHA
      branch: process.env.BRANCH || null,
      deployId: process.env.DEPLOY_ID || null,
      context: process.env.CONTEXT || null,            // production | deploy-preview | branch-deploy
      url: process.env.DEPLOY_URL || process.env.DEPLOY_PRIME_URL || null,
      siteName: process.env.SITE_NAME || null,
      region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || null,
    },
    build: {
      // We’ll set these in the next step via env-injection during build
      buildTime: process.env.BUILD_TIME || null,
      appVersion: process.env.APP_VERSION || null,
    },
  };

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
}