export class IdbWrapper {

    /** @type {IDBDatabase} */
    #db;

    constructor(db) {
        this.#db = db;
    }

    /** 
     * @param {string} dbName
     * @param {number} version
     * @returns {Promise<IdbWrapper>}
     */
    static open(dbName, version) {
        return new Promise((resolve, fail) => {
            const request = window.indexedDB.open(dbName, version);
            request.onerror = fail;

            request.onsuccess = (event) => {
                /** @type {IDBDatabase} */
                const db = event.target.result;
                console.log({ db });
                const dbw = new IdbWrapper(db);
                resolve(dbw);
            };

            // init db structure
            request.onupgradeneeded = function (ev) {
                /** @type {IDBDatabase} */
                const db = ev.target.result;

                const tbl = db.createObjectStore('lsa');
                console.log({ tbl });

            };

            request.onblocked = function (ev) {
                /** @type {IDBDatabase} */
                const db = ev.target.result;

                fail(ev);
                alert('please close other tabs to allow upgrade');
            };
        });
    }

    /** 
     * @param {string[]} objectStoreNames
     * @param {(transaction: IDBTransaction) => void} todo
     */
    newTransaction(objectStoreNames, todo) {
        return new Promise((resolve, fail) => {
            const db = this.#db;
            const transaction = db.transaction(objectStoreNames, 'readwrite');
            transaction.oncomplete = resolve;
            transaction.onerror = (ev) => {
                // console.warn(ev);
                fail(ev.target.error);
            };

            todo(transaction);
        });
    }

    /** 
     * @param {string} objectStoreName
     * @param {Iterator<[key: (string | number | object), value: any]>} iterator
    */
    add(objectStoreName, iterator) {
        return new Promise((resolve, fail) => {
            const db = this.#db;
            const transaction = db.transaction(objectStoreName, 'readwrite');
            transaction.oncomplete = resolve;
            transaction.onerror = (ev) => {
                // console.warn(ev);
                fail(ev.target.error);
            };;

            const tbl = transaction.objectStore(objectStoreName);
            for (
                let r = iterator.next();
                r.done === false;
                r = iterator.next()
            ) {
                const x = r.value;
                tbl.add(x[1], x[0]);
            }
        });
    }

    /** 
     * @param {string} objectStoreName
     * @param {Iterator<[key: (string | number | object), value: any]>} iterator
    */
    update(objectStoreName, iterator) {
        return new Promise((resolve, fail) => {
            const db = this.#db;
            const transaction = db.transaction(objectStoreName, 'readwrite');
            transaction.oncomplete = resolve;
            transaction.onerror = (ev) => {
                // console.warn(ev);
                fail(ev.target.error);
            };;

            const tbl = transaction.objectStore(objectStoreName);
            for (
                let r = iterator.next();
                r.done === false;
                r = iterator.next()
            ) {
                const x = r.value;
                tbl.put(x[1], x[0]);
            }
        });

    }

    /** 
     * @param {string} objectStoreName
     * @param {string | number} id
    */
    read(objectStoreName, id) {
        return new Promise((resolve, fail) => {
            const db = this.#db;
            const transaction = db.transaction(objectStoreName, 'readonly');
            const request = transaction.objectStore(objectStoreName).get(id);
            request.onerror = fail;
            request.onsuccess = ev => {
                // console.log({ event: ev, result: request.result });
                resolve(request.result);
            };
        });
    }

    /** 
     * @param {string} objectStoreName
     * @param {(string | number)[]} rowIDs
    */
    delete(objectStoreName, rowIDs) {
        return new Promise((resolve, fail) => {
            const db = this.#db;
            const request = db.transaction(objectStoreName, "readwrite");
            request.onerror = fail;
            request.onsuccess = ev => {
                // console.log({ event: ev, result: request.result });
                resolve(request.result);
            };
            const tbl = request.objectStore(objectStoreName);
            const len = rowIDs.length;
            for (let i = 0; i < len; ++i) {
                tbl.delete(rowIDs[i]);
            }
        });
    }



    /** 
    * @param {string} objectStoreName
    */
    _all(objectStoreName) {
        const db = this.#db;
        const tbl = db.transaction(objectStoreName, 'readonly').objectStore(objectStoreName);
        const cursor = tbl.openCursor();
        cursor.onerror = console.error;
        cursor.onsuccess = (ev) => {
            /** @type {IDBCursorWithValue} */
            const cursor = ev.target.result;
            if (!cursor) return;
            const k = cursor.key, v = cursor.value;
            console.log({ cursor, k, v });
            cursor.continue();
        };
    }

    /** 
     * @param {string} objectStoreName
     * @param {(key: (string | number), value: any) => boolean} callback 
     * */
    readAll(objectStoreName, callback) {
        return new Promise((done, fail) => {
            const db = this.#db;
            const tbl = db.transaction(objectStoreName, 'readonly').objectStore(objectStoreName);
            const cursor = tbl.openCursor();

            cursor.onerror = (ev) => {
                // console.warn(ev);
                fail(ev.target.error);
            };

            cursor.onsuccess = (ev) => {
                /** @type {IDBCursorWithValue} */
                const cursor = ev.target.result;
                if (!cursor) { done(); return; }
                const doContinue = callback(cursor.key, cursor.value);
                if (doContinue === false) { done(); return; }
                cursor.continue();
            };
        });
    }

}


async function compress(str) {
    const blob = new Blob([str]);
    const s = blob.stream();
    const c = s.pipeThrough(new CompressionStream('gzip'));
    const r = new Response(c);
    const a = new Uint8Array(await r.arrayBuffer());
    return a;
}

async function decompress(a) {
    // let a = new Uint8Array(bytes);
    const c = new DecompressionStream('gzip');
    const w = c.writable.getWriter();
    w.write(a);
    w.close();
    const r = new Response(c.readable);
    const v = await r.text();

    return v;

}