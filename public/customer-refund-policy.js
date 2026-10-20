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

      /* Product prices: force the approved premium champagne-gold price on mobile and desktop. */
      #products .card.productCardClickable .priceCurrent,
      #products .card.productCardClickable .price--promo .priceCurrent,
      #products .card.productCardClickable .price--regular .priceCurrent{
        color:#F4D58D !important;
        text-shadow:0 0 14px rgba(244,213,141,.16) !important;
      }
      #products .card.productCardClickable .priceCurrent small{
        color:#a9b9ca !important;
        text-shadow:none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function policyHtml(){
    return `<div class="sgaRefundPolicy" data-sngamer-refund-policy="1">
      <div class="sgaRefundPolicyHead">
        <div class="sgaRefundPolicyIcon">🔒</div>
        <div>
          <h4>Annulation & remboursement</h4>
          <p>Pour toute demande d’annulation ou de remboursement, <b>veuillez contacter SNGAMER STORE avant la livraison de votre commande</b>. Chaque demande est examinée en fonction de l’état de la commande et de notre politique commerciale.</p>
          <p style="margin-top:7px"><b>Une commande déjà livrée ne peut pas être annulée ni faire l’objet d’un remboursement.</b></p>
        </div>
      </div>
    </div>`;
  }

  function cleanLabel(value){
    return String(value||'').replace(/^\s*[^\p{L}\p{N}]+/u,'').replace(/\s+/g,' ').trim();
  }

  function removeDuplicateOrderMeta(){
    const profile=document.getElementById('profileArea');
    if(!profile) return;

    profile.querySelectorAll('.sgaOrder').forEach(function(card){
      const notice=Array.from(card.querySelectorAll('*')).find(function(el){
        return /MESSAGE DE LA BOUTIQUE/i.test((el.textContent||'').trim()) && el.children.length>=1;
      });

      const isInsideNotice=function(el){
        return !!(notice && (el===notice || notice.contains(el)));
      };

      const targets=[];
      const walker=document.createTreeWalker(card,NodeFilter.SHOW_TEXT);
      let node;
      while((node=walker.nextNode())){
        const text=(node.nodeValue||'').replace(/\s+/g,' ').trim();
        if(!text) continue;
        if(!/^((🚚\s*)?Suivi\s*[:·]\s*.+|(💬\s*)?Bien reçu)$/i.test(text)) continue;
        const el=node.parentElement;
        if(!el || isInsideNotice(el)) continue;
        targets.push(el);
      }

      targets.forEach(function(el){
        let row=el;
        while(row.parentElement && row.parentElement!==card){
          const parent=row.parentElement;
          if(cleanLabel(parent.textContent)!==cleanLabel(row.textContent)) break;
          row=parent;
        }
        if(!isInsideNotice(row)) row.remove();
      });
    });
  }

  function apply(){
    injectStyles();
    const profile=document.getElementById('profileArea');
    if(!profile) return;

    profile.querySelectorAll('.sgaOrder .sgaActions').forEach(el=>{
      if(el.querySelector('[onclick*="sngCancelOrder"]')) el.classList.add('sgaClientCancelDisabled');
    });

    removeDuplicateOrderMeta();

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
      alert('Pour toute demande d’annulation ou de remboursement, veuillez contacter SNGAMER STORE avant la livraison de votre commande. Une commande déjà livrée ne peut pas être annulée ni faire l’objet d’un remboursement.');
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
