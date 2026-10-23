/* SNGAMER STORE — PRODUCT PREMIUM PRELOAD
   Adds a small JSONB product_specs field and isolated endpoints.
   Existing product/order routes remain untouched.
*/
const fs=require('fs');
const path=require('path');
const SERVER_FILE=path.join(__dirname,'server.js');
const MARK='SNGAMER_PRODUCT_PREMIUM_SPECS_V1';
try{
  let text=fs.readFileSync(SERVER_FILE,'utf8');
  if(!text.includes(MARK)){
    const columnNeedle='ADD COLUMN IF NOT EXISTS description TEXT,';
    if(text.includes(columnNeedle)){
      text=text.replace(columnNeedle,`${columnNeedle}\n    ADD COLUMN IF NOT EXISTS product_specs JSONB NOT NULL DEFAULT '{}'::jsonb,`);
    }
    const routeNeedle='app.get("/api/products", async (req, res) => {';
    if(text.includes(routeNeedle)){
      const routes=`\n/* ${MARK} */\napp.get("/api/product-specs/:id", async (req,res)=>{\n  try{\n    const id=Number(req.params.id);\n    if(!Number.isInteger(id)||id<=0)return res.status(400).json({error:"Produit invalide"});\n    const result=await db("SELECT product_specs FROM products WHERE id=$1",[id]);\n    if(!result.rows.length)return res.status(404).json({error:"Produit introuvable"});\n    res.json({specs:result.rows[0].product_specs||{}});\n  }catch(error){console.error("PRODUCT_SPECS_GET_ERROR:",error);res.status(500).json({error:"Impossible de charger les caractéristiques"});}\n});\napp.get("/api/admin/product-specs/:id", async (req,res)=>{\n  try{\n    if(!req.session?.admin)return res.status(401).json({error:"Non autorisé"});\n    const id=Number(req.params.id);\n    if(!Number.isInteger(id)||id<=0)return res.status(400).json({error:"Produit invalide"});\n    const result=await db("SELECT product_specs FROM products WHERE id=$1",[id]);\n    if(!result.rows.length)return res.status(404).json({error:"Produit introuvable"});\n    res.json({specs:result.rows[0].product_specs||{}});\n  }catch(error){res.status(500).json({error:"Impossible de charger les caractéristiques"});}\n});\napp.put("/api/admin/product-specs/:id", async (req,res)=>{\n  try{\n    if(!req.session?.admin)return res.status(401).json({error:"Non autorisé"});\n    const id=Number(req.params.id);\n    const incoming=req.body?.specs;\n    if(!Number.isInteger(id)||id<=0)return res.status(400).json({error:"Produit invalide"});\n    if(!incoming||typeof incoming!=="object"||Array.isArray(incoming))return res.status(400).json({error:"Caractéristiques invalides"});\n    const specs={};\n    for(const [key,value] of Object.entries(incoming)){\n      const k=String(key).trim().slice(0,80),v=String(value??"").trim().slice(0,240);\n      if(k&&v)specs[k]=v;\n    }\n    const result=await db("UPDATE products SET product_specs=$1::jsonb WHERE id=$2 RETURNING id,product_specs",[JSON.stringify(specs),id]);\n    if(!result.rows.length)return res.status(404).json({error:"Produit introuvable"});\n    res.json({success:true,id:result.rows[0].id,specs:result.rows[0].product_specs||{}});\n  }catch(error){console.error("PRODUCT_SPECS_SAVE_ERROR:",error);res.status(500).json({error:"Impossible d'enregistrer les caractéristiques"});}\n});\n`;
      text=text.replace(routeNeedle,routes+routeNeedle);
    }
    text=`/* ${MARK} */\n`+text;
    fs.writeFileSync(SERVER_FILE,text,'utf8');
  }
}catch(error){console.error('PRODUCT_PREMIUM_PRELOAD_ERROR:',error);process.exit(1)}
