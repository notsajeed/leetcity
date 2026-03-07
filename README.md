# LeetCity

LeetCity is a web application that visualizes LeetCode user statistics as buildings in a 3D city.

Inspired by the idea behind GitCity, the project represents programming activity spatially. Instead of viewing statistics as numbers or charts, each LeetCode user becomes a building in a generated skyline.

Live site: https://leetcity.vercel.app

---

## Overview

LeetCity fetches public LeetCode profile data and converts it into structures inside an interactive 3D environment.

Users can add one or more LeetCode usernames. For each user:

- their statistics are fetched from the API
- a building is generated in the city
- selecting the building reveals that user's stats

As more users are added, the skyline expands to form a small city made up of developer profiles.

---

## Features

- 3D visualization of LeetCode users as buildings
- Add multiple usernames to grow the city
- Interactive scene navigation
- Click buildings to inspect user statistics
- Persistent city data using Redis

---

## Usage

1. Open the application at
   https://leetcity.vercel.app

2. Enter a LeetCode username.

3. Press **ADD**.

4. A building representing that user appears in the city.

5. Click the building to view detailed statistics.

Multiple users can be added to expand the skyline.

---

## Controls

| Action          | Control |
| --------------- | ------- |
| Rotate camera   | Drag    |
| Zoom            | Scroll  |
| Select building | Click   |

---

## Tech Stack

- Next.js
- React
- TypeScript
- React Three Fiber / Three.js
- Upstash Redis

---

## Running Locally

Clone the repository:

```bash id="clone"
git clone https://github.com/yourusername/leetcity.git
cd leetcity
```

Install dependencies:

```bash id="install"
npm install
```

Create a `.env.local` file and configure your Redis connection:

```bash id="env"
UPSTASH_REDIS_REST_URL=your_url
UPSTASH_REDIS_REST_TOKEN=your_token
```

Start the development server:

```bash id="dev"
npm run dev
```

Open:

```
http://localhost:3000
```

---

## Inspiration

The project is loosely inspired by GitCity, which visualizes GitHub activity as cities. LeetCity applies a similar idea to competitive programming by representing LeetCode activity as buildings in a city.

---

## License

MIT License
