'use strict';

const express = require('express');

const RESET_BOOTSTRAP = `<script>(function(){'use strict';function install(){var p=document.getElementById('sg-site-analytics-panel');if(!p)return;var h=p.querySelector('.sg-analytics-head');if(!h||h.querySelector('#sgAnalyticsReset'))return;var r=h.querySelector('#sgAnalyticsRefresh');var b=document.createElement('button');b.type='button';b.id='sgAnalyticsReset';b.textContent='Réinitialiser';b.title='Réinitialiser les statistiques sans supprimer produits, clients ou commandes';b.style.cssText='border:1px solid rgba(255,184,77,.25);border-radius:10px;padding:9px 12px;background:rgba(255,184,77,.10);color:#ffd38a;font-weight:800;cursor:pointer;white-space:nowrap;margin-left:6px';b.onclick=async function(){if(!window.confirm('Réinitialiser les statistiques de la boutique ?\\n\\nLes produits, comptes clients et commandes ne seront pas supprimés.'))return;b.disabled=true;b.textContent='Réinitialisation…';try{var x=await fetch('/api/admin/analytics/reset',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},cache:'no-store'});var d=await x.json().catch(function(){return{}});if(!x.ok)throw new Error(d.error||'Réinitialisation impossible');b.textContent='Réinitialisé ✓';if(r&&document.body.contains(r))r.click();setTimeout(function(){var q=document.getElementById('sgAnalyticsReset');if(q){q.textContent='Réinitialiser';q.disabled=false}},1800)}catch(e){b.textContent='Erreur';setTimeout(function(){var q=document.getElementById('sgAnalyticsReset');if(q){q.textContent='Réinitialiser';q.disabled=false}},2200);alert(e.message||'Impossible de réinitialiser les statistiques')}};if(r&&r.parentElement)r.parentElement.appendChild(b);else h.appendChild(b)}var o=new MutationObserver(install);o.observe(document.documentElement,{childList:true,subtree:true});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install()})();</script>`;

function install(app) {
  const stack = app._router && app._router.stack;
  if (!stack || app.__sngAnalyticsBaselineUiInstalled) return;
  app.__sngAnalyticsBaselineUiInstalled = true;
  const injector = express.Router();
  injector.use((req, res, next) => {
    if (req.path !== '/admin.html' && req.path !== '/admin-dashboard.html') return next();
    const originalSend = res.send.bind(res);
    res.send = body => {
      try {
        if (typeof body === 'string' && body.includes('</body>') && !body.includes('sgAnalyticsReset')) {
          body = body.replace('</body>', RESET_BOOTSTRAP + '</body>');
        }
      } catch (e) {
        console.error('ANALYTICS_BASELINE_UI_INJECT_ERROR:', e.message);
      }
      return originalSend(body);
    };
    next();
  });
  stack.unshift(...injector.stack);
}

const target = express.application;
const existingListen = target.listen;
let currentListen = existingListen;
function wrap(nextListen) {
  return function analyticsBaselineUiListen(...args) {
    try { install(this); } catch (e) { console.error('ANALYTICS_BASELINE_UI_INSTALL_ERROR:', e); }
    return nextListen.apply(this, args);
  };
}
Object.defineProperty(target, 'listen', {
  configurable: true,
  enumerable: false,
  get() { return currentListen; },
  set(nextListen) { currentListen = wrap(nextListen); }
});
currentListen = wrap(existingListen);
