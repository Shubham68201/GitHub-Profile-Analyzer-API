import { analyzeGithubProfile, GithubApiError } from '../services/githubService.js';
import {
  upsertProfile,
  findAllProfiles,
  findProfileByUsername,
  deleteProfileByUsername
} from '../services/profileModel.js';

/**
 * POST /api/profiles/:username/analyze
 * Fetches the profile from GitHub, computes insights, and stores/updates it in MySQL.
 */
export const analyzeProfile = async (req, res, next) => {
  try {
    const { username } = req.params;
    if (!username || !/^[a-zA-Z0-9-]+$/.test(username)) {
      return res.status(400).json({ success: false, message: 'Invalid GitHub username' });
    }

    const profile = await analyzeGithubProfile(username);
    await upsertProfile(profile);
    const stored = await findProfileByUsername(profile.username);

    return res.status(200).json({ success: true, data: stored });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/profiles
 * Returns all stored analyzed profiles, with basic pagination + sorting.
 */
export const getAllProfiles = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, sortBy = 'last_analyzed_at', order = 'DESC' } = req.query;
    const { rows, total } = await findAllProfiles({ limit, offset, sortBy, order });

    return res.status(200).json({
      success: true,
      count: rows.length,
      total,
      data: rows
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/profiles/:username
 * Returns a single stored profile. Does NOT hit GitHub again.
 */
export const getProfileByUsername = async (req, res, next) => {
  try {
    const { username } = req.params;
    const profile = await findProfileByUsername(username);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: `No analyzed profile found for "${username}". Run analysis first via POST /api/profiles/${username}/analyze`
      });
    }

    return res.status(200).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/profiles/:username
 * Removes a stored profile (bonus utility endpoint).
 */
export const deleteProfile = async (req, res, next) => {
  try {
    const { username } = req.params;
    const deleted = await deleteProfileByUsername(username);

    if (!deleted) {
      return res.status(404).json({ success: false, message: `No stored profile for "${username}"` });
    }

    return res.status(200).json({ success: true, message: `Profile "${username}" deleted` });
  } catch (err) {
    next(err);
  }
};

export { GithubApiError };
