import logging
import os
import re
import shutil
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests
from googleapiclient.discovery import build  # hanya untuk list files

from src.config import (
    GOOGLE_API_KEY,
    GOOGLE_OAUTH_CLIENT_ID,
    GOOGLE_OAUTH_CLIENT_SECRET,
    GOOGLE_OAUTH_REFRESH_TOKEN,
    TEMP_DIR,
    SUPPORTED_FORMATS,
    MAX_PHOTOS_UPLOAD,
)

logger = logging.getLogger(__name__)

# Token endpoint & scope untuk membangun Credentials dari refresh token.
_OAUTH_TOKEN_URI = "https://oauth2.googleapis.com/token"
_OAUTH_SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]
# API key hanya bisa untuk LISTING metadata; download konten harus lewat URL web
# publik (uc?export=download). URL ini tidak butuh OAuth untuk folder publik, tapi
# akan diputus Google (RemoteDisconnected) bila terlalu banyak request paralel —
# jadi worker sengaja dibatasi dan tiap file punya retry + backoff.
MAX_WORKERS = 5           # worker paralel (>5 memicu throttle/putus koneksi Google)
DOWNLOAD_TIMEOUT = 300    # detik timeout per file (file besar ~14MB butuh >60s di koneksi lambat)
MAX_RETRIES = 3           # percobaan ulang per file saat koneksi diputus
RETRY_BACKOFF = 2         # detik jeda awal, digandakan tiap retry (2s, 4s, ...)


def _get_api_key():
    """Ambil API key dari environment (lihat src/config.py)."""
    return GOOGLE_API_KEY


def _build_oauth_credentials():
    """Bangun google Credentials dari refresh token di config.

    Return Credentials bila ketiga variabel OAuth terisi, atau None kalau OAuth
    belum dikonfigurasi (pemanggil lalu jatuh ke jalur API key/web-URL lama).
    """
    if not (GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET
            and GOOGLE_OAUTH_REFRESH_TOKEN):
        return None
    from google.oauth2.credentials import Credentials
    return Credentials(
        token=None,
        refresh_token=GOOGLE_OAUTH_REFRESH_TOKEN,
        client_id=GOOGLE_OAUTH_CLIENT_ID,
        client_secret=GOOGLE_OAUTH_CLIENT_SECRET,
        token_uri=_OAUTH_TOKEN_URI,
        scopes=_OAUTH_SCOPES,
    )


def _build_service(creds=None):
    """Bangun Drive API service. Pakai OAuth credentials bila ada, else API key."""
    if creds is not None:
        return build("drive", "v3", credentials=creds, cache_discovery=False)
    api_key = _get_api_key()
    if not api_key:
        raise ValueError(
            "GOOGLE_API_KEY belum dikonfigurasi. "
            "Set environment variable GOOGLE_API_KEY (mis. lewat file .env)."
        )
    return build("drive", "v3", developerKey=api_key, cache_discovery=False)


_INVALID_FILENAME_CHARS = re.compile(r'[\\/:*?"<>|]')


def _sanitize_filename(name):
    """Ganti karakter yang tidak valid di nama file Windows (mis. '/') dengan '_'.

    Google Drive mengizinkan karakter seperti '/' pada nama file/folder, tapi Windows
    melarangnya (dianggap pemisah path) — tanpa sanitasi ini menyebabkan WinError 3
    saat os.path.join menafsirkan nama file sebagai subfolder yang tidak ada.
    """
    return _INVALID_FILENAME_CHARS.sub("_", name).strip()


def extract_drive_id(link):
    """Ekstrak folder/file ID dari Google Drive link."""
    folder_match = re.search(r'/folders/([a-zA-Z0-9_-]+)', link)
    if folder_match:
        return folder_match.group(1), "folder"

    file_match = re.search(r'/file/d/([a-zA-Z0-9_-]+)', link)
    if file_match:
        return file_match.group(1), "file"

    id_match = re.search(r'[?&]id=([a-zA-Z0-9_-]+)', link)
    if id_match:
        return id_match.group(1), "file"

    return None, None


def _list_files_recursive(service, folder_id):
    """List semua file foto di folder secara rekursif, dengan pagination."""
    files = []
    page_token = None

    while True:
        response = service.files().list(
            q=f"'{folder_id}' in parents and trashed=false",
            fields="nextPageToken, files(id, name, mimeType)",
            pageToken=page_token,
            pageSize=1000,
        ).execute()

        for item in response.get("files", []):
            if item["mimeType"] == "application/vnd.google-apps.folder":
                files.extend(_list_files_recursive(service, item["id"]))
            elif any(item["name"].lower().endswith(ext) for ext in SUPPORTED_FORMATS):
                files.append(item)

            if len(files) >= MAX_PHOTOS_UPLOAD:
                return files

        page_token = response.get("nextPageToken")
        if not page_token:
            break

    return files


_HTML_SIGNATURES = (b"<!DOCTYPE", b"<!doctype", b"<html", b"<HTML")


def _is_html(data: bytes) -> bool:
    stripped = data.lstrip()
    return any(stripped.startswith(sig) for sig in _HTML_SIGNATURES)


def _extract_confirm_url(html_text: str, file_id: str) -> str:
    """Ekstrak URL download dengan token konfirmasi dari halaman HTML Google Drive."""
    # Format baru (2024+): /uc?id=...&export=download&confirm=t&uuid=...
    uuid_match = re.search(r'uuid=([0-9A-Za-z_\-]+)', html_text)
    if uuid_match:
        return (f"https://drive.google.com/uc?export=download"
                f"&id={file_id}&confirm=t&uuid={uuid_match.group(1)}")
    # Format lama: confirm=XXXX
    confirm_match = re.search(r'confirm=([0-9A-Za-z_\-]+)', html_text)
    if confirm_match:
        return (f"https://drive.google.com/uc?export=download"
                f"&id={file_id}&confirm={confirm_match.group(1)}")
    # Fallback
    return f"https://drive.google.com/uc?export=download&id={file_id}&confirm=t"


def _download_once(file_id, dest_path):
    """Satu percobaan download via URL web publik Google Drive.

    API key TIDAK bisa dipakai untuk mengunduh konten file (hanya listing) —
    Google memblokir alt=media dengan halaman 'automated queries'. Untuk folder
    publik, URL uc?export=download tidak butuh OAuth. HTML dideteksi dari bytes
    pertama (bukan Content-Type) agar halaman konfirmasi file besar tidak
    tersimpan sebagai gambar.
    """
    session = requests.Session()
    url = f"https://drive.google.com/uc?export=download&id={file_id}"

    response = session.get(url, stream=True, timeout=DOWNLOAD_TIMEOUT)
    response.raise_for_status()

    # Baca chunk pertama untuk mendeteksi apakah response adalah HTML
    first_chunk = b""
    for chunk in response.iter_content(chunk_size=8192):
        if chunk:
            first_chunk = chunk
            break

    if _is_html(first_chunk):
        # Google mengembalikan halaman konfirmasi — ekstrak token & ulangi
        html_text = first_chunk.decode("utf-8", errors="ignore")
        for chunk in response.iter_content(chunk_size=65536):
            if chunk:
                html_text += chunk.decode("utf-8", errors="ignore")
            if len(html_text) > 200_000:
                break
        confirm_url = _extract_confirm_url(html_text, file_id)
        response = session.get(confirm_url, stream=True, timeout=DOWNLOAD_TIMEOUT)
        response.raise_for_status()
        first_chunk = b""
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                first_chunk = chunk
                break
        if _is_html(first_chunk):
            raise RuntimeError("Google Drive mengembalikan HTML, bukan file gambar. "
                               "Pastikan folder di-set 'Anyone with the link'.")

    with open(dest_path, "wb") as f:
        f.write(first_chunk)
        for chunk in response.iter_content(chunk_size=1024 * 1024):
            if chunk:
                f.write(chunk)


def _download_file(api_key, file_id, dest_path):
    """Download satu file dengan retry + exponential backoff.

    Google kadang memutus koneksi (RemoteDisconnected) saat banyak request
    berdekatan. Error koneksi transient dicoba ulang hingga MAX_RETRIES kali;
    RuntimeError (HTML konfirmasi) tidak diulang karena bukan masalah transient.
    """
    last_exc = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            _download_once(file_id, dest_path)
            return
        except (requests.exceptions.ConnectionError,
                requests.exceptions.Timeout,
                requests.exceptions.ChunkedEncodingError) as e:
            last_exc = e
            if attempt < MAX_RETRIES:
                delay = RETRY_BACKOFF * (2 ** (attempt - 1))
                logger.info("Retry %d/%d untuk file %s setelah %ds (%s)",
                            attempt, MAX_RETRIES - 1, file_id, delay, e)
                time.sleep(delay)
    raise last_exc


def _download_once_oauth(authed_session, file_id, dest_path):
    """Satu percobaan download via Drive API alt=media dengan OAuth Bearer token.

    Endpoint API mengembalikan bytes mentah (bukan halaman HTML konfirmasi seperti
    URL web publik), jadi tidak butuh deteksi HTML / token konfirmasi. OAuth membuat
    request dihitung sebagai identitas terautentikasi, sehingga tidak di-throttle.
    """
    url = f"https://www.googleapis.com/drive/v3/files/{file_id}?alt=media"
    with authed_session.get(url, stream=True, timeout=DOWNLOAD_TIMEOUT) as response:
        response.raise_for_status()
        with open(dest_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    f.write(chunk)


def _download_file_oauth(authed_session, file_id, dest_path):
    """Download satu file lewat OAuth dengan retry + exponential backoff (transient)."""
    last_exc = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            _download_once_oauth(authed_session, file_id, dest_path)
            return
        except (requests.exceptions.ConnectionError,
                requests.exceptions.Timeout,
                requests.exceptions.ChunkedEncodingError) as e:
            last_exc = e
            if attempt < MAX_RETRIES:
                delay = RETRY_BACKOFF * (2 ** (attempt - 1))
                logger.info("Retry %d/%d untuk file %s setelah %ds (%s)",
                            attempt, MAX_RETRIES - 1, file_id, delay, e)
                time.sleep(delay)
    raise last_exc


def _download_all_parallel(files, output_dir, creds=None, progress_callback=None):
    """Download semua file secara paralel. Return: (list of path, first_error).

    Bila `creds` (OAuth) diberikan, pakai jalur alt=media terautentikasi (cepat,
    tanpa throttle). Bila None, jatuh ke jalur web-URL publik lama (`_download_file`).
    """
    photo_paths = []
    first_error = [None]
    lock = threading.Lock()
    completed = [0]

    use_oauth = creds is not None
    if use_oauth:
        # Pre-refresh token sekali agar semua worker mulai dengan access token valid,
        # menghindari beberapa thread me-refresh bersamaan di awal batch.
        from google.auth.transport.requests import Request
        creds.refresh(Request())
        # Tiap thread punya AuthorizedSession sendiri (requests.Session tidak aman
        # dipakai lintas thread), tapi berbagi objek Credentials yang sama.
        thread_local = threading.local()

        def _session():
            s = getattr(thread_local, "session", None)
            if s is None:
                from google.auth.transport.requests import AuthorizedSession
                s = AuthorizedSession(creds)
                thread_local.session = s
            return s

    def download_one(file_meta):
        safe_name = _sanitize_filename(file_meta["name"])
        dest_path = os.path.join(output_dir, safe_name)
        if os.path.exists(dest_path):
            base, ext = os.path.splitext(safe_name)
            dest_path = os.path.join(output_dir, f"{base}_{file_meta['id'][:6]}{ext}")
        try:
            if use_oauth:
                _download_file_oauth(_session(), file_meta["id"], dest_path)
            else:
                _download_file(None, file_meta["id"], dest_path)
            return dest_path, file_meta["name"]
        except Exception as e:
            logger.warning("Gagal unduh '%s': %s", file_meta["name"], e)
            # Simpan error pertama untuk ditampilkan ke user
            with lock:
                if first_error[0] is None:
                    first_error[0] = str(e)
            # Hapus file parsial
            if os.path.exists(dest_path):
                try:
                    os.remove(dest_path)
                except OSError:
                    pass
            return None, file_meta["name"]

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(download_one, f): f for f in files}
        for future in as_completed(futures):
            dest_path, filename = future.result()
            with lock:
                completed[0] += 1
                if dest_path:
                    photo_paths.append(dest_path)
                if progress_callback:
                    progress_callback(completed[0], len(files), filename)

    return photo_paths, first_error[0]


def download_from_drive(link, output_dir=None, progress_callback=None):
    """
    Download foto dari Google Drive menggunakan Google Drive API v3.
    - progress_callback(current, total, filename) dipanggil setiap file selesai diunduh.
    Return: (photo_paths, error_message)
    """
    if output_dir is None:
        output_dir = os.path.join(TEMP_DIR, "drive_photos")

    # Bersihkan sisa sesi sebelumnya
    # ignore_errors=True: Windows mengunci file yang sedang dipakai proses lain,
    # file lama yang terkunci dibiarkan — tidak mempengaruhi hasil karena
    # photo_paths hanya berisi file yang baru diunduh
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir, ignore_errors=True)
    os.makedirs(output_dir, exist_ok=True)

    drive_id, link_type = extract_drive_id(link)
    if drive_id is None:
        return [], "Link Google Drive tidak valid. Pastikan formatnya benar."

    creds = _build_oauth_credentials()
    logger.info("Metode download Drive: %s", "OAuth (alt=media)" if creds else "web-URL publik (fallback)")

    try:
        service = _build_service(creds)
    except ValueError as e:
        return [], str(e)

    try:
        if link_type == "folder":
            files = _list_files_recursive(service, drive_id)
        else:
            meta = service.files().get(fileId=drive_id, fields="id, name, mimeType").execute()
            if any(meta["name"].lower().endswith(ext) for ext in SUPPORTED_FORMATS):
                files = [meta]
            else:
                files = []
    except Exception as e:
        return [], f"Gagal membaca isi Google Drive: {str(e)}"

    if not files:
        return [], "Tidak ada foto valid ditemukan. Pastikan folder berisi file JPG/PNG/HEIC."

    files = files[:MAX_PHOTOS_UPLOAD]

    photo_paths, download_error = _download_all_parallel(
        files, output_dir, creds=creds, progress_callback=progress_callback
    )

    if not photo_paths:
        detail = f" Detail: {download_error}" if download_error else ""
        return [], f"Semua file gagal diunduh. Pastikan folder di-set 'Anyone with the link'.{detail}"

    return photo_paths, None
