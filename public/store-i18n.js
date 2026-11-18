(function(){
  "use strict";
  if(window.__sngamerI18nLoaded) return;
  window.__sngamerI18nLoaded = true;

  var STORAGE_KEY = "sngamer_store_locale_v1";
  var locales = {
    fr: {label:"Français",flag:"🇸🇳",country:"Sénégal"},
    wo: {label:"Wolof · bêta",flag:"🇸🇳",country:"Sénégal"},
    en: {label:"English",flag:"🌐",country:"International"}
  };
  var dictionaries = {
    en: {
      "Accueil":"Home","Accessoires":"Accessories","Gaming Phone":"Gaming phones",
      "Pièces eFootball":"eFootball coins","Profil":"Profile","Tous":"All",
      "Collection":"Collection","Découvrir les produits":"Explore products",
      "SÉLECTION DU MOMENT":"FEATURED SELECTION","TON SETUP. TON GAME.":"YOUR SETUP. YOUR GAME.",
      "Livraison au Sénégal et dans toute la sous-région":"Delivery in Senegal and across West Africa",
      "En promotion":"On sale","Panier vide.":"Your cart is empty.",
      "Aucun produit dans cette rubrique pour le moment.":"No products in this section yet.",
      "Ajouter au panier":"Add to cart","Mon profil":"My profile","Panier":"Cart",
      "Rechercher un produit":"Search products","Rechercher un produit...":"Search for a product...",
      "À PROPOS":"ABOUT US","COMMENT COMMANDER ?":"HOW TO ORDER?",
      "Choisis ton produit":"Choose your product","Sur commande":"Available to order",
      "Rupture de stock":"Out of stock","En stock":"In stock","Stock limité":"Limited stock",
      "Dernier article !":"Last item!","Découvrir mon panier":"View my cart"
    },
    wo: {
      "Accueil":"Dalal",
      "Accessoires":"Jumtukaay yi",
      "Gaming Phone":"Telefon yu gaming",
      "Pièces eFootball":"Piisi eFootball",
      "Profil":"Profil",
      "Tous":"Yépp",
      "Collection":"Li ñu tànn",
      "Découvrir les produits":"Seetal al yi",
      "Panier vide.":"Sa panie amul dara."
    }
  };
  var locale = "fr";
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if(saved && locales[saved]) locale = saved;
  } catch(_) {}

  function isProtected(node){
    var el=node && node.parentElement;
    if(!el) return true;
    return !!el.closest("h3,.productCardClickable,.productDetail,.productGallery,.cartItem,.price,.productCardImage,.productName,[data-no-translate],input,textarea,select,script,style,code");
  }
  function translateNode(node){
    if(!node || node.nodeType!==Node.TEXT_NODE || isProtected(node)) return;
    var raw=node.nodeValue;
    var value=raw.trim();
    if(!value) return;
    var target = locale==="fr" ? value : (dictionaries[locale] && dictionaries[locale][value]);
    if(!target) return;
    var start=raw.match(/^\s*/)[0], end=raw.match(/\s*$/)[0];
    var next=start+target+end;
    if(node.nodeValue!==next) node.nodeValue=next;
  }
  function translateAttributes(root){
    if(locale==="fr") return;
    var dict=dictionaries[locale]||{};
    var selectors="[placeholder],[aria-label],[title]";
    var elements=[];
    if(root.nodeType===1 && root.matches && root.matches(selectors)) elements.push(root);
    if(root.querySelectorAll) elements=elements.concat(Array.from(root.querySelectorAll(selectors)));
    elements.forEach(function(el){
      if(el.closest("h3,.productCardClickable,.productDetail,[data-no-translate]")) return;
      ["placeholder","aria-label","title"].forEach(function(attr){
        var v=el.getAttribute(attr);
        if(v && dict[v]) el.setAttribute(attr,dict[v]);
      });
    });
  }
  function walk(root){
    if(!root) return;
    if(root.nodeType===Node.TEXT_NODE){translateNode(root);return;}
    if(root.nodeType===1 && root.closest && root.closest("h3,.productCardClickable,.productDetail,[data-no-translate]")) return;
    var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    var nodes=[];while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(translateNode);
    translateAttributes(root);
  }
  function applyLocale(){
    document.documentElement.lang=locale==="wo"?"wo":locale;
    document.documentElement.dataset.storeLocale=locale;
    document.querySelectorAll(".sngLanguageChoice").forEach(function(btn){
      btn.setAttribute("aria-pressed",String(btn.dataset.locale===locale));
    });
    walk(document.body);
    if(window.dispatchEvent) window.dispatchEvent(new CustomEvent("sngamer:localechange",{detail:{locale:locale}}));
  }
  function selectLocale(next){
    if(!locales[next]) return;
    locale=next;
    try{localStorage.setItem(STORAGE_KEY,next);}catch(_){}
    closeMenu();
    applyLocale();
  }
  function menuMarkup(){
    return '<div class="sngLanguageMenu" id="sngLanguageMenu" role="dialog" aria-label="Choisir pays et langue" hidden>'+
      '<div class="sngLanguageMenuTitle">CHOISIR PAYS &amp; LANGUE</div>'+
      countryRow("🇸🇳","Sénégal",["fr","wo"])+
      countryRow("🇨🇮","Côte d’Ivoire",["fr","soon:Malinké"])+
      countryRow("🇹🇬","Togo",["fr","soon:Éwé"])+
      countryRow("🇧🇫","Burkina Faso",["fr","soon:Peulh"])+
      countryRow("🇧🇯","Bénin",["fr","soon:Fon"])+
      countryRow("🇲🇱","Mali",["fr","soon:Bambara"])+
      '<div class="sngLanguageCountry"><div class="sngLanguageCountryName"><span class="sngLanguageFlag">🌐</span><strong>International</strong></div><div class="sngLanguageOptions">'+choice("en")+'</div></div>'+
      '<div class="sngLanguageMenuNote">Les langues marquées « bientôt » seront activées après validation de leur qualité.</div></div>';
  }
  function choice(code){
    var item=locales[code];
    return '<button type="button" class="sngLanguageChoice" data-locale="'+code+'" aria-pressed="'+(locale===code)+'">'+item.label+'</button>';
  }
  function countryRow(flag,name,choices){
    var html='<div class="sngLanguageCountry"><div class="sngLanguageCountryName"><span class="sngLanguageFlag">'+flag+'</span><strong>'+name+'</strong></div><div class="sngLanguageOptions">';
    choices.forEach(function(code){
      if(code==="fr"||code==="wo") html+=choice(code);
      else html+='<button type="button" class="sngLanguageChoice isComingSoon" disabled>'+code.replace("soon:","")+' <small>Bientôt</small></button>';
    });
    return html+'</div></div>';
  }
  function closeMenu(){
    var menu=document.getElementById("sngLanguageMenu");
    var button=document.getElementById("sngLanguageButton");
    if(menu) menu.hidden=true;
    if(button) button.setAttribute("aria-expanded","false");
  }
  function positionMenu(){
    var button=document.getElementById("sngLanguageButton"), menu=document.getElementById("sngLanguageMenu");
    if(!button||!menu||menu.hidden) return;
    var r=button.getBoundingClientRect(), width=Math.min(420,window.innerWidth-24);
    var left=Math.max(12,Math.min(r.left+r.width/2-width/2,window.innerWidth-width-12));
    menu.style.width=width+"px";
    menu.style.left=left+"px";
    menu.style.top=Math.min(r.bottom+10,window.innerHeight-100)+"px";
  }
  function ensureMenu(){
    var button=document.getElementById("sngLanguageButton");
    if(!button) return;
    if(!document.getElementById("sngLanguageMenu")){
      document.body.insertAdjacentHTML("beforeend",menuMarkup());
    }
    button.setAttribute("aria-haspopup","dialog");
    button.setAttribute("aria-expanded","false");
    button.addEventListener("click",function(e){
      e.preventDefault();e.stopPropagation();
      var menu=document.getElementById("sngLanguageMenu");
      menu.hidden=!menu.hidden;
      button.setAttribute("aria-expanded",String(!menu.hidden));
      if(!menu.hidden) positionMenu();
    });
    document.getElementById("sngLanguageMenu").addEventListener("click",function(e){
      var target=e.target.closest("[data-locale]");
      if(target) selectLocale(target.dataset.locale);
    });
    document.addEventListener("click",function(e){
      var menu=document.getElementById("sngLanguageMenu");
      if(menu&&!menu.hidden&&!menu.contains(e.target)&&!button.contains(e.target)) closeMenu();
    });
    document.addEventListener("keydown",function(e){if(e.key==="Escape")closeMenu();});
    window.addEventListener("resize",positionMenu,{passive:true});
    window.addEventListener("scroll",positionMenu,{passive:true});
  }
  function boot(){
    ensureMenu();
    applyLocale();
    if(window.MutationObserver && !window.__sngamerI18nObserver){
      window.__sngamerI18nObserver=new MutationObserver(function(records){
        records.forEach(function(record){
          if(record.type==="characterData") translateNode(record.target);
          else record.addedNodes.forEach(function(n){walk(n);});
        });
      });
      window.__sngamerI18nObserver.observe(document.body,{subtree:true,childList:true,characterData:true});
    }
  }
  window.SNGamerI18n={
    getLocale:function(){return locale;},
    setLocale:selectLocale,
    t:function(fr){return locale==="fr"?fr:((dictionaries[locale]||{})[fr]||fr);}
  };
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();