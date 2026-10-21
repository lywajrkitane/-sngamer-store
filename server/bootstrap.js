const express=require("express");const fs=require("fs");const path=require("path");const {Pool}=require("pg");const {installCustomerSystem}=require("./customer-system");const {initCustomersTable,ensureOrderCustomerColumns}=require("./customer-bootstrap-db");const {installPaytech}=require("./paytech");
function patchCampaignSource(){try{const file=path.join(__dirname,"server.js");let text=fs.readFileSync(file,"utf8");const oldProducts=`const result = await db(\`
      SELECT
  id,
  name,
  category,
  platform,
  price,
  stock,
  emoji,
  description,
  image1_url,
  image2_url,
  image3_url,
  video_url,
  promo_price,
  promo_active,
  campaign_id,
  created_at
FROM products
    \`);`;const newProducts=`const result = await db(\`
      SELECT
  p.id,
  p.name,
  p.category,
  p.platform,
  p.price,
  p.stock,
  p.emoji,
  p.description,
  p.image1_url,
  p.image2_url,
  p.image3_url,
  p.video_url,
  p.promo_price,
  p.promo_active,
  p.campaign_id,
  p.created_at,
  c.name AS campaign_name,
  c.sticker AS campaign_sticker,
  c.right_sticker AS campaign_right_sticker,
  c.active AS campaign_active
FROM products p
LEFT JOIN campaigns c
  ON c.id = p.campaign_id
    \`);`;const oldPromo=`  SELECT
    pm.slot,
    pm.media_type,
    pm.url,
    pm.updated_at,
    pm.campaign_id,
    pm.product_id,

    c.name AS campaign_name,
    c.sticker AS campaign_sticker,
    c.right_sticker AS campaign_right_sticker,
    c.active AS campaign_active,
    c.start_date AS campaign_start_date,
    c.end_date AS campaign_end_date,

    p.name AS product_name,
    p.price AS product_price,
    p.promo_price AS product_promo_price,
    p.promo_active AS product_promo_active,
    p.emoji AS product_emoji

  FROM promo_media pm

  INNER JOIN campaigns c
    ON c.id = pm.campaign_id

  LEFT JOIN products p
    ON p.id = pm.product_id

  WHERE c.active = true

    AND (
      c.start_date IS NULL
      OR c.start_date <= NOW()
    )

    AND (
      c.end_date IS NULL
      OR c.end_date > NOW()
    )

  ORDER BY pm.slot ASC`;const newPromo=`  SELECT
    pm.slot,
    pm.media_type,
    pm.url,
    pm.updated_at,
    pm.campaign_id,
    pm.product_id,

    CASE
      WHEN pc.id IS NOT NULL AND pc.active = true THEN pc.name
      ELSE mc.name
    END AS campaign_name,
    CASE
      WHEN pc.id IS NOT NULL AND pc.active = true THEN pc.sticker
      ELSE mc.sticker
    END AS campaign_sticker,
    CASE
      WHEN pc.id IS NOT NULL AND pc.active = true THEN pc.right_sticker
      ELSE mc.right_sticker
    END AS campaign_right_sticker,
    CASE
      WHEN pc.id IS NOT NULL AND pc.active = true THEN pc.active
      ELSE mc.active
    END AS campaign_active,
    CASE
      WHEN pc.id IS NOT NULL AND pc.active = true THEN pc.start_date
      ELSE mc.start_date
    END AS campaign_start_date,
    CASE
      WHEN pc.id IS NOT NULL AND pc.active = true THEN pc.end_date
      ELSE mc.end_date
    END AS campaign_end_date,

    p.name AS product_name,
    p.price AS product_price,
    p.promo_price AS product_promo_price,
    p.promo_active AS product_promo_active,
    p.emoji AS product_emoji

  FROM promo_media pm

  LEFT JOIN products p
    ON p.id = pm.product_id

  LEFT JOIN campaigns mc
    ON mc.id = pm.campaign_id

  LEFT JOIN campaigns pc
    ON pc.id = p.campaign_id

  WHERE
    (
      pc.id IS NOT NULL
      AND pc.active = true
      AND (pc.start_date IS NULL OR pc.start_date <= NOW())
      AND (pc.end_date IS NULL OR pc.end_date > NOW())
    )
    OR
    (
      pc.id IS NULL
      AND mc.id IS NOT NULL
      AND mc.active = true
      AND (mc.start_date IS NULL OR mc.start_date <= NOW())
      AND (mc.end_date IS NULL OR mc.end_date > NOW())
    )

  ORDER BY pm.slot ASC`;let changed=false;if(text.includes(oldProducts)){text=text.replace(oldProducts,newProducts);changed=true}if(text.includes(oldPromo)){text=text.replace(oldPromo,newPromo);changed=true}if(changed)fs.writeFileSync(file,text,"utf8");}catch(error){console.error("CAMPAIGN_SOURCE_PATCH_ERROR:",error);process.exit(1)}}
function installGuestOrderRoute(app){const guestRouter=express.Router();guestRouter.post(["/api/orders","/api/customer/orders"],async(req,res)=>{const client=await guestOrderPool.connect();try{const {customer,payment,items}=req.body||{};const allowedPayments=["Wave","Orange Money","PayPal"];const name=String(customer?.name||"").trim(),phone=String(customer?.phone||"").trim(),address=String(customer?.address||"").trim();if(!name||!phone||!address||!allowedPayments.includes(payment)||!Array.isArray(items))return res.status(400).json({error:"Remplis les informations de commande et sélectionne un moyen de paiement valide."});if(!items.length)return res.status(400).json({error:"Le panier est vide"});await client.query("BEGIN");let total=0;const finalItems=[];for(const item of items){const productId=Number(item.id),quantity=Number(item.quantity??item.qty);if(!Number.isInteger(productId)||!Number.isInteger(quantity)||quantity<=0)throw new Error("Produit ou quantité invalide");const r=await client.query(`SELECT id,name,price,promo_price,promo_active,stock,emoji FROM products WHERE id=$1 FOR UPDATE`,[productId]);if(!r.rows.length)throw new Error("Produit introuvable");const p=r.rows[0];if(Number(p.stock)<quantity)throw new Error(`Stock insuffisant pour ${p.name}`);const promo=Boolean(p.promo_active)&&Number(p.promo_price)>0&&Number(p.promo_price)<Number(p.price);const unit=promo?Number(p.promo_price):Number(p.price);const subtotal=unit*quantity;total+=subtotal;finalItems.push({id:p.id,name:p.name,price:unit,quantity,subtotal,emoji:p.emoji})}const orderCustomer={name,phone,address,email:String(customer?.email||"").trim()},customerId=req.session?.customerId||null;const result=await client.query(`INSERT INTO orders (customer_id,status,customer,payment,items,total) VALUES ($1,'Nouvelle',$2,$3,$4,$5) RETURNING id,created_at,status,customer,payment,items,total`,[customerId,JSON.stringify(orderCustomer),payment,JSON.stringify(finalItems),total]);await client.query("COMMIT");res.status(201).json({success:true,orderId:result.rows[0].id,order:result.rows[0],guest:!customerId})}catch(error){await client.query("ROLLBACK");console.error("GUEST_ORDER_ERROR:",error);res.status(400).json({error:error.message||"Impossible de créer la commande"})}finally{client.release()}});const stack=app._router&&app._router.stack;if(!stack)return;const orderIndex=stack.findIndex(layer=>layer&&layer.route&&layer.route.path==="/api/orders"&&layer.route.methods?.post);if(orderIndex>=0)stack.splice(orderIndex,0,...(guestRouter.stack||[]));else stack.unshift(...(guestRouter.stack||[]))}
const guestOrderPool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const originalListen = express.application.listen;
express.application.listen = function patchedListen(...args) {
  const app = this;
  const customerRouter = installCustomerSystem();
  const stack = app._router && app._router.stack;

  if (stack) {
    installGuestOrderRoute(app);

    const adminInjection = function (req, res, next) {
      const target = req.path === "/admin-dashboard.html" || req.path === "/admin.html";
      if (!target || req.method !== "GET") return next();

      const file = path.join(__dirname, "..", "public", req.path.replace(/^\//, ""));
      if (!fs.existsSync(file)) return next();

      try {
        let html = fs.readFileSync(file, "utf8");
        if (!html.includes("customer-admin.js")) {
          html = html.replace(/<\/body>/i, '<script src="/customer-admin.js" defer></script></body>');
        }
        if (!html.includes("admin-v2.css")) {
          html = html.replace(/<\/head>/i, '<link rel="stylesheet" href="/admin-v2.css?v=20261016-2200"></head>');
        }
        if (!html.includes("admin-v2.js")) {
          html = html.replace(/<\/body>/i, '<script src="/admin-v2.js?v=20261016-2200" defer></script></body>');
        }
        if (!html.includes("admin-v21.css")) {
          html = html.replace(/<\/head>/i, '<link rel="stylesheet" href="/admin-v21.css?v=20261016-2300"></head>');
        }
        if (!html.includes("admin-v21.js")) {
          html = html.replace(/<\/body>/i, '<script src="/admin-v21.js?v=20261021-orders1" defer></script></body>');
        }

        html = html.replace(/<script[^>]+admin-v24-workspace\.js[^>]*><\/script>/gi, "");
        html = html.replace(/<script[^>]+admin-section-workspace-v24\.js[^>]*><\/script>/gi, "");
        html = html.replace(/<script[^>]+admin-v25-workspace\.js[^>]*><\/script>/gi, "");
        html = html.replace(/<script[^>]+admin-v23-orders\.js[^>]*><\/script>/gi, "");
        html = html.replace(/<script[^>]+admin-final-fix\.js[^>]*><\/script>/gi, "");

        if (!html.includes("/admin-v24-workspace.js")) {
          html = html.replace("</body>", '<script src="/admin-v24-workspace.js?v=20261018-1048"></script></body>');
        }
        if (!html.includes("/admin-data-fix.js")) {
          html = html.replace("</body>", '<script src="/admin-data-fix.js?v=20261018-1220"></script></body>');
        }

        res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.set("Pragma", "no-cache");
        res.set("Expires", "0");
        return res.type("html").send(html);
      } catch (error) {
        console.error("ADMIN_HTML_INJECTION_ERROR:", error);
        return next();
      }
    };

    // Register exact admin routes before static files and the catch-all.
    const injectionRouter = express.Router();
    injectionRouter.use(adminInjection);

    const staticIndex = stack.findIndex(layer => layer && layer.handle && layer.handle.name === "serveStatic");
    if (staticIndex >= 0) {
      stack.splice(staticIndex, 0, ...(injectionRouter.stack || []));
    } else {
      stack.push(...(injectionRouter.stack || []));
    }

    // Append customer routes after the static middleware but before the catch-all.
    // These are exact API paths; find the catch-all using the route path rather than
    // Express' version-dependent RegExp.toString() representation.
    const catchAllIndex = stack.findIndex(layer => {
      if (!layer || !layer.route || !layer.route.methods || !layer.route.methods.get) return false;
      const routePath = layer.route.path;
      return routePath === "*" || (Array.isArray(routePath) && routePath.includes("*"));
    });
    if (catchAllIndex >= 0) {
      stack.splice(catchAllIndex, 0, ...(customerRouter.stack || []));
    } else {
      stack.push(...(customerRouter.stack || []));
    }
  }

  Promise.all([ensureOrderCustomerColumns(), installPaytech(app)])
    .then(() => originalListen.apply(app, args))
    .catch(error => {
      console.error("CUSTOMER_ORDER_DB_BOOT_ERROR:", error);
      process.exit(1);
    });
};
(async()=>{try{patchCampaignSource();await initCustomersTable();require("./server")}catch(error){console.error("CUSTOMER_SYSTEM_BOOT_ERROR:",error);process.exit(1)}})();
