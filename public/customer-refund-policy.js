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
      #products .card.productCardClickable .priceCurrent,
      #products .card.productCardClickable .price--promo .priceCurrent,
      #products .card.productCardClickable .price--regular .priceCurrent{color:#F4D58D !important;text-shadow:0 0 14px rgba(244,213,141,.16) !important}
      #products .card.productCardClickable .priceCurrent small{color:#a9b9ca !important;text-shadow:none !important}
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

  function removeDuplicateOrderMeta(){
    const profile=document.getElementById('profileArea');
    if(!profile) return;

    profile.querySelectorAll('.sgaOrder').forEach(function(card){
      const notice=Array.from(card.querySelectorAll('*')).find(function(el){
        return /MESSAGE DE LA BOUTIQUE/i.test((el.textContent||'').trim()) && el.children.length>=1;
      });
      const isInsideNotice=function(el){return !!(notice && (el===notice || notice.contains(el)))};

      card.querySelectorAll('p,div,span').forEach(function(el){
        if(isInsideNotice(el)) return;
        const text=(el.textContent||'').replace(/\s+/g,' ').trim();
        if(/^🚚\s*Suivi\s*[:·]\s*\S+$/i.test(text) || /^Suivi\s*[:·]\s*\S+$/i.test(text) || /^💬\s*Bien reçu$/i.test(text) || /^Bien reçu$/i.test(text)){
          const parent=el.parentElement;
          if(parent && parent.children.length===1 && !isInsideNotice(parent)) parent.remove();
          else el.remove();
        }
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
    apply();
    guardCancelFunction();
    const observer=new MutationObserver(function(){apply();guardCancelFunction()});
    observer.observe(document.body,{childList:true,subtree:true});
    setInterval(function(){apply();guardCancelFunction()},1500);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();

/* Public e-commerce policies — rendered from the existing policy asset so no new page route is required. */
(function(){
  'use strict';
  const policies={
    privacy:['Politique de confidentialité','<h3>Données collectées</h3><p>SNGAMER STORE peut collecter le nom, e-mail, téléphone, adresse et les informations nécessaires au compte, à la commande et au suivi.</p><h3>Utilisation</h3><p>Ces données servent à gérer les comptes, traiter les commandes, confirmer les paiements, organiser la livraison, assurer le support et sécuriser la boutique.</p><h3>Sécurité</h3><p>Les mots de passe sont protégés côté serveur. Des mesures techniques sont utilisées pour limiter les accès et requêtes non autorisés.</p><h3>Demandes</h3><p>Pour toute demande concernant vos données ou votre compte, contactez SNGAMER STORE via le contact officiel de la boutique.</p>'],
    terms:['Conditions générales de vente','<h3>Commande</h3><p>Le client doit vérifier les produits, quantités, coordonnées et montant avant de confirmer sa commande.</p><h3>Prix et disponibilité</h3><p>Les prix et disponibilités affichés peuvent évoluer. Le prix affiché lors de la validation fait foi pour la commande.</p><h3>Paiement</h3><p>Une commande payée est confirmée après validation du paiement par le système utilisé.</p><h3>Livraison</h3><p>Les modalités, délais et éventuels frais dépendent de la destination et sont communiqués lors du traitement.</p><h3>Annulation</h3><p>Les demandes d’annulation ou remboursement sont examinées selon l’état de la commande. Une commande déjà livrée ne peut pas être annulée ni remboursée selon la politique actuelle.</p>'],
    delivery:['Politique de livraison','<h3>Préparation</h3><p>Après confirmation de la commande et du paiement, SNGAMER STORE prépare la commande avant son expédition.</p><h3>Adresse</h3><p>Le client est responsable de l’exactitude de son nom, téléphone et adresse ou quartier.</p><h3>Suivi</h3><p>Lorsqu’un numéro de suivi est disponible, il peut être affiché dans l’espace client avec l’état de la commande.</p><h3>Difficulté</h3><p>En cas de problème de livraison, contactez SNGAMER STORE pour vérification et assistance.</p>'],
    payment:['Politique de paiement','<h3>Moyens de paiement</h3><p>Les moyens de paiement disponibles sont ceux affichés dans le parcours de commande.</p><h3>Validation</h3><p>Une ouverture de la page de paiement ne constitue pas un paiement réussi. Le statut est confirmé après validation par le système de paiement.</p><h3>Sécurité</h3><p>Ne transmettez jamais votre mot de passe, code PIN, OTP ou autre donnée confidentielle de paiement à une personne.</p>'],
    refund:['Annulation et remboursement','<h3>Demande</h3><p>Contactez SNGAMER STORE avant la livraison pour toute demande d’annulation ou de remboursement.</p><h3>Examen</h3><p>Chaque demande est examinée selon l’état de la commande et son paiement.</p><h3>Commande livrée</h3><p>Une commande déjà livrée ne peut pas être annulée ni faire l’objet d’un remboursement selon la politique commerciale actuelle.</p><h3>Contact</h3><p><a href="https://wa.me/221786127985" target="_blank" rel="noopener noreferrer">WhatsApp SNGAMER STORE</a></p>']
  };
  function mount(){
    if(document.getElementById('sngPublicPolicies')) return;
    const footer=document.querySelector('footer'); if(!footer) return;
    const style=document.createElement('style');style.textContent='.sngPolicyLinks{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:18px auto 6px}.sngPolicyLinks button{border:1px solid rgba(87,164,255,.28);background:#0d182b;color:#a9c9ef;border-radius:999px;padding:8px 12px;font:600 11px inherit;cursor:pointer}.sngPolicyOverlay{position:fixed;inset:0;z-index:10000;background:rgba(2,5,12,.8);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:18px;opacity:0;pointer-events:none;transition:.2s}.sngPolicyOverlay.open{opacity:1;pointer-events:auto}.sngPolicyModal{width:min(760px,100%);max-height:88vh;overflow:auto;border:1px solid rgba(82,159,255,.3);border-radius:22px;background:#0c1628;color:#dce5f2;padding:22px;box-shadow:0 20px 70px #0008}.sngPolicyTop{display:flex;justify-content:space-between;align-items:center;position:sticky;top:-22px;background:#0c1628;padding-bottom:15px}.sngPolicyTop h2{margin:0;color:#fff;font-size:22px}.sngPolicyClose{background:#18233a;color:#fff;border:1px solid #ffffff26;border-radius:12px;width:40px;height:40px;font-size:24px;cursor:pointer}.sngPolicyContent h3{color:#fff;font-size:14px;margin:20px 0 7px}.sngPolicyContent p{color:#aebbd0;font-size:13px;line-height:1.7;margin:0 0 8px}.sngPolicyContent a{color:#69b6ff}';document.head.appendChild(style);
    const links=document.createElement('div');links.id='sngPublicPolicies';links.className='sngPolicyLinks';links.innerHTML='<button data-policy="privacy">Confidentialité</button><button data-policy="terms">CGV</button><button data-policy="delivery">Livraison</button><button data-policy="payment">Paiement</button><button data-policy="refund">Annulation & remboursement</button>';
    const overlay=document.createElement('div');overlay.id='sngPolicyOverlay';overlay.className='sngPolicyOverlay';overlay.innerHTML='<div class="sngPolicyModal"><div class="sngPolicyTop"><h2 id="sngPolicyTitle"></h2><button class="sngPolicyClose" type="button">×</button></div><div id="sngPolicyContent" class="sngPolicyContent"></div></div>';
    document.body.appendChild(overlay);footer.parentNode.insertBefore(links,footer);
    const close=()=>{overlay.classList.remove('open');document.body.style.overflow=''};links.onclick=e=>{const k=e.target.closest('[data-policy]')?.dataset.policy;if(!k)return;document.getElementById('sngPolicyTitle').textContent=policies[k][0];document.getElementById('sngPolicyContent').innerHTML=policies[k][1];overlay.classList.add('open');document.body.style.overflow='hidden'};overlay.onclick=e=>{if(e.target===overlay)close()};overlay.querySelector('.sngPolicyClose').onclick=close;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
