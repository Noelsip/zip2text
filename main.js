// Synchronous code
// Membiarkan blocking code berjalan secara berurutan
displayMessage();

const readFile = fs.readFileSync('path/to/file');
console.log(readFile);

doSomethingElse();

// Asynchronous code
// Membiarkan non-blocking code berjalan secara bersamaan dengan event loop dan callback function 
displayMessage();

fs.readFile('path/to/file', function (err, data) {
    if (err) {
        throw err;
    }
    console.log(data);
});

doSomethingElse();


// Concurrency dan Parallel

// Concurrency: Menjalankan beberapa tugas secara bersamaan dengan event loop
// Parallel: Menjalankan beberapa tugas secara bersamaan dengan multiple threads


// Callback-style dan chaining function
// Callback-style: Menggunakan callback function untuk menangani hasil dari operasi asynchronous
// Chaining function: Menggunakan method chaining untuk menangani hasil dari operasi asynchronous


// Promise
// Promise status
// - Pending: Janji belum terpenuhi atau ditolak
// - Fulfilled: Janji terpenuhi dengan hasil tertentu
// - Rejected: Janji ditolak dengan alasan tertentu

// Contoh pembuatan promise
function doSomeThing(...params) {
    return new Promise(function (resolve, reject) {
        try {
            if (result.success) {
                resolve(result.data);
            } else {
                reject(result.error);
            }
        } catch (error) {
            reject(error);
        }
    });
}

doSomeThing()
    .then((data) => console.log(data))
    .catch((error) => console.error(error));



// Promise dalam keseharian
fetch('https://api.github.com/users/username')
    .then(response => response.json())
    .then(parseData)
    .then(showData)
    .catch(console.error);

function delay(timeInMillis) {
    return  new Promise(
        (resolve) => setTimeout(resolve, timeInMillis
        )
    );
}

delay(3000)
    .then(doSomeThing)
    .then(() => delay(1000))
    .then(doSomethingElse)
    .catch(console.error);