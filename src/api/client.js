import axios from "axios";
import Constants from "expo-constants";
import { NativeModules, Platform } from "react-native";
import { clearStoredTokens, getStoredTokens, persistTokens } from "./tokenStorage";

const API_PORT = Number(process.env.EXPO_PUBLIC_API_PORT || "8000");
const API_ROOT_PATH = "/api";
const HEALTH_PATH = `${API_ROOT_PATH}/health/`;
const PROBE_TIMEOUT_MS = 2000;

const stripTrailingSlash = (value) => (value.endsWith("/") ? value.slice(0, -1) : value);

const sanitizeHost = (host) => {
  if (!host) {
    return null;
  }
  const clean = host.trim();
  if (!clean) {
    return null;
  }
  const lowered = clean.toLowerCase();
  if (lowered === "localhost" || lowered === "127.0.0.1") {
    if (Platform.OS === "android") {
      return Constants.isDevice ? null : "10.0.2.2";
    }
    return Constants.isDevice ? null : "localhost";
  }
  return clean;
};

const isExpoTunnelHost = (host) => {
  if (!host) {
    return false;
  }
  const normalized = host.toLowerCase();
  return (
    normalized === "exp.host" ||
    normalized.endsWith(".exp.host") ||
    normalized === "exp.direct" ||
    normalized.endsWith(".exp.direct") ||
    normalized === "expo.dev" ||
    normalized.endsWith(".expo.dev")
  );
};

const stripScheme = (value) => value.replace(/^[a-z][a-z0-9.+-]*:\/\//i, "");

const parseHostCandidate = (candidate) => {
  if (!candidate) {
    return null;
  }
  const trimmed = `${candidate}`.trim();
  if (!trimmed) {
    return null;
  }
  const withoutScheme = stripScheme(trimmed);
  const normalized = withoutScheme.startsWith("//")
    ? `http:${withoutScheme}`
    : `http://${withoutScheme}`;
  const GlobalURL = typeof globalThis !== "undefined" ? globalThis.URL : null;
  if (typeof GlobalURL === "function") {
    try {
      const parsed = new GlobalURL(normalized);
      return sanitizeHost(parsed.hostname);
    } catch (_err) {
      // ignore parse failure and fall through to regex fallback
    }
  }
  const fallbackMatch = withoutScheme.match(/^([^/?#:]+)/);
  return sanitizeHost(fallbackMatch?.[1]);
};

const resolveExpoHost = () => {
  const candidates = [
    Constants?.expoGoConfig?.debuggerHost,
    Constants?.expoGoConfig?.hostUri,
    Constants?.expoConfig?.hostUri,
    Constants?.manifest?.debuggerHost,
    Constants?.manifest?.hostUri,
    Constants?.manifest2?.extra?.expoGo?.developer?.host
  ];
  for (const candidate of candidates) {
    const host = parseHostCandidate(candidate);
    if (host && !isExpoTunnelHost(host)) {
      return host;
    }
  }
  return null;
};

const resolveMetroHost = () => {
  const host = parseHostCandidate(NativeModules?.SourceCode?.scriptURL);
  return isExpoTunnelHost(host) ? null : host;
};

const buildBaseUrlForHost = (host) => `http://${host}:${API_PORT}${API_ROOT_PATH}`;

const resolveDeviceBaseUrl = () => {
  if (Platform.OS === "web") {
    return null;
  }
  const host = resolveMetroHost() ?? resolveExpoHost();
  if (!host) {
    return null;
  }
  return buildBaseUrlForHost(host);
};

const collectHostCandidates = () => {
  const raw = [
    resolveMetroHost(),
    resolveExpoHost(),
    sanitizeHost(Constants?.manifest?.debuggerHost?.split(":")?.[0]),
    sanitizeHost(Constants?.expoGoConfig?.debuggerHost?.split(":")?.[0])
  ];
  return Array.from(new Set(raw.filter(Boolean)));
};

const envBaseUrl = (process.env.EXPO_PUBLIC_API_URL || "").trim();
const autoDetectedBaseUrl = resolveDeviceBaseUrl();
const resolvedBaseUrl = envBaseUrl || autoDetectedBaseUrl || `http://localhost:${API_PORT}${API_ROOT_PATH}`;

let baseMeta = {
  envBaseUrl: envBaseUrl || null,
  autoDetectedBaseUrl: autoDetectedBaseUrl || null,
  resolvedBaseUrl: stripTrailingSlash(resolvedBaseUrl),
  source: envBaseUrl ? "env" : autoDetectedBaseUrl ? "auto" : "fallback"
};

const updateBaseMeta = (patch) => {
  baseMeta = { ...baseMeta, ...patch };
};

if (!envBaseUrl && __DEV__ && Platform.OS !== "web") {
  if (autoDetectedBaseUrl) {
    console.info(
      `API base URL inferida automaticamente em ${baseMeta.resolvedBaseUrl}. Defina EXPO_PUBLIC_API_URL para substituir.`
    );
  } else {
    console.warn(
      "Não consegui detectar o IP do backend automaticamente. Defina EXPO_PUBLIC_API_URL ou inicie o Metro em modo LAN."
    );
  }
}

const api = axios.create({
  baseURL: `${baseMeta.resolvedBaseUrl}/`,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json"
  }
});

const applyAuthorizationHeader = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

let authTokens = {
  accessToken: null,
  refreshToken: null
};

const hydrateStoredTokens = () => {
  const stored = getStoredTokens();
  if (!stored) {
    authTokens = { accessToken: null, refreshToken: null };
    applyAuthorizationHeader(null);
    return;
  }
  authTokens = {
    accessToken: stored.accessToken || null,
    refreshToken: stored.refreshToken || null
  };
  applyAuthorizationHeader(authTokens.accessToken);
};

export const getAuthTokens = () => ({ ...authTokens });

export const setAuthTokens = ({ accessToken, refreshToken }) => {
  authTokens = {
    accessToken:
      typeof accessToken === "undefined" ? authTokens.accessToken : accessToken || null,
    refreshToken:
      typeof refreshToken === "undefined" ? authTokens.refreshToken : refreshToken || null
  };
  applyAuthorizationHeader(authTokens.accessToken);
  if (authTokens.accessToken || authTokens.refreshToken) {
    persistTokens(authTokens);
  } else {
    clearStoredTokens();
  }
};

export const clearAuthTokens = () => {
  authTokens = { accessToken: null, refreshToken: null };
  applyAuthorizationHeader(null);
  clearStoredTokens();
};

hydrateStoredTokens();

api.interceptors.request.use((config) => {
  if (authTokens.accessToken) {
    if (config.headers?.set) {
      config.headers.set("Authorization", `Bearer ${authTokens.accessToken}`);
    } else {
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${authTokens.accessToken}`
      };
    }
  }
  return config;
});

const setApiBaseUrl = (nextBaseUrl, source = "manual") => {
  const normalized = stripTrailingSlash(nextBaseUrl);
  api.defaults.baseURL = `${normalized}/`;
  updateBaseMeta({
    resolvedBaseUrl: normalized,
    autoDetectedBaseUrl: source === "auto-probe" ? normalized : baseMeta.autoDetectedBaseUrl,
    source
  });
};

export const getApiBaseMeta = () => ({ ...baseMeta });

const probeState = {
  promise: null
};

const AbortControllerCtor =
  typeof globalThis !== "undefined" && typeof globalThis.AbortController === "function"
    ? globalThis.AbortController
    : null;
const scheduleTimeout =
  typeof globalThis !== "undefined" && typeof globalThis.setTimeout === "function"
    ? globalThis.setTimeout.bind(globalThis)
    : null;
const cancelTimeout =
  typeof globalThis !== "undefined" && typeof globalThis.clearTimeout === "function"
    ? globalThis.clearTimeout.bind(globalThis)
    : null;

const probeHost = async (host) => {
  const healthUrl = `http://${host}:${API_PORT}${HEALTH_PATH}`;
  const controller = AbortControllerCtor ? new AbortControllerCtor() : null;
  const timeoutId =
    controller && scheduleTimeout ? scheduleTimeout(() => controller.abort(), PROBE_TIMEOUT_MS) : null;
  try {
    const response = await fetch(healthUrl, {
      method: "GET",
      signal: controller?.signal
    });
    if (timeoutId && cancelTimeout) {
      cancelTimeout(timeoutId);
    }
    if (response.ok) {
      return buildBaseUrlForHost(host);
    }
  } catch (_err) {
    if (timeoutId && cancelTimeout) {
      cancelTimeout(timeoutId);
    }
  }
  return null;
};

const probeForReachableBaseUrl = async () => {
  const hosts = collectHostCandidates();
  for (const host of hosts) {
    const reachable = await probeHost(host);
    if (reachable) {
      return reachable;
    }
  }
  return null;
};

export const ensureApiBaseUrl = async () => {
  if (baseMeta.source !== "fallback") {
    return getApiBaseMeta();
  }
  if (probeState.promise) {
    return probeState.promise;
  }
  probeState.promise = (async () => {
    try {
      const reachableBase = await probeForReachableBaseUrl();
      if (reachableBase) {
        setApiBaseUrl(reachableBase, "auto-probe");
      }
    } catch (error) {
      console.warn("Auto-probe da API falhou", error);
    } finally {
      probeState.promise = null;
    }
    return getApiBaseMeta();
  })();
  return probeState.promise;
};

let isRefreshing = false;
let failedQueue = [];
const unauthorizedListeners = new Set();

const onRefreshed = () => {
  failedQueue.forEach((entry) => entry.resolve());
  failedQueue = [];
};

const onRefreshFailed = (error) => {
  failedQueue.forEach((entry) => entry.reject(error));
  failedQueue = [];
};

const notifyUnauthorized = () => {
  clearAuthTokens();
  unauthorizedListeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.warn("Unauthorized listener error", err);
    }
  });
};

export const subscribeUnauthorized = (listener) => {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;
    const normalizePath = (url) => {
      if (!url) {
        return "";
      }
      try {
        const ParsedURL = typeof globalThis.URL === "function" ? globalThis.URL : null;
        if (ParsedURL) {
          const parsed = new ParsedURL(url, api.defaults.baseURL);
          return parsed.pathname;
        }
        throw new Error("URL constructor unavailable");
      } catch (_err) {
        const cleaned = `${url}`.replace(/^\//, "");
        return `/${cleaned}`;
      }
    };
    const requestPath = normalizePath(originalRequest.url);
    const isAuthCriticalPath = (path) => [
      "/api/auth/token/refresh/",
      "/api/auth/logout/",
      "/api/auth/token/"
    ].some((endpoint) => path.endsWith(endpoint));

    if (status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      notifyUnauthorized();
      return Promise.reject(error);
    }

    if (isAuthCriticalPath(requestPath)) {
      notifyUnauthorized();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: () => resolve(api(originalRequest)),
          reject
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const currentRefresh = authTokens.refreshToken;
      if (!currentRefresh) {
        throw new Error("Refresh token ausente.");
      }
      const { data } = await api.post("auth/token/refresh/", { refresh: currentRefresh });
      if (!data?.access) {
        throw new Error("Resposta sem access token.");
      }
      setAuthTokens({
        accessToken: data.access,
        refreshToken: data.refresh ?? currentRefresh
      });
      onRefreshed();
      return api(originalRequest);
    } catch (refreshError) {
      onRefreshFailed(refreshError);
      notifyUnauthorized();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
