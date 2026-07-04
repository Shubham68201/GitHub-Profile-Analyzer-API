import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GITHUB_API_URL = process.env.GITHUB_API_URL || 'https://api.github.com';

const githubClient = axios.create({
  baseURL: GITHUB_API_URL,
  headers: {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(process.env.GITHUB_TOKEN
      ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
      : {})
  },
  timeout: 10000
});

class GithubApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'GithubApiError';
    this.statusCode = statusCode;
  }
}

/**
 * Fetch the base public profile for a username.
 */
const fetchUser = async (username) => {
  try {
    const { data } = await githubClient.get(`/users/${username}`);
    return data;
  } catch (err) {
    if (err.response?.status === 404) {
      throw new GithubApiError(`GitHub user "${username}" not found`, 404);
    }
    if (err.response?.status === 403) {
      throw new GithubApiError(
        'GitHub API rate limit exceeded. Try again later or configure GITHUB_TOKEN.',
        429
      );
    }
    throw new GithubApiError('Failed to fetch data from GitHub API', 502);
  }
};

/**
 * Fetch up to `maxPages` pages of public repos (100 per page) for a user,
 * used to compute derived insights like total stars and language breakdown.
 */
const fetchAllRepos = async (username, maxPages = 3) => {
  const perPage = 100;
  let page = 1;
  let repos = [];

  while (page <= maxPages) {
    const { data } = await githubClient.get(`/users/${username}/repos`, {
      params: { per_page: perPage, page, sort: 'updated' }
    });
    repos = repos.concat(data);
    if (data.length < perPage) break;
    page += 1;
  }

  return repos;
};

/**
 * Derive useful insights from the raw repo list:
 * total stars, total forks, most used language, and top 5 languages by repo count.
 */
const deriveRepoInsights = (repos) => {
  let totalStars = 0;
  let totalForks = 0;
  const languageCounts = {};

  for (const repo of repos) {
    totalStars += repo.stargazers_count || 0;
    totalForks += repo.forks_count || 0;
    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
    }
  }

  const sortedLanguages = Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([language, count]) => ({ language, count }));

  return {
    totalStars,
    totalForks,
    mostUsedLanguage: sortedLanguages[0]?.language || null,
    topLanguages: sortedLanguages.slice(0, 5)
  };
};

/**
 * Full analysis: fetch profile + repos, compute insights, return a flat object
 * ready to be persisted.
 */
export const analyzeGithubProfile = async (username) => {
  const user = await fetchUser(username);
  const repos = await fetchAllRepos(username);
  const { totalStars, totalForks, mostUsedLanguage, topLanguages } =
    deriveRepoInsights(repos);

  const createdAt = new Date(user.created_at);
  const accountAgeDays = Math.floor(
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    username: user.login,
    name: user.name,
    bio: user.bio,
    avatarUrl: user.avatar_url,
    profileUrl: user.html_url,
    company: user.company,
    location: user.location,
    blog: user.blog,
    email: user.email,
    publicRepos: user.public_repos,
    publicGists: user.public_gists,
    followers: user.followers,
    following: user.following,
    totalStars,
    totalForks,
    mostUsedLanguage,
    topLanguages,
    accountCreatedAt: user.created_at,
    accountAgeDays
  };
};

export { GithubApiError };
