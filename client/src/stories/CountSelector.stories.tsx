import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import CountSelector from '../components/ui/CountSelector';

export default {
  title: 'CountSelector',
  component: CountSelector,
  argTypes: {
    onChange: { action: 'count changed' },
  },
  args: {
    initial: 3,
    min: 0,
    max: 5,
    step: 1,
  },
} as ComponentMeta<typeof CountSelector>;

const Template: ComponentStory<typeof CountSelector> = (args) => (
  <div className="h-screen max-w-sm m-auto">
    <CountSelector {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {};

export const Inc2 = Template.bind({});
Inc2.args = {
  ...Default.args,
  step: 2,
};
