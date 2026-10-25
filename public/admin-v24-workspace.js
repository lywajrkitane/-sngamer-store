/* SNGAMER STORE — canonical admin workspace controller.
   Navigation markup/styles live in admin.html and admin-dashboard.html.
   This file only binds navigation and isolates the selected section.
*/
(function () {
  'use strict';
  var NAV_ID = 'sg-admin-v26-nav';
  var ROOT_ID = 'adminBox';
  var STORAGE_KEY = 'sg_admin_workspace_v26';
  var VIEWS = [
    ['overview', "Vue d'ensemble", '▦'], ['hero', 'Hero', '🎯'],
    ['products', 'Produits', '📦'], ['orders', 'Commandes', '🛒'],
    ['promotions', 'Promotions', '🎉'], ['campaigns', 'Campagnes', '📣'],
    ['customers', 'Clients', '👥']
  ];
  function root(){ return document.getElementById(ROOT_ID); }
  function navElement(){
    var r=root(), n=document.getElementById(NAV_ID);
    return r&&n&&n.parentElement===r?n:null;
  }
  function norm(value){
    return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
  }
  function sectionType(section){
    var h=section.querySelector('h1,h2,h3,h4'), heading=norm(h?h.textContent:''), id=norm(section.id);
    var cls=norm(typeof section.className==='string'?section.className:''), text=norm((section.textContent||'').slice(0,1200));
    if(id==='sgcustomersection'||cls.indexOf('sgcustomersection')!==-1||/\bclients?\b/.test(heading))return 'customers';
    if(/\bhero\b/.test(heading)||id.indexOf('hero')!==-1||cls.indexOf('hero')!==-1||/page d'accueil|page d’accueil/.test(heading))return 'hero';
    if(/campagnes?/.test(heading)||id.indexOf('campaign')!==-1||cls.indexOf('campaignssection')!==-1)return 'campaigns';
    if(/promotions?/.test(heading)||id.indexOf('promotion')!==-1||cls.indexOf('promoadminsection')!==-1)return 'promotions';
    if(/gestion des produits|produits?|stock/.test(heading)||id.indexOf('product')!==-1)return 'products';
    if(/commandes?|orders?/.test(heading)||id.indexOf('order')!==-1||text.indexOf('gestion rapide de toutes les commandes')!==-1)return 'orders';
    return 'other';
  }
  function directSections(r){
    return Array.prototype.filter.call(r.children||[],function(child){return child&&child.tagName==='SECTION';});
  }
  function setView(view,shouldScroll){
    var r=root(),nav=navElement(); if(!r||!nav)return false;
    var valid=VIEWS.some(function(v){return v[0]===view;})?view:'overview';
    r.classList.add('sg-v26-mode'); r.setAttribute('data-v26-workspace',valid);
    directSections(r).forEach(function(section){
      var show=valid==='overview'||sectionType(section)===valid;
      section.classList.toggle('sg-v26-show',show); section.classList.toggle('sg-v26-hide',!show);
    });
    var stats=r.querySelector(':scope > .stats'); if(stats)stats.style.display=valid==='overview'?'':'none';
    Array.prototype.forEach.call(nav.querySelectorAll('[data-v26-view]'),function(button){
      var active=button.getAttribute('data-v26-view')===valid;
      button.classList.toggle('active',active); button.setAttribute('aria-current',active?'page':'false');
    });
    try{sessionStorage.setItem(STORAGE_KEY,valid);}catch(_){}
    nav.setAttribute('data-workspace-controller','ready');
    if(shouldScroll)window.scrollTo({top:0,left:0,behavior:'auto'});
    return true;
  }
  function bindNav(nav){
    if(!nav||nav.getAttribute('data-bound')==='1')return;
    nav.setAttribute('data-bound','1');
    nav.addEventListener('click',function(event){
      var target=event.target,button=target&&target.closest?target.closest('[data-v26-view]'):null;
      if(!button||!nav.contains(button))return;
      event.preventDefault(); event.stopPropagation(); setView(button.getAttribute('data-v26-view'),true);
    });
  }
  var sectionObserver=null;
  function observeSections(){
    var r=root(); if(!r||sectionObserver||typeof MutationObserver==='undefined')return;
    sectionObserver=new MutationObserver(function(records){
      var added=records.some(function(record){
        return Array.prototype.some.call(record.addedNodes||[],function(node){
          return node&&node.nodeType===1&&(node.tagName==='SECTION'||(node.querySelector&&node.querySelector('section')));
        });
      });
      if(added)setView(r.getAttribute('data-v26-workspace')||'overview',false);
    });
    sectionObserver.observe(r,{childList:true,subtree:true});
  }
  function boot(){
    var r=root(),nav=navElement(); if(!r||!nav)return false;
    bindNav(nav); observeSections();
    var saved='overview'; try{saved=sessionStorage.getItem(STORAGE_KEY)||'overview';}catch(_){}
    setView(saved,false); nav.setAttribute('data-workspace-controller','ready'); return true;
  }
  window.SNGAMER_ADMIN_WORKSPACE_BOOT=boot;
  window.SNGAMER_ADMIN_WORKSPACE_SET_VIEW=setView;
  function start(){
    var attempts=0;
    function tick(){if(boot())return;attempts+=1;if(attempts<300)window.setTimeout(tick,200);}
    tick();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();
