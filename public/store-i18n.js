(function(){
"use strict";
if(window.__sngamerI18nLoaded)return;
window.__sngamerI18nLoaded=true;
var KEY="sngamer_store_locale_v1";
var flags={sn:"🇸🇳",ci:"🇨🇮",tg:"🇹🇬",bf:"🇧🇫",bj:"🇧🇯",ml:"🇲🇱",intl:"🌐"};
var locale="fr",country="sn",originalText=new WeakMap();
try{var l=localStorage.getItem(KEY),c=localStorage.getItem(KEY+"_country");if(["fr","wo","en"].includes(l))locale=l;if(flags[c])country=c;}catch(_){}
var dict={
en:{
"Accueil":"Home","Accessoires":"Accessories","Gaming Phone":"Gaming phones","Pièces eFootball":"eFootball coins","Profil":"Profile","Tous":"All","Collection":"Collection","Découvrir les produits":"Explore products","SÉLECTION DU MOMENT":"FEATURED SELECTION","TON SETUP. TON GAME.":"YOUR SETUP. YOUR GAME.","TON STYLE.":"YOUR STYLE.","Univers Gaming":"Gaming universe","Accessoires gaming":"Gaming accessories","Pièces eFootball":"eFootball coins","Livraison au Sénégal et dans toute la sous-région":"Delivery in Senegal and across West Africa","En promotion":"On sale","Panier vide.":"Your cart is empty.","Aucun produit dans cette rubrique pour le moment.":"No products in this section yet.","Ajouter au panier":"Add to cart","Mon profil":"My profile","Panier":"Cart","Rechercher un produit":"Search products","Rechercher un produit...":"Search for a product...","À PROPOS":"ABOUT US","COMMENT COMMANDER ?":"HOW TO ORDER?","Choisis ton produit":"Choose your product","Sur commande":"Available to order","Rupture de stock":"Out of stock","En stock":"In stock","Stock limité":"Limited stock","Dernier article !":"Last item!","Découvrir mon panier":"View my cart"
},
wo:{"Accueil":"Kër","Accessoires":"Jumtukaay yi","Gaming Phone":"Telefon yu gaming","Pièces eFootball":"Piisi eFootball","Profil":"Profil","Tous":"Yépp","Collection":"Li ñu tànn","Découvrir les produits":"Seetal al yi","Panier vide.":"Sa panie amul dara."}
};
function protectedNode(node){var el=node&&node.parentElement;return !el||!!el.closest("h3,.productCardClickable,.productDetail,.productGallery,.cartItem,.price,[data-no-translate],input,textarea,select,script,style,code");}
function translateNode(node){
if(!node||node.nodeType!==Node.TEXT_NODE||protectedNode(node))return;
if(!originalText.has(node))originalText.set(node,node.nodeValue);
var raw=originalText.get(node),value=raw.trim();if(!value)return;
var target=locale==="fr"?value:((dict[locale]||{})[value]||value);
var start=raw.match(/^\s*/)[0],end=raw.match(/\s*$/)[0],next=start+target+end;
if(node.nodeValue!==next)node.nodeValue=next;
}
function walk(root){
if(!root)return;if(root.nodeType===Node.TEXT_NODE){translateNode(root);return;}
if(root.nodeType===1&&root.closest&&root.closest("h3,.productCardClickable,.productDetail,[data-no-translate]"))return;
var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(translateNode);
if(root.querySelectorAll)root.querySelectorAll("[placeholder],[aria-label],[title]").forEach(function(el){
if(el.closest("h3,.productCardClickable,.productDetail,[data-no-translate]"))return;
["placeholder","aria-label","title"].forEach(function(a){var v=el.getAttribute(a),t=(dict[locale]||{})[v];if(v&&t){if(!el.dataset["i18n"+a])el.dataset["i18n"+a]=v;el.setAttribute(a,t);}else if(el.dataset["i18n"+a])el.setAttribute(a,el.dataset["i18n"+a]);});
});
}
function countryRow(flag,name,code,localLabel){
return '<section class="sngLanguageCountry"><div class="sngLanguageCountryName"><span class="sngLanguageFlag">'+flag+'</span><strong>'+name+'</strong></div><div class="sngLanguageOptions">'+
choice("fr",code,"Français")+
(localLabel?'<button type="button" class="sngLanguageChoice isComingSoon" disabled>'+localLabel+' <small>Bientôt</small></button>':choice("wo",code,"Wolof · bêta"))+
'</div></section>';
}
function choice(lang,code,label){return '<button type="button" class="sngLanguageChoice" data-locale="'+lang+'" data-country="'+code+'" aria-pressed="'+(locale===lang&&country===code)+'">'+label+'</button>';}
function menuHTML(){
return '<div class="sngLanguageMenu" id="sngLanguageMenu" role="dialog" aria-label="Choisir pays et langue" hidden>'+
'<div class="sngLanguageMenuTitle">CHOISIR PAYS &amp; LANGUE</div>'+
countryRow("🇸🇳","Sénégal","sn","")+
countryRow("🇨🇮","Côte d’Ivoire","ci","Malinké")+
countryRow("🇹🇬","Togo","tg","Éwé")+
countryRow("🇧🇫","Burkina Faso","bf","Peulh")+
countryRow("🇧🇯","Bénin","bj","Fon")+
countryRow("🇲🇱","Mali","ml","Bambara")+
'<section class="sngLanguageCountry"><div class="sngLanguageCountryName"><span class="sngLanguageFlag">🌐</span><strong>International</strong></div><div class="sngLanguageOptions">'+choice("en","intl","English")+'</div></section>'+
'<div class="sngLanguageMenuNote">Les langues locales marquées « Bientôt » seront activées après validation de leur qualité.</div></div>';
}
function close(){var m=document.getElementById("sngLanguageMenu"),b=document.getElementById("sngLanguageButton");if(m)m.hidden=true;if(b)b.setAttribute("aria-expanded","false");}
function position(){var b=document.getElementById("sngLanguageButton"),m=document.getElementById("sngLanguageMenu");if(!b||!m||m.hidden)return;var r=b.getBoundingClientRect(),w=Math.min(320,Math.max(180,Math.floor(window.innerWidth*.5)));w=Math.min(w,window.innerWidth-24);m.style.setProperty("width",w+"px","important");m.style.setProperty("max-width",w+"px","important");m.style.setProperty("left","auto","important");m.style.setProperty("right","12px","important");m.style.setProperty("top",Math.min(r.bottom+10,window.innerHeight-80)+"px","important");}
function setLocale(next,nextCountry){
if(!["fr","wo","en"].includes(next))return;locale=next;if(flags[nextCountry])country=nextCountry;
try{localStorage.setItem(KEY,locale);localStorage.setItem(KEY+"_country",country);}catch(_){}
close();apply();
}
function apply(){
document.documentElement.lang=locale;document.documentElement.dataset.storeLocale=locale;
document.querySelectorAll(".sngLanguageChoice[data-locale]").forEach(function(b){b.setAttribute("aria-pressed",String(b.dataset.locale===locale&&b.dataset.country===country));});
var flag=document.querySelector("#sngLanguageButton span");if(flag)flag.textContent=flags[country]||"🇸🇳";
walk(document.body);
window.dispatchEvent(new CustomEvent("sngamer:localechange",{detail:{locale:locale,country:country}}));
}
function boot(){
var b=document.getElementById("sngLanguageButton");if(!b)return;
if(!document.getElementById("sngLanguageMenu"))document.body.insertAdjacentHTML("beforeend",menuHTML());
var m=document.getElementById("sngLanguageMenu");
b.setAttribute("aria-haspopup","dialog");b.setAttribute("aria-expanded","false");
b.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();m.hidden=!m.hidden;b.setAttribute("aria-expanded",String(!m.hidden));if(!m.hidden)position();});
m.addEventListener("click",function(e){var x=e.target.closest("[data-locale]");if(x)setLocale(x.dataset.locale,x.dataset.country);});
document.addEventListener("click",function(e){if(!m.hidden&&!m.contains(e.target)&&!b.contains(e.target))close();});
document.addEventListener("keydown",function(e){if(e.key==="Escape")close();});
window.addEventListener("resize",position,{passive:true});window.addEventListener("scroll",position,{passive:true});
apply();
if(window.MutationObserver&&!window.__sngamerI18nObserver){window.__sngamerI18nObserver=new MutationObserver(function(records){records.forEach(function(r){if(r.type==="characterData")translateNode(r.target);else r.addedNodes.forEach(walk);});});window.__sngamerI18nObserver.observe(document.body,{subtree:true,childList:true,characterData:true});}
}
window.SNGamerI18n={getLocale:function(){return locale;},setLocale:setLocale,t:function(fr){return locale==="fr"?fr:((dict[locale]||{})[fr]||fr);}};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();