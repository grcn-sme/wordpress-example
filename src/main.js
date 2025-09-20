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
    appBody.innerHTML = innerHTMLPolicy.createHTML(await response.text());
    { // simulate page load
      const opt = { bubbles: true };
      setTimeout((appBody, ev) => { appBody.dispatchEvent(ev); }, 0, appBody, new Event('readystatechange', opt));
      setTimeout((appBody, ev) => { appBody.dispatchEvent(ev); }, 0, appBody, new Event('DOMContentLoaded', opt));
      setTimeout((appBody, ev) => { appBody.dispatchEvent(ev); }, 0, appBody, new Event('load', opt));
    }

    // load /src/page/(dir/dir.js) if any
    { // partial page, load dir general shared resources
      const paths = url.pathname.split('/'), len = paths.length - 1;
      console.log(paths);
      for (let i = 1; i < len; ++i) {
        if (paths[i] === '') continue;
        const src = `/src/page/${paths[i]}/${paths[i]}.js`;
        console.log(src);
        import(src).catch(console.warn);
      }
    }

    // load /src/page/(file.js|dir/file.js) if any
    { // partial page, load individual file specific resources
      const module = appBody.getElementsByTagName('module')[0];
      if (module !== undefined) {
        const scripts = module.getElementsByTagName('script'), len = scripts.length;
        for (let i = 0; i < len; ++i) {
          const src = scripts[i].getAttribute('src');
          if (src === null || src === '') continue;
          import(src).catch(console.warn);
        }
      }
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