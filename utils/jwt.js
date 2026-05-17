import crypto from "crypto";

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

const base64UrlEncode = (value) => {
  const input = typeof value === "string" ? value : JSON.stringify(value);

  return Buffer.from(input)
    .toString("base64url");
};

const base64UrlDecode = (value) => {
  return Buffer.from(value, "base64url").toString("utf8");
};

const getJwtSecret = () => {
  return process.env.JWT_SECRET || process.env.SESSION_SECRET || "secret";
};

const sign = (data) => {
  return crypto
    .createHmac("sha256", getJwtSecret())
    .update(data)
    .digest("base64url");
};

export const createToken = (payload) => {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "HS256",
    typ: "JWT",
  };
  const body = {
    ...payload,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
  };
  const unsignedToken = `${base64UrlEncode(header)}.${base64UrlEncode(body)}`;

  return `${unsignedToken}.${sign(unsignedToken)}`;
};

export const verifyToken = (token) => {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const unsignedToken = `${header}.${payload}`;
  const expectedSignature = sign(unsignedToken);
  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedSignatureBuffer.length ||
    !crypto.timingSafeEqual(
      signatureBuffer,
      expectedSignatureBuffer,
    )
  ) {
    return null;
  }

  const decodedPayload = JSON.parse(base64UrlDecode(payload));

  if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return decodedPayload;
};
