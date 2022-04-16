## Ranker Course

This repo holds the project code for my [Ranker Youtube tutorial](https://youtube.com/playlist?list=PLnrGn4P6C4P5J2rSSyiAyxZegws4SS8ey) on building a real-time, websocket-based (add another hyphenated-term as you please) ranked-choice voting app! 

I hope it helps you and your friends to choose a movie to see, a vacation destination, or to find a place to eat without wasting so much time deliberating that your enthusiasm for going out utterly vanishes!

Check out the [Application Overview](./tutorials/01-application-overview.md) to determine if you're interested!

## Getting Started

This project contains a `starter` branch which you can use to follow along from the beginning of the tutorial. You can either clone the starter branch or use a tool like [degit](https://github.com/Rich-Harris/degit) to get a copy of the repository without any history. 

```sh
npx degit https://github.com/JacobSNGoodwin/ranker-course.git#starter
```

This repository will also include a branch for each tutorial. So if you'd like to join along at some later point in the course, you can clone that branch, or use `degit` as above, but replacing starter with the branch name as follows:

```sh
npx degit https://github.com/JacobSNGoodwin/ranker-course.git#{branch}
```

## Running the application

In order to run the application, you will need to have some prerequisite tools installed. 

First, you'll need to be able to run `docker-compose` command. If you are able to install Docker with Docker Desktop, that is probably the easiest solution.

Second, you'll need NodeJS for both the client and server applications. I recommend you use [nvm](https://github.com/nvm-sh/nvm) or [nvm-windows](https://github.com/coreybutler/nvm-windows) and make sure to use the same version of node found in the [.nvmrc](/.nvmrc) file at the root of the project. You can run `nvm use` from the root of the project to make sure you're using the same version of node as me. 

With the everything installed and with Docker running on your machine, you can launch a docker container running `redis-json`, the backend Nest JS application, and the front-end react application by running the following from the root of the project.

```sh
npm run start
```

The project root's `package.json` file and its npm scripts are basically just for convenience of running all applications and a database at once.

You can also run these applications separately by running the appropriate npm scripts inside of each project's `package.json` file. 

## Tutorials Folder

This repo contains a [tutorials](tutorials) folder holding a document for each of the video lessons. These are not intended to be well-written, thorough documents. However these will hold the scripts, or notes, that I use to create the videos with code snippets and images. Therefore, you may find these documents useful for copying and pasting some code, or to review content from the videos in a more efficient manner. 

Or, heck, skip the videos all together. It's not like I'm in this for the money (though feel free to send me vast sums of money or offer lucrative jobs). Making niche, long video tutorials will never garner much viewership. I'd be making general info videos or crash-courses if that's what I wanted. 

## Links to Tools and Frameworks

### General
* [Typescript](https://www.typescriptlang.org/)
* [Docker](https://www.docker.com/products/docker-desktop)
* [Prettier](https://prettier.io/)
* [ESLint](https://eslint.org/docs/user-guide/getting-started)

### Frontend Application
* [Vite](https://vitejs.dev/)
* [React](https://reactjs.org/)
* [Valtio](https://github.com/pmndrs/valtio)
* [Wouter](https://github.com/molefrog/wouter)
* [Storybook](https://storybook.js.org/)
* [Socket.io Client](https://socket.io/docs/v4/client-api/)
* [Tailwind CSS](https://tailwindcss.com/)
* [react-use](https://github.com/streamich/react-use)

### Backend Application
* [NestJS](https://nestjs.com/)
* [Socket.io Server](https://socket.io/docs/v4/server-api/)
* [Redis-JSON](https://oss.redis.com/redisjson/)
* [Redis-JSON Docker Image](https://hub.docker.com/r/redislabs/rejson/)
* [JSON Web Token](https://jwt.io/)
