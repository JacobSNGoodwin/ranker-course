import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import Loader from '../components/ui/Loader';

export default {
  title: 'Loader',
  component: Loader,
  argTypes: {
    color: {
      options: ['blue', 'orange', 'purple'],
      control: { type: 'select' },
    },
  },
} as ComponentMeta<typeof Loader>;

const Template: ComponentStory<typeof Loader> = (args) => <Loader {...args} />;

export const Loading = Template.bind({});
Loading.args = {
  isLoading: true,
  color: 'purple',
  width: 80,
};
