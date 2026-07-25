var e=globalThis,t=e.ShadowRoot&&(e.ShadyCSS===void 0||e.ShadyCSS.nativeShadow)&&`adoptedStyleSheets`in Document.prototype&&`replace`in CSSStyleSheet.prototype,n=Symbol(),r=new WeakMap,i=class{constructor(e,t,r){if(this._$cssResult$=!0,r!==n)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,n=this.t;if(t&&e===void 0){let t=n!==void 0&&n.length===1;t&&(e=r.get(n)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),t&&r.set(n,e))}return e}toString(){return this.cssText}},a=e=>new i(typeof e==`string`?e:e+``,void 0,n),o=(e,...t)=>new i(e.length===1?e[0]:t.reduce((t,n,r)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if(typeof e==`number`)return e;throw Error(`Value passed to 'css' function must be a 'css' function result: `+e+`. Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.`)})(n)+e[r+1],e[0]),e,n),s=(n,r)=>{if(t)n.adoptedStyleSheets=r.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let t of r){let r=document.createElement(`style`),i=e.litNonce;i!==void 0&&r.setAttribute(`nonce`,i),r.textContent=t.cssText,n.appendChild(r)}},c=t?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t=``;for(let n of e.cssRules)t+=n.cssText;return a(t)})(e):e,l,{is:u,defineProperty:d,getOwnPropertyDescriptor:ee,getOwnPropertyNames:te,getOwnPropertySymbols:ne,getPrototypeOf:re}=Object,f=globalThis,ie=f.trustedTypes,ae=ie?ie.emptyScript:``,oe=f.reactiveElementPolyfillSupport,p=(e,t)=>e,m={toAttribute(e,t){switch(t){case Boolean:e=e?ae:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=e!==null;break;case Number:n=e===null?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch{n=null}}return n}},h=(e,t)=>!u(e,t),se={attribute:!0,type:String,converter:m,reflect:!1,useDefault:!1,hasChanged:h};(l=Symbol).metadata??(l.metadata=Symbol(`metadata`)),f.litPropertyMetadata??(f.litPropertyMetadata=new WeakMap);var g=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??(this.l=[])).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=se){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let n=Symbol(),r=this.getPropertyDescriptor(e,n,t);r!==void 0&&d(this.prototype,e,r)}}static getPropertyDescriptor(e,t,n){let{get:r,set:i}=ee(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:r,set(t){let a=r?.call(this);i?.call(this,t),this.requestUpdate(e,a,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??se}static _$Ei(){if(this.hasOwnProperty(p(`elementProperties`)))return;let e=re(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(p(`finalized`)))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(p(`properties`))){let e=this.properties,t=[...te(e),...ne(e)];for(let n of t)this.createProperty(n,e[n])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[e,n]of t)this.elementProperties.set(e,n)}this._$Eh=new Map;for(let[e,t]of this.elementProperties){let n=this._$Eu(e,t);n!==void 0&&this._$Eh.set(n,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let n=new Set(e.flat(1/0).reverse());for(let e of n)t.unshift(c(e))}else e!==void 0&&t.push(c(e));return t}static _$Eu(e,t){let n=t.attribute;return!1===n?void 0:typeof n==`string`?n:typeof e==`string`?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??(this._$EO=new Set)).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let n of t.keys())this.hasOwnProperty(n)&&(e.set(n,this[n]),delete this[n]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return s(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,n){this._$AK(e,n)}_$ET(e,t){let n=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,n);if(r!==void 0&&!0===n.reflect){let i=(n.converter?.toAttribute===void 0?m:n.converter).toAttribute(t,n.type);this._$Em=e,i==null?this.removeAttribute(r):this.setAttribute(r,i),this._$Em=null}}_$AK(e,t){let n=this.constructor,r=n._$Eh.get(e);if(r!==void 0&&this._$Em!==r){let e=n.getPropertyOptions(r),i=typeof e.converter==`function`?{fromAttribute:e.converter}:e.converter?.fromAttribute===void 0?m:e.converter;this._$Em=r;let a=i.fromAttribute(t,e.type);this[r]=a??this._$Ej?.get(r)??a,this._$Em=null}}requestUpdate(e,t,n,r=!1,i){if(e!==void 0){let a=this.constructor;if(!1===r&&(i=this[e]),n??(n=a.getPropertyOptions(e)),!((n.hasChanged??h)(i,t)||n.useDefault&&n.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,n))))return;this.C(e,t,n)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:n,reflect:r,wrapped:i},a){n&&!(this._$Ej??(this._$Ej=new Map)).has(e)&&(this._$Ej.set(e,a??t??this[e]),!0!==i||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||n||(t=void 0),this._$AL.set(e,t)),!0===r&&this._$Em!==e&&(this._$Eq??(this._$Eq=new Set)).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??(this.renderRoot=this.createRenderRoot()),this._$Ep){for(let[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}let e=this.constructor.elementProperties;if(e.size>0)for(let[t,n]of e){let{wrapped:e}=n,r=this[t];!0!==e||this._$AL.has(t)||r===void 0||this.C(t,void 0,n,r)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&(this._$Eq=this._$Eq.forEach(e=>this._$ET(e,this[e]))),this._$EM()}updated(e){}firstUpdated(e){}};g.elementStyles=[],g.shadowRootOptions={mode:`open`},g[p(`elementProperties`)]=new Map,g[p(`finalized`)]=new Map,oe?.({ReactiveElement:g}),(f.reactiveElementVersions??(f.reactiveElementVersions=[])).push(`2.1.2`);var _=globalThis,v=e=>e,y=_.trustedTypes,ce=y?y.createPolicy(`lit-html`,{createHTML:e=>e}):void 0,le=`$lit$`,b=`lit$${Math.random().toFixed(9).slice(2)}$`,ue=`?`+b,de=`<${ue}>`,x=document,S=()=>x.createComment(``),C=e=>e===null||typeof e!=`object`&&typeof e!=`function`,w=Array.isArray,fe=e=>w(e)||typeof e?.[Symbol.iterator]==`function`,T=`[ 	
\f\r]`,E=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,D=/-->/g,O=/>/g,k=RegExp(`>|${T}(?:([^\\s"'>=/]+)(${T}*=${T}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,`g`),A=/'/g,j=/"/g,M=/^(?:script|style|textarea|title)$/i,pe=e=>(t,...n)=>({_$litType$:e,strings:t,values:n}),N=pe(1),P=pe(2),F=Symbol.for(`lit-noChange`),I=Symbol.for(`lit-nothing`),me=new WeakMap,L=x.createTreeWalker(x,129);function he(e,t){if(!w(e)||!e.hasOwnProperty(`raw`))throw Error(`invalid template strings array`);return ce===void 0?t:ce.createHTML(t)}var ge=(e,t)=>{let n=e.length-1,r=[],i,a=t===2?`<svg>`:t===3?`<math>`:``,o=E;for(let t=0;t<n;t++){let n=e[t],s,c,l=-1,u=0;for(;u<n.length&&(o.lastIndex=u,c=o.exec(n),c!==null);)u=o.lastIndex,o===E?c[1]===`!--`?o=D:c[1]===void 0?c[2]===void 0?c[3]!==void 0&&(o=k):(M.test(c[2])&&(i=RegExp(`</`+c[2],`g`)),o=k):o=O:o===k?c[0]===`>`?(o=i??E,l=-1):c[1]===void 0?l=-2:(l=o.lastIndex-c[2].length,s=c[1],o=c[3]===void 0?k:c[3]===`"`?j:A):o===j||o===A?o=k:o===D||o===O?o=E:(o=k,i=void 0);let d=o===k&&e[t+1].startsWith(`/>`)?` `:``;a+=o===E?n+de:l>=0?(r.push(s),n.slice(0,l)+le+n.slice(l)+b+d):n+b+(l===-2?t:d)}return[he(e,a+(e[n]||`<?>`)+(t===2?`</svg>`:t===3?`</math>`:``)),r]},R=class e{constructor({strings:t,_$litType$:n},r){let i;this.parts=[];let a=0,o=0,s=t.length-1,c=this.parts,[l,u]=ge(t,n);if(this.el=e.createElement(l,r),L.currentNode=this.el.content,n===2||n===3){let e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;(i=L.nextNode())!==null&&c.length<s;){if(i.nodeType===1){if(i.hasAttributes())for(let e of i.getAttributeNames())if(e.endsWith(le)){let t=u[o++],n=i.getAttribute(e).split(b),r=/([.?@])?(.*)/.exec(t);c.push({type:1,index:a,name:r[2],strings:n,ctor:r[1]===`.`?ve:r[1]===`?`?ye:r[1]===`@`?be:V}),i.removeAttribute(e)}else e.startsWith(b)&&(c.push({type:6,index:a}),i.removeAttribute(e));if(M.test(i.tagName)){let e=i.textContent.split(b),t=e.length-1;if(t>0){i.textContent=y?y.emptyScript:``;for(let n=0;n<t;n++)i.append(e[n],S()),L.nextNode(),c.push({type:2,index:++a});i.append(e[t],S())}}}else if(i.nodeType===8)if(i.data===ue)c.push({type:2,index:a});else{let e=-1;for(;(e=i.data.indexOf(b,e+1))!==-1;)c.push({type:7,index:a}),e+=b.length-1}a++}}static createElement(e,t){let n=x.createElement(`template`);return n.innerHTML=e,n}};function z(e,t,n=e,r){if(t===F)return t;let i=r===void 0?n._$Cl:n._$Co?.[r],a=C(t)?void 0:t._$litDirective$;return i?.constructor!==a&&(i?._$AO?.(!1),a===void 0?i=void 0:(i=new a(e),i._$AT(e,n,r)),r===void 0?n._$Cl=i:(n._$Co??(n._$Co=[]))[r]=i),i!==void 0&&(t=z(e,i._$AS(e,t.values),i,r)),t}var _e=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:n}=this._$AD,r=(e?.creationScope??x).importNode(t,!0);L.currentNode=r;let i=L.nextNode(),a=0,o=0,s=n[0];for(;s!==void 0;){if(a===s.index){let t;s.type===2?t=new B(i,i.nextSibling,this,e):s.type===1?t=new s.ctor(i,s.name,s.strings,this,e):s.type===6&&(t=new xe(i,this,e)),this._$AV.push(t),s=n[++o]}a!==s?.index&&(i=L.nextNode(),a++)}return L.currentNode=x,r}p(e){let t=0;for(let n of this._$AV)n!==void 0&&(n.strings===void 0?n._$AI(e[t]):(n._$AI(e,n,t),t+=n.strings.length-2)),t++}},B=class e{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,n,r){this.type=2,this._$AH=I,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=n,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=z(this,e,t),C(e)?e===I||e==null||e===``?(this._$AH!==I&&this._$AR(),this._$AH=I):e!==this._$AH&&e!==F&&this._(e):e._$litType$===void 0?e.nodeType===void 0?fe(e)?this.k(e):this._(e):this.T(e):this.$(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==I&&C(this._$AH)?this._$AA.nextSibling.data=e:this.T(x.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:n}=e,r=typeof n==`number`?this._$AC(e):(n.el===void 0&&(n.el=R.createElement(he(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===r)this._$AH.p(t);else{let e=new _e(r,this),n=e.u(this.options);e.p(t),this.T(n),this._$AH=e}}_$AC(e){let t=me.get(e.strings);return t===void 0&&me.set(e.strings,t=new R(e)),t}k(t){w(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,r,i=0;for(let a of t)i===n.length?n.push(r=new e(this.O(S()),this.O(S()),this,this.options)):r=n[i],r._$AI(a),i++;i<n.length&&(this._$AR(r&&r._$AB.nextSibling,i),n.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let t=v(e).nextSibling;v(e).remove(),e=t}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},V=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,n,r,i){this.type=1,this._$AH=I,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=i,n.length>2||n[0]!==``||n[1]!==``?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=I}_$AI(e,t=this,n,r){let i=this.strings,a=!1;if(i===void 0)e=z(this,e,t,0),a=!C(e)||e!==this._$AH&&e!==F,a&&(this._$AH=e);else{let r=e,o,s;for(e=i[0],o=0;o<i.length-1;o++)s=z(this,r[n+o],t,o),s===F&&(s=this._$AH[o]),a||(a=!C(s)||s!==this._$AH[o]),s===I?e=I:e!==I&&(e+=(s??``)+i[o+1]),this._$AH[o]=s}a&&!r&&this.j(e)}j(e){e===I?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??``)}},ve=class extends V{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===I?void 0:e}},ye=class extends V{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==I)}},be=class extends V{constructor(e,t,n,r,i){super(e,t,n,r,i),this.type=5}_$AI(e,t=this){if((e=z(this,e,t,0)??I)===F)return;let n=this._$AH,r=e===I&&n!==I||e.capture!==n.capture||e.once!==n.once||e.passive!==n.passive,i=e!==I&&(n===I||r);r&&this.element.removeEventListener(this.name,this,n),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH==`function`?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},xe=class{constructor(e,t,n){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(e){z(this,e)}},Se=_.litHtmlPolyfillSupport;Se?.(R,B),(_.litHtmlVersions??(_.litHtmlVersions=[])).push(`3.3.3`);var Ce=(e,t,n)=>{let r=n?.renderBefore??t,i=r._$litPart$;if(i===void 0){let e=n?.renderBefore??null;r._$litPart$=i=new B(t.insertBefore(S(),e),e,void 0,n??{})}return i._$AI(e),i},H=globalThis,U=class extends g{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var e;let t=super.createRenderRoot();return(e=this.renderOptions).renderBefore??(e.renderBefore=t.firstChild),t}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Ce(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return F}};U._$litElement$=!0,U.finalized=!0,H.litElementHydrateSupport?.({LitElement:U});var we=H.litElementPolyfillSupport;we?.({LitElement:U}),(H.litElementVersions??(H.litElementVersions=[])).push(`4.2.2`);var Te=e=>(t,n)=>{n===void 0?customElements.define(e,t):n.addInitializer(()=>{customElements.define(e,t)})},Ee={attribute:!0,type:String,converter:m,reflect:!1,hasChanged:h},De=(e=Ee,t,n)=>{let{kind:r,metadata:i}=n,a=globalThis.litPropertyMetadata.get(i);if(a===void 0&&globalThis.litPropertyMetadata.set(i,a=new Map),r===`setter`&&((e=Object.create(e)).wrapped=!0),a.set(n.name,e),r===`accessor`){let{name:r}=n;return{set(n){let i=t.get.call(this);t.set.call(this,n),this.requestUpdate(r,i,e,!0,n)},init(t){return t!==void 0&&this.C(r,void 0,e,t),t}}}if(r===`setter`){let{name:r}=n;return function(n){let i=this[r];t.call(this,n),this.requestUpdate(r,i,e,!0,n)}}throw Error(`Unsupported decorator location: `+r)};function Oe(e){return(t,n)=>typeof n==`object`?De(e,t,n):((e,t,n)=>{let r=t.hasOwnProperty(n);return t.constructor.createProperty(n,e),r?Object.getOwnPropertyDescriptor(t,n):void 0})(e,t,n)}function W(e){return Oe({...e,state:!0,attribute:!1})}function G(e){return e===`left`?`right`:`left`}function ke(){return{farmer:`left`,wolf:`left`,goat:`left`,cabbage:`left`}}function K(){return{...ke(),selected:null,moveCount:0,status:`playing`,failureReason:null}}function Ae(e,t){return e.farmer===t.farmer&&e.wolf===t.wolf&&e.goat===t.goat&&e.cabbage===t.cabbage}var je={farmer:`right`,wolf:`right`,goat:`right`,cabbage:`right`},Me={wolf:`늑대`,goat:`염소`,cabbage:`양배추`},Ne={left:`왼쪽`,right:`오른쪽`};function q(e){return Me[e]}function Pe(e){return Ne[e]}function Fe(e,t){let n=n=>e[n]===t;return n(`wolf`)&&n(`goat`)?[`wolf`,`goat`]:n(`goat`)&&n(`cabbage`)?[`goat`,`cabbage`]:null}function Ie(e){return Fe(e,G(e.farmer))!==null}function Le(e){let t=G(e.farmer),n=Fe(e,t);if(!n)return null;let[r,i]=n;return`농부가 없는 ${Pe(t)} 강둑에 ${q(r)}와(과) ${q(i)}만 남아 ${q(r)}가(이) ${q(i)}를 위협합니다.`}function Re(e){return Ae(e,je)}function J(e,t){return e.status===`playing`&&e[t]===e.farmer}function Y(e,t){return e.status===`playing`?e[t]===e.farmer?null:`${q(t)}는(은) 농부와 같은 강둑에 있지 않아 태울 수 없습니다.`:`게임이 끝났습니다. 처음부터 다시 시작해주세요.`}function ze(e,t){return J(e,t)?{...e,selected:e.selected===t?null:t}:e}function X(e){return e.status===`playing`?e.selected===null||J(e,e.selected):!1}function Be(e){if(!X(e))return e;let t=G(e.farmer),n={...e,farmer:t,selected:null,moveCount:e.moveCount+1,status:`playing`,failureReason:null};return e.selected&&(n[e.selected]=t),Ie(n)?(n.status=`failed`,n.failureReason=Le(n)):Re(n)&&(n.status=`solved`),n}var Ve=P`
  <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <ellipse cx="32" cy="58" rx="16" ry="4" fill="#00000014" />
    <path d="M20 40c0-8 5-14 12-14s12 6 12 14v10a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4V40z" fill="#3a6ea5" />
    <circle cx="32" cy="22" r="10" fill="#f2c197" />
    <path d="M20 20c0-7 5-12 12-12s12 5 12 12c-4-2-8 1-12 1s-8-3-12-1z" fill="#8a5a34" />
    <rect x="18" y="16" width="28" height="5" rx="2.5" fill="#8a5a34" />
    <path d="M26 44l-6 8M38 44l6 8" stroke="#2f4d70" stroke-width="4" stroke-linecap="round" fill="none" />
  </svg>
`,He=P`
  <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <ellipse cx="32" cy="58" rx="16" ry="4" fill="#00000014" />
    <path d="M18 46c-3-10-2-22 4-28l4 8 6-4 6 4 4-8c6 6 7 18 4 28-3 6-9 9-14 9s-11-3-14-9z" fill="#8b98a8" />
    <path d="M22 18l-4-10 9 6zM42 18l4-10-9 6z" fill="#5f6b78" />
    <circle cx="26" cy="34" r="3" fill="#20242a" />
    <circle cx="38" cy="34" r="3" fill="#20242a" />
    <path d="M28 44c2 2 6 2 8 0" stroke="#20242a" stroke-width="2.5" stroke-linecap="round" fill="none" />
    <path d="M32 38l-3 5h6z" fill="#3c434c" />
  </svg>
`,Ue=P`
  <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <ellipse cx="32" cy="58" rx="16" ry="4" fill="#00000014" />
    <ellipse cx="32" cy="38" rx="17" ry="16" fill="#f5ede0" />
    <path d="M22 20c-2-6 0-11 2-13 1 4 3 7 5 9zM42 20c2-6 0-11-2-13-1 4-3 7-5 9z" fill="#e2c98f" />
    <circle cx="25" cy="36" r="3" fill="#3a2f22" />
    <circle cx="39" cy="36" r="3" fill="#3a2f22" />
    <path d="M30 44h4l-2 4z" fill="#c9a86a" />
    <path d="M28 24c1 3 2 4 4 4s3-1 4-4" stroke="#e2c98f" stroke-width="3" stroke-linecap="round" fill="none" />
  </svg>
`,We=P`
  <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <ellipse cx="32" cy="58" rx="15" ry="4" fill="#00000014" />
    <circle cx="32" cy="36" r="18" fill="#8fbf5e" />
    <circle cx="32" cy="36" r="13" fill="#a5cf74" />
    <circle cx="32" cy="36" r="8" fill="#bcdd8e" />
    <path d="M18 30c-4-4-4-10-2-14 4 2 7 6 8 10zM46 30c4-4 4-10 2-14-4 2-7 6-8 10z" fill="#7bab4e" />
  </svg>
`,Ge=P`
  <svg viewBox="0 0 120 60" aria-hidden="true" focusable="false" preserveAspectRatio="none">
    <path d="M8 34c8 14 96 14 104 0l-8 18H16z" fill="#a9713f" />
    <path d="M8 34c8 14 96 14 104 0" fill="none" stroke="#7a4f28" stroke-width="3" />
    <rect x="56" y="6" width="4" height="30" fill="#6b4a2c" />
  </svg>
`;function Z(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a}var Q,Ke={wolf:He,goat:Ue,cabbage:We},qe=[`wolf`,`goat`,`cabbage`];function Je(){return typeof window<`u`&&window.matchMedia?.(`(prefers-reduced-motion: reduce)`).matches===!0}var $=(Q=class extends U{constructor(...e){super(...e),this.gameState=K(),this.animating=!1,this.message=``,this.ferrying=null}animationDelay(){let e=Je()?0:550;return e===0?Promise.resolve():new Promise(t=>setTimeout(t,e))}async runMove(e){let t=this.gameState.farmer,n=G(t);this.ferrying={passenger:e,fromSide:t,toSide:n},await this.animationDelay(),this.gameState=Be({...this.gameState,selected:e}),this.ferrying=null}announceStatus(){this.gameState.status===`solved`?this.message=`성공! ${this.gameState.moveCount}번 만에 모두 강을 건넜습니다. (최소 7번)`:this.gameState.status===`failed`&&(this.message=`실패했습니다. ${this.gameState.failureReason??``}`)}handleCharacterClick(e){if(!this.animating){if(!J(this.gameState,e)){this.message=Y(this.gameState,e)??``;return}this.gameState=ze(this.gameState,e),this.message=``}}async handleMoveClick(){if(!this.animating){if(!X(this.gameState)){this.message=this.gameState.selected?Y(this.gameState,this.gameState.selected)??`지금은 이동할 수 없습니다.`:`지금은 이동할 수 없습니다.`;return}this.animating=!0,this.message=``,await this.runMove(this.gameState.selected),this.animating=!1,this.announceStatus()}}handleResetClick(){this.animating||(this.gameState=K(),this.ferrying=null,this.message=`처음부터 다시 시작합니다.`)}isOnBank(e,t){return this.ferrying?.passenger!==e&&this.gameState[e]===t}renderCharacterButton(e){let t=this.gameState.selected===e;return N`
      <button
        type="button"
        class="character-btn"
        aria-pressed=${t}
        aria-label=${`${q(e)}${t?` (선택됨)`:``}`}
        ?disabled=${this.animating}
        @click=${()=>this.handleCharacterClick(e)}
      >
        ${Ke[e]}
        <span class="character-name">${q(e)}</span>
      </button>
    `}renderBank(e){let t=e===`left`?`왼쪽 강둑`:`오른쪽 강둑`,n=!this.ferrying&&this.gameState.farmer===e,r=n?`${t} (배와 농부가 있습니다)`:t;return N`
      <div class="bank ${e===`right`?`bank-right`:``}" aria-label=${r}>
        <div class="bank-label">${t}${n?` 🚣`:``}</div>
        <div class="characters">
          ${qe.filter(t=>this.isOnBank(t,e)).map(e=>this.renderCharacterButton(e))}
        </div>
      </div>
    `}renderBoat(){let e=this.ferrying?.toSide??this.gameState.farmer,t=this.ferrying?.passenger??null;return N`
      <div class="boat" data-side=${e} aria-hidden="true">
        <div class="boat-occupants">${Ve} ${t?Ke[t]:I}</div>
        ${Ge}
      </div>
    `}renderMessageTone(){return this.gameState.status===`failed`?`failed`:this.gameState.status===`solved`?`solved`:`info`}render(){let{moveCount:e,selected:t}=this.gameState,n=!this.animating&&X(this.gameState);return N`
      <div class="puzzle">
        <div class="scene">
          ${this.renderBank(`left`)}
          <div class="river">${this.renderBoat()}</div>
          ${this.renderBank(`right`)}
        </div>

        <div class="controls">
          <button
            type="button"
            class="action-btn move-btn"
            ?disabled=${!n}
            @click=${this.handleMoveClick}
          >
            배 이동${t?` (${q(t)}와 함께)`:` (농부 혼자)`}
          </button>
          <button type="button" class="action-btn secondary" ?disabled=${this.animating} @click=${this.handleResetClick}>
            처음부터
          </button>
        </div>

        <div class="status-row">
          <span>이동 횟수: ${e}</span>
          <span>최소 이동 횟수: ${7}</span>
        </div>

        <p class="message" data-tone=${this.renderMessageTone()} aria-live="polite">${this.message}</p>
      </div>
    `}},Q.styles=o`
    :host {
      display: block;
      max-width: 100%;
      box-sizing: border-box;
      font-family: inherit;
      color: var(--puzzle-text, #272727);
      --puzzle-accent: #b85d32;
      --puzzle-surface: #f8f4eb;
      --puzzle-text: #272727;
      --puzzle-river: #6fa8c9;
      --puzzle-duration: 550ms;
    }
    * {
      box-sizing: border-box;
    }
    .puzzle {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 12px;
      border-radius: 16px;
      background: var(--puzzle-surface);
      border: 1px solid #00000014;
      max-width: 100%;
    }
    .scene {
      position: relative;
      display: flex;
      align-items: stretch;
      min-height: 200px;
      border-radius: 12px;
      overflow: hidden;
      background: #dff0f7;
    }
    .bank {
      flex: 0 0 34%;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 8px 6px;
      background: #e8dcc0;
    }
    .bank-right {
      background: #e2e6c4;
    }
    .bank-label {
      font-size: 0.8rem;
      font-weight: 600;
      text-align: center;
      opacity: 0.75;
    }
    .characters {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      justify-content: center;
      align-content: flex-start;
      flex: 1;
      min-height: 44px;
    }
    .character-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      width: 68px;
      min-height: 44px;
      min-width: 44px;
      padding: 4px;
      background: transparent;
      border: 2px solid transparent;
      border-radius: 10px;
      cursor: pointer;
      color: inherit;
      font: inherit;
      -webkit-tap-highlight-color: transparent;
    }
    .character-btn svg {
      width: 52px;
      height: 52px;
    }
    .character-btn .character-name {
      font-size: 0.7rem;
    }
    .character-btn[aria-pressed='true'] {
      border-color: var(--puzzle-accent);
      background: color-mix(in srgb, var(--puzzle-accent) 15%, transparent);
    }
    .character-btn:disabled {
      opacity: 0.4;
      cursor: default;
    }
    .character-btn:focus-visible {
      outline: 3px solid var(--puzzle-accent);
      outline-offset: 2px;
    }
    .river {
      position: relative;
      flex: 1 1 auto;
      min-width: 0;
      background: repeating-linear-gradient(
        100deg,
        var(--puzzle-river),
        var(--puzzle-river) 10px,
        #82bcda 10px,
        #82bcda 20px
      );
    }
    .boat {
      position: absolute;
      top: 50%;
      width: 84px;
      height: 50px;
      transform: translate(-50%, -50%);
      left: 25%;
      transition: left var(--puzzle-duration) ease-in-out;
    }
    .boat[data-side='right'] {
      left: 75%;
    }
    .boat svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    .boat-occupants {
      position: absolute;
      inset: -10px 0 auto 0;
      display: flex;
      justify-content: center;
      gap: 2px;
    }
    .boat-occupants svg {
      width: 34px;
      height: 34px;
    }
    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    button {
      font: inherit;
    }
    .action-btn {
      min-height: 44px;
      padding: 4px 10px;
      border-radius: 8px;
      border: 1px solid var(--puzzle-accent);
      background: var(--puzzle-accent);
      color: #fff;
      font-size: 0.85rem;
      cursor: pointer;
    }
    .action-btn.secondary {
      background: transparent;
      color: var(--puzzle-accent);
    }
    .action-btn:disabled {
      opacity: 0.5;
      cursor: default;
    }
    .action-btn:focus-visible,
    .move-btn:focus-visible {
      outline: 3px solid var(--puzzle-accent);
      outline-offset: 2px;
    }
    .status-row {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 8px;
      font-size: 0.85rem;
    }
    .message {
      min-height: 1.4em;
      font-size: 0.9rem;
      font-weight: 600;
    }
    .message[data-tone='failed'] {
      color: #b3261e;
    }
    .message[data-tone='solved'] {
      color: #2e7d32;
    }
    @media (prefers-reduced-motion: reduce) {
      .boat {
        transition-duration: 0.01ms;
      }
    }
    @media (max-width: 360px) {
      .character-btn {
        width: 56px;
      }
      .character-btn svg {
        width: 42px;
        height: 42px;
      }
    }
  `,Q);Z([W()],$.prototype,`gameState`,void 0),Z([W()],$.prototype,`animating`,void 0),Z([W()],$.prototype,`message`,void 0),Z([W()],$.prototype,`ferrying`,void 0),$=Z([Te(`river-crossing-puzzle`)],$);