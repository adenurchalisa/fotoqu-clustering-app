"""Skrip setup OAuth 2.0 SEKALI PAKAI — dapatkan refresh token untuk download Drive.

Dijalankan sekali oleh PEMILIK aplikasi secara lokal. Hasilnya (refresh token +
client id/secret) disalin ke backend/.env. Setelah itu, user aplikasi TIDAK perlu
login apapun — mereka tetap hanya menempel link folder Drive publik.

## Langkah di Google Cloud Console (sekali saja):
1. Buka https://console.cloud.google.com/ → pilih/buat project.
2. APIs & Services → Library → aktifkan "Google Drive API".
3. APIs & Services → OAuth consent screen:
   - User type: External. Isi nama app & email.
   - Tambahkan scope: .../auth/drive.readonly
   - Di "Test users", tambahkan akun Google-mu sendiri.
   (Catatan: di mode "Testing", refresh token berumur ~7 hari — regenerasi via skrip
   ini bila kedaluwarsa, atau publish consent screen ke "Production".)
4. APIs & Services → Credentials → Create Credentials → OAuth client ID:
   - Application type: Desktop app.
   - Unduh JSON-nya (mis. client_secret_xxx.json).

## Cara pakai:
    cd backend
    python scripts/get_drive_token.py path/ke/client_secret_xxx.json

Browser akan terbuka untuk consent. Setelah selesai, skrip mencetak 3 nilai untuk
disalin ke backend/.env:
    GOOGLE_OAUTH_CLIENT_ID=...
    GOOGLE_OAUTH_CLIENT_SECRET=...
    GOOGLE_OAUTH_REFRESH_TOKEN=...
"""
import sys

# Read-only: cukup untuk listing + download, tidak bisa mengubah/menghapus file user.
SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]


def main():
    if len(sys.argv) != 2:
        print("Usage: python scripts/get_drive_token.py <client_secret.json>")
        sys.exit(1)

    client_secret_path = sys.argv[1]

    try:
        from google_auth_oauthlib.flow import InstalledAppFlow
    except ImportError:
        print("Paket 'google-auth-oauthlib' belum terpasang. Jalankan:")
        print("    pip install -r requirements.txt")
        sys.exit(1)

    flow = InstalledAppFlow.from_client_secrets_file(client_secret_path, SCOPES)
    # access_type=offline + prompt=consent memastikan Google mengembalikan refresh_token.
    creds = flow.run_local_server(
        port=0,
        access_type="offline",
        prompt="consent",
    )

    if not creds.refresh_token:
        print("\nGagal mendapatkan refresh token. Coba ulangi (pastikan mencabut akses "
              "lama di https://myaccount.google.com/permissions bila perlu).")
        sys.exit(1)

    print("\n" + "=" * 64)
    print("BERHASIL. Salin baris berikut ke backend/.env:")
    print("=" * 64)
    print(f"GOOGLE_OAUTH_CLIENT_ID={creds.client_id}")
    print(f"GOOGLE_OAUTH_CLIENT_SECRET={creds.client_secret}")
    print(f"GOOGLE_OAUTH_REFRESH_TOKEN={creds.refresh_token}")
    print("=" * 64)


if __name__ == "__main__":
    main()
