(function(){
  "use strict";

  function repairStoreView(section){
    const productsArea = document.getElementById("products");
    const profileArea = document.getElementById("profileArea");
    if(!productsArea) return;

    if(section === "profile"){
      productsArea.style.display = "none";
      if(profileArea) profileArea.hidden = false;
      return;
    }

    if(profileArea) profileArea.hidden = true;
    productsArea.style.display = "";

    // Returning from the profile must restore the already-loaded product grid.
    if(typeof window.render === "function"){
      window.render();
    }
  }

  if(typeof window.navigateStore === "function"){
    const originalNavigateStore = window.navigateStore;
    window.navigateStore = function(section){
      originalNavigateStore(section);
      window.setTimeout(function(){ repairStoreView(section); }, 0);
    };
  }

  function prepareCheckoutLayout(){
    const checkout = document.getElementById("checkout");
    const box = checkout && checkout.querySelector(".box");
    if(!box) return;

    let scroll = box.querySelector(":scope > .checkoutScrollArea");
    let actionBar = box.querySelector(":scope > .checkoutActionBar");
    const closeButton = box.querySelector(":scope > .x");

    if(!scroll || !actionBar){
      const confirmButton = box.querySelector(":scope > .primary.full");
      if(!confirmButton) return;

      scroll = document.createElement("div");
      scroll.className = "checkoutScrollArea";

      actionBar = document.createElement("div");
      actionBar.className = "checkoutActionBar";

      Array.from(box.children).forEach(function(child){
        if(child === closeButton || child === confirmButton) return;
        scroll.appendChild(child);
      });

      actionBar.appendChild(confirmButton);
      box.appendChild(scroll);
      box.appendChild(actionBar);
    }

    // openCheckout dynamically inserts the order summary at the top of .box.
    // Move any newly-added content into the scroll area so the action bar stays fixed.
    Array.from(box.children).forEach(function(child){
      if(child !== closeButton && child !== scroll && child !== actionBar){
        scroll.appendChild(child);
      }
    });

    box.dataset.layoutFixed = "1";
  }

  function watchCheckout(){
    const checkout = document.getElementById("checkout");
    if(!checkout) return;

    prepareCheckoutLayout();

    const observer = new MutationObserver(function(){
      if(checkout.classList.contains("show")){
        prepareCheckoutLayout();
      }
    });
    observer.observe(checkout, {attributes:true, attributeFilter:["class"]});

    const box = checkout.querySelector(".box");
    if(box){
      const boxObserver = new MutationObserver(function(){
        if(checkout.classList.contains("show")) prepareCheckoutLayout();
      });
      boxObserver.observe(box, {childList:true});
    }
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", watchCheckout, {once:true});
  }else{
    watchCheckout();
  }

  window.setTimeout(function(){
    repairStoreView(window.activeStoreSection || "home");
    prepareCheckoutLayout();
  }, 250);
})();
