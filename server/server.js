const express=require("express"),path=require("path"),fs=require("fs"),session=require("express-session"),bcrypt=require("bcryptjs");
const app=express(),PORT=process.env.PORT||3000,DATA=path.join(__dirname,"data.json");
if(!fs.existsSync(DATA))fs.writeFileSync(DATA,JSON.stringify({products:[
{id:1,name:"Manette PS5 DualSense",category:"Manettes",price:45000,stock:12,emoji:"🎮"},
{id:2,name:"Casque Gaming RGB",category:"Casques",price:28000,stock:8,emoji:"🎧"},
{id:3,name:"Clavier mécanique RGB",category:"Claviers",price:35000,stock:6,emoji:"⌨️"},
{id:4,name:"Souris Gaming 7200 DPI",category:"Souris",price:18000,stock:15,emoji:"🖱️"}],orders:[]},null,2));
const read=()=>JSON.parse(fs.readFileSync(DATA));const write=x=>fs.writeFileSync(DATA,JSON.stringify(x,null,2));
const ADMIN_USER=process.env.ADMIN_USER||"admin";
const ADMIN_HASH=process.env.ADMIN_PASSWORD_HASH||bcrypt.hashSync(process.env.ADMIN_PASSWORD||"ChangeMe123!",10);
app.use(express.json());app.use(express.urlencoded({extended:true}));
app.use(session({secret:process.env.SESSION_SECRET||"CHANGE_THIS_SECRET",resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production"}}));
function auth(req,res,next){if(!req.session.admin)return res.status(401).json({error:"Non autorisé"});next()}
app.get("/api/products",(req,res)=>res.json(read().products));
app.post("/api/orders",(req,res)=>{const d=read(),o=req.body;if(!o.customer||!Array.isArray(o.items)||!o.items.length)return res.status(400).json({error:"Commande incomplète"});for(const it of o.items){const p=d.products.find(x=>x.id===it.id);if(!p||p.stock<it.qty)return res.status(400).json({error:"Stock insuffisant"});p.stock-=it.qty}const order={id:"SG-"+Date.now(),createdAt:new Date().toISOString(),status:"Nouvelle",...o};d.orders.unshift(order);write(d);res.json({ok:true,orderId:order.id})});
app.post("/api/admin/login",async(req,res)=>{const {username,password}=req.body;if(username!==ADMIN_USER||!(await bcrypt.compare(password,ADMIN_HASH)))return res.status(401).json({error:"Identifiants incorrects"});req.session.admin=true;res.json({ok:true})});
app.post("/api/admin/logout",(req,res)=>req.session.destroy(()=>res.json({ok:true})));
app.get("/api/admin/me",(req,res)=>res.json({authenticated:!!req.session.admin}));
app.get("/api/admin/orders",auth,(req,res)=>res.json(read().orders));
app.patch("/api/admin/orders/:id",auth,(req,res)=>{const d=read(),o=d.orders.find(x=>x.id===req.params.id);if(!o)return res.status(404).json({error:"Commande introuvable"});o.status=req.body.status||o.status;write(d);res.json(o)});
app.post("/api/admin/products",auth,(req,res)=>{const d=read(),p={id:Date.now(),name:req.body.name,category:req.body.category||"Accessoires",price:Number(req.body.price),stock:Number(req.body.stock),emoji:req.body.emoji||"🎮"};if(!p.name||!p.price)return res.status(400).json({error:"Produit invalide"});d.products.push(p);write(d);res.json(p)});
app.patch("/api/admin/products/:id",auth,(req,res)=>{const d=read(),p=d.products.find(x=>x.id==req.params.id);if(!p)return res.status(404).json({error:"Produit introuvable"});Object.assign(p,{name:req.body.name??p.name,category:req.body.category??p.category,price:req.body.price!==undefined?Number(req.body.price):p.price,stock:req.body.stock!==undefined?Number(req.body.stock):p.stock,emoji:req.body.emoji??p.emoji});write(d);res.json(p)});
app.use(express.static(path.join(__dirname,"../public")));
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"../public/index.html")));
app.listen(PORT,"0.0.0.0",()=>console.log("SNGAMER STORE sur port "+PORT));