const API_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const API_HOST = 'exercisedb.p.rapidapi.com';
const BASE_URL = `https://${API_HOST}`;

/**
 * Fetch exercises by body part from ExerciseDB API
 * @param {string} bodyPart - The body part to fetch exercises for (e.g., 'back', 'chest', 'cardio')
 * @returns {Promise<Array>} - Array of exercise objects
 */
export const fetchExercisesByBodyPart = async (bodyPart) => {
  const url = `${BASE_URL}/exercises/bodyPart/${bodyPart}`;
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': API_HOST
    }
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch exercises:', error);
    throw error;
  }
};
