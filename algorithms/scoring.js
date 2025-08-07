export function organizeResponse(questions, responses) {
  const result = [];
  for (const response of responses) {
    let question = questions.filter(
      (question) => question.id === response.questionId,
    );
    if (question.length === 0) {
      throw new Error('Question ID is invalid.');
    }
    question = question[0];
    // This should look up by answer.id for performance improvement
    // let answer = question.answers.filter(answer => answer.id === response.answer.id)
    let answer = question.answers.filter(
      (answer) => answer.text === response.answer.text,
    );
    if (answer.length === 0) {
      throw new Error('Answer text is invalid.');
    }
    answer = answer[0];
    result.push({
      question,
      answer,
    });
  }
  return result;
}

export function calculateScore(organizedResponse) {
  const scores = {
    Dominance: 0,
    Influence: 0,
    Steadiness: 0,
    Conscientiousness: 0,
    Introversion: 0,
    Extraversion: 0,
    Sensing: 0,
    Intuition: 0,
    Thinking: 0,
    Feeling: 0,
    Judging: 0,
    Perceiving: 0,
    Openness: 0,
  };
  for (const response of organizedResponse) {
    scores[response.answer.trait] += response.answer.score;
  }
  // For now we will only return D I S C
  return {
    Dominance: scores.Dominance,
    Influence: scores.Influence,
    Steadiness: scores.Steadiness,
    Conscientiousness: scores.Conscientiousness,
  };
}

export function calculateResults(scores, personalities) {
  let finalTrait = '';
  const average =
    Object.values(scores).reduce((a, b) => a + b) /
    Object.values(scores).length;
  for (const [key, value] of Object.entries(scores)) {
    if (value >= average) {
      if (finalTrait.length === 0) {
        finalTrait = key;
      } else {
        finalTrait += `,${key}`;
      }
    }
  }
  const personalityTraits = finalTrait.split(',');
  const initials = personalityTraits
    .map((item) => item[0].toUpperCase())
    .join('');
  const permutations = getAllPermutations(initials);
  for (const personality of personalities) {
    if (permutations.includes(personality.key)) {
      return personality;
    }
  }
}

function getAllPermutations(str) {
  const result = [];

  function swap(arr, i, j) {
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }

  function permute(strArray, start) {
    if (start === strArray.length - 1) {
      result.push(strArray.join(''));
      return;
    }

    for (let i = start; i < strArray.length; i++) {
      swap(strArray, start, i);
      permute([...strArray], start + 1);
      swap(strArray, start, i); // Backtrack
    }
  }

  permute([...str], 0);
  return result;
}
