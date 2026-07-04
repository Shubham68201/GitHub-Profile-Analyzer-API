import { Router } from 'express';
import {
  analyzeProfile,
  getAllProfiles,
  getProfileByUsername,
  deleteProfile
} from '../controllers/profileController.js';

const router = Router();

// Trigger analysis of a GitHub username and store/refresh insights in MySQL
router.post('/:username/analyze', analyzeProfile);

// Fetch all stored analyzed profiles
router.get('/', getAllProfiles);

// Fetch a single stored profile by username
router.get('/:username', getProfileByUsername);

// Delete a stored profile
router.delete('/:username', deleteProfile);

export default router;
