(function(){
"use strict";
if(window.__sngamerI18nLoaded)return;
window.__sngamerI18nLoaded=true;
var KEY="sngamer_store_locale_v1",STATE_KEY="sngamer_store_locale_state_v1";
var flags={sn:"🇸🇳",ci:"🇨🇮",tg:"🇹🇬",bf:"🇧🇫",bj:"🇧🇯",ml:"🇲🇱",intl:"🌐"};
var locale="fr",country="sn",originalText=new WeakMap();
function restoreSavedLocale(){try{var state=localStorage.getItem(STATE_KEY);if(state){var parts=state.split("|");if(["fr","wo","en","man","ee","ff","fon","bm"].includes(parts[0])&&flags[parts[1]]){locale=parts[0];country=parts[1];return;}}var l=localStorage.getItem(KEY),c=localStorage.getItem(KEY+"_country");if(["fr","wo","en","man","ee","ff","fon","bm"].includes(l))locale=l;if(flags[c])country=c;}catch(_){}}restoreSavedLocale();
var dict={
en:{
"Accueil":"Home","Accessoires":"Accessories","Gaming Phone":"Gaming phones","Pièces eFootball":"eFootball coins","Profil":"Profile","Tous":"All","Collection":"Collection","Découvrir les produits":"Explore products","SÉLECTION DU MOMENT":"FEATURED SELECTION","TON SETUP. TON GAME.":"YOUR SETUP. YOUR GAME.","TON STYLE.":"YOUR STYLE.","Univers Gaming":"Gaming universe","Accessoires gaming":"Gaming accessories","Pièces eFootball":"eFootball coins","Livraison au Sénégal et dans toute la sous-région":"Delivery in Senegal and across West Africa","BIENVENUE CHEZ SNGAMER":"WELCOME TO SNGAMER","BONJOUR ET BIENVENUE SUR SNGAMER STORE":"HELLO AND WELCOME TO SNGAMER STORE","MERCI DE NOUS RENDRE VISITE !":"THANK YOU FOR VISITING US!","Nous sommes heureux de vous accueillir dans notre boutique et de vous faire découvrir notre univers gaming.":"We are delighted to welcome you to our store and introduce you to our gaming world.","Bienvenue dans la boutique. Merci de nous rendre visite aujourd’hui.":"Welcome to our store. Thank you for visiting us today.","SNGAMER STORE":"SNGAMER STORE","Découvre nos accessoires gaming, Gaming Phone, consoles et pièces eFootball.":"Explore our gaming accessories, gaming phones, consoles and eFootball coins.","COMMANDE EN LIGNE":"ORDER ONLINE","Choisis tes produits, ajoute-les au panier et passe ta commande facilement.":"Choose your products, add them to your cart and place your order easily.","LIVRAISON AU SÉNÉGAL":"DELIVERY IN SENEGAL","Nous préparons ta commande avec soin et facilitons sa livraison.":"We carefully prepare your order and make delivery easy.","En promotion":"On sale","OFFRE EXCLUSIVE":"EXCLUSIVE OFFER","Offre exclusive":"Exclusive offer","Profil":"Profile","Souris":"Mice","SOURIS":"MICE","Claviers":"Keyboards","CLAVIERS":"KEYBOARDS","Casques":"Headsets","CASQUES":"HEADSETS","Manettes":"Controllers","MANETTES":"CONTROLLERS","PC Gaming":"PC Gaming","Console":"Console","Pièces eFootball Android":"eFootball Coins for Android","Pièces eFootball iPhone":"eFootball Coins for iPhone","Ordinateurs et équipements PC":"PC computers and equipment","Smartphones dédiés au jeu":"Gaming smartphones","Consoles et accessoires console":"Consoles and console accessories","Mon espace client":"My account","CHOISIR PAYS & LANGUE":"CHOOSE COUNTRY & LANGUAGE","Remonter en haut":"Back to top","Panier vide.":"Your cart is empty.","Aucun produit dans cette rubrique pour le moment.":"No products in this section yet.","Ajouter au panier":"Add to cart","LIVRAISON":"DELIVERY","ÉTAT DU PRODUIT":"PRODUCT CONDITION","TYPE DE PRODUIT":"PRODUCT TYPE","GARANTIE":"WARRANTY","Note du produit":"Product rating","Chargement…":"Loading…","Pas encore de note":"Not rated yet","Pas encore de note":"Not rated yet","Connecte-toi pour laisser ou modifier ta note.":"Sign in to leave or edit your rating.","Acheter maintenant":"Buy now","Ajouté au panier":"Added to cart","Total :":"Total: ","Pas encore de note":"Not rated yet","Connecte-toi pour laisser ou modifier ta note.":"Sign in to leave or edit your rating.","Description":"Description","Écran":"Screen","Résolution":"Resolution","Processeur":"Processor","Stockage":"Storage","Batterie":"Battery","Mémoire":"Memory","RAM":"RAM","Go":"GB","mois":"months","12 mois":"12 months","Aucune description disponible.":"No description available.","Acheter maintenant":"Buy now","Recevois cet article dans":"Get this item within","Reçois cet article dans":"Receive this item within","2 heures maximum":"2 hours maximum","chez toi":"at your door","Aucune garantie":"No warranty","Occasion":"Used","Reconditionné":"Refurbished","Produit numérique":"Digital product","Caractéristiques":"Specifications","Voir plus ↓":"Read more ↓","Vidéo du produit":"Product video","heures maximum chez toi":"hours at your door","Partout au Sénégal":"Across Senegal","Neuf":"New","À définir":"To be determined","Mon profil":"My profile","Panier":"Cart","Rechercher un produit":"Search products","Rechercher un produit...":"Search for a product...","À PROPOS":"ABOUT US","COMMENT COMMANDER ?":"HOW TO ORDER?","Choisis ton produit":"Choose your product","Sur commande":"Available to order","Rupture de stock":"Out of stock","En stock":"In stock","Sur commande":"Available to order","Rupture de stock":"Out of stock","Dernier article !":"Last item!","Stock limité":"Limited stock","Stock limité":"Limited stock","Dernier article !":"Last item!","Découvrir mon panier":"View my cart","OFFRE EXCLUSIVE":"EXCLUSIVE OFFER","Offre exclusive":"Exclusive offer","SNGAMER STORE · À PROPOS":"SNGAMER STORE · ABOUT US","L’univers gaming, sans frontières.":"Gaming without borders.","RESTONS EN CONTACT":"STAY IN TOUCH","Contacte-nous et suis SNGAMER":"Contact us and follow SNGAMER","Une question ou besoin d’assistance ? Retrouve-nous sur nos réseaux officiels.":"Have a question or need help? Find us on our official social channels.","Votre boutique gaming en ligne au Sénégal, basée à Dakar.":"Your online gaming store in Senegal, based in Dakar.","Accessoires gaming, Gaming Phone et pièces eFootball sélectionnés pour les passionnés.":"Gaming accessories, gaming phones and eFootball coins selected for enthusiasts.","BESOIN D\u0027AIDE ?":"NEED HELP?","Une question sur une commande ?":"A question about an order?","SUivez SNGAMER":"FOLLOW SNGAMER","SUIVEZ SNGAMER":"FOLLOW SNGAMER","Retrouvez-nous sur nos plateformes":"Find us on our platforms","WhatsApp":"WhatsApp","Contact direct":"Direct contact","Nous contacter":"Contact us","Notre page officielle":"Our official page","Nos vidéos gaming":"Our gaming videos","À PROPOS":"ABOUT US","COMMENT COMMANDER ?":"HOW TO ORDER?","4 étapes simples":"4 easy steps","Parcours les catégories et consulte les prix et disponibilités.":"Browse categories and check prices and availability.","Ajoute au panier":"Add to cart","Sélectionne les articles souhaités et vérifie le montant total.":"Select the items you want and check the total.","Confirme ta commande":"Confirm your order","Renseigne tes coordonnées, ton adresse et le mode de paiement proposé.":"Enter your contact details, address and available payment method.","Confirmation et livraison":"Confirmation and delivery","Notre équipe te contacte pour confirmer le traitement et les modalités de livraison.":"Our team will contact you to confirm processing and delivery details."
},
wo:{
"Accueil":"Dalal",
"Accessoires":"Jumtukaay yi",
"Gaming Phone":"Telefon yu gaming",
"Pièces eFootball":"Piis eFootball",
"Profil":"Sa profil",
"Tous":"Yépp",
"Collection":"Li ñu dajale",
"Découvrir les produits":"Seetal al yi",
"Panier":"Sa panie",
"Panier vide.":"Sa panie dafa féex.",
"Ajouter au panier":"Yokk ci sa panie",
"Ajouté au panier":"Yokk nañu ko ci sa panie",
"Découvrir mon panier":"Seetal sa panie",
"Rechercher un produit":"Seet benn al",
"Rechercher un produit...":"Seetal benn al...",
"SÉLECTION DU MOMENT":"Tànneef yi tey",
"TON SETUP. TON GAME.":"Sa setup, sa game.",
"TON STYLE.":"Sa style.",
"Univers Gaming":"Àdduna gaming",
"Accessoires gaming":"Jumtukaay yu gaming",
"Livraison au Sénégal et dans toute la sous-région":"Yóbbu gi ci Senegaal ak réew yi ko wër",
"BIENVENUE CHEZ SNGAMER":"DALAL AK JÀMM CI SNGAMER",
"BONJOUR ET BIENVENUE SUR SNGAMER STORE":"DALAL AK JÀMM CI SNGAMER STORE",
"MERCI DE NOUS RENDRE VISITE !":"JËRËJËF CI SA ÑËW!",
"Nous sommes heureux de vous accueillir dans notre boutique et de vous faire découvrir notre univers gaming.":"Bég nanu ci sa ñëw. Nanu la won sunu boutique ak sunu àdduna gaming.",
"Bienvenue dans la boutique. Merci de nous rendre visite aujourd’hui.":"Dalal ak jàmm ci sunu boutique. Jërëjëf ci sa ñëw tey.",
"SNGAMER STORE":"SNGAMER STORE",
"Découvre nos accessoires gaming, Gaming Phone, consoles et pièces eFootball.":"Seetal sunuy jumtukaay gaming, telefon yu gaming, consoles ak piis eFootball.",
"COMMANDE EN LIGNE":"JËND CI INTERNET",
"Choisis tes produits, ajoute-les au panier et passe ta commande facilement.":"Tànnal say al, yokk leen ci sa panie, te yónnee sa jënd ci yomb.",
"LIVRAISON AU SÉNÉGAL":"YÓBBU GI CI SENEGAAL",
"Nous préparons ta commande avec soin et facilitons sa livraison.":"Nu ngi waajal sa jënd ak teey, ngir yóbbu gi jaar yomb.",
"En promotion":"Ci promo",
"OFFRE EXCLUSIVE":"XÉEWAL BU ÀND AK YOW",
"Offre exclusive":"Xéewal bu ànd ak yow",
"Souris":"Souris",
"SOURIS":"SOURIS",
"Claviers":"Claviers",
"CLAVIERS":"CLAVIERS",
"Casques":"Casques",
"CASQUES":"CASQUES",
"Manettes":"Manettes",
"MANETTES":"MANETTES",
"PC Gaming":"PC Gaming",
"Console":"Console",
"Pièces eFootball Android":"Piis eFootball Android",
"Pièces eFootball iPhone":"Piis eFootball iPhone",
"Ordinateurs et équipements PC":"Ordinateur ak jumtukaay PC",
"Smartphones dédiés au jeu":"Telefon yu gaming",
"Consoles et accessoires console":"Consoles ak jumtukaayam",
"Mon espace client":"Sa espace client",
"CHOISIR PAYS & LANGUE":"TÀNN RÉEW AK LÀKK",
"Remonter en haut":"Dellusi ci kaw",
"Aucun produit dans cette rubrique pour le moment.":"Amul al ci wàll bii léegi.",
"LIVRAISON":"YÓBBU GI",
"ÉTAT DU PRODUIT":"NIRU AL BI",
"TYPE DE PRODUIT":"XEETU AL BI",
"GARANTIE":"GARANTI",
"Note du produit":"Njàngat ci al bi",
"Chargement…":"Mi ngi yebbi…",
"Pas encore de note":"Kenn jotagul a bind njàngat.",
"Connecte-toi pour laisser ou modifier ta note.":"Duggal ngir bind walla soppi sa njàngat.",
"Acheter maintenant":"Jënd léegi",
"Description":"Li aju ci al bi",
"Aucune description disponible.":"Amul benn leeral ci al bii.",
"Recevois cet article dans":"Dinga jot al bii ci",
"Reçois cet article dans":"Dinga jot al bii ci",
"2 heures maximum":"lu ëppul ñaari waxtu",
"heures maximum chez toi":"waxtu ci sa kër",
"chez toi":"ci sa kër",
"Partout au Sénégal":"Ci bépp Senegaal",
"Neuf":"Bu bees",
"Occasion":"Bu ñu jëfandikoon ba noppi",
"Reconditionné":"Bu ñu delloo ba mu mel ni bu bees",
"Produit numérique":"Al bu numérique",
"Aucune garantie":"Amul garanti",
"À définir":"Dañ koy dogal",
"Caractéristiques":"Melo yi ak xibaar yi",
"Voir plus ↓":"Wone yeneen ↓",
"Vidéo du produit":"Wideyo al bi",
"Sur commande":"Jënd ko ci ndigal",
"Rupture de stock":"Mbooloo mi jeex na",
"En stock":"Am na ci stock",
"Dernier article !":"Benn rekk moo des!",
"Stock limité":"Stock bi néew na",
"Total :":"Mboolem :",
"À PROPOS":"CI SUNU MBIR",
"COMMENT COMMANDER ?":"NAN LAÑUY JËNDEE?",
"Choisis ton produit":"Tànnal al bi",
"4 étapes simples":"Ñeenti jéego yu yomb",
"Parcours les catégories et consulte les prix et disponibilités.":"Xoolal xeet yi, seetal njëg yi ak li am ci stock.",
"Ajoute au panier":"Yokk ci sa panie",
"Sélectionne les articles souhaités et vérifie le montant total.":"Tànnal al yi nga bëgg te seetal mboolem njëg yi.",
"Confirme ta commande":"Dëggal sa jënd",
"Renseigne tes coordonnées, ton adresse et le mode de paiement proposé.":"Bindal say coordonnées, sa adres ak ni ngay faye.",
"Confirmation et livraison":"Dëggal gi ak yóbbu gi",
"Notre équipe te contacte pour confirmer le traitement et les modalités de livraison.":"Sunu ekip dina la woo ngir dëggal sa jënd ak ni ñuy ko yóbbu.",
"SNGAMER STORE · À PROPOS":"SNGAMER STORE · CI SUNU MBIR",
"L’univers gaming, sans frontières.":"Àdduna gaming amul ay diggante.",
"RESTONS EN CONTACT":"NANU NEKK CI JOKKOO",
"Contacte-nous et suis SNGAMER":"Jokkoo ak nun te toppal SNGAMER",
"Une question ou besoin d’assistance ? Retrouve-nous sur nos réseaux officiels.":"Am nga laaj walla soxla ndimbal? Gisal nu ci sunuy réseaux officiels.",
"Votre boutique gaming en ligne au Sénégal, basée à Dakar.":"Sa boutique gaming ci internet, ci Senegaal, Dakar.",
"Accessoires gaming, Gaming Phone et pièces eFootball sélectionnés pour les passionnés.":"Jumtukaay gaming, telefon yu gaming ak piis eFootball ñu tànn ngir ñi bëgg game.",
"BESOIN D'AIDE ?":"SOXLA NGA NDIMBAL?",
"Une question sur une commande ?":"Am nga laaj ci sa jënd?",
"SUIVEZ SNGAMER":"TOPPAL SNGAMER",
"Retrouvez-nous sur nos plateformes":"Gisal nu ci sunuy plateforme yi",
"WhatsApp":"WhatsApp",
"Contact direct":"Jokkoo ak nun",
"Nous contacter":"Jokkoo ak nun",
"Notre page officielle":"Sunuy xët officiel",
"Nos vidéos gaming":"Sunuy wideyo gaming",
"Facebook":"Facebook",
"TikTok":"TikTok",
"YouTube":"YouTube",
"Accueil":"Dalal"
}
};
var translationQueue=new Map(),translationTimer=null,translationRun=0,automaticText=new WeakMap();
function protectedNode(node){var el=node&&node.parentElement;return !el||!!el.closest(".productCardClickable h3,.productDetail h2,.productGallery,.price,[data-no-translate],input,textarea,select,script,style,code");}
function queueAutomaticTranslation(node,raw,value){
if(locale==="fr"||value.length<4||/^[\d\W_]+$/.test(value)||!/[\p{L}]/u.test(value))return;
translationQueue.set(node,{raw:raw,value:value,locale:locale,run:translationRun});
if(translationTimer)clearTimeout(translationTimer);
translationTimer=setTimeout(flushAutomaticTranslations,180);
}
async function flushAutomaticTranslations(){
translationTimer=null;
var entries=[],totalChars=0;Array.from(translationQueue.entries()).forEach(function(entry){if(entries.length>=30)return;var size=entry[1].value.length;if(size>5000||totalChars+size>30000)return;entries.push(entry);totalChars+=size;});
entries.forEach(function(entry){translationQueue.delete(entry[0]);});
if(!entries.length)return;
var activeLocale=locale,run=translationRun;
console.info("SNGAMER_TRANSLATION_CLIENT_BATCH",JSON.stringify({locale:activeLocale,count:entries.length}));
function retryEntries(delay){
entries.forEach(function(entry){
var meta=entry[1];
meta.attempts=(meta.attempts||0)+1;
if(meta.attempts<=3&&entry[0]&&entry[0].isConnected&&meta.locale===locale)translationQueue.set(entry[0],meta);
});
if(translationQueue.size&&locale===activeLocale&&run===translationRun){
if(translationTimer)clearTimeout(translationTimer);
translationTimer=setTimeout(flushAutomaticTranslations,delay);
}
}
try{
var response=await fetch("/api/translate",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({locale:activeLocale,texts:entries.map(function(entry){return entry[1].value;})})});
if(!response.ok){console.warn("SNGAMER_AUTO_TRANSLATION_HTTP_ERROR",response.status);retryEntries(response.status===429?12000:2500);return;}
var data=await response.json();
if(locale!==activeLocale||run!==translationRun||!Array.isArray(data.translations))return;
entries.forEach(function(entry,index){
var node=entry[0],meta=entry[1],translated=data.translations[index];
if(node&&node.isConnected&&originalText.get(node)===meta.raw&&typeof translated==="string"&&translated.trim()){
var rendered=meta.raw.replace(meta.value,translated);automaticText.set(node,{locale:activeLocale,text:rendered});node.nodeValue=rendered;
}
});
}catch(error){console.warn("SNGAMER_AUTO_TRANSLATION_UNAVAILABLE",error);retryEntries(3000);}
if(translationQueue.size&&locale!=="fr"&&!translationTimer)translationTimer=setTimeout(flushAutomaticTranslations,180);
}
function translateNode(node){
if(!node||node.nodeType!==Node.TEXT_NODE||protectedNode(node))return;
if(!originalText.has(node))originalText.set(node,node.nodeValue);
var raw=originalText.get(node),value=raw.trim();if(!value)return;
var auto=automaticText.get(node);if(locale!=="fr"&&auto&&auto.locale===locale&&node.nodeValue===auto.text)return;
var known=(dict[locale]||{})[value],target=locale==="fr"?value:(known||value);
if(locale!=="fr"&&!known)queueAutomaticTranslation(node,raw,value);else automaticText.delete(node);
var start=raw.match(/^\s*/)[0],end=raw.match(/\s*$/)[0],next=start+target+end;
if(node.nodeValue!==next)node.nodeValue=next;
}
function walk(root){
if(!root)return;if(root.nodeType===Node.TEXT_NODE){translateNode(root);return;}
if(root.nodeType===1&&root.closest&&root.closest(".productCardClickable h3,.productDetail h2,.productGallery,[data-no-translate]"))return;
var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(translateNode);
if(root.querySelectorAll)root.querySelectorAll("[placeholder],[aria-label],[title]").forEach(function(el){
if(el.closest("h3,.productCardClickable h3,.productDetail h2,.productGallery,[data-no-translate]"))return;
["placeholder","aria-label","title"].forEach(function(a){var v=el.getAttribute(a),t=(dict[locale]||{})[v];if(v&&t){if(!el.dataset["i18n"+a])el.dataset["i18n"+a]=v;el.setAttribute(a,t);}else if(el.dataset["i18n"+a])el.setAttribute(a,el.dataset["i18n"+a]);});
});
}
function countryRow(flag,name,code,localLocale,localLabel){
return '<section class="sngLanguageCountry"><div class="sngLanguageCountryName"><span class="sngLanguageFlag">'+flag+'</span><strong>'+name+'</strong></div><div class="sngLanguageOptions">'+
choice("fr",code,"Français")+choice(localLocale,code,localLabel)+
'</div></section>';
}
function choice(lang,code,label){return '<button type="button" class="sngLanguageChoice" data-locale="'+lang+'" data-country="'+code+'" aria-pressed="'+(locale===lang&&country===code)+'">'+label+'</button>';}
function menuHTML(){
return '<div class="sngLanguageMenu" id="sngLanguageMenu" role="dialog" aria-label="Choisir pays et langue" hidden>'+
'<div class="sngLanguageMenuTitle">CHOISIR PAYS &amp; LANGUE</div>'+
countryRow("🇸🇳","Sénégal","sn","wo","Wolof")+
countryRow("🇨🇮","Côte d’Ivoire","ci","man","Malinké")+
countryRow("🇹🇬","Togo","tg","ee","Éwé")+
countryRow("🇧🇫","Burkina Faso","bf","ff","Peulh")+
countryRow("🇧🇯","Bénin","bj","fon","Fon")+
countryRow("🇲🇱","Mali","ml","bm","Bambara")+
'<section class="sngLanguageCountry"><div class="sngLanguageCountryName"><span class="sngLanguageFlag">🌐</span><strong>International</strong></div><div class="sngLanguageOptions">'+choice("en","intl","English")+'</div></section>'+
'<div class="sngLanguageMenuNote">Les traductions locales sont générées automatiquement et doivent être vérifiées par des locuteurs natifs.</div></div>';
}
function close(){var m=document.getElementById("sngLanguageMenu"),b=document.getElementById("sngLanguageButton");if(m)m.hidden=true;if(b)b.setAttribute("aria-expanded","false");}
function position(){var b=document.getElementById("sngLanguageButton"),m=document.getElementById("sngLanguageMenu");if(!b||!m||m.hidden)return;var r=b.getBoundingClientRect(),w=Math.min(320,Math.max(180,Math.floor(window.innerWidth*.5)));w=Math.min(w,window.innerWidth-24);m.style.setProperty("width",w+"px","important");m.style.setProperty("max-width",w+"px","important");m.style.setProperty("left","auto","important");m.style.setProperty("right","12px","important");m.style.setProperty("top",Math.min(r.bottom+10,window.innerHeight-80)+"px","important");}
function setLocale(next,nextCountry){
if(!["fr","wo","en","man","ee","ff","fon","bm"].includes(next))return;locale=next;if(flags[nextCountry])country=nextCountry;
try{localStorage.setItem(STATE_KEY,locale+"|"+country);localStorage.setItem(KEY,locale);localStorage.setItem(KEY+"_country",country);}catch(_){}
close();apply();
}
function apply(){
translationRun++;translationQueue.clear();if(translationTimer){clearTimeout(translationTimer);translationTimer=null;}
document.documentElement.lang=locale;document.documentElement.dataset.storeLocale=locale;
document.querySelectorAll(".sngLanguageChoice[data-locale]").forEach(function(b){b.setAttribute("aria-pressed",String(b.dataset.locale===locale&&b.dataset.country===country));});
var flag=document.querySelector("#sngLanguageButton span");if(flag)flag.textContent=flags[country]||"🇸🇳";
walk(document.body);
window.dispatchEvent(new CustomEvent("sngamer:localechange",{detail:{locale:locale,country:country}}));
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
window.addEventListener("load",function(){attachMenu();apply();});
window.addEventListener("sngamer:home-sequence-complete",function(){attachMenu();apply();});
window.addEventListener("sngamer:i18nready",function(){apply();});
window.addEventListener("pageshow",function(){restoreSavedLocale();attachMenu();apply();});
window.setTimeout(function(){if(document.body){attachMenu();apply();}},700);
window.setTimeout(function(){if(document.body){attachMenu();apply();}},1800);
})();