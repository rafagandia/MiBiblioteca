
const originalBooks = window.INITIAL_BOOKS;
let books = JSON.parse(localStorage.getItem("mi_biblioteca_books") || "null") || originalBooks;
let currentId = null;
const fields = [
 ["Titulo","Título"],["Escritor","Escritor"],["Serie","Serie"],["Pais","País"],
 ["Año","Año"],["Leído","Leído"],["When","When"],["Valor","Valor"],["Para leer","Para leer"]
];

function normalise(v){return String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]))}
function isRead(v){return ["si","sí","yes","leido","leído","true","1"].includes(normalise(v).trim())}
function switchView(id){["home","search","detail","stats","settings"].forEach(x=>document.getElementById(x).classList.toggle("hidden",x!==id));scrollTo(0,0)}
function sortBooks(){books.sort((a,b)=>normalise(a.Escritor).localeCompare(normalise(b.Escritor))||normalise(a.Titulo).localeCompare(normalise(b.Titulo)))}
function persist(){localStorage.setItem("mi_biblioteca_books",JSON.stringify(books));updateCount()}
function updateCount(){document.getElementById("bookCount").textContent=`${books.length} libros`}
function goHome(){switchView("home");updateCount()}
function notReady(){alert("Esta función se añadirá después de conectar la carpeta de EPUB.")}
function showSearch(){switchView("search");document.getElementById("query").focus();renderResults()}
function backToSearch(){switchView("search");renderResults()}

function renderResults(){
 const q=normalise(document.getElementById("query").value.trim());
 const out=document.getElementById("results"),sum=document.getElementById("summary");
 if(!q){sum.textContent="";out.innerHTML='<div class="empty">Escribe parte del título o del escritor.</div>';return}
 const matches=books.filter(b=>normalise(b.Titulo).includes(q)||normalise(b.Escritor).includes(q));
 sum.textContent=matches.length===1?"1 resultado":`${matches.length} resultados`;
 out.innerHTML=matches.length?matches.map(b=>`<button class="result" onclick="openBook('${b.id}')">
 <div class="result-title">${esc(b.Titulo||"Sin título")}</div>
 <div class="result-author">${esc(b.Escritor||"Sin escritor")}</div>
 <div class="result-status">${isRead(b["Leído"])?"✅ Leído":"⬜ No leído"}</div></button>`).join(""):'<div class="empty">No se ha encontrado ningún libro.</div>';
}

function openBook(id){currentId=id;renderView();switchView("detail")}
function getCurrent(){return books.find(b=>b.id===currentId)}
function renderView(){
 const b=getCurrent();
 document.getElementById("bookCard").innerHTML=fields.map(([k,l])=>`<div class="field"><div class="label">${l}</div><div class="value">${esc(b[k]===""?"—":b[k])}</div></div>`).join("");
 document.getElementById("viewActions").classList.remove("hidden");document.getElementById("editActions").classList.add("hidden");
}
function startEdit(){
 const b=getCurrent();
 document.getElementById("bookCard").innerHTML=fields.map(([k,l])=>`<div class="field"><div class="label">${l}</div><input class="edit-input" id="edit_${k}" value="${esc(b[k])}"></div>`).join("");
 document.getElementById("viewActions").classList.add("hidden");document.getElementById("editActions").classList.remove("hidden");
}
function cancelEdit(){renderView()}
function saveEdit(){
 const b=getCurrent(); fields.forEach(([k])=>b[k]=document.getElementById("edit_"+k).value.trim());
 sortBooks();persist();renderView();renderResults();toast("Cambios guardados");
}
function showStats(){
 const read=books.filter(b=>isRead(b["Leído"])).length;
 const pending=books.length-read;
 const next=books.filter(b=>String(b["Para leer"]).trim()!=="").length;
 const authors=new Set(books.map(b=>String(b.Escritor).trim()).filter(Boolean)).size;
 document.getElementById("statsGrid").innerHTML=[
  ["Total",books.length],["Leídos",read],["No leídos",pending],["Para leer",next],["Escritores",authors]
 ].map(([l,v])=>`<div class="stat"><strong>${v}</strong><span>${l}</span></div>`).join("");
 switchView("stats");
}
function showSettings(){switchView("settings")}
function exportJSON(){
 const blob=new Blob([JSON.stringify(books,null,2)],{type:"application/json"});
 downloadBlob(blob,"Biblioteca_copia.json");
}
function exportCSV(){
 const sep=";";
 const lines=[fields.map(x=>csvCell(x[1],sep)).join(sep),...books.map(b=>fields.map(([k])=>csvCell(b[k],sep)).join(sep))];
 const blob=new Blob(["\ufeff"+lines.join("\r\n")],{type:"text/csv;charset=utf-8"});
 downloadBlob(blob,"Biblioteca_actualizada.csv");
}
function csvCell(v,sep){let s=String(v??"");if(s.includes('"'))s=s.replaceAll('"','""');return (s.includes(sep)||s.includes('"')||s.includes("\n"))?`"${s}"`:s}
function downloadBlob(blob,name){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function importJSON(input){
 const file=input.files[0];if(!file)return;
 const reader=new FileReader();
 reader.onload=()=>{try{
  const data=JSON.parse(reader.result);if(!Array.isArray(data))throw new Error();
  books=data;sortBooks();persist();toast("Copia importada");goHome();
 }catch{alert("No se ha podido importar esa copia.")} input.value="";};
 reader.readAsText(file);
}
function resetLibrary(){
 if(!confirm("¿Restaurar los datos originales del Excel? Se perderán los cambios guardados en esta web."))return;
 books=structuredClone(originalBooks);sortBooks();persist();toast("Biblioteca restaurada");goHome();
}
function toast(text){const t=document.getElementById("toast");t.textContent=text;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1700)}
updateCount();
if("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./service-worker.js");
