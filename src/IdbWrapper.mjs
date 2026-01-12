class IdbObjectStoreWrapper {
    /** @type {IDBObjectStore} */
    #objectStore;
    constructor(objectStore) {
        this.#objectStore = objectStore;
    }

    get indexName() {
        return this.#objectStore.index('indexName');
    }
}

async function example() {
    /** @type {IdbWrapper} */
    const idbWrapper = await IdbWrapper.open('db name', Date.now(), (db, existingStores) => {

        // create xxx 'store' if not exists yet
        if (db.objectStoreNames.contains('exampleStore') === false) {
            const exampleStore = db.createObjectStore('exampleStore', { keyPath: 'uname' });
            exampleStore.createIndex('userEmail', 'email', { unique: true });
        }
        if (existingStores.contains('exampleStore2') === false) {
            const exampleStore = db.createObjectStore('exampleStore', { keyPath: 'id', autoIncrement: true });
            exampleStore.createIndex('guid', 'guid', { unique: true });
        }

        // always create xxx 'store' regardless, crash if one exists
        const ost = IdbWrapper.createObjectStore(db, 'store name (table)', { keyPath: 'indexed key' });
        ost?.createIndex('indexName1', 'keyedName1', { unique: true });
    });
    window.idbWrapper = idbWrapper;
}


export class IdbWrapper {

    /** @type {IDBDatabase} */
    #db;

    /** @param {IDBDatabase} db */
    constructor(db) {
        this.#db = db;
    }


    /** 
     * open connection to an IndexedDB, return in a form of wrapped IndexedDB
     * @param {string} dbName
     * @param {number} version
     * @param {(db: IDBDatabase, existingObjectStoreNames: DOMStringList) => void} setup_db_structure
     * @returns {Promise<IdbWrapper>}
     */
    static open(dbName, version, setup_db_structure) {
        return new Promise((resolve, fail) => {
            const request = window.indexedDB.open(dbName, version);
            request.onerror = fail;

            request.onsuccess = (event) => {
                /** @type {IDBDatabase} */
                const db = event.target.result;
                console.log({ db });
                db.onversionchange = db.close;
                const dbw = new IdbWrapper(db);
                resolve(dbw);
            };

            // init db structure
            request.onupgradeneeded = function (ev) {
                /** @type {IDBDatabase} */
                const db = ev.target.result;
                db.onversionchange = db.close;
                setup_db_structure(db, db.objectStoreNames);
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
     * @param {IDBDatabase} db
     * @param {string} objectStoreName
     * @param {IDBObjectStoreParameters} options
     * @returns {IDBObjectStore?} the newly created IDBObjectStore, otherwise null if there is existing
     */
    static createObjectStore(db, objectStoreName, options) {
        if (db.objectStoreNames.contains(objectStoreName) === true) return null;
        else return db.createObjectStore(objectStoreName, options);
    }

    close() {
        // close the database connection. This allows the other page to upgrade the database.
        this.#db.close();
        console.log("A new version of this page is ready. Please reload or close this tab!");
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
     * @param {object[]} items
    */
    add(objectStoreName, items) {
        return new Promise((resolve, fail) => {
            const db = this.#db;
            const transaction = db.transaction(objectStoreName, 'readwrite');
            transaction.oncomplete = resolve;
            transaction.onerror = (ev) => {
                // console.warn(ev);
                fail(ev.target.error);
            };;

            const tbl = transaction.objectStore(objectStoreName), len = items.length;
            for (let i = 0; i < len; ++i) {
                tbl.add(items[i]);
            }
        });
    }

    /** 
     * @param {string} objectStoreName
     * @param {object[]} items
    */
    set(objectStoreName, items) {
        return new Promise((resolve, fail) => {
            const db = this.#db;
            const transaction = db.transaction(objectStoreName, 'readwrite');
            transaction.oncomplete = resolve;
            transaction.onerror = (ev) => {
                // console.warn(ev);
                fail(ev.target.error);
            };;

            const tbl = transaction.objectStore(objectStoreName), len = items.length;
            for (let i = 0; i < len; ++i) {
                tbl.put(items[i]);
            }
        });
    }

    /** 
     * manually set key and values: object
     * @param {string} objectStoreName
     * @param {[key: (string | number | object), value: any][]} kvPairs
    */
    setKeyValues(objectStoreName, kvPairs) {
        return new Promise((resolve, fail) => {
            const db = this.#db;
            const transaction = db.transaction(objectStoreName, 'readwrite');
            transaction.oncomplete = resolve;
            transaction.onerror = (ev) => {
                // console.warn(ev);
                fail(ev.target.error);
            };;

            const tbl = transaction.objectStore(objectStoreName), len = kvPairs.length;
            for (let i = 0; i < len; ++i) {
                const kv = kvPairs[i];
                tbl.put(kv[1], kv[0]);
            }
        });
    }

    /** 
     * @param {string} objectStoreName
     * @param {string | number | object} id
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
     * @param {(string | number | object)[]} rowIDs
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


    /** 
     * find rows by the 'addon' indexed key
     * @param {string} objectStoreName
     * @param {string} indexName 
     * @param {string} searchValue 
    * */
    readByIndex(objectStoreName, indexName, searchValue) {
        return new Promise((resolve, fail) => {
            const db = this.#db;
            const tbl = db.transaction(objectStoreName, 'readonly').objectStore(objectStoreName);
            console.log({ objectStoreName: objectStoreName, objectStore: tbl, indexNames: tbl.indexNames, searchValue: searchValue });
            const index = tbl.index(indexName);
            const request = index.get(searchValue);

            request.onerror = (ev) => {
                // console.warn(ev);
                fail(ev.target.error);
            };

            request.onsuccess = (ev) => {
                console.log({ result: ev.target.result });
                resolve(ev.target.result);
            };

        });
    }

}

/**
 * example
 * @param {IDBDatabase} db
 * @param {string} objectStoreName
*/
function exampleObjectStore(db, objectStoreName) {
    if (db.objectStoreNames.contains(objectStoreName) === false) {
        const tbl = db.createObjectStore(objectStoreName, { keyPath: 'ssn' });
        console.log({ tbl });
        tbl.createIndex('indexName1', 'keyName1', { unique: true });
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