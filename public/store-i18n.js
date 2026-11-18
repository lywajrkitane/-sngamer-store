(function(){
"use strict";
if(window.__sngamerI18nLoaded)return;
window.__sngamerI18nLoaded=true;
var KEY="sngamer_store_locale_v1",STATE_KEY="sngamer_store_locale_state_v1";
var flags={sn:"🇸🇳",ci:"🇨🇮",tg:"🇹🇬",bf:"🇧🇫",bj:"🇧🇯",ml:"🇲🇱",intl:"🌐"};
var locale="fr",country="sn",originalText=new WeakMap();
function restoreSavedLocale(){try{var state=localStorage.getItem(STATE_KEY);if(state){var parts=state.split("|");if(["fr","wo","en"].includes(parts[0])&&flags[parts[1]]){locale=parts[0];country=parts[1];return;}}var l=localStorage.getItem(KEY),c=localStorage.getItem(KEY+"_country");if(["fr","wo","en"].includes(l))locale=l;if(flags[c])country=c;}catch(_){}}restoreSavedLocale();
var dict={
en:{
"Accueil":"Home","Accessoires":"Accessories","Gaming Phone":"Gaming phones","Pièces eFootball":"eFootball coins","Profil":"Profile","Tous":"All","Collection":"Collection","Découvrir les produits":"Explore products","SÉLECTION DU MOMENT":"FEATURED SELECTION","TON SETUP. TON GAME.":"YOUR SETUP. YOUR GAME.","TON STYLE.":"YOUR STYLE.","Univers Gaming":"Gaming universe","Accessoires gaming":"Gaming accessories","Pièces eFootball":"eFootball coins","Livraison au Sénégal et dans toute la sous-région":"Delivery in Senegal and across West Africa","BIENVENUE CHEZ SNGAMER":"WELCOME TO SNGAMER","BONJOUR ET BIENVENUE SUR SNGAMER STORE":"HELLO AND WELCOME TO SNGAMER STORE","MERCI DE NOUS RENDRE VISITE !":"THANK YOU FOR VISITING US!","Nous sommes heureux de vous accueillir dans notre boutique et de vous faire découvrir notre univers gaming.":"We are delighted to welcome you to our store and introduce you to our gaming world.","Bienvenue dans la boutique. Merci de nous rendre visite aujourd’hui.":"Welcome to our store. Thank you for visiting us today.","SNGAMER STORE":"SNGAMER STORE","Découvre nos accessoires gaming, Gaming Phone, consoles et pièces eFootball.":"Explore our gaming accessories, gaming phones, consoles and eFootball coins.","COMMANDE EN LIGNE":"ORDER ONLINE","Choisis tes produits, ajoute-les au panier et passe ta commande facilement.":"Choose your products, add them to your cart and place your order easily.","LIVRAISON AU SÉNÉGAL":"DELIVERY IN SENEGAL","Nous préparons ta commande avec soin et facilitons sa livraison.":"We carefully prepare your order and make delivery easy.","En promotion":"On sale","OFFRE EXCLUSIVE":"EXCLUSIVE OFFER","Profil":"Profile","Souris":"Mice","PC Gaming":"PC Gaming","Console":"Console","Pièces eFootball Android":"eFootball Coins for Android","Pièces eFootball iPhone":"eFootball Coins for iPhone","Ordinateurs et équipements PC":"PC computers and equipment","Smartphones dédiés au jeu":"Gaming smartphones","Consoles et accessoires console":"Consoles and console accessories","Mon espace client":"My account","CHOISIR PAYS & LANGUE":"CHOOSE COUNTRY & LANGUAGE","Remonter en haut":"Back to top","Panier vide.":"Your cart is empty.","Aucun produit dans cette rubrique pour le moment.":"No products in this section yet.","Ajouter au panier":"Add to cart","Mon profil":"My profile","Panier":"Cart","Rechercher un produit":"Search products","Rechercher un produit...":"Search for a product...","À PROPOS":"ABOUT US","COMMENT COMMANDER ?":"HOW TO ORDER?","Choisis ton produit":"Choose your product","Sur commande":"Available to order","Rupture de stock":"Out of stock","En stock":"In stock","Stock limité":"Limited stock","Dernier article !":"Last item!","Découvrir mon panier":"View my cart"
},
wo:{"Accueil":"Kër","Accessoires":"Jumtukaay yi","Gaming Phone":"Telefon yu gaming","Pièces eFootball":"Piis yu eFootball","Profil":"Profil","Tous":"Yépp","Collection":"Li ñu tànn","Découvrir les produits":"Seetal al yi","Panier vide.":"Sa panie amul dara.","SÉLECTION DU MOMENT":"Li ñu tànn tey","TON SETUP. TON GAME.":"Sa setup. Sa game.","TON STYLE.":"Sa style.","Univers Gaming":"Àdduna gaming","Accessoires gaming":"Jumtukaay yu gaming","Livraison au Sénégal et dans toute la sous-région":"Yóbbu al yi ci Senegaal ak réew yi ko wër","BIENVENUE CHEZ SNGAMER":"DALAL AK JÀMM CI SNGAMER","BONJOUR ET BIENVENUE SUR SNGAMER STORE":"DALAL AK JÀMM CI SNGAMER STORE","MERCI DE NOUS RENDRE VISITE !":"JËRËJËF CI SA ÑËW!","Nous sommes heureux de vous accueillir dans notre boutique et de vous faire découvrir notre univers gaming.":"Bég nanu la nuyu ci sunu boutique te won la sunu àdduna gaming.","Bienvenue dans la boutique. Merci de nous rendre visite aujourd’hui.":"Dalal ak jàmm ci sunu boutique. Jërëjëf ci sa ñëw.","SNGAMER STORE":"SNGAMER STORE","Découvre nos accessoires gaming, Gaming Phone, consoles et pièces eFootball.":"Seetal sunuy jumtukaay gaming, telefon yu gaming, consoles ak pièces eFootball.","COMMANDE EN LIGNE":"JËND CI INTERNET","Choisis tes produits, ajoute-les au panier et passe ta commande facilement.":"Tànnal say al, yokk leen ci sa panie te defal sa commande ci yomb.","LIVRAISON AU SÉNÉGAL":"YÓBBU AL YI CI SENEGAAL","Nous préparons ta commande avec soin et facilitons sa livraison.":"Nu ngi waajal sa commande ak teey, te yombal yóbbu gi."}
};
function protectedNode(node){var el=node&&node.parentElement;return !el||!!el.closest("h3,.productCardClickable,.productDetail,.productGallery,.cartItem,.price,.sngHomeHeroTitle,.sngHomeHeroBody,.sngCampaignSectionHeading,.campaignEyebrow,[data-no-translate],input,textarea,select,script,style,code");}
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
if(root.nodeType===1&&root.closest&&root.closest("h3,.productCardClickable,.productDetail,.sngHomeHeroTitle,.sngHomeHeroBody,.sngCampaignSectionHeading,.campaignEyebrow,[data-no-translate]"))return;
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
try{localStorage.setItem(STATE_KEY,locale+"|"+country);localStorage.setItem(KEY,locale);localStorage.setItem(KEY+"_country",country);}catch(_){}
close();apply();
}

function translateDynamicContent(root){
var scope=root&&root.querySelectorAll?root:document;
var selectors=".sngHomeHeroTitle,.sngHomeHeroBody,.sngCampaignSectionHeading,.campaignEyebrow";
var nodes=[];
if(root&&root.nodeType===1&&root.matches&&root.matches(selectors))nodes.push(root);
if(scope.querySelectorAll)nodes=nodes.concat(Array.from(scope.querySelectorAll(selectors)));
nodes.forEach(function(el){
if(!el.dataset.sngI18nSource)el.dataset.sngI18nSource=el.textContent||"";
var source=el.dataset.sngI18nSource;
var translated=locale==="fr"?source:((dict[locale]||{})[source]||source);
if(el.textContent!==translated)el.textContent=translated;
});
}

function apply(){
document.documentElement.lang=locale;document.documentElement.dataset.storeLocale=locale;
document.querySelectorAll(".sngLanguageChoice[data-locale]").forEach(function(b){b.setAttribute("aria-pressed",String(b.dataset.locale===locale&&b.dataset.country===country));});
var flag=document.querySelector("#sngLanguageButton span");if(flag)flag.textContent=flags[country]||"🇸🇳";
walk(document.body);
window.dispatchEvent(new CustomEvent("sngamer:localechange",{detail:{locale:locale,country:country}}));
document.documentElement.classList.remove("sng-locale-pending");
}
function attachMenu(){
var b=document.getElementById("sngLanguageButton");if(!b)return false;
if(!document.getElementById("sngLanguageMenu"))document.body.insertAdjacentHTML("beforeend",menuHTML());
var m=document.getElementById("sngLanguageMenu");
if(b.dataset.sngI18nBound==="1")return true;
b.dataset.sngI18nBound="1";b.setAttribute("aria-haspopup","dialog");b.setAttribute("aria-expanded","false");
b.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();m.hidden=!m.hidden;b.setAttribute("aria-expanded",String(!m.hidden));if(!m.hidden)position();});
m.addEventListener("click",function(e){var x=e.target.closest("[data-locale]");if(x&&!x.disabled)setLocale(x.dataset.locale,x.dataset.country);});
document.addEventListener("click",function(e){if(!m.hidden&&!m.contains(e.target)&&!b.contains(e.target))close();});
document.addEventListener("keydown",function(e){if(e.key==="Escape")close();});
window.addEventListener("resize",position,{passive:true});window.addEventListener("scroll",position,{passive:true});
return true;
}
function boot(){
if(!document.body){window.setTimeout(boot,30);return;}
attachMenu();
apply();
if(!window.__sngamerI18nPageshowBound){window.__sngamerI18nPageshowBound=true;window.addEventListener("pageshow",function(){restoreSavedLocale();attachMenu();apply();});}
if(window.MutationObserver&&!window.__sngamerI18nObserver){
window.__sngamerI18nObserver=new MutationObserver(function(records){
records.forEach(function(r){if(r.type==="characterData")translateNode(r.target);else r.addedNodes.forEach(walk);});
attachMenu();
});
window.__sngamerI18nObserver.observe(document.body,{subtree:true,childList:true,characterData:true});
}
window.dispatchEvent(new CustomEvent("sngamer:i18nready",{detail:{locale:locale,country:country}}));
}
window.SNGamerI18n={getLocale:function(){return locale;},getCountry:function(){return country;},setLocale:setLocale,apply:apply,t:function(fr){return locale==="fr"?fr:((dict[locale]||{})[fr]||fr);}};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();