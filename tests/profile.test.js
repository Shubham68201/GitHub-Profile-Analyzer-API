import { jest } from '@jest/globals';

// Mock the GitHub service and profile model before importing the app,
// so tests don't require a real DB connection or network access.
jest.unstable_mockModule('../services/githubService.js', () => ({
  analyzeGithubProfile: jest.fn(async (username) => ({
    username,
    name: 'Test User',
    bio: 'Just a test',
    avatarUrl: 'https://example.com/avatar.png',
    profileUrl: `https://github.com/${username}`,
    company: null,
    location: 'Earth',
    blog: null,
    email: null,
    publicRepos: 10,
    publicGists: 2,
    followers: 100,
    following: 5,
    totalStars: 250,
    totalForks: 30,
    mostUsedLanguage: 'JavaScript',
    topLanguages: [{ language: 'JavaScript', count: 6 }],
    accountCreatedAt: '2015-01-01T00:00:00Z',
    accountAgeDays: 4000
  })),
  GithubApiError: class GithubApiError extends Error {}
}));

jest.unstable_mockModule('../services/profileModel.js', () => ({
  upsertProfile: jest.fn(async () => {}),
  findAllProfiles: jest.fn(async () => ({
    rows: [{ username: 'testuser', followers: 100 }],
    total: 1
  })),
  findProfileByUsername: jest.fn(async (username) =>
    username === 'testuser' ? { username: 'testuser', followers: 100 } : null
  ),
  deleteProfileByUsername: jest.fn(async (username) => username === 'testuser')
}));

jest.unstable_mockModule('../config/db.js', () => ({
  default: { execute: jest.fn(), query: jest.fn() },
  testConnection: jest.fn(async () => {})
}));

const { default: app } = await import('../server.js');
const { default: request } = await import('supertest');

describe('GitHub Profile Analyzer API', () => {
  it('GET / returns health check info', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/profiles/:username/analyze analyzes and stores a profile', async () => {
    const res = await request(app).post('/api/profiles/testuser/analyze');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.username).toBe('testuser');
  });

  it('rejects invalid usernames', async () => {
    const res = await request(app).post('/api/profiles/inv@lid!/analyze');
    expect(res.status).toBe(400);
  });

  it('GET /api/profiles returns stored profiles', async () => {
    const res = await request(app).get('/api/profiles');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });

  it('GET /api/profiles/:username returns a single profile', async () => {
    const res = await request(app).get('/api/profiles/testuser');
    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe('testuser');
  });

  it('GET /api/profiles/:username returns 404 for unknown user', async () => {
    const res = await request(app).get('/api/profiles/unknownuser');
    expect(res.status).toBe(404);
  });

  it('DELETE /api/profiles/:username removes a profile', async () => {
    const res = await request(app).delete('/api/profiles/testuser');
    expect(res.status).toBe(200);
  });
});
