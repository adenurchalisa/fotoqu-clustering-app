import type { ClustersResponse, JobStatusResponse, PhotoRef } from "../types";

export const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000";

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      detail = (await res.json()).detail ?? detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export async function uploadFiles(files: File[]): Promise<{ job_id: string }> {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  const res = await fetch(`${API_URL}/api/jobs/upload`, { method: "POST", body: form });
  return jsonOrThrow(res);
}

export async function startDriveJob(link: string): Promise<{ job_id: string }> {
  const res = await fetch(`${API_URL}/api/jobs/drive`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ link }),
  });
  return jsonOrThrow(res);
}

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  return jsonOrThrow(await fetch(`${API_URL}/api/jobs/${jobId}`));
}

export async function getClusters(jobId: string): Promise<ClustersResponse> {
  return jsonOrThrow(await fetch(`${API_URL}/api/jobs/${jobId}/clusters`));
}

export async function getClusterPhotos(jobId: string, cid: number): Promise<PhotoRef[]> {
  const data = await jsonOrThrow<{ photos: PhotoRef[] }>(
    await fetch(`${API_URL}/api/jobs/${jobId}/clusters/${cid}/photos`)
  );
  return data.photos;
}

// URL builders untuk <img> dan download (dipakai langsung di tag, bukan fetch)
export const clusterThumbUrl = (jobId: string, cid: number) =>
  `${API_URL}/api/jobs/${jobId}/clusters/${cid}/thumb`;

export const fullPhotoUrl = (jobId: string, photoId: number) =>
  `${API_URL}/api/jobs/${jobId}/photos/${photoId}`;

export const noiseThumbUrl = (jobId: string, idx: number) =>
  `${API_URL}/api/jobs/${jobId}/noise/${idx}/thumb`;

export const downloadUrl = (jobId: string, cids: number[]) =>
  `${API_URL}/api/jobs/${jobId}/download?cids=${cids.join(",")}`;

export const progressStreamUrl = (jobId: string) =>
  `${API_URL}/api/jobs/${jobId}/progress`;
