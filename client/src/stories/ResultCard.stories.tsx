import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import ResultCard from '../components/ui/ResultCard';
import { RoundResult } from 'shared/poll-types';

export default {
  title: 'ResultCard',
  component: ResultCard,
} as ComponentMeta<typeof ResultCard>;

const Template: ComponentStory<typeof ResultCard> = (args) => (
  <div className="max-w-sm m-auto h-screen">
    <ResultCard {...args} />
  </div>
);

const result: RoundResult = {
  votes: [
    {
      nominationID: '1',
      count: 3,
      text: 'Taco Bell',
    },
    {
      nominationID: '2',
      count: 2,
      text: 'Del Taco',
    },
    {
      nominationID: '3',
      count: 1,
      text: "Papa's Tacos",
    },
    {
      nominationID: '4',
      count: 1,
      text: 'Los Taqueros Locos con Nomre Largo',
    },
  ],
  totalVotes: 7,
};

export const ResultCardShort = Template.bind({});
ResultCardShort.args = {
  result,
};

const resultLong = {
  votes: [
    {
      nominationID: '1',
      count: 10,
      text: 'Taco Bell',
    },
    {
      nominationID: '2',
      count: 8,
      text: 'Del Taco',
    },
    {
      nominationID: '3',
      count: 5,
      text: "Papa's Tacos",
    },
    {
      nominationID: '4',
      count: 4,
      text: 'Los Taqueros Locos con Nomre Largo',
    },
    {
      nominationID: '5',
      count: 4,
      text: 'Chicky-Chicken-Filet',
    },
    {
      nominationID: '6',
      count: 3,
      text: 'Mad Clown Burger',
    },
    {
      nominationID: '7',
      count: 3,
      text: 'Thai Basil #0005',
    },
    {
      nominationID: '8',
      count: 2,
      text: 'Sichuan Spice',
    },
    {
      nominationID: '9',
      count: 0,
      text: 'Not Good Curry',
    },
    {
      nominationID: '10',
      count: 0,
      text: 'Not Good Soul Food',
    },
    {
      nominationID: '11',
      count: 0,
      text: 'Not Good Sushi',
    },
    {
      nominationID: '12',
      count: 0,
      text: 'Not Good Falafel',
    },
    {
      nominationID: '13',
      count: 0,
      text: 'Not Good Steakhouse',
    },
    {
      nominationID: '14',
      count: 0,
      text: 'Not Good Burgers',
    },
  ],
  totalVotes: 39,
};

export const ResultCardLong = Template.bind({});
ResultCardLong.args = {
  result: resultLong,
};
