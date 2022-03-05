import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import ConfirmationDialog from '../components/ui/ConfirmationDialog';

export default {
  title: 'ConfirmationDialog',
  component: ConfirmationDialog,
  argTypes: {
    onCancel: { action: 'cancelling' },
    onConfirm: { action: 'confirming' },
  },
  args: {
    showDialog: true,
  },
} as ComponentMeta<typeof ConfirmationDialog>;

const Template: ComponentStory<typeof ConfirmationDialog> = (args) => (
  <ConfirmationDialog {...args} />
);

export const BasicMessage = Template.bind({});
BasicMessage.args = {
  message: 'The world will explode if you contine...',
};
