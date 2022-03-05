import React, { Children, useState, useMemo } from 'react';
import { BsChevronLeft, BsChevronRight } from 'react-icons/bs';
import { useScratch } from 'react-use';

const HorizontalSwipeList: React.FC = ({ children }) => {
  const [total, childrenArray] = useMemo(
    () => [Children.count(children), Children.toArray(children)],
    [children]
  );

  const [current, setCurrent] = useState(0);

  const [ref] = useScratch({
    onScratchEnd: ({ dx }) => {
      if ((dx || 0) > 50 && current > 0) {
        setCurrent(current - 1);
      }

      if ((dx || 0) < -50 && current < total - 1) {
        setCurrent(current + 1);
      }
    },
  });

  return (
    <div className="flex flex-col flex-shrink max-h-full overflow-hidden">
      <div className="my-8 mx-2 flex justify-between align-middle flex-shrink-0">
        <button
          className="block"
          disabled={current <= 0}
          onClick={() => setCurrent(current - 1)}
        >
          <BsChevronLeft
            className="mx-auto fill-current text-indigo-800 hover:text-indigo-600 hover:shadow-sm transition-all disabled:text-gray-400 stroke-1"
            size={28}
          />
        </button>
        <div className="font-bold text-center text-lg">
          {current + 1} of {total}
        </div>
        <button
          className="block"
          disabled={current >= total - 1}
          onClick={() => setCurrent(current + 1)}
        >
          <BsChevronRight
            size={28}
            className="mx-auto fill-current text-indigo-800 hover:text-indigo-600 hover:shadow-sm transition-all disabled:text-gray-400 stroke-1"
          />
        </button>
      </div>

      <div ref={ref} className="flex-shrink overflow-y-auto">
        {childrenArray[current]}
      </div>
    </div>
  );
};

export default HorizontalSwipeList;
