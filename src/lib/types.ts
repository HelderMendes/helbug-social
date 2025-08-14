export function getUserDataSelect(loggedInUserId: string) {
  return {
    id: true,
    username: true,
    displayName: true,
    avatarUrl: true,
    bio: true,
    createdAt: true,

    followers: {
      where: { followerId: loggedInUserId },
      select: { followerId: true },
    },
    _count: {
      select: {
        posts: true,
        followers: true,
      },
    },
  };
}

// Manual type definition instead of Prisma.UserGetPayload
export type UserData = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
  followers: { followerId: string }[];
  _count: {
    posts: number;
    followers: number;
  };
};

export interface FollowerData {
  followerId: string;
}

export function getUserWithFollowersSelect(loggedInUserId: string) {
  return {
    id: true,
    username: true,
    displayName: true,
    avatarUrl: true,
    bio: true,
    createdAt: true,
    followers: {
      select: { followerId: true },
    },
    _count: {
      select: {
        posts: true,
        followers: true,
        following: true,
      },
    },
  };
}

export type UserWithFollowers = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
  followers: { followerId: string }[];
  _count: {
    posts: number;
    followers: number;
    following: number;
  };
};

export function getPostDataInclude(loggedInUserId: string) {
  return {
    user: {
      select: getUserDataSelect(loggedInUserId),
    },
    attachments: true,
    likes: {
      where: { userId: loggedInUserId },
      select: { userId: true },
    },
    bookmarks: {
      where: { userId: loggedInUserId },
      select: { userId: true },
    },
    _count: {
      select: {
        likes: true,
        comments: true,
      },
    },
  };
}

export type PostData = {
  id: string;
  content: string;
  createdAt: Date;
  authorId: string;
  user: UserData;
  attachments: {
    id: string;
    url: string;
    type: string;
    postId: string | null;
  }[];
  likes: { userId: string }[];
  bookmarks: { userId: string }[];
  _count: {
    likes: number;
    comments: number;
  };
};

export interface PostsPage {
  posts: PostData[];
  nextCursor: string | null;
}

export function getCommentDataInclude(loggedInUserId: string) {
  return {
    user: {
      select: getUserDataSelect(loggedInUserId),
    },
  };
}

export type CommentData = {
  id: string;
  content: string;
  createdAt: Date;
  userId: string;
  postId: string;
  user: UserData;
};

export interface CommentsPage {
  comments: CommentData[];
  previousCursor: string | null;
}

export const notificationsInclude = {
  issuer: {
    select: {
      username: true,
      displayName: true,
      avatarUrl: true,
    },
  },
  post: {
    select: {
      content: true,
    },
  },
};

export type NotificationData = {
  id: string;
  type: "LIKE" | "FOLLOW" | "COMMENT";
  createdAt: Date;
  read: boolean;
  issuerId: string;
  recipientId: string;
  postId: string | null;
  issuer: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  post: {
    content: string;
  } | null;
};

export interface NotificationsPage {
  notifications: NotificationData[];
  nextCursor: string | null;
}

export interface FollowerInfo {
  followers: number;
  isFollowedByUser: boolean;
}

export interface LikeInfo {
  likes: number;
  isLikedByUser: boolean;
}

export interface BookmarkInfo {
  isBookmarkedByUser: boolean;
}

export interface NotificationCountInfo {
  unreadCount: number;
}

export interface MessagesCountInfo {
  unreadCount: number;
}
