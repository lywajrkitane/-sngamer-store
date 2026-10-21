(() => {
  "use strict";

  const style = document.createElement("style");
  style.textContent = `
    .productDescriptionBlock{margin:22px 0 18px;padding:18px;border:1px solid rgba(96,165,250,.18);border-radius:16px;background:rgba(8,15,27,.72)}
    .productDescriptionTitle{display:flex;align-items:center;gap:9px;margin:0 0 10px;color:#fff;font-size:15px;font-weight:900;letter-spacing:.2px}
    .productDescriptionTitle::before{content:"";width:4px;height:18px;border-radius:99px;background:linear-gradient(180deg,#38bdf8,#8b5cf6)}
    .productDescriptionText{margin:0;color:#aebbd0;font-size:13px;line-height:1.75}
    #checkout .paymentHeading{display:block;margin:15px 0 10px;color:#fff;font-size:13px;font-weight:900;letter-spacing:.5px}
    #checkout #pay.paymentNativeHidden{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important;opacity:0!important;pointer-events:none!important}
    .paymentMethodsGrid{display:grid;gap:9px;margin-top:0}
    .paymentMethodCard{width:100%;min-height:66px;display:grid;grid-template-columns:46px 1fr auto;align-items:center;gap:12px;padding:10px 12px;border:1px solid rgba(96,165,250,.18);border-radius:15px;background:linear-gradient(145deg,rgba(16,27,44,.92),rgba(9,16,27,.92));color:#fff;text-align:left;cursor:pointer;transition:border-color .22s ease,box-shadow .22s ease,transform .22s ease,background .22s ease}
    .paymentMethodCard:hover{transform:translateY(-1px);border-color:rgba(90,184,255,.45)}
    .paymentMethodCard.is-selected{border-color:rgba(90,184,255,.92);background:linear-gradient(145deg,rgba(22,135,255,.13),rgba(124,58,237,.10));box-shadow:0 0 0 1px rgba(90,184,255,.12),0 10px 26px rgba(0,0,0,.18)}
    .paymentBrand{width:46px;height:46px;display:grid;place-items:center;border-radius:12px;font-weight:900;letter-spacing:-.6px;color:#fff;box-shadow:inset 0 0 0 1px rgba(255,255,255,.16)}
    .paymentBrand.wave{background:linear-gradient(145deg,#1e9bff,#0876dc);font-size:19px;font-style:italic}.paymentBrand.orange{background:linear-gradient(145deg,#ff7900,#f45100);font-size:14px}
    .paymentMethodName{display:block;font-size:14px;font-weight:900}.paymentMethodSub{display:block;margin-top:3px;color:#8798ae;font-size:10px;font-weight:600}
    .paymentRadio{width:18px;height:18px;border:2px solid rgba(190,205,224,.65);border-radius:50%;position:relative}.paymentMethodCard.is-selected .paymentRadio{border-color:#5ab8ff}.paymentMethodCard.is-selected .paymentRadio::after{content:"";position:absolute;inset:3px;border-radius:50%;background:#5ab8ff;box-shadow:0 0 10px rgba(90,184,255,.55)}
    #checkout .paymentHint{margin:9px 2px 0;color:#8191a7;font-size:11px;line-height:1.5}#checkout .paymentHint strong{color:#b9c7da}#checkout .box.hasSummary .hint{margin-top:12px}
    @media(max-width:560px){.paymentMethodCard{min-height:62px;grid-template-columns:42px 1fr auto;padding:9px 10px;gap:10px}.paymentBrand{width:42px;height:42px}.paymentMethodName{font-size:13px}}
  `;
  document.head.appendChild(style);

  function polishProductDescription(){
    const paragraph=document.querySelector("#productDetail .productDescription");
    if(!paragraph||paragraph.closest(".productDescriptionBlock"))return;
    const block=document.createElement("section");block.className="productDescriptionBlock";
    const title=document.createElement("h3");title.className="productDescriptionTitle";title.textContent="Description";
    paragraph.classList.add("productDescriptionText");paragraph.parentNode.insertBefore(block,paragraph);block.append(title,paragraph);
  }
  const originalOpenProduct=window.openProduct;
  if(typeof originalOpenProduct==="function")window.openProduct=function(id){originalOpenProduct(id);requestAnimationFrame(polishProductDescription)};

  function polishPaymentUI(){
    const select=document.getElementById("pay");
    if(!select||select.dataset.polished==="true")return;
    select.dataset.polished="true";
    select.innerHTML=`<option value="Wave">Wave</option><option value="Orange Money">Orange Money</option>`;
    select.value="Wave";

    const heading=document.createElement("label");
    heading.className="paymentHeading";
    heading.setAttribute("for","pay");
    heading.textContent="Moyen de paiement";

    const methods=document.createElement("div");
    methods.className="paymentMethodsGrid";
    methods.setAttribute("role","radiogroup");
    methods.setAttribute("aria-label","Moyen de paiement");
    methods.innerHTML=`
      <button type="button" class="paymentMethodCard is-selected" data-payment="Wave" role="radio" aria-checked="true"><span class="paymentBrand wave" aria-hidden="true">W</span><span><span class="paymentMethodName">Wave</span><span class="paymentMethodSub">Paiement mobile</span></span><span class="paymentRadio" aria-hidden="true"></span></button>
      <button type="button" class="paymentMethodCard" data-payment="Orange Money" role="radio" aria-checked="false"><span class="paymentBrand orange" aria-hidden="true">OM</span><span><span class="paymentMethodName">Orange Money</span><span class="paymentMethodSub">Paiement mobile</span></span><span class="paymentRadio" aria-hidden="true"></span></button>
    `;

    const hint=document.createElement("p");
    hint.className="paymentHint";
    hint.textContent="Sélectionne Wave ou Orange Money pour continuer vers PayTech.";

    select.classList.add("paymentNativeHidden");
    select.parentNode.insertBefore(heading,select);
    select.parentNode.insertBefore(methods,select);
    select.parentNode.insertBefore(hint,select.nextSibling);

    methods.querySelectorAll(".paymentMethodCard").forEach(card=>card.addEventListener("click",()=>{
      const value=card.dataset.payment;
      select.value=value;
      select.dispatchEvent(new Event("change",{bubbles:true}));
      methods.querySelectorAll(".paymentMethodCard").forEach(item=>{
        const selected=item===card;
        item.classList.toggle("is-selected",selected);
        item.setAttribute("aria-checked",selected?"true":"false");
      });
    }));
  }

  function loadPaytechBridge(){
    if(document.querySelector('script[data-paytech-checkout="1"],script[src*="paytech-checkout.js"]'))return;
    const script=document.createElement("script");
    script.src="/paytech-checkout.js?v=20261017-2125";
    script.dataset.paytechCheckout="1";
    document.body.appendChild(script);
  }

  function enrichProductPurchaseMeta(){
    const modal=document.getElementById("productModal");
    const detail=document.getElementById("productDetail");
    if(!modal||!detail||!modal.classList.contains("show")||!Array.isArray(window.products))return;
    const title=detail.querySelector(".productInfo h2,.productInfo h1,h2,h1");
    const name=title?title.textContent.trim():"";
    if(!name)return;
    const p=window.products.find(x=>String(x.name||"").trim()===name)||window.products.find(x=>String(x.name||"").trim().toLowerCase()===name.toLowerCase());
    if(!p)return;
    const info=detail.querySelector(".productInfo")||detail;
    let box=detail.querySelector(".sngProductPurchaseMeta");
    if(!box){box=document.createElement("div");box.className="sngProductPurchaseMeta";const add=info.querySelector(".add");if(add)info.insertBefore(box,add);else info.appendChild(box)}
    const normal=Number(p.price)||0;
    const promoActive=Boolean(p.promo_active)&&Number(p.promo_price)>0&&Number(p.promo_price)<normal;
    const saving=promoActive?normal-Number(p.promo_price):0;
    const percent=promoActive?Math.round((saving/normal)*100):0;
    const stock=Math.max(0,Number(p.stock)||0);
    const fmt=v=>new Intl.NumberFormat("fr-FR").format(Math.round(v))+" FCFA";
    box.innerHTML=`<div class="sngPurchaseMetaRow"><span class="sngStockPill ${stock>0?"is-stock":"is-out"}"><i></i>${stock>0?`En stock · ${stock} disponible${stock>1?"s":""}`:"Rupture de stock"}</span>${promoActive?`<span class="sngSavingPill">Économie ${fmt(saving)} · -${percent}%</span>`:""}</div>`;
    const addBtn=info.querySelector(".add");
    if(addBtn){addBtn.disabled=stock<=0;addBtn.setAttribute("aria-disabled",stock<=0?"true":"false");if(stock<=0)addBtn.textContent="Produit indisponible";}
  }

  function installProductMetaStyle(){
    if(document.getElementById("sngProductMetaStyle"))return;
    const s=document.createElement("style");s.id="sngProductMetaStyle";s.textContent=`
      #productModal .sngProductPurchaseMeta{margin:14px 0 2px;padding:0}
      #productModal .sngPurchaseMetaRow{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
      #productModal .sngStockPill,#productModal .sngSavingPill{display:inline-flex;align-items:center;min-height:34px;padding:7px 11px;border-radius:999px;font-size:13px;font-weight:800;line-height:1.15;border:1px solid rgba(100,150,210,.2);background:rgba(8,15,27,.72)}
      #productModal .sngStockPill{color:#b9c9dc}.sngStockPill i{width:7px;height:7px;border-radius:50%;margin-right:7px;background:#35e58a;box-shadow:0 0 9px rgba(53,229,138,.55)}
      #productModal .sngStockPill.is-out{color:#ff9d9d}.sngStockPill.is-out i{background:#ff5757;box-shadow:0 0 9px rgba(255,87,87,.45)}
      #productModal .sngSavingPill{color:#ffe8a6;border-color:rgba(255,190,70,.22);background:rgba(255,170,40,.08)}
      #productModal .productInfo .add:disabled{opacity:.62;cursor:not-allowed;filter:saturate(.65)}
      @media(max-width:700px){#productModal .sngPurchaseMetaRow{gap:7px}#productModal .sngStockPill,#productModal .sngSavingPill{font-size:12px;min-height:32px;padding:6px 10px}}
    `;document.head.appendChild(s);
  }

  function startProductEnhancement(){
    installProductMetaStyle();
    const modal=document.getElementById("productModal");
    if(modal&&!modal.dataset.sngMetaObserver){
      modal.dataset.sngMetaObserver="1";
      new MutationObserver(()=>requestAnimationFrame(enrichProductPurchaseMeta)).observe(modal,{subtree:true,childList:true,attributes:true,attributeFilter:["class"]});
    }
    setTimeout(enrichProductPurchaseMeta,80);
    setTimeout(enrichProductPurchaseMeta,300);
  }

  document.addEventListener("DOMContentLoaded",()=>{
    polishPaymentUI();
    loadPaytechBridge();
    startProductEnhancement();
  });
  setTimeout(()=>{
    polishPaymentUI();
    loadPaytechBridge();
    startProductEnhancement();
  },250);
})();
