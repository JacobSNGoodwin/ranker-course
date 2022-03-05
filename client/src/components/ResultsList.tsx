import React from 'react';
import ResultCard from './ui/ResultCard';
import HorizontalSwipeList from './ui/HorizontalSwipeList';
import { RoundResult } from 'shared/poll-types';

type ResultsList = {
  results: DeepReadonly<RoundResult[]>;
};

const ResultsList: React.FC<ResultsList> = ({ results }) => {
  return (
    <div className="mx-auto max-h-full flex flex-col">
      <HorizontalSwipeList>
        {results.map((result, i) => (
          // Can use index as we'll never change list
          <ResultCard key={i} result={result} />
        ))}
      </HorizontalSwipeList>
    </div>
  );
};

export default ResultsList;
