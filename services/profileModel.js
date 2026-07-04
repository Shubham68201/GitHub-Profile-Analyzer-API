import pool from "../config/db.js";

/**
 * Insert a newly analyzed profile, or update it if it already exists
 * (re-analyzing refreshes the stored insights).
 */
export const upsertProfile = async (profile) => {
  const sql = `
    INSERT INTO profiles (
      username, name, bio, avatar_url, profile_url, company, location, blog, email,
      public_repos, public_gists, followers, following, total_stars, total_forks,
      most_used_language, top_languages, account_created_at, account_age_days, last_analyzed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      bio = VALUES(bio),
      avatar_url = VALUES(avatar_url),
      profile_url = VALUES(profile_url),
      company = VALUES(company),
      location = VALUES(location),
      blog = VALUES(blog),
      email = VALUES(email),
      public_repos = VALUES(public_repos),
      public_gists = VALUES(public_gists),
      followers = VALUES(followers),
      following = VALUES(following),
      total_stars = VALUES(total_stars),
      total_forks = VALUES(total_forks),
      most_used_language = VALUES(most_used_language),
      top_languages = VALUES(top_languages),
      account_created_at = VALUES(account_created_at),
      account_age_days = VALUES(account_age_days),
      last_analyzed_at = NOW()
  `;

  const params = [
    profile.username,
    profile.name,
    profile.bio,
    profile.avatarUrl,
    profile.profileUrl,
    profile.company,
    profile.location,
    profile.blog,
    profile.email,
    profile.publicRepos,
    profile.publicGists,
    profile.followers,
    profile.following,
    profile.totalStars,
    profile.totalForks,
    profile.mostUsedLanguage,
    JSON.stringify(profile.topLanguages || []),
    profile.accountCreatedAt
      ? new Date(profile.accountCreatedAt)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ")
      : null,
    profile.accountAgeDays,
  ];

  await pool.execute(sql, params);
};

const parseRow = (row) => {
  if (!row) return row;
  return {
    ...row,
    top_languages:
      typeof row.top_languages === "string"
        ? JSON.parse(row.top_languages)
        : row.top_languages,
  };
};

export const findAllProfiles = async ({
  limit = 50,
  offset = 0,
  sortBy = "last_analyzed_at",
  order = "DESC",
} = {}) => {
  const allowedSort = new Set([
    "followers",
    "public_repos",
    "total_stars",
    "last_analyzed_at",
    "created_at",
    "username",
  ]);
  const sortColumn = allowedSort.has(sortBy) ? sortBy : "last_analyzed_at";
  const sortOrder = order.toUpperCase() === "ASC" ? "ASC" : "DESC";

  const [rows] = await pool.query(
    `SELECT * FROM profiles ORDER BY ${sortColumn} ${sortOrder} LIMIT ? OFFSET ?`,
    [Number(limit), Number(offset)],
  );

  const [[{ total }]] = await pool.query(
    "SELECT COUNT(*) as total FROM profiles",
  );

  return { rows: rows.map(parseRow), total };
};

export const findProfileByUsername = async (username) => {
  const [rows] = await pool.execute(
    "SELECT * FROM profiles WHERE LOWER(username) = LOWER(?) LIMIT 1",
    [username],
  );
  return parseRow(rows[0]);
};

export const deleteProfileByUsername = async (username) => {
  const [result] = await pool.execute(
    "DELETE FROM profiles WHERE LOWER(username) = LOWER(?)",
    [username],
  );
  return result.affectedRows > 0;
};
