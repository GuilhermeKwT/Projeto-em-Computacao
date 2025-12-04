import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { VideoService } from '../../services/video.service';
import { VideoWithOwner } from '../../models/video.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  videos: VideoWithOwner[] = [];
  isLoading = false;
  currentPage = 1;
  totalPages = 1;
  searchQuery = '';
  
  uploaderNameFilter = '';
  minLengthFilter: number | null = null;
  maxLengthFilter: number | null = null;
  sortBy: 'date' | 'likes' | 'length' | 'title' = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';
  showFilters = false;

  constructor(
    private videoService: VideoService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['search'] || '';
      this.loadVideos();
    });
  }

  loadVideos(): void {
    this.isLoading = true;
    this.videoService.getVideos(
      this.currentPage, 
      20, 
      this.searchQuery,
      this.sortBy,
      this.sortOrder
    ).subscribe({
      next: (response) => {
        if (Array.isArray(response)) {
          this.videos = response as any[];
          this.totalPages = 1;
        } else {
          this.videos = response.videos || [];
          this.totalPages = response.pagination?.totalPages || 1;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading videos', error);
        this.isLoading = false;
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadVideos();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadVideos();
  }

  clearFilters(): void {
    this.uploaderNameFilter = '';
    this.minLengthFilter = null;
    this.maxLengthFilter = null;
    this.sortBy = 'date';
    this.sortOrder = 'desc';
    this.currentPage = 1;
    this.loadVideos();
  }
}
