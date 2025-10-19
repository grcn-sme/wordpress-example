import { IDB_Example } from '../../idb_example.mjs';
import { IdbWrapper } from '/src/IdbWrapper.mjs';

export default async function main(appBody) {
    // /** @type {IDB_Example} */
    // const idbExample = await IDB_Example.open('haha');
    // window.idbExample = idbExample;
    // setupUIexample(idbExample, appBody);

    /** @type {IdbWrapper} */
    const idbWrapper = await IdbWrapper.open('haha');
    window.idbWrapper = idbWrapper;
    setupUI(idbWrapper, appBody);
}

/** 
 * @param {IdbWrapper} idbWrapper 
 * @param {HTMLElement} appBody
*/
function setupUI(idbWrapper, appBody) {
    const div = document.getElementById('dbDisplay');

    document.getElementById('btnRead').addEventListener('click', async function (e) {
        const result = await idbWrapper.read('lsa', 1);
        console.log(result);

        idbWrapper.readAll('lsa', (k, v) => {
            console.log({ k, v });
        });
    });

    document.getElementById('btnAdd').addEventListener('click', async function (e) {
        idbWrapper.add('lsa', [
            [Date.now(), Math.random() + ' ' + 'valu']
        ].values());
    });

    document.getElementById('btnUpdate').addEventListener('click', function (e) {
        idbWrapper.update('lsa', [
            [1, `updated value: ${(Date.now()).toString().split('').reverse().join('')}`]
        ].values());
    });

    document.getElementById('btnDelete').addEventListener('click', function (e) {
        idbWrapper.delete('lsa', [
            1
        ]);
    });
}

/** 
 * @param {IDB_Example} idbExample 
 * @param {HTMLElement} appBody
*/
function setupUIexample(idbExample, appBody) {
    const div = document.getElementById('dbDisplay');

    document.getElementById('btnRead').addEventListener('click', async function (e) {
        const result = await idbExample.read();
        console.log(result);

        // idbExample.readAll();
        idbExample.listAll((k, v) => {
            console.log({ k, v });
        });
    });

    document.getElementById('btnAdd').addEventListener('click', async function (e) {
        idbExample.add();
    });

    document.getElementById('btnUpdate').addEventListener('click', function (e) {
        idbExample.update();
    });

    document.getElementById('btnDelete').addEventListener('click', function (e) {
        idbExample.delete();
    });
}