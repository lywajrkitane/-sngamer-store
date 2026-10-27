/* SNGAMER STORE — politique d'annulation et de remboursement côté client */
(function(){
  'use strict';
  function injectStyles(){
    if(document.getElementById('sngamerRefundPolicyStyles')) return;
    const style=document.createElement('style');
    style.id='sngamerRefundPolicyStyles';
    style.textContent=`
      .sgaRefundPolicy{margin-top:14px;padding:16px 15px;border:1px solid rgba(255,196,78,.24);border-radius:16px;background:linear-gradient(145deg,rgba(58,42,15,.34),rgba(15,18,27,.72));color:#dce5f2}
      .sgaRefundPolicyHead{display:flex;align-items:flex-start;gap:11px}
      .sgaRefundPolicyIcon{width:38px;height:38px;flex:0 0 38px;border-radius:12px;display:grid;place-items:center;background:rgba(255,190,65,.13);font-size:19px}
      .sgaRefundPolicy h4{margin:0 0 5px;font-size:13px;color:#fff}
      .sgaRefundPolicy p{margin:0;color:#aebbd0;font-size:11px;line-height:1.6}
      .sgaRefundPolicy b{color:#fff}
      .sgaClientCancelDisabled{display:none!important}
    `;
    document.head.appendChild(style);
  }
  function policyHtml(){
    return `<div class="sgaRefundPolicy" data-sngamer-refund-policy="1"><div class="sgaRefundPolicyHead"><div class="sgaRefundPolicyIcon">🔒</div><div><h4>Annulation & remboursement</h4><p>Pour toute demande d’annulation ou de remboursement, <b>veuillez contacter SNGAMER STORE avant la livraison de votre commande</b>. Chaque demande est examinée en fonction de l’état de la commande et de notre politique commerciale.</p><p style="margin-top:7px"><b>Une commande déjà livrée ne peut pas être annulée ni faire l’objet d’un remboursement.</b></p></div></div></div>`;
  }
  function removeDuplicateOrderMeta(){
    const profile=document.getElementById('profileArea');
    if(!profile) return;
    profile.querySelectorAll('.sgaOrder').forEach(function(card){
      const notice=Array.from(card.querySelectorAll('*')).find(function(el){return /MESSAGE DE LA BOUTIQUE/i.test((el.textContent||'').trim()) && el.children.length>=1;});
      const isInsideNotice=function(el){return !!(notice && (el===notice || notice.contains(el)))};
      card.querySelectorAll('p,div,span').forEach(function(el){
        if(isInsideNotice(el)) return;
        const text=(el.textContent||'').replace(/\s+/g,' ').trim();
        if(/^🚚\s*Suivi\s*[:·]\s*\S+$/i.test(text) || /^Suivi\s*[:·]\s*\S+$/i.test(text) || /^💬\s*Bien reçu$/i.test(text) || /^Bien reçu$/i.test(text)){
          const parent=el.parentElement;
          if(parent && parent.children.length===1 && !isInsideNotice(parent)) parent.remove(); else el.remove();
        }
      });
    });
  }
  function apply(){
    injectStyles();
    const profile=document.getElementById('profileArea');
    if(!profile) return;
    profile.querySelectorAll('.sgaOrder .sgaActions').forEach(el=>{if(el.querySelector('[onclick*="sngCancelOrder"]')) el.classList.add('sgaClientCancelDisabled');});
    removeDuplicateOrderMeta();
    const cards=Array.from(profile.querySelectorAll('.sgaCard'));
    const ordersCard=cards.find(card=>card.querySelector('.sgaSectionTitle')?.textContent?.trim()==='Mes commandes');
    if(ordersCard && !ordersCard.querySelector('[data-sngamer-refund-policy="1"]')) ordersCard.insertAdjacentHTML('beforeend',policyHtml());
  }
  function guardCancelFunction(){
    if(typeof window.sngCancelOrder!=='function') return;
    if(window.sngCancelOrder.__sngamerPolicyGuard) return;
    const guarded=function(){alert('Pour toute demande d’annulation ou de remboursement, veuillez contacter SNGAMER STORE avant la livraison de votre commande. Une commande déjà livrée ne peut pas être annulée ni faire l’objet d’un remboursement.')};
    guarded.__sngamerPolicyGuard=true;
    window.sngCancelOrder=guarded;
  }
  function start(){
    apply();guardCancelFunction();
    const observer=new MutationObserver(function(){apply();guardCancelFunction()});
    observer.observe(document.body,{childList:true,subtree:true});
    setInterval(function(){apply();guardCancelFunction()},1500);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();

/* SNGAMER STORE — professional public policy navigation */
(function(){
  'use strict';
  const links=[['/politique-confidentialite.html','Confidentialité'],['/cgv.html','CGV'],['/livraison.html','Livraison'],['/paiement.html','Paiement'],['/annulation-remboursement.html','Annulation & remboursement']];
  function mount(){
    const footer=document.querySelector('footer');
    if(!footer) return;
    let container=document.getElementById('sngPublicPolicies');
    if(!container){container=document.createElement('nav');container.id='sngPublicPolicies';container.setAttribute('aria-label','Politiques de la boutique');footer.parentNode.insertBefore(container,footer);}
    if(!document.getElementById('sngPublicPolicyStyles')){
      const style=document.createElement('style');style.id='sngPublicPolicyStyles';
      style.textContent=`
        #sngPublicPolicies{width:min(980px,calc(100% - 32px));margin:18px auto 10px;padding:0;box-sizing:border-box;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;position:relative;z-index:20}
        #sngPublicPolicies::before{content:'INFORMATIONS & POLITIQUES';grid-column:1/-1;color:#6daeff;font-size:12px;font-weight:800;letter-spacing:2.5px;margin:0 2px 3px}
        #sngPublicPolicies a{min-height:46px;display:flex;align-items:center;justify-content:center;text-align:center;padding:10px 12px;box-sizing:border-box;border:1px solid rgba(87,164,255,.28);border-radius:14px;background:linear-gradient(145deg,#101d32,#0b1424);color:#b8d1ed;text-decoration:none;font-size:12px;font-weight:700;line-height:1.25;box-shadow:0 8px 24px rgba(0,0,0,.16);transition:transform .16s ease,border-color .16s ease,background .16s ease,color .16s ease}
        #sngPublicPolicies a:hover,#sngPublicPolicies a:focus-visible{transform:translateY(-2px);border-color:rgba(80,170,255,.65);background:linear-gradient(145deg,#132746,#0d1a2e);color:#fff;outline:none}
        #sngPublicPolicies a:last-child{grid-column:span 2}
        html body > .store-footer-content{margin-bottom:18px!important}
        html body > footer{display:none!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important}
        @media(max-width:760px){#sngPublicPolicies{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;padding-bottom:110px}#sngPublicPolicies a:last-child{grid-column:span 2}}
      `;
      document.head.appendChild(style);
    }
    container.innerHTML=links.map(([href,label])=>`<a href="${href}">${label}</a>`).join('');
    footer.remove();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true}); else mount();
})();
