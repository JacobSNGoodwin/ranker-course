# 17 - React Typescript Client Intro

It's time to move on out web application! Let's do a quick review of our client application.

First, you'll see that this is an application using vite for development and building. Second, you'll see that we have a [tailwind.config.js](../client//tailwind.config.js). So we'll be using Tailwind for many of our styles. If you don't know Tailwind, but understand CSS, I think you'll get the gist of it pretty quickly. 

We also have storybook setup and stories many of our files in the [src/components](../client/src/components/) folder. I created a handful of components that we'll use throughout the course. To try this components out, you can run `npm run storybook` from the root of the project.

We also have some basic styles in [index.css](../client/src/index.css), which are mostly built up from Tailwind classes. The `@apply` and then adding styles I believe is a Postcss feature which allows us to compose styles from other classes. 

We mount the application in [main.tsx](../client/src/main.tsx). Our top-level component is the [App component](../client/src/App.tsx). And that's where we'll start off today. 

Lastly, I had initially said that we would build this application with a router called [wouter](https://github.com/molefrog/wouter). After thinking it over, I have decided to manage the displayed components without actually routing, or changing the URL. I still recommend checking out this library if you're in need of a light-weight router. 

*Github reminder*

## Creating Welcome Page

Let's start out by adding a basic page. Notice that as of now, our [App](../client/src/App.tsx) is simply rendering the [Welcome Page Component](../client/src/pages/Welcome.tsx). So we'll just create the UI before adding any functionality. 

```tsx
    <div className="flex flex-col w-full justify-center items-center h-full">
      <h1 className="text-center my-12">Welcome to Rankr</h1>
    </div>
```

We'll keep the outer component of our page along with the centered title. We're basically creating a column with items vertically and horizontally centered. Later, we'll actually wrap our pages in a main container, but don't worry about it now. 

Next, we add some buttons.

```tsx
      <div className="my-12 flex flex-col justify-center">
        <button
          className="box btn-orange my-2"
          onClick={() => console.log('Go to Create Poll')}
        >
          Create New Poll
        </button>
        <button
          className="box btn-purple my-2"
          onClick={() => console.log('Go to Join Poll')}
        >
          Join Existing Poll
        </button>
      </div>
```

The `box` and `button` classes are some classes we defined in our styles to make the buttons have the rounded box look.

Let's check this out in our browser and see the logs we just added when clicking these buttons.

## Adding Pages Component

Currently our App just renders the `Welcome` component. But we want some way to transition between components. Let's do this by creating a [Pages component](../client/src/Pages.tsx) in our client's `src` folder.

Right now, let's just create a container which will be a standard container for or app.

```tsx
import React from 'react';
import Welcome from './pages/Welcome';

const Pages: React.FC = () => {
  return (
    <div className="page mobile-height max-w-screen-sm mx-auto py-8 px-4 overflow-y-auto">
      <Welcome />
    </div>
  );
};

export default Pages;
```

The `page` and `mobile-height` classes basically create a container that's the full height of the screen. 

Let's now import `Pages` into our `App`.

```tsx
import Pages from './Pages';

const App: React.FC = () => <Pages />;
```

*View container in dev-tools*

## Adding Valtio (To Track Location State)

We now want to be able to go to a different page when we click "Create New Poll" or "Join Existing Poll".

We'll store the current component in our global app state. I'm not 100% sure we need to do that, but I think it actually will help. But you'll see that later. 

For our application, we'll be using [valtio](https://github.com/pmndrs/valtio). Let's not dwell on the docs. Let's just create some state in a new [state.ts](../client/src/state.ts).


```ts
import { proxy } from 'valtio';

export enum AppPage {
  Welcome = 'welcome',
  Create = 'create',
  Join = 'join',
}

export type AppState = {
  currentPage: AppPage;
};

const state: AppState = proxy({
  currentPage: AppPage.Welcome,
});

const actions = {
  setPage: (page: AppPage): void => {
    state.currentPage = page;
  },
};

export { state, actions };
```

So we create the initial `state` by calling valtio's `proxy` function. So, the object that we pass into the `proxy` can be sort-of "watched" inside of our React component. We'll be able to create a snapshot for when the component changes. We can even cause rerenders only when a particular field, like `currentPage` changes. 

*See valtio docs example*.

So basically, to observe the state we'll `useSnapshot`, and to update it we merely mutate the state directly. However, I want to mutate the state in an organized fashion. Therefore, I'll be creating an `actions` object with functions that can be called to update the state. Our first method is to change the current page. 

We define an `enum` with string values which will sort of map to the pages in our app. The goal for today is to send users to pages to either create a new poll or join an existing poll. So we'll create those.  Our initial page will be set to the `Welcome` page. 

## Valtio Devtools

So next we'll want to wire up the buttons on our `Welcome` page to make use of `actions.setPage`. But before doing this, I want to show you how we can use [Redux Devtools](https://github.com/reduxjs/redux-devtools) to keep track of our state. You heard that right... we'll be using the `Redux Devtools` to monitor our Valtio state. 

Most of the time people will install a Redux devtools extension for their browser. But see their website if you want to run it in a stand-alone window. 

Let's now import the `devtools` extension from `valtio` in our `App.js`.

```tsx
import { devtools } from 'valtio/utils';
devtools(state, 'app state');
const App: React.FC = () => <Pages />;
```

## Setting the Page on Button click

Let's now set out page when clicking the buttons on the [Welcome](../client/src/pages/Welcome.tsx) page. 

We do this by importing our `actions` object from the state module.

```tsx
import { actions, AppPage } from '../state';

        <button
          className="box btn-orange my-2"
          onClick={() => actions.setPage(AppPage.Create)}
        >
          Create New Poll
        </button>
        <button
          className="box btn-purple my-2"
          onClick={() => actions.setPage(AppPage.Join)}
        >
          Join Existing Poll
        </button>
```

*Show in devtools. May require hard refresh since we just added the devtools.*

## Creating Page Transitions

What we'll now do is create a page transition to sort of slide in our page from the bottom to the top. To do this, we'll use the `react-transition-group` library's `CSSTransition`. This will apply transitions as we'll define in our [index.css stylesheet](../client/src/index.css).

First, let's create a map of page name to the actual React component that we intend to render. 

```tsx Pages.tsx
const routeConfig = {
  [AppPage.Welcome]: Welcome,
  [AppPage.Create]: Create,
  [AppPage.Join]: Join,
};
```

Of course, we still do not actually have any `Create` and `Join`, but let's create some basic components in the [pages directory](../client/src/pages/).

```tsx Create.tsx
import React from 'react';

const Create: React.FC = () => (
  <div className="flex flex-col w-full justify-around items-stretch h-full mx-auto max-w-sm">
    <h3 className="text-center">Enter Poll Topic</h3>
  </div>
);

export default Create;
```

```tsx Join.tsx
import React from 'react';

const Join: React.FC = () => (
  <div className="flex flex-col w-full justify-around items-stretch h-full mx-auto max-w-sm">
    <h3 className="text-center">Enter Code Provided by &quot;Friend&quot;</h3>
  </div>
);

export default Join;
```

Then update imports in [Pages.tsx](../client/src/Pages.tsx);

We'll no wrap all of our components with a `CSSTransition` component by iterating over the map we just created.


```tsx
import { CSSTransition } from 'react-transition-group';

const Pages: React.FC = () => {
  return (
    <>
      {Object.entries(routeConfig).map(([page, Component]) => (
        <CSSTransition
          key={page}
          in={}
          timeout={300}
          classNames="page"
          unmountOnExit
        >
          <div className="page mobile-height max-w-screen-sm mx-auto py-8 px-4 overflow-y-auto">
            <Component />
          </div>
        </CSSTransition>
      ))}
    </>
  );
};
```

So, we basically take all of our `Components`, and wrap them in the main container, and then wrap that in a transition. We tell the transition to have a `timeout` or duration of 300ms. And then we tell it to use styles prefixed with `page`. *See index.css*

We tell the transition to Unmount the component when the outgoing transition completes instead of leaving it in our Component tree with `unmountOnExit`.

However, we need a way to tell the transition to trigger mounting the component. That will occur when the `in` property is true. So what we can do, is access our `state.currentPage` that we just created, and see if it matches the `page` argument of our map. 

To access state, we take a snapshot of the state. We'll do this before returning the JSX in our functional component. 

```tsx
// import the state and hook
const currentState = useSnapshot(state);
```

Then we can set `in` as follows.

```tsx
<CSSTransition
  key={page}
  in={page === currentState.currentPage}
  timeout={300}
  classNames="page"
  unmountOnExit
>
```

*Demonstrate. We currently have no way to go back, but we'll add this next time*