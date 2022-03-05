import React, { useState } from 'react';
import { RoundResult } from 'shared/poll-types';

type ResultCard = {
  result: DeepReadonly<RoundResult>;
};

const ResultCard: React.FC<ResultCard> = ({ result }) => {
  const [showPercent, setShowPercent] = useState(false);
  const totalVotes = result.totalVotes;

  return (
    <>
      <div className="grid grid-cols-3 gap-4 pb-2 my-2 border-b-2 border-solid border-purple-70 pr-4">
        <div className="col-span-2 font-semibold">Candidate</div>
        <div className="col-span-1 font-semibold text-right">
          <button
            onClick={() => setShowPercent(false)}
            className={showPercent ? '' : 'text-orange-700'}
          >
            Count
          </button>
          {' / '}
          <button
            onClick={() => setShowPercent(true)}
            className={showPercent ? 'text-orange-700' : ''}
          >
            %
          </button>
        </div>
      </div>
      <div className="divide-y-2 overflow-y-auto pr-4">
        {result.votes.map((candidate) => (
          <div
            key={candidate.nominationID}
            className="grid grid-cols-3 gap-4 my-1 items-center"
          >
            <div className="col-span-2">{candidate.text}</div>
            <div className="col-span-1 text-right">
              {showPercent
                ? ((candidate.count / totalVotes) * 100).toFixed(2)
                : candidate.count}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default ResultCard;
