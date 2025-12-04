import { User } from './user.model';

export interface Video {
  id: string;
  userId: string;
  title: string;
  description: string;
  visibility: 'hidden' | 'link-only' | 'public';
  likeCount: number;
  dislikeCount: number;
  date: string;
  videoLength: number;
  video: string;
  thumbnailUrl?: string;
}

export interface VideoWithOwner extends Video {
  owner: User;
}

export interface InitiateUploadRequest {
  title: string;
  description?: string;
  visibility?: string;
  filename: string;
  contentType: string;
  declaredSize: number;
}

export interface InitiateUploadResponse {
  key: string;
  upload: {
    url: string;
    fields: { [key: string]: string };
  };
}

export interface CompleteUploadRequest {
  key: string;
  title: string;
  description?: string;
  visibility?: string;
  videoLength?: number;
}

export interface CompleteUploadResponse {
  video: Video;
}

export interface UpdateVideoRequest {
  title?: string;
  description?: string;
  visibility?: 'hidden' | 'link-only' | 'public';
}

export interface VideoListResponse {
  videos: VideoWithOwner[];
  pagination: {
    page: number;
    pageSize: number;
    totalResults: number;
    totalPages: number;
  };
}
