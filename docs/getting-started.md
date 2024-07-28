# Y

Y is a social network that is based on X, which allows people to join by creating accounts. Each user should provide a uername, a display name, an email, and a password to create an account. The email address should not link to any account in the system.

After joining Y, users can update their profile info like Avatar, Header, Location and a short description about themselves.

Users can write posts that contain text content and image. Users can like, unlike, repost, undo repost or bookmark a post or a reply.

Users can follow each other. After following someone, a user can view posts of that user in Following tab.

## User Stories

### Authentication

- [] As a user, I can register for a new account with my username, display name, email and password.
- [] As a user, I can sign in with my email and password.

### Users

- [] As a user, I can see a list other users so that I can follow.
- [] As a user, I can get my current profile info (stay signed in after page refresh).
- [] As a user, I can see the profile of a specific user given a username.
- [] As a user, I can update my profile info like Avatar, Header, Location and short description.

### Posts

- [] As a user, I can see a list of posts.
- [] As a user, I can create a new post with text content and image.
- [] As a user, I can edit my posts.
- [] As a user, I can delete my posts.

### Replies

- [] As a user, I can see a list of replies on a post.
- [] As a user, I can write replies on a post.
- [] As a user, I can update my replies.
- [] As a user, I can delete my replies.

### Hashtags

- [] As a user, I can use hashtags when writing a post which starts with a #.
- [] As a user, I can create new hashtags when writing a post which starts with a #.

### Likes

- [] As a user, I can like or unlike a post or a comment.

### Reposts

- [] As a user, I can repost a post or a reply.

### Bookmarks

- [] As a user, I can bookmark a post or a reply.

### Follow

- [] As a user, I can follow or unfollow another user.
- [] As a user, I can see a list of users that I followed.
- [] As a user, I can see a list of users that followed me.

### Chat

- [] As a user, I can chat with another user.

### Notifications

- [] As a user, I will receive notifications when I have replies to one of my posts, get mentioned in a post or reply, get followed by other users, or when other users repost one of my posts or replies

## Endpoint APIs

### Auth APIs

```javascript
/**
 * @route POST /auth/login
 * @description Log in with email and password
 * @body {email, password}
 * @access Public
 */
```

### User APIs

```javascript
/**
 * @route POST /users
 * @description Register new user
 * @body {username, diplayName, email, password}
 * @access Public
 */
```

```javascript
/**
 * @route GET /users?page=1&limit=10
 * @description Get users with pagination
 * @access Login required
 */
```

```javascript
/**
 * @route GET /users/me
 * @description Get current user info
 * @access Login required
 */
```

```javascript
/**
 * @route GET /users/:id
 * @description Get a user profile
 * @access Login required
 */
```

```javascript
/**
 * @route GET /users/:username
 * @description Get a user profile
 * @access Login required
 */
```

```javascript
/**
 * @route PUT /users/:id
 * @description Update user profile
 * @body {displayName, avatar, header, bio, location}
 * @access Login required
 */
```

### Post APIs

```javascript
/**
 * @route GET /posts/?page=1&limit=10
 * @description Get all posts of all users except posts of current user
 * @access Login required
 */
```

```javascript
/**
 * @route GET /posts/followees?page=1&limit=10
 * @description Get all posts of users that the current user are following
 * @access Login required
 */
```

```javascript
/**
 * @route GET /posts/user/:userId?page=1&limit=10
 * @description Get all posts of a single user
 * @access Login required
 */
```

```javascript
/**
 * @route POST /posts
 * @description Create a new post
 * @body {content, mediaFile}
 * @access Login required
 */
```

```javascript
/**
 * @route POST /posts/repost/
 * @description Create a repost of post
 * @body {repostType, repostId}
 * @access Login required
 */
```

```javascript
/**
 * @route DELETE /posts/repost/
 * @description Delete a repost of post
 * @body {repostId}
 * @access Login required
 */
```

```javascript
/**
 * @route PUT /posts/original/:id
 * @description Update a post
 * @body {content, mediaFile}
 * @access Login required
 */
```

```javascript
/**
 * @route DELETE /posts/original/:id
 * @description Delete
 * @access Login required
 */
```

```javascript
/**
 * @route GET /posts/original/:id
 * @description Get a single post
 * @access Login required
 */
```

### Reply APIs

```javascript
/**
 * @route POST /replies
 * @description Create a new reply
 * @body {content, mediaFile, targetType, targetId}
 * @access Login required
 */
```

```javascript
/**
 * @route PUT /replies/original/:id
 * @description Update a reply
 * @body {content, mediaFile}
 * @access Login required
 */
```

```javascript
/**
 * @route DELETE /replies/original/:id
 * @description Delete a reply
 * @access Login required
 */
```

```javascript
/**
 * @route GET /replies/:targetType/:targetId?page=1&limit=10
 * @description Get replies of a post or a reply
 * @access Login required
 */
```

```javascript
/**
 * @route GET /replies/user/:userId?page=1&limit=10
 * @description Get replies of a single user
 * @access Login required
 */
```

```javascript
/**
 * @route GET /replies/original/:id
 * @description Get details of a reply
 * @access Login required
 */
```

```javascript
/**
 * @route POST /replies/repost/
 * @description Create a repost of reply
 * @body {repostType, repostId}
 * @access Login required
 */
```

```javascript
/**
 * @route DELETE /replies/repost/
 * @description Delete a repost of reply
 * @body {repostId}
 * @access Login required
 */
```

### Like APIs

```javascript
/**
 * @route POST /likes
 * @description Save a like to a post or reply
 * @body {targetType: 'Post' or 'Reply', target}
 * @access Login required
 */
```

```javascript
/**
 * @route GET /likes/user/:userId
 * @description Get liked targets of single user
 * @access Login required
 */
```

### Follow APIs

```javascript
/**
 * @route POST /follows
 * @description Follow user
 * @body {followeeId: targetUserId}
 * @access Login required
 */
```

```javascript
/**
 * @route DELETE /follows/
 * @description Unfollow user
 * @body {followeeId: targetUserId}
 * @access Login required
 */
```

```javascript
/**
 * @route GET /follows/:userId/followers
 * @description Get a list of followers of user
 * @access Login required
 */
```

```javascript
/**
 * @route GET /follows/:userId/followees
 * @description Get a list of followees of user
 * @access Login required
 */
```

### Hashtag APIs

```javascript
/**
 * @route GET /hashtags
 * @description Get a list of hashtags
 * @access Login required
 */
```

```javascript
/**
 * @route POST /hashtags
 * @description Create hashtags for a post
 * @body {postId, hashtags}
 * @access Login required
 */
```

### Bookmark APIs

```javascript
/**
 * @route GET /bookmarks
 * @description Get a list of bookmarks
 * @access Login required
 */
```

```javascript
/**
 * @route POST /bookmarks
 * @description Create bookmark of a post or a reply
 * @body {targetType, targetId}
 * @access Login required
 */
```

```javascript
/**
 * @route DELETE /bookmarks
 * @description Delete bookmark of a post or a reply
 * @body {targetType, targetId}
 * @access Login required
 */
```

### Message APIs

```javascript
/**
 * @route POST /messages
 * @description Create a new message
 * @body {content, to: userId}
 * @access Login required
 */
```

```javascript
/**
 * @route GET /messages/users
 * @description Get a list of chat users of the current user
 * @access Login required
 */
```

```javascript
/**
 * @route GET /messages/users/:userId
 * @description Get single chat user of the current user
 * @access Login required
 */
```

```javascript
/**
 * @route PUT /messages/status
 * @description Update status of messages , {isRead: true}
 * @body {messages: [messageId]}
 * @access Login required
 */
```

### Notification APIs

```javascript
/**
 * @route POST /notifications/mentions
 * @description Create a new notification for mentions
 * @body {mentionLocationType: 'Post' | 'Reply, mentionLocation: postId | ReplyId, mentionedTargets: [userId]}
 * @access Login required
 */
```

```javascript
/**
 * @route GET /notifications
 * @description Get a list of notifications of the current user
 * @access Login required
 */
```

```javascript
/**
 * @route PUT /notifications/status
 * @description Update status of notifications , {isRead: true}
 * @body {notifs: [notifId]}
 * @access Login required
 */
```
