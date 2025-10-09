'use strict';
// function injectCustomCode(htmlCode, intoElement) { let addText; if (intoElement === document.head) { const nodeToAdd = []; addText = (TAG) => { nodeToAdd.push(new Text(TAG.textContent)); setTimeout(_ => { document.body.prepend(nodeToAdd.pop()); }); }; } else { addText = (TAG) => { intoElement.appendChild(new Text(TAG.textContent)); }; } const cloneChildNodes = (TAG) => { try { if (TAG.attributes === undefined) { if (TAG.nodeName === "#text") { addText(TAG); return new Text(TAG.textContent); } else if (TAG.nodeName === "#comment") { intoElement.appendChild(new Comment(TAG.textContent)); } else { console.warn("unknown node type, assume as textNode instead: ", TAG); addText(TAG); } } else { const tag = document.createElement(TAG.tagName); for (const a of TAG.attributes) { tag.setAttribute(a.name, a.value); } tag.innerHTML = TAG.innerHTML; intoElement.appendChild(tag); } } catch (err) { console.warn(err); } }; const doc = new DOMParser().parseFromString(htmlCode, "text/html"); doc.head.childNodes.forEach(cloneChildNodes); doc.body.childNodes.forEach(cloneChildNodes); }


function injectCustomCode(htmlCode, intoElement) {
    const b = document.createElement('template');
    b.innerHTML = htmlCode;
    const nodes = [...(b.content.cloneNode(true).childNodes)];
    const txtNodes = [];
    const len = nodes.length;
    for (let i = 0; i < len; ++i) {
        const x = nodes[i];
        if (x.nodeName === 'SCRIPT') {
            const sc = document.createElement('script');
            if (x.attributes) for (const a of x.attributes) {
                sc.setAttribute(a.name, a.value);
            };
            sc.textContent = x.textContent;
            intoElement.appendChild(sc);
            nodes[i] = sc;
            continue;
        }
        else if (x.nodeName === '#text') {
            if (intoElement === document.head) {
                txtNodes.push(x);
                continue;
            }
        }
        intoElement.appendChild(x);
        nodes[i] = x;
    }
    document.addEventListener('readystatechange', function fixTextNode() {
        if (document.readyState !== 'interactive') return;
        const len = txtNodes.length, b = document.body;
        for (let i = 0; i < len; ++i) {
            b.prepend(txtNodes[i]);
        }
    }, { once: true, capture: true });
    return nodes;
}