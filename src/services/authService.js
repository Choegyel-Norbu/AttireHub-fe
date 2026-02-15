import { api } from './api';

const AUTH_BASE = '/auth';

/**
 * Extracts a user-facing error message from an API error response.
 * @param {import('axios').AxiosError} error
 * @returns {string}
 */
function getErrorMessage(error) {
  const data = error.response?.data;
  if (data && typeof data === 'object') {
    if (typeof data.message === 'string') return data.message;
    if (typeof data.error === 'string') return data.error;
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      const first = data.errors[0];
      return typeof first === 'string' ? first : (first?.message || first?.defaultMessage) ?? 'Validation failed';
    }
  }
  if (error.response?.status === 409) return 'An account with this email already exists.';
  if (error.response?.status === 401) return 'Invalid email or password.';
  if (error.response?.status === 403) return 'Please verify your email before signing in. Check your mail inbox for the verification link.';
  if (error.response?.status === 400) return 'Invalid request. Please check your details.';
  return error.message || 'Something went wrong. Please try again.';
}

/**
 * Register a new user.
 * @param {{ email: string, password: string, firstName: string, lastName: string, phoneNumber?: string }} data
 * @returns {Promise<{ accessToken: string, refreshToken: string, tokenType: string, expiresIn: number }>}
 */
export async function register(data) {
  const body = {
    email: data.email,
    password: data.password,
    firstName: data.firstName,
    lastName: data.lastName,
  };
  if (data.phoneNumber != null && data.phoneNumber !== '') {
    body.phoneNumber = data.phoneNumber;
  }
  try {
    // Longer timeout: backend creates user and sends verification email
    const response = await api.post(`${AUTH_BASE}/register`, body, { timeout: 30000 });
    const inner = response?.data ?? response;
    if (inner?.accessToken) {
      return {
        accessToken: inner.accessToken,
        refreshToken: inner.refreshToken ?? '',
        tokenType: inner.tokenType ?? 'Bearer',
        expiresIn: inner.expiresIn ?? 0,
        user: inner.user ?? null,
      };
    }
    throw new Error('Invalid registration response');
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
}

/**
 * Sign in and get tokens.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ accessToken: string, refreshToken: string, tokenType: string, expiresIn: number }>}
 */
export async function login(email, password) {
  try {
    const response = await api.post(`${AUTH_BASE}/login`, { email, password });
    const inner = response?.data ?? response;
    if (inner?.accessToken) {
      return {
        accessToken: inner.accessToken,
        refreshToken: inner.refreshToken ?? '',
        tokenType: inner.tokenType ?? 'Bearer',
        expiresIn: inner.expiresIn ?? 0,
        user: inner.user ?? null,
      };
    }
    throw new Error('Invalid login response');
  } catch (err) {
    const message = getErrorMessage(err);
    const error = new Error(message);
    if (err.response?.status === 403) {
      error.statusCode = 403;
    }
    throw error;
  }
}

/**
 * Refresh access token using refresh token.
 * @param {string} refreshToken
 * @returns {Promise<{ accessToken: string, refreshToken: string, tokenType: string, expiresIn: number }>}
 */
/**
 * Verify email address using the token from the verification email.
 * No auth required (public endpoint).
 * @param {string} token - Token from the verification email link
 * @returns {Promise<void>}
 * @throws {Error} When token is invalid, expired, or already used (400)
 */
export async function verifyEmail(token) {
  if (!token || typeof token !== 'string' || !token.trim()) {
    throw new Error('Verification link is invalid. Please use the link from your email.');
  }
  try {
    await api.post(`${AUTH_BASE}/verify-email`, { token: token.trim() });
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
}

/**
 * Refresh access token using refresh token.
 * @param {string} refreshToken
 * @returns {Promise<{ accessToken: string, refreshToken: string, tokenType: string, expiresIn: number }>}
 */
export async function refreshToken(refreshToken) {
  try {
    const response = await api.post(`${AUTH_BASE}/refresh-token`, { refreshToken });
    const inner = response?.data ?? response;
    if (inner?.accessToken) {
      return {
        accessToken: inner.accessToken,
        refreshToken: inner.refreshToken ?? refreshToken,
        tokenType: inner.tokenType ?? 'Bearer',
        expiresIn: inner.expiresIn ?? 0,
        user: inner.user ?? null,
      };
    }
    throw new Error('Invalid refresh response');
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
}
