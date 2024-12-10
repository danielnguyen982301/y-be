# BackEnd for Project Y

## What is Project Y?

- Y is a social network that is based on X, which allows people to join by creating accounts. Each user should provide a username, a display name, an email, and a password to create an account. The email address should not link to any account in the system.

- After joining Y, users can update their profile info like Avatar, Header, Location and a short description about themselves.

- Users can write posts that contain text content, which includes hashtags, and image. Users can like, unlike, repost, undo repost or bookmark a post or a reply.

- Users can follow each other. After following someone, a user can view posts of that user in Following tab.

- Users can view other users' profile.

- Users can chat with each other and receive notifications when they have replies to one of their posts, get mentioned in a post or reply, get followed by other users, or when other users repost one of their posts or replies.

## Tech Stack

### Express.js + Typescript

- A Node.js framework comes with various other utilities for designing API, such as routing, validation and more.

### MongoDB

- Non-relational database for more flexibility.

### Joi

- Library for convenient validation

### Socket.io

- To handle real-time update of messages between users.

### Other libraries like Bcryptjs, Nodemon, Dotenv, etc.

## Production Link

- Check out the app here: <https://danielnguyen-y-fe.vercel.app/>

- **Note**: The backend of the app is deployed with a free account. It will go to sleep after being inactive for a while. It will re-activate within at least 1 - 3 minutes after an attempt to call an API. (You will get error 504 during that time)
