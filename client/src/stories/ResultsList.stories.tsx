import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import ResultsList from '../components/ResultsList';
import { Results } from 'shared/poll-types';

export default {
  title: 'ResultsList',
  component: ResultsList,
} as ComponentMeta<typeof ResultsList>;

const Template: ComponentStory<typeof ResultsList> = (args) => (
  <div className="max-w-sm m-auto h-screen">
    <ResultsList {...args} />
  </div>
);

const results: Results = [
  {
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
  },
  {
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
        nominationID: '4',
        count: 2,
        text: "Papa's Tacos",
      },
    ],
    totalVotes: 7,
  },
  {
    votes: [
      {
        nominationID: '4',
        count: 4,
        text: "Papa's Tacos",
      },
      {
        nominationID: '1',
        count: 3,
        text: 'Taco Bell',
      },
    ],
    totalVotes: 7,
  },
];

export const ResultsBasic = Template.bind({});
ResultsBasic.args = {
  results: results,
};

const resultsLong: Results = [
  {
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
  },
  {
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
        nominationID: '4',
        count: 2,
        text: "Papa's Tacos",
      },
    ],
    totalVotes: 7,
  },
];

export const ResultsLong = Template.bind({});
ResultsLong.args = {
  results: resultsLong,
};
