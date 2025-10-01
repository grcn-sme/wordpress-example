
const sanatizer = document.createElement('body');
const safeHTMLtext = trustedTypes.createPolicy("html-sanatizer", {
    createHTML: function (html_string) {
        sanatizer.textContent = html_string;
        return sanatizer.innerHTML;
    }
});

export function html(strings, ...variableVal) {
    const cleaned = variableVal.map(x => {
        return safeHTMLtext.createHTML(x);
    });
    return String.raw({ raw: strings }, ...cleaned);
}




export function newHtml_with_Variables(strings, ...values) {
    const template = document.createElement('template');
    template.innerHTML = strings.join('<!-- ? -->');
    const fragment = template.content.cloneNode(true);

    const markers = [];
    { // get all comment node (the variables marker)
        const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_COMMENT);
        for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
            markers.push(node);
        }
    }

    // replace marker to a textNode
    for (let i = 0, len = markers.length; i < len; ++i) {
        const textNode = document.createTextNode(values[i]);
        markers[i].parentNode.replaceChild(textNode, markers[i]);
        markers[i] = textNode;
    }
    const variables = markers;

    // return {
    //     fragment,
    //     set(index, value) {
    //         variables[index].nodeValue = value;
    //     }
    // };

    return new HtmlFragment(fragment, variables);
    // return [fragment, variables];
}

export class HtmlFragment {
    #fragment;
    #variables = [];

    constructor(fragment, variables) {
        this.#fragment = fragment;
        this.#variables = variables;
    }

    get fragment() {
        return this.#fragment;
    }

    update(varIndex, newValue) {
        this.#variables[varIndex].nodeValue = newValue;
    }

}



// const body = document.createElement('body');
// export function html(strings, ...variableVal) {
//     const cleaned = variableVal.map(x=>{
//         body.textContent = x;
//         return body.innerHTML;
//     });
//     console.log({cleaned});

//     return String.raw({ raw: strings }, ...cleaned);
// }
