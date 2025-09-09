// Converting text to HTML defined format
// use case
//  Terdapat data dalam format zip
//  Extract zip ke suatu folder
//  Baca file yang ada pada folder ekstraksi (JSON)
//  Konversi ke HTML
//  Baca di console

import { htmlToText } from 'html-to-text';
import extract from 'extract-zip';
import fs from 'fs';
import path from 'path';
import process from 'process';

const ZIP_PATH = './books.zip';
const EXTRACT_DIR = path.join(process.cwd(), 'Data', 'extracted');

// --- pipeline ---
isZipFileExist(ZIP_PATH)
  .then(doExtract, (err) => {
    console.error('ZIP tidak ditemukan atau tidak bisa diakses:', err?.message || err);
    // penting: tetap melempar agar chain berhenti
    throw err;
  })
  .then(readFileFromPath)
  .then(buildHTML)
  .then((htmlText) => console.log(htmlToText(htmlText)))
  .catch((error) => console.error('Terjadi kesalahan:', error?.message || error));

// --- helpers ---

function isZipFileExist(zipPath) {
  return new Promise(function (resolve, reject) {
    fs.access(zipPath, fs.constants.F_OK | fs.constants.R_OK, function (err) {
      if (err) return reject(err);
      return resolve(zipPath);
    });
  });
}

function ensureDir(dirPath) {
  return new Promise(function (resolve, reject) {
    fs.mkdir(dirPath, { recursive: true }, function (err) {
      if (err) return reject(err);
      return resolve(dirPath);
    });
  });
}

function cleanDir(dirPath) {
  // Hapus folder jika ada, lalu buat ulang
  return new Promise(function (resolve, reject) {
    fs.rm(dirPath, { recursive: true, force: true }, function (err) {
      if (err) return reject(err);
      return ensureDir(dirPath).then(resolve, reject);
    });
  });
}

function doExtract(zipPath) {
  // Pastikan folder ekstraksi bersih dulu
  return cleanDir(EXTRACT_DIR).then(function () {
    // library extract-zip sudah berbasis promise
    return extract(zipPath, { dir: EXTRACT_DIR }).then(function () {
      return EXTRACT_DIR;
    });
  });
}

function listFilesRecursively(startDir) {
  return new Promise(function (resolve, reject) {
    fs.readdir(startDir, { withFileTypes: true }, function (err, entries) {
      if (err) return reject(err);

      const tasks = entries.map(function (ent) {
        const full = path.join(startDir, ent.name);
        if (ent.isDirectory()) {
          return listFilesRecursively(full);
        } else {
          return Promise.resolve([full]);
        }
      });

      Promise.all(tasks)
        .then(function (nested) {
          // flatten
          resolve([].concat.apply([], nested));
        })
        .catch(reject);
    });
  });
}

function readFile(filePath) {
  return new Promise(function (resolve, reject) {
    fs.readFile(filePath, 'utf8', function (err, data) {
      if (err) return reject(err);
      resolve(data);
    });
  });
}

function readFileFromPath(dirPath) {
  // Ambil semua file JSON dari folder hasil ekstraksi (rekursif)
  return listFilesRecursively(dirPath).then(function (files) {
    const jsonFiles = files.filter(function (f) {
      return path.extname(f).toLowerCase() === '.json';
    });

    if (jsonFiles.length === 0) {
      // Jika tidak ada JSON, beri informasi yang jelas
      return Promise.reject(
        new Error('Tidak ditemukan file .json pada hasil ekstraksi.')
      );
    }

    // Baca semua JSON dan gabungkan ke satu array of books
    const readTasks = jsonFiles.map(function (f) {
      return readFile(f)
        .then(function (raw) {
          try {
            const parsed = JSON.parse(raw);
            // Bisa berupa array buku atau satu objek buku
            if (Array.isArray(parsed)) return parsed;
            if (parsed && typeof parsed === 'object') return [parsed];
            return [];
          } catch (e) {
            // Jika JSON tidak valid, abaikan file ini tapi beri peringatan
            console.warn('Peringatan: gagal parse JSON untuk', f, '-', e.message);
            return [];
          }
        });
    });

    return Promise.all(readTasks).then(function (arrs) {
      // Flatten
      const books = [].concat.apply([], arrs);
      if (books.length === 0) {
        return Promise.reject(
          new Error('File JSON terbaca, namun tidak ada data buku yang valid.')
        );
      }
      // Normalisasi minimal fields
      const normalized = books.map(function (b, idx) {
        return {
          name: valueOr(b.name, `Unknown Book #${idx + 1}`),
          price: valueOr(b.price, 'N/A'),
          description: valueOr(b.description, '(tidak ada deskripsi)')
        };
      });
      return normalized;
    });
  });
}

function valueOr(v, fallback) {
  return (v === undefined || v === null || v === '') ? fallback : v;
}

function buildHTML(booksData) {
  return new Promise(function (resolve, reject) {
    try {
      if (!Array.isArray(booksData)) {
        return reject(new Error('Format data buku tidak valid (bukan array).'));
      }

      const cards = booksData.map(function (item) {
        return `
          <div class="book-card">
            <h2>${escapeHTML(item.name)}</h2>
            <b>Price: ${escapeHTML(String(item.price))}</b>
            <br>
            <b>Description:</b>
            <p>${escapeHTML(String(item.description))}</p>
          </div>
        `;
      });

      const htmlDoc = `
        <section class="books">
          <h1>Books</h1>
          ${cards.join('\n')}
        </section>
      `;

      resolve(htmlDoc);
    } catch (error) {
      reject(error);
    }
  });
}

function escapeHTML(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
