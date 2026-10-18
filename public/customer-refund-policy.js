/* SNGAMER STORE — politique d'annulation et de remboursement côté client */
(function(){
  'use strict';

  const WA='https://wa.me/221786127985';

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
      .sgaRefundPolicyBtn{display:inline-flex;align-items:center;justify-content:center;gap:7px;margin-top:12px;border:1px solid rgba(70,154,255,.35);border-radius:10px;padding:10px 13px;background:#132238;color:#fff;font-weight:900;font-size:11px;text-decoration:none}
      .sgaClientCancelDisabled{display:none!important}
    `;
    document.head.appendChild(style);
  }

  function policyHtml(){
    return `<div class="sgaRefundPolicy" data-sngamer-refund-policy="1">
      <div class="sgaRefundPolicyHead">
        <div class="sgaRefundPolicyIcon">🔒</div>
        <div>
          <h4>Annulation & remboursement</h4>
          <p>Si tu souhaites annuler une commande ou demander un remboursement, <b>contacte d’abord SNGAMER STORE</b>. Si la commande n’est pas encore livrée, notre équipe vérifiera la situation et pourra traiter le remboursement depuis le dashboard via PayTech.</p>
          <p style="margin-top:7px"><b>Une commande déjà livrée ne peut pas faire l’objet d’une demande de remboursement depuis cet espace.</b></p>
          <a class="sgaRefundPolicyBtn" href="${WA}" target="_blank" rel="noopener noreferrer">💬 Contacter SNGAMER sur WhatsApp</a>
        </div>
      </div>
    </div>`;
  }

  function apply(){
    injectStyles();
    const profile=document.getElementById('profileArea');
    if(!profile) return;

    profile.querySelectorAll('.sgaOrder .sgaActions').forEach(el=>{
      if(el.querySelector('[onclick*="sngCancelOrder"]')) el.classList.add('sgaClientCancelDisabled');
    });

    const cards=Array.from(profile.querySelectorAll('.sgaCard'));
    const ordersCard=cards.find(card=>card.querySelector('.sgaSectionTitle')?.textContent?.trim()==='Mes commandes');
    if(ordersCard && !ordersCard.querySelector('[data-sngamer-refund-policy="1"]')){
      ordersCard.insertAdjacentHTML('beforeend',policyHtml());
    }
  }

  function guardCancelFunction(){
    if(typeof window.sngCancelOrder!=='function') return;
    if(window.sngCancelOrder.__sngamerPolicyGuard) return;
    const guarded=function(){
      alert('Pour une annulation ou une demande de remboursement, contacte d’abord SNGAMER STORE. Si la commande n’est pas encore livrée, notre équipe vérifiera ta demande et pourra traiter le remboursement via PayTech depuis le dashboard.');
    };
    guarded.__sngamerPolicyGuard=true;
    window.sngCancelOrder=guarded;
  }

  function start(){
    apply();
    guardCancelFunction();
    const observer=new MutationObserver(function(){apply();guardCancelFunction()});
    observer.observe(document.body,{childList:true,subtree:true});
    setInterval(function(){apply();guardCancelFunction()},1500);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
