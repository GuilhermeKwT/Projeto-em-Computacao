export interface Comment {
  id: string;
  userId: string;
  videoId: string;
  text: string;
  date: string;
}

export interface CommentWithUser extends Comment {
  user: User;
}

import { User } from './user.model';

export interface CreateCommentRequest {
  text: string;
}

export interface CommentsResponse {
  comments: CommentWithUser[];
  pagination: {
    page: number;
    pageSize: number;
    totalResults: number;
    totalPages: number;
  };
}
