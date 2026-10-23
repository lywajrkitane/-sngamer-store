/* SNGAMER STORE — PRODUCT PREMIUM PRELOAD */
const fs=require('fs');
const path=require('path');
const SERVER_FILE=path.join(__dirname,'server.js');
const PUBLIC_DIR=path.join(__dirname,'..','public');
const MARK='SNGAMER_PRODUCT_PREMIUM_SPECS_V1';
function injectFile(fileName,needle,insert){try{const file=path.join(PUBLIC_DIR,fileName);if(!fs.existsSync(file))return;let html=fs.readFileSync(file,'utf8');if(!html.includes(needle)){html=html.replace(/<\/head>/i,needle.includes('.css')?insert+'</head>':insert+'</body>');fs.writeFileSync(file,html,'utf8')}}catch(error){console.error('PRODUCT_PREMIUM_ASSET_INJECT_ERROR:',fileName,error)}}
try{
  let text=fs.readFileSync(SERVER_FILE,'utf8');
  if(!text.includes(MARK)){
    const columnNeedle='ADD COLUMN IF NOT EXISTS description TEXT,';
    if(text.includes(columnNeedle))text=text.replace(columnNeedle,`${columnNeedle}\n    ADD COLUMN IF NOT EXISTS product_specs JSONB NOT NULL DEFAULT '{}'::jsonb,`);
    const routeNeedle='app.get("/api/products", async (req, res) => {';
    if(text.includes(routeNeedle)){
      const routes=`\n/* ${MARK} */\napp.get("/api/product-specs/:id", async (req,res)=>{\n  try{const id=Number(req.params.id);if(!Number.isInteger(id)||id<=0)return res.status(400).json({error:"Produit invalide"});const result=await db("SELECT product_specs FROM products WHERE id=$1",[id]);if(!result.rows.length)return res.status(404).json({error:"Produit introuvable"});res.json({specs:result.rows[0].product_specs||{}})}catch(error){console.error("PRODUCT_SPECS_GET_ERROR:",error);res.status(500).json({error:"Impossible de charger les caractéristiques"})}\n});\napp.get("/api/admin/product-specs/:id", async (req,res)=>{try{if(!req.session?.admin)return res.status(401).json({error:"Non autorisé"});const id=Number(req.params.id);const result=await db("SELECT product_specs FROM products WHERE id=$1",[id]);if(!result.rows.length)return res.status(404).json({error:"Produit introuvable"});res.json({specs:result.rows[0].product_specs||{}})}catch(error){res.status(500).json({error:"Impossible de charger les caractéristiques"})}});\napp.put("/api/admin/product-specs/:id", async (req,res)=>{try{if(!req.session?.admin)return res.status(401).json({error:"Non autorisé"});const id=Number(req.params.id),incoming=req.body?.specs;if(!Number.isInteger(id)||id<=0)return res.status(400).json({error:"Produit invalide"});if(!incoming||typeof incoming!=="object"||Array.isArray(incoming))return res.status(400).json({error:"Caractéristiques invalides"});const specs={};for(const [key,value] of Object.entries(incoming)){const k=String(key).trim().slice(0,80),v=String(value??"").trim().slice(0,240);if(k&&v)specs[k]=v}const result=await db("UPDATE products SET product_specs=$1::jsonb WHERE id=$2 RETURNING id,product_specs",[JSON.stringify(specs),id]);if(!result.rows.length)return res.status(404).json({error:"Produit introuvable"});res.json({success:true,id:result.rows[0].id,specs:result.rows[0].product_specs||{}})}catch(error){console.error("PRODUCT_SPECS_SAVE_ERROR:",error);res.status(500).json({error:"Impossible d'enregistrer les caractéristiques"})}});\n`;
      text=text.replace(routeNeedle,routes+routeNeedle);
    }
    text=`/* ${MARK} */\n`+text;fs.writeFileSync(SERVER_FILE,text,'utf8');
  }
  // Store: visual layer + premium product detail. Injected into the static HTML so existing app logic remains intact.
  const index=path.join(PUBLIC_DIR,'index.html');
  if(fs.existsSync(index)){let html=fs.readFileSync(index,'utf8');if(!html.includes('store-premium-v2.css'))html=html.replace(/<\/head>/i,'<link rel="stylesheet" href="store-premium-v2.css?v=20261023-p1"><link rel="stylesheet" href="product-premium-v2.css?v=20261023-p1"></head>');if(!html.includes('product-premium-v2.js'))html=html.replace(/<\/body>/i,'<script src="product-premium-v2.js?v=20261023-p1"></script></body>');fs.writeFileSync(index,html,'utf8')}
  // Admin: same premium visual language + specifications editor. Existing dashboard controls stay in place.
  const admin=path.join(PUBLIC_DIR,'admin-dashboard.html');
  if(fs.existsSync(admin)){let html=fs.readFileSync(admin,'utf8');if(!html.includes('admin-product-premium-v1.css'))html=html.replace(/<\/head>/i,'<link rel="stylesheet" href="/admin-product-premium-v1.css?v=20261023-p1"></head>');if(!html.includes('admin-product-premium-v1.js'))html=html.replace(/<\/body>/i,'<script src="/admin-product-premium-v1.js?v=20261023-p1"></script></body>');fs.writeFileSync(admin,html,'utf8')}
}catch(error){console.error('PRODUCT_PREMIUM_PRELOAD_ERROR:',error);process.exit(1)}
