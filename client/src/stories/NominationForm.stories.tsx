import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import NominationForm from '../components/NominationForm';
import { Nominations } from 'shared/poll-types';

export default {
  title: 'NominationForm',
  component: NominationForm,
  argTypes: {
    onClose: { action: 'closing' },
    onSubmitNomination: { action: 'submitting nomination' },
    onRemoveNomination: { action: 'removing nomination' },
  },
  args: {
    userID: '1',
    isAdmin: false,
  },
} as ComponentMeta<typeof NominationForm>;

const nominations: Nominations = {
  item1: {
    userID: '1',
    text: 'Nominanationaroo 1',
  },
  item2: {
    userID: '2',
    text: 'Nominanationaroo 2',
  },
  item3: {
    userID: '3',
    text: 'Nominanationaroo 3',
  },
};

const Template: ComponentStory<typeof NominationForm> = (args) => (
  <div className="max-w-sm m-auto h-screen relative">
    <NominationForm {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  title: 'Nomination Formaroo!',
  isOpen: true,
  nominations,
};
