import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import SnackBar from '../components/ui/SnackBar';

export default {
  title: 'SnackBar',
  component: SnackBar,
  argTypes: {
    onClose: { action: 'close-a-roo' },
  },
  args: {
    show: true,
    type: 'standard',
  },
} as ComponentMeta<typeof SnackBar>;

const Template: ComponentStory<typeof SnackBar> = (args) => (
  <SnackBar {...args} />
);

export const Standard = Template.bind({});
Standard.args = {
  message: 'Something happened.',
  title: 'Heyo!',
};

export const Error = Template.bind({});
Error.args = {
  message: 'Something happened.',
  title: 'Heyo!',
  type: 'error',
};

export const AutoClose = Template.bind({});
AutoClose.args = {
  message: 'Something happened.',
  title: 'Heyo!',
  autoCloseDuration: 2000,
};
