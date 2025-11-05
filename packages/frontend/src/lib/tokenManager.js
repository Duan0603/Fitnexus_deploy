// src/lib/tokenManager.js

let currentToken = null;
let currentRefreshToken = null;
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const REMEMBER_KEY = "rememberMe";


export const setTokens = (accessToken, refreshToken = null, rememberMe = false) => {
  // Clear previous tokens from all storages and memory
  clearAllTokens();

  // Persist according to rememberMe
  if (rememberMe) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REMEMBER_KEY, 'true');
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  } else {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    sessionStorage.setItem(REMEMBER_KEY, 'false');
    if (refreshToken) {
      sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  // Update in-memory cache last to reflect current state
  currentToken = accessToken;
  currentRefreshToken = refreshToken || null;
};

export const getToken = () => {
  // Priority : RAM -> sessionStorage -> localStorage
  if (currentToken) return currentToken;

  // Check sessionStorage đầu tiên
  const sessionToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
  if(sessionToken) {
    currentToken = sessionToken;
    const sessionRefresh = sessionStorage.getItem(REFRESH_TOKEN_KEY);
    if(sessionRefresh) {
      currentRefreshToken = sessionRefresh;
    }
    return sessionToken;
  }

  // Fallback to localstorage (remember me)
  const localToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  if(localToken) {
    currentToken = localToken;
    const localRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
    if(localRefresh) {
      currentRefreshToken = localRefresh;
    }
    return localToken;
  }
  return null;
};

export const getRefreshToken = () => {
  if(currentRefreshToken) return currentRefreshToken;

  const sessionRefresh = sessionStorage.getItem(REFRESH_TOKEN_KEY)
  if(sessionRefresh) {
    currentRefreshToken = sessionRefresh;
    return sessionRefresh;
  }

  const localRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
  if(localRefresh) {
    currentRefreshToken = localRefresh;
    return localRefresh;
  }
  return null;
}

export const isRemembered = () => {
  return localStorage.getItem(REMEMBER_KEY) === 'true' || !!localStorage.getItem(ACCESS_TOKEN_KEY);
}

export const clearAllTokens = () => {
  // Clear memory
  currentToken = null;
  currentRefreshToken = null;

  // Clear all storage
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(REMEMBER_KEY);

  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(REMEMBER_KEY);
};

export const clearToken = clearAllTokens;

export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Date.now() / 1000;
    
    // Add 5-minute buffer for refresh
    return payload.exp < (now + 300);
  } catch (error) {
    console.error('Error parsing token:', error);
    return true;
  }
};

// Get token info
export const getTokenInfo = () => {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      userId: payload.sub,
      role: payload.role,
      rememberMe: payload.rememberMe,
      expiresAt: new Date(payload.exp * 1000),
      isExpired: isTokenExpired(token)
    };
  } catch (error) {
    console.error('Error parsing token info:', error);
    return null;
  }
};
