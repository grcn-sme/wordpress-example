// custom code injector 
// html code to inject dynamically on run time
function injectCustomCode(htmlCode, intoElement) { let addText; if (intoElement === document.head) { const nodeToAdd = []; addText = (TAG) => { nodeToAdd.push(new Text(TAG.textContent)); setTimeout(_ => { document.body.prepend(nodeToAdd.pop()); }); }; } else { addText = (TAG) => { intoElement.appendChild(new Text(TAG.textContent)); }; } const cloneChildNodes = (TAG) => { try { if (TAG.attributes === undefined) { if (TAG.nodeName === "#text") { addText(TAG); return new Text(TAG.textContent); } else if (TAG.nodeName === "#comment") { intoElement.appendChild(new Comment(TAG.textContent)); } else { console.warn("unknown node type, assume as textNode instead: ", TAG); addText(TAG); } } else { const tag = document.createElement(TAG.tagName); for (const a of TAG.attributes) { tag.setAttribute(a.name, a.value); } tag.innerHTML = TAG.innerHTML; intoElement.appendChild(tag); } } catch (err) { console.warn(err); } }; const doc = new DOMParser().parseFromString(htmlCode, "text/html"); doc.head.childNodes.forEach(cloneChildNodes); doc.body.childNodes.forEach(cloneChildNodes); }





const innerHTMLPolicy = trustedTypes.createPolicy("passthrough", {
  createHTML: (html) => html,
});


async function navigatePage(hash) {
  // fetch resources
  // #pathname/xxx/yyy
  const href = hash.substring(1);

  // virtual url for SPA
  const url = new URL(`${location.origin}/${href}`);

  const uri = `page${url.pathname}.html`;
  const response = await fetch(uri, {
    cache: url.search === '' ? undefined : 'no-store' // cache only if no search param
  });

  const appBody = document.getElementById('app');
  if (response.ok) {
    setTimeout(_ => {
      injectCustomCode(localStorage['txtCodeHead'] || '', document.head);
      // console.log('head', document.getElementById('form-custom-code'));
    }, 0);
    appBody.innerHTML = innerHTMLPolicy.createHTML(await response.text());



    // simulate page load
    const opt = { bubbles: true };
    setTimeout((appBody, opt) => { appBody.dispatchEvent(new Event('readystatechange', opt)); }, 0, appBody, opt);


    let lastResource0 = null;
    // load /src/page/(dir/dir.js) if any
    { // partial page, load dir general shared resources
      const paths = url.pathname.split('/'), len = paths.length - 1;
      console.log(paths);
      for (let i = 1; i < len; ++i) {
        if (paths[i] === '') continue;
        const src = `/src/page/${paths[i]}/${paths[i]}.js`;
        console.log(src);
        lastResource0 = import(src).catch(console.warn);
      }
    }

    let lastResource1 = null;
    // load /src/page/(file.js|dir/file.js) if any
    { // partial page, load individual file specific resources
      const module = appBody.getElementsByTagName('module')[0];
      if (module !== undefined) {
        const scripts = module.getElementsByTagName('script'), len = scripts.length;
        for (let i = 0; i < len; ++i) {
          const src = scripts[i].getAttribute('src');
          if (src === null || src === '') continue;
          lastResource1 = import(src).catch(console.warn);
        }
      }
    }

    setTimeout(_ => {
      injectCustomCode(localStorage['txtCodeBody'] || '', document.body);
      // console.log('/body', document.getElementById('form-custom-code'));
    }, 100);

    try {
      await lastResource0;
      await lastResource1;
    } finally {
      setTimeout((appBody, opt) => { appBody.dispatchEvent(new Event('DOMContentLoaded', opt)); }, 0, appBody, opt);
      setTimeout((opt) => { window.dispatchEvent(new Event('load', opt)); }, 0);
    }

  }
  else {
    appBody.innerHTML = '<b>404</b>';
    console.error({ response });
  }
  console.log({ url, uri });
}

{ // init page
  if (location.hash !== '') {
    navigatePage(location.hash);
  }
}

// document.body.addEventListener('click', async function (e) { // navigation
//   if (e.target.tagName !== 'A') return;
//   if (e.ctrlKey) return;

//   const href = e.target.getAttribute('href');
//   if (href.startsWith('#/') === false) return;

//   await navigatePage(href);
// });

window.onpopstate = async function navigateTo(ev) { // custom route
  // await navigatePage(location.hash); // spa
  window.stop(); this.location.reload();  // mpa
};


if ('serviceWorker' in navigator) {
  // navigator.serviceWorker.register('sw.js');
}



