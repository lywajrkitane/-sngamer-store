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

    // The profile screen can leave the product grid empty/hidden after navigation.
    // Re-render from the already loaded products instead of requiring a page refresh.
    if(typeof window.render === "function"){
      window.render();
    }
  }

  // Keep the existing navigation behavior, then explicitly restore the product view.
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
    if(!box || box.dataset.layoutFixed === "1") return;

    const closeButton = box.querySelector(".x");
    const confirmButton = box.querySelector(".primary.full");
    if(!confirmButton) return;

    const scroll = document.createElement("div");
    scroll.className = "checkoutScrollArea";

    const actionBar = document.createElement("div");
    actionBar.className = "checkoutActionBar";

    Array.from(box.children).forEach(function(child){
      if(child === closeButton || child === confirmButton) return;
      scroll.appendChild(child);
    });

    actionBar.appendChild(confirmButton);
    box.appendChild(scroll);
    box.appendChild(actionBar);
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
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", watchCheckout, {once:true});
  }else{
    watchCheckout();
  }

  // A second safety pass after app initialization/navigation scripts have loaded.
  window.setTimeout(function(){
    repairStoreView(window.activeStoreSection || "home");
    prepareCheckoutLayout();
  }, 250);
})();
