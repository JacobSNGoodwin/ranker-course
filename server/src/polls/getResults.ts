import { Nominations, Rankings, Results } from 'shared';

export default (
  rankings: Rankings,
  nominations: Nominations,
  votesPerVoter: number,
): Results => {
  // 1. Each value of `rankings` key values is an array of a participants'
  // vote. Points for each array element corresponds to following formula:
  // r_n = ((votesPerVoter - 0.5*n) / votesPerVoter)^(n+1), where n corresponds
  // to array index of rankings.
  // Accumulate score per nominationID
  const scores: { [nominationID: string]: number } = {};

  Object.values(rankings).forEach((userRankings) => {
    userRankings.forEach((nominationID, n) => {
      const voteValue = Math.pow(
        (votesPerVoter - 0.5 * n) / votesPerVoter,
        n + 1,
      );

      scores[nominationID] = (scores[nominationID] ?? 0) + voteValue;
    });
  });

  // 2. Take nominationID to score mapping, and merge in nominationText
  // and nominationID into value
  const results = Object.entries(scores).map(([nominationID, score]) => ({
    nominationID,
    nominationText: nominations[nominationID].text,
    score,
  }));

  // 3. Sort values by score in descending order
  results.sort((res1, res2) => res2.score - res1.score);

  return results;
};
