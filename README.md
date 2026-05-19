# Nusantara Tech — Development Environment in a Box

Proyek ini menyediakan lingkungan development terisolasi
menggunakan Docker Compose untuk aplikasi Sistem Informasi Akademik.

## Layanan yang Tersedia

| Layanan | Container | Port | Keterangan |
|---------|-----------|------|------------|
| Web App | nusantara_app | 3000 | API CRUD Mahasiswa |
| Database | nusantara_db | 3306 | MySQL 8.0 |
| Object Storage | nusantara_minio | 9000/9001 | MinIO |

## Prasyarat

- OS: Ubuntu 24.04
- Docker v29+
- Docker Compose v2+

## Cara Menjalankan

### 1. Clone repository
git clone https://github.com/Aurelya16/ADSIS2.git
cd nusantara-tech

### 2. Setup environment
cp .env.example .env
nano .env

### 3. Jalankan semua service
docker compose up -d

### 4. Cek status
docker compose ps

## Akses Layanan

- Web App   : http://100.71.232.23:3000
- MinIO UI  : http://100.71.232.23:9001

## Bukti Pengujian

### 1. Semua container hidup
(screenshot docker compose ps)

### 2. API tambah mahasiswa berhasil
(screenshot curl POST)

### 3. Data tersimpan di MySQL via phpMyAdmin
(screenshot phpMyAdmin tabel mahasiswa)

### 4. File upload masuk ke MinIO bucket
(screenshot MinIO dashboard)

## Cara Menggunakan API

### Tambah mahasiswa
curl -X POST http://100.71.232.23:3000/mahasiswa -H "Content-Type: application/json" -d '{"nama":"Nama","nim":"NIM"}'

### Lihat semua mahasiswa
curl http://100.71.232.23:3000/mahasiswa

### Hapus mahasiswa
curl -X DELETE http://100.71.232.23:3000/mahasiswa/1
