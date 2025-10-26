const ACCESS_KEY = "datacake.access_token";
const REFRESH_KEY = "datacake.refresh_token";

const hasLocalStorage = () => {
  try {
    return typeof globalThis !== "undefined" && typeof globalThis.localStorage !== "undefined";
  } catch (_error) {
    return false;
  }
};

const fallbackStore = {};

const readStorage = (key) => {
  if (hasLocalStorage()) {
    try {
      return globalThis.localStorage.getItem(key);
    } catch (error) {
      console.warn("localStorage getItem falhou, usando memoria.", error);
    }
  }
  return Object.prototype.hasOwnProperty.call(fallbackStore, key) ? fallbackStore[key] : null;
};

const writeStorage = (key, value) => {
  if (hasLocalStorage()) {
    try {
      if (value === null || typeof value === "undefined") {
        globalThis.localStorage.removeItem(key);
      } else {
        globalThis.localStorage.setItem(key, value);
      }
      return;
    } catch (error) {
      console.warn("localStorage setItem falhou, usando memoria.", error);
    }
  }
  if (value === null || typeof value === "undefined") {
    delete fallbackStore[key];
  } else {
    fallbackStore[key] = value;
  }
};

export const getStoredTokens = () => {
  const accessToken = readStorage(ACCESS_KEY);
  const refreshToken = readStorage(REFRESH_KEY);
  if (!accessToken && !refreshToken) {
    return null;
  }
  return { accessToken, refreshToken };
};

export const persistTokens = ({ accessToken, refreshToken }) => {
  writeStorage(ACCESS_KEY, accessToken || null);
  writeStorage(REFRESH_KEY, refreshToken || null);
};

export const clearStoredTokens = () => {
  writeStorage(ACCESS_KEY, null);
  writeStorage(REFRESH_KEY, null);
};
