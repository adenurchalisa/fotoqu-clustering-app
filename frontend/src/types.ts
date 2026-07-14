export type JobStatus = "running" | "done" | "empty" | "error" | "gone";

export interface JobMetrics {
  n_clusters: number;
  n_noise: number;
  noise_pct: number;
  coverage_pct: number;
  silhouette: number | null;
}

export interface FaceStats {
  total_photos: number;
  photos_with_faces: number;
  photos_without_faces: number;
  skipped_errors: number;
  total_faces: number;
}

export interface JobStatusResponse {
  job_id: string;
  status: JobStatus;
  progress_pct: number;
  message: string;
  error?: string;
  metrics?: JobMetrics;
  face_stats?: FaceStats;
  load_seconds?: number;
  face_extract_seconds?: number;
  clustering_seconds?: number;
}

export interface ClusterSummary {
  id: number;
  label: number;
  n_faces: number;
  n_photos: number;
  rep_score: number;
}

export interface ClustersResponse {
  metrics: JobMetrics;
  noise_count: number;
  clusters: ClusterSummary[];
  load_seconds?: number;
  face_extract_seconds?: number;
  clustering_seconds?: number;
}

export interface PhotoRef {
  photo_id: number;
  filename: string;
}
