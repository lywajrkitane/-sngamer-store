/* SNGAMER STORE — Commandes compactes V2.3 */
(function(){
  'use strict';
  const PAGE_SIZE=25; let page=1; let lastSignature='';
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
  function orderId(row){const btn=row.querySelector('.order-details-btn');const m=btn?.getAttribute('onclick')?.match(/viewOrderDetails\((\d+)\)/);return m?m[1]:'';}
  function status(row){const s=row.querySelector('select.status');return s?.value||s?.options?.[s.selectedIndex]?.textContent?.trim()||'';}
  function data(){const body=document.getElementById('ordersTable');if(!body)return [];return [...body.querySelectorAll('tr')].filter(r=>orderId(r));}
  function textCell(row,index){return row.cells[index]?.innerText?.trim()||'';}
  function build(){
    const body=document.getElementById('ordersTable');if(!body)return;const rows=data();
    const sig=rows.map(r=>r.outerHTML).join('');if(sig===lastSignature&&document.querySelector('.sgOrdersCompact'))return;lastSignature=sig;
    const totalPages=Math.max(1,Math.ceil(rows.length/PAGE_SIZE));if(page>totalPages)page=totalPages;const start=(page-1)*PAGE_SIZE;const visible=rows.slice(start,start+PAGE_SIZE);
    const oldTable=body.closest('table');if(!oldTable)return;const box=oldTable.parentElement?.parentElement||oldTable.parentElement;
    if(!box.querySelector('.sgOrdersCompact')){oldTable.style.display='none';const ui=document.createElement('div');ui.className='sgOrdersCompact';oldTable.insertAdjacentElement('afterend',ui);}
    const ui=box.querySelector('.sgOrdersCompact');
    ui.innerHTML=`<div class="sgOrdersMeta"><span>${rows.length} commande${rows.length>1?'s':''}</span><span>Page ${page} / ${totalPages}</span></div>`+
      visible.map(r=>{const id=orderId(r);const client=textCell(r,2)||textCell(r,1)||'Client';const phone=client.match(/(?:\+?\d[\d\s-]{7,})/)?.[0]||'';const name=client.replace(phone,'').trim().replace(/\n+/g,' ');const st=status(r);return `<div class="sgOrderRow"><div class="sgOrderId">#${esc(id)}</div><div class="sgOrderClient"><strong>${esc(name||client)}</strong>${phone?`<small>${esc(phone)}</small>`:''}</div><div class="sgOrderStatus"><span>${esc(st)}</span></div><button type="button" class="sgOrderDetails" data-order-id="${esc(id)}">👁️ Voir les détails</button></div>`;}).join('')+
      `<div class="sgPager">${page>1?'<button data-page="prev">‹</button>':''}<span>${rows.length?start+1:0}-${Math.min(start+PAGE_SIZE,rows.length)} sur ${rows.length}</span>${page<totalPages?'<button data-page="next">›</button>':''}</div>`;
    ui.querySelectorAll('.sgOrderDetails').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.orderId;if(typeof window.viewOrderDetails==='function')window.viewOrderDetails(Number(id));}));
    ui.querySelector('[data-page="prev"]')?.addEventListener('click',()=>{page--;build();});ui.querySelector('[data-page="next"]')?.addEventListener('click',()=>{page++;build();});rows.forEach(r=>r.style.display='none');
  }
  function install(){if(window.__sgOrdersCompact)return;window.__sgOrdersCompact=true;const target=document.getElementById('ordersTable');if(!target)return;new MutationObserver(()=>setTimeout(build,0)).observe(target,{childList:true,subtree:true});setTimeout(build,150);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
