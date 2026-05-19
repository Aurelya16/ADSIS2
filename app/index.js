const express = require('express')
const mysql = require('mysql2/promise')
const Minio = require('minio')
const multer = require('multer')
require('dotenv').config()

const app = express()
app.use(express.json())

// koneksi MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
})

// koneksi MinIO
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
})

const BUCKET = 'mahasiswa-files'
const upload = multer({ storage: multer.memoryStorage() })

async function initDB() {
  const conn = await pool.getConnection()
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mahasiswa (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nama VARCHAR(100) NOT NULL,
      nim VARCHAR(20) NOT NULL UNIQUE,
      foto VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
  conn.release()
  console.log('Tabel mahasiswa siap')
}

async function initMinio() {
  const exists = await minioClient.bucketExists(BUCKET)
  if (!exists) {
    await minioClient.makeBucket(BUCKET)
    console.log('Bucket mahasiswa-files dibuat')
  }
}

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Nusantara Tech API jalan!' })
})

app.get('/mahasiswa', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM mahasiswa')
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data' })
  }
})

app.post('/mahasiswa', async (req, res) => {
  try {
    const { nama, nim } = req.body
    if (!nama || !nim) return res.status(400).json({ error: 'Nama dan NIM wajib' })
    const [result] = await pool.execute(
      'INSERT INTO mahasiswa (nama, nim) VALUES (?, ?)',
      [nama, nim]
    )
    res.status(201).json({ message: 'Berhasil ditambahkan', id: result.insertId })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'NIM sudah terdaftar' })
    }
    res.status(500).json({ error: 'Gagal menambahkan data' })
  }
})

app.delete('/mahasiswa/:id', async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM mahasiswa WHERE id = ?',
      [req.params.id]
    )
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Tidak ditemukan' })
    res.json({ message: 'Berhasil dihapus' })
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus data' })
  }
})

app.post('/upload/:id', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File wajib diupload' })
    const fileName = `${req.params.id}-${Date.now()}-${req.file.originalname}`
    await minioClient.putObject(
      BUCKET,
      fileName,
      req.file.buffer,
      req.file.size,
      { 'Content-Type': req.file.mimetype }
    )
    await pool.execute(
      'UPDATE mahasiswa SET foto = ? WHERE id = ?',
      [fileName, req.params.id]
    )
    res.json({ message: 'File berhasil diupload', fileName })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Gagal upload file' })
  }
})

Promise.all([initDB(), initMinio()]).then(() => {
  app.listen(3000, () => console.log('App jalan di port 3000'))
})
