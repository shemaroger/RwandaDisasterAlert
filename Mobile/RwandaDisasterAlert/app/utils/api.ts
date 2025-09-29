const BASE_URL = 'http://yourapiurl.com/api'; // Replace with your API base URL

export const fetchRecentSpam = async () => {
  const response = await fetch(`${BASE_URL}/recent-spam`);
  return response.json();
};

export const loginUser = async (email: string, password: string) => {
  const response = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
};

export const signupUser = async (email: string, password: string) => {
  const response = await fetch(`${BASE_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
};

export const fetchSettings = async () => {
  const response = await fetch(`${BASE_URL}/settings`);
  return response.json();
};

export const updateSettings = async (settings: any) => {
  const response = await fetch(`${BASE_URL}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  return response.json();
};

export const fetchAnalyticsData = async () => {
  const response = await fetch(`${BASE_URL}/analytics`);
  return response.json();
};

export const reportSpam = async (messageId: string, reason: string) => {
  const response = await fetch(`${BASE_URL}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messageId, reason }),
  });
  return response.json();
};

export const fetchMessageDetail = async (messageId: string) => {
  const response = await fetch(`${BASE_URL}/message/${messageId}`);
  return response.json();
};

export const fetchWhitelist = async () => {
  const response = await fetch(`${BASE_URL}/whitelist`);
  return response.json();
};

export const updateWhitelist = async (whitelist: string[]) => {
  const response = await fetch(`${BASE_URL}/whitelist`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(whitelist),
  });
  return response.json();
};

export const fetchBlacklist = async () => {
  const response = await fetch(`${BASE_URL}/blacklist`);
  return response.json();
};

export const updateBlacklist = async (blacklist: string[]) => {
  const response = await fetch(`${BASE_URL}/blacklist`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(blacklist),
  });
  return response.json();
};