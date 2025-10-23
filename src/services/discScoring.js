/**
 * DISC Scoring Algorithm
 * Calculates personality type based on DISC framework
 */

/**
 * Calculate DISC scores from user answers
 * @param {Array} answers - Array of user answers with questionId and answerId
 * @param {Array} questions - Array of question objects with trait mapping
 * @returns {Object} Scores for D, I, S, C traits
 */
export function calculateDISCScores(answers, questions) {
  const scores = { D: 0, I: 0, S: 0, C: 0 };
  const counts = { D: 0, I: 0, S: 0, C: 0 };

  answers.forEach(userAnswer => {
    // Coerce IDs to numbers for comparison (handles string/number mismatch)
    const question = questions.find(q => Number(q.id) === Number(userAnswer.questionId));
    if (!question) {
      console.warn(`Question not found for ID: ${userAnswer.questionId}`);
      return;
    }

    const selectedAnswer = question.answers.find(a => Number(a.id) === Number(userAnswer.answerId));
    if (!selectedAnswer) {
      console.warn(`Answer not found for question ${userAnswer.questionId}, answer ID: ${userAnswer.answerId}`);
      return;
    }

    // Add score to the appropriate trait
    const trait = selectedAnswer.trait;
    if (trait && scores.hasOwnProperty(trait)) {
      scores[trait] += selectedAnswer.score;
      counts[trait] += 1;
    } else {
      console.warn(`Invalid trait: ${trait} for question ${userAnswer.questionId}`);
    }
  });

  console.log('DISC Scoring - Trait counts:', counts);
  console.log('DISC Scoring - Raw scores:', scores);

  // Calculate average scores (normalized to 0-100 scale)
  const normalizedScores = {};
  Object.keys(scores).forEach(trait => {
    if (counts[trait] > 0) {
      // Average score per question for this trait
      const avgScore = scores[trait] / counts[trait];
      // Normalize to 0-100 scale (5-point scale: 1-5 → 0-100)
      normalizedScores[trait] = Math.round(((avgScore - 1) / 4) * 100);
    } else {
      normalizedScores[trait] = 0;
    }
  });

  console.log('DISC Scoring - Normalized scores (0-100):', normalizedScores);
  return normalizedScores;
}

/**
 * Determine personality type from DISC scores
 * @param {Object} scores - Normalized DISC scores (0-100)
 * @returns {String} Personality type key (D, I, S, C, DI, DS, etc.)
 */
export function determineDISCType(scores) {
  const threshold = 60; // Score must be above 60 to be considered dominant
  const combinationThreshold = 55; // Lower threshold for combination types

  // Find all traits above threshold
  const dominantTraits = Object.entries(scores)
    .filter(([trait, score]) => score >= threshold)
    .sort((a, b) => b[1] - a[1])
    .map(([trait]) => trait);

  // If we have dominant traits, return the type
  if (dominantTraits.length >= 2) {
    // Return two-trait combination (highest two)
    return dominantTraits.slice(0, 2).sort().join('');
  } else if (dominantTraits.length === 1) {
    // Return single dominant trait
    return dominantTraits[0];
  }

  // If no traits above main threshold, check for combination type
  const moderateTraits = Object.entries(scores)
    .filter(([trait, score]) => score >= combinationThreshold)
    .sort((a, b) => b[1] - a[1])
    .map(([trait]) => trait);

  if (moderateTraits.length >= 2) {
    return moderateTraits.slice(0, 2).sort().join('');
  } else if (moderateTraits.length === 1) {
    return moderateTraits[0];
  }

  // Default: return highest scoring trait
  const highestTrait = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])[0];

  return highestTrait[0];
}

/**
 * Match personality type to profile
 * @param {String} typeKey - DISC type key (D, I, S, C, DI, etc.)
 * @param {Array} profiles - Array of personality profile objects
 * @returns {Object|null} Matched personality profile
 */
export function matchPersonalityProfile(typeKey, profiles) {
  // Try exact match first
  let profile = profiles.find(p => p.key === typeKey);

  // If no exact match, try reverse order for two-letter combinations
  if (!profile && typeKey.length === 2) {
    const reversedKey = typeKey.split('').reverse().join('');
    profile = profiles.find(p => p.key === reversedKey);
  }

  // If still no match, find closest single-trait match
  if (!profile && typeKey.length === 2) {
    const firstTrait = typeKey[0];
    profile = profiles.find(p => p.key === firstTrait);
  }

  // Default to first profile if no match found
  if (!profile && profiles.length > 0) {
    profile = profiles[0];
  }

  return profile;
}

/**
 * Complete DISC assessment analysis
 * @param {Array} answers - User answers
 * @param {Array} questions - Assessment questions
 * @param {Array} profiles - Personality profiles
 * @returns {Object} Assessment results with personality profile and scores
 */
export function analyzeDISCAssessment(answers, questions, profiles) {
  // Calculate DISC scores
  const scores = calculateDISCScores(answers, questions);

  // Determine personality type
  const personalityType = determineDISCType(scores);

  // Match to profile
  const profile = matchPersonalityProfile(personalityType, profiles);

  return {
    personalityType,
    scores,
    profile
  };
}
