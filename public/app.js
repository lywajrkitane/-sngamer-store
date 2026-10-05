let products=[],cartItems=JSON.parse(localStorage.getItem("sg_cart")||"[]"),filter="Tous";
const money=n=>new Intl.NumberFormat("fr-FR").format(n)+" FCFA";
async function load(){products=await fetch("/api/products").then(r=>r.json());cats();render()}
function cats(){let cs=["Tous",...new Set(products.map(p=>p.category))];document.querySelector("#cats").innerHTML=cs.map(c=>`<button class="catbtn ${c===filter?"on":""}" onclick="filterBy('${c}')">${c}</button>`).join("")}
function filterBy(c){filter=c;cats();render()}
function render(){let q=document.querySelector("#q").value.toLowerCase();let list=products.filter(p=>(filter==="Tous"||p.category===filter)&&p.name.toLowerCase().includes(q));document.querySelector("#products").innerHTML=list.map(p=>`<article class="card"><div class="pic">${p.image1_url ? '<img src="' + p.image1_url + '" alt="' + p.name + '" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" loading="lazy">' : p.emoji}</div><div class="info"><div class="cat">${p.category}</div><h3>${p.name}</h3><div class="price">${money(p.price)}</div><div class="stock">${p.stock} disponible(s)</div><button class="add" onclick="add(${p.id})">Ajouter au panier</button><button class="details" onclick="openProduct(${p.id})">Voir le produit</button></div></article>`).join("")}
function save(){localStorage.setItem("sg_cart",JSON.stringify(cartItems));update()}
function add(id){let x=cartItems.find(a=>a.id===id);x?x.qty++:cartItems.push({id,qty:1});save();cart()}
function update(){document.querySelector("#count").textContent=cartItems.reduce((s,x)=>s+x.qty,0);document.querySelector("#items").innerHTML=cartItems.length?cartItems.map(x=>{let p=products.find(p=>p.id===x.id);return `<div class="cartItem"><div class="em">${p.image1_url ? `<img src="${p.image1_url}" alt="${p.name}">` : p.emoji}</div><div><b>${p.name}</b><br><small>${money(p.price)} × ${x.qty}</small></div><div class="qty"><button onclick="chg(${p.id},-1)">−</button>${x.qty}<button onclick="chg(${p.id},1)">+</button></div></div>`}).join(""):"<p style='color:#8190a2'>Panier vide.</p>";let t=cartItems.reduce((s,x)=>s+products.find(p=>p.id===x.id).price*x.qty,0);document.querySelector("#total").textContent=money(t)}
function chg(id,n){let x=cartItems.find(a=>a.id===id);x.qty+=n;if(x.qty<=0)cartItems=cartItems.filter(a=>a.id!==id);save()}
function cart(){document.querySelector("#drawer").classList.add("show");update()}
function closeCart(){document.querySelector("#drawer").classList.remove("show")}
function openCheckout(){if(!cartItems.length)return alert("Panier vide.");document.querySelector("#checkout").classList.add("show")}
function closeCheckout(){document.querySelector("#checkout").classList.remove("show")}
async function order(){let customer={name:document.querySelector("#name").value,phone:document.querySelector("#phone").value,address:document.querySelector("#addr").value};if(!customer.name||!customer.phone||!customer.address)return alert("Remplis les informations.");let payment=document.querySelector("#pay").value;let r=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({customer,payment,items:cartItems})});let d=await r.json();if(!r.ok)return alert(d.error||"Erreur");alert("Commande enregistrée : "+d.orderId);cartItems=[];save();closeCheckout();closeCart();load()}
document.querySelector("#q").oninput=render;load();
function escapeHtml(text=""){
  return String(text).replace(/[&<>"']/g, c => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#039;"
  }[c]));
}

function openProduct(id){
  const p=products.find(x=>x.id===id);
  if(!p)return;

  const images=[p.image1_url,p.image2_url,p.image3_url].filter(Boolean);
  const inStock=Number(p.stock)>0;

  window.productImages=images;

  document.querySelector("#productDetail").innerHTML=`
    <div class="productDetail">

      <div class="productGallery">

        <div class="productMainImage">
          ${
            images.length
            ? `<img id="productMainImage"
                 src="${escapeHtml(images[0])}"
                 alt="${escapeHtml(p.name)}">`
            : `<div class="productEmoji">${escapeHtml(p.emoji || "🎮")}</div>`
          }
        </div>

        ${
          images.length>1
          ? `
            <div class="productThumbnails">
              ${images.map((url,i)=>`
                <button class="productThumb" onclick="selectProductImage(${i})">
                  <img src="${escapeHtml(url)}"
                       alt="${escapeHtml(p.name)}">
                </button>
              `).join("")}
            </div>
          `
          : ""
        }

      </div>

      <div class="productInfo">

        <div class="cat">${escapeHtml(p.category || "Gaming")}</div>

        <h2>${escapeHtml(p.name)}</h2>

        <div class="price">${money(p.price)}</div>

        ${
          inStock
          ? `<div class="stock">${p.stock} disponible(s)</div>`
          : `<div class="stock outOfStock">Rupture de stock</div>`
        }

        <p class="productDescription">
          ${escapeHtml(p.description || "Aucune description disponible.").replace(/\n/g,"<br>")}
        </p>

        ${
          p.video_url
          ? `
            <div class="productVideo">
              <h3>Vidéo du produit</h3>
              <video controls preload="metadata" src="${escapeHtml(p.video_url)}"></video>
            </div>
          `
          : ""
        }

        ${
          inStock
          ? `
            <button class="primary full" onclick="add(${p.id});closeProduct()">
              Ajouter au panier
            </button>
          `
          : `
            <button class="primary full disabled" disabled>
              Rupture de stock
            </button>
          `
        }

      </div>

    </div>
  `;

  document.querySelector("#productModal").classList.add("show");
}

function selectProductImage(index){
  const images=window.productImages||[];
  const image=document.querySelector("#productMainImage");

  if(image && images[index]){
    image.src=images[index];
  }
}

function closeProduct(){
  document.querySelector("#productModal").classList.remove("show");
}
