import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import HorizontalSwipeList from '../components/ui/HorizontalSwipeList';

export default {
  title: 'HorizontalSwipeList',
  component: HorizontalSwipeList,
} as ComponentMeta<typeof HorizontalSwipeList>;

const Template: ComponentStory<typeof HorizontalSwipeList> = (args) => (
  <div className="h-screen max-w-sm m-auto">
    <HorizontalSwipeList {...args}>{args.children}</HorizontalSwipeList>
  </div>
);

export const SwipeList = Template.bind({});
SwipeList.args = {
  children: [
    <div key="key1" className="bg-gray-400 h-48 w-full"></div>,
    <div key="key2" className="bg-blue-400 h-48 w-full"></div>,
    <div key="key3" className="bg-green-400 h-48 w-full"></div>,
    <div key="key4" className="bg-red-400 h-48 w-full"></div>,
  ],
};

export const SwipeListTallContent = Template.bind({});
SwipeListTallContent.args = {
  children: [
    <div key="key1" className="bg-gray-400 h-96 w-full"></div>,
    <div key="key2" className="bg-blue-400 h-96 w-full"></div>,
    <div key="key3" className="bg-green-400 h-96 w-full"></div>,
    <div key="key4" className="bg-red-400 h-96 w-full"></div>,
  ],
};
