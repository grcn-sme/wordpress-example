
/**
 * run when requested `https://xxxx/gtg/xxx?id=yyyy`
 * Main Cloudflare Pages Function handler. 
 * Intercepts requests to the `/gtm.js?id=` or `/gtag/js?id=` path and proxies them to Google Tag CDN.
 * * @param {EventContext<object, any, any>} context - The Cloudflare Pages context object.
 * @returns {Promise<Response>} The proxied response from Google or an error response.
 */
export async function onRequest(context) {
    // console.log(context, {context});

    /** @type {Request} */
    const request = context.request;

    // 2. Handle Preflight (OPTIONS) - Crucial for POST requests
    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "Content-Type",
                "Access-Control-Max-Age": "86400",
            },
        });
    }

    /** @type {URL|null} */
    const targetUrl = getTargetUrl(request.url);
    if (!targetUrl) {
        return new Response("Error: Missing Google Tag ID (?id=G-xxx)", {
            status: 400,
            headers: { "Content-Type": "text/plain" }
        });
    }
    const requestHeader = new Headers(request.headers);

    // 4. Override the Host header
    requestHeader.set('Host', targetUrl.host);
    requestHeader.set('User-Agent', request.headers.get("User-Agent") || "");
    requestHeader.set('Accept', request.headers.get("Accept") || "");
    requestHeader.set('Accept-Language', request.headers.get("Accept-Language") || "");

    if (request.cf) {
        const country = request.cf.country; // ISO 3166-1 alpha-2
        const region = request.cf.regionCode; // e.g., "CA"
        if (country) {
            requestHeader.set('X-Forwarded-Country', country);
            if (region) {
                requestHeader.set('X-Forwarded-Region', region);
                // Optional: Set the combined header US-CA
                requestHeader.set('X-Forwarded-CountryRegion', `${country}-${region}`);
            }
        }
    }


    /** re-fetch for original request
     * @type {RequestInit} 
     */
    const requestOptions = {
        method: request.method,
        headers: requestHeader,
        // Required for POST requests (like GTM event collection)
        body: request.method === "POST" ? await request.blob() : null,
        redirect: "manual",
    };


    try {
        const googleResponse = await fetch(targetUrl.toString(), requestOptions);

        /** @type {Headers} */
        const responseHeaders = new Headers(googleResponse.headers);

        // Force First-Party Mode compatibility
        responseHeaders.set("Access-Control-Allow-Origin", "*");
        responseHeaders.set("X-Frame-Options", "SAMEORIGIN");

        // Performance: Cache the script at the edge for n seconds
        responseHeaders.set("Cache-Control", "public, max-age=3600");

        return new Response(googleResponse.body, {
            status: googleResponse.status,
            headers: responseHeaders,
        });
    } catch (err) {
        console.error(err);
        return new Response("Gateway for Google Tag, Error", { status: 502 });
    }
}



/**
 * Parses the incoming Request to extract the Google Tag Manager target URL.
 * * @param {string} link - The original incoming Request from the browser.
 * @returns {URL|null} The constructed Google URL or null if the ID is missing.
 */
function getTargetUrl(link) {
    try {
        const url = new URL(link);
        const queryId = url.searchParams.get("id");

        /** @type {string} */
        let tagId;
        if (queryId) {
            tagId = queryId;
            url.searchParams.delete('id');
        } else {
            // try capture tagId at last 1 or 2 position 
            // /.../{xxxx1} 
            // /.../{xxxx2}/
            const gteId = url.pathname.split("/");
            tagId = gteId.pop();
            if (!tagId) tagId = gteId.pop();
            if (!tagId) return null;
        }

        /** @type {string} */
        url.host = (`${tagId}.fps.goog`);
        url.protocol = 'https:';
        // url.pathname = `/gtg/${tagId}/`;
        // url.search = url.search;
        return url;
    } catch (err) {
        console.warn(err);
        return null;
    }
}