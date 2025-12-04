export interface Like {
  id: string;
  userId: string;
  videoId: string;
  type: 'like' | 'dislike';
}

export interface ToggleLikeRequest {
  type: 'like' | 'dislike';
}

export interface LikeStatusResponse {
  status: 'like' | 'dislike' | 'none';
}

export interface LikeCountsResponse {
  likes: number;
  dislikes: number;
}
