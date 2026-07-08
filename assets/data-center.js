const DATA_URL = "../data/featured-data-center-master.json?v=english-public-v4";
const fields = {
  id:"ID", group:"System Group", subsystem:"Subsystem", level:"Object Level",
  item:"Item / Equipment / Accessory / Document", requirement:"Functional Requirement", route:"Recommended Technical Route / Specification",
  params:"Key Technical Parameters / Control Indicators", why:"Why This Route / Specification Is Selected",
  whyNot:"Why Alternatives Are Not Selected", calc:"Calculation Required", inputs:"Calculation Inputs",
  formula:"Calculation / Verification Formula", demand:"Example Demand Value", capacity:"Example Selected Capacity",
  margin:"Margin %", risk:"Main Risk", measure:"Control Measures", evidence:"Acceptance / Evidence Documents",
  delivery:"Operation / Handover Documents", access:"Access Level", package:"Restricted Package", webid:"Website Interface ID",
  summary:"Public Web Summary", topic:"Fourth-Level Category"
};
let allRecords = [];
let filtered = [];
function tagClass(access){
  if(!access) return "tag";
  if(access.includes("Restricted")) return "tag res";
  if(access.includes("Request")) return "tag req";
  return "tag";
}
function byId(id){return document.getElementById(id)}
function uniq(arr){return [...new Set(arr.filter(Boolean))].sort((a,b)=>a.localeCompare(b,"en-US"))}
function fillSelect(id, values, allText){
  const el = byId(id);
  el.innerHTML = `<option value="">${allText}</option>` + values.map(v=>`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
}
function escapeHtml(s){
  return String(s ?? "").replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
}
function truncate(s,n=110){
  s = String(s ?? "");
  return s.length>n ? s.slice(0,n)+"…" : s;
}
function init(){
  fetch(DATA_URL).then(r=>r.json()).then(data=>{
    allRecords = data.records || [];
    filtered = allRecords;
    byId("countRecords").textContent = allRecords.length;
    byId("countSystems").textContent = uniq(allRecords.map(r=>r[fields.group])).length;
    byId("countPackages").textContent = uniq(allRecords.map(r=>r[fields.package])).length;
    byId("countCalc").textContent = allRecords.filter(r=>String(r[fields.calc]).includes("Yes")).length;
    fillSelect("filterGroup", uniq(allRecords.map(r=>r[fields.group])), "All system groups");
    fillSelect("filterAccess", uniq(allRecords.map(r=>r[fields.access])), "All access levels");
    fillSelect("filterTopic", uniq(allRecords.map(r=>r[fields.topic])), "All fourth-level categories");
    renderCards();
    applyFilters();
    ["search","filterGroup","filterAccess","filterTopic"].forEach(id=>{
      byId(id).addEventListener("input", applyFilters);
      byId(id).addEventListener("change", applyFilters);
    });
  }).catch(err=>{
    byId("tableBody").innerHTML = `<tr><td colspan="8">Database loading failed: ${escapeHtml(err.message)}</td></tr>`;
  });
}
function renderCards(){
  const groups = uniq(allRecords.map(r=>r[fields.group])).slice(0,12);
  byId("systemCards").innerHTML = groups.map(g=>{
    const rows = allRecords.filter(r=>r[fields.group]===g);
    const pkgs = uniq(rows.map(r=>r[fields.package])).slice(0,3).join(" / ");
    return `<article class="card">
      <h3>${escapeHtml(g)}</h3>
      <p>${rows.length} records; package: ${escapeHtml(pkgs || "Not set")}</p>
    </article>`;
  }).join("");
}
function applyFilters(){
  const q = byId("search").value.trim().toLowerCase();
  const g = byId("filterGroup").value;
  const a = byId("filterAccess").value;
  const t = byId("filterTopic").value;
  filtered = allRecords.filter(r=>{
    const text = Object.values(r).join(" ").toLowerCase();
    return (!q || text.includes(q)) && (!g || r[fields.group]===g) && (!a || r[fields.access]===a) && (!t || r[fields.topic]===t);
  });
  byId("filteredCount").textContent = filtered.length;
  renderTable(filtered.slice(0,120));
  byId("detail").classList.remove("show");
}
function renderTable(rows){
  byId("tableBody").innerHTML = rows.map((r,idx)=>`
    <tr onclick="showDetail('${escapeHtml(r[fields.id])}')">
      <td><b>${escapeHtml(r[fields.id])}</b><br><span class="${tagClass(r[fields.access])}">${escapeHtml(r[fields.access])}</span></td>
      <td>${escapeHtml(r[fields.group])}<br><small>${escapeHtml(r[fields.subsystem])}</small></td>
      <td>${escapeHtml(r[fields.item])}</td>
      <td>${escapeHtml(truncate(r[fields.route],90))}</td>
      <td>${escapeHtml(truncate(r[fields.why],120))}</td>
      <td>${escapeHtml(truncate(r[fields.risk],95))}</td>
      <td>${escapeHtml(truncate(r[fields.evidence],95))}</td>
      <td>${escapeHtml(r[fields.webid])}</td>
    </tr>
  `).join("") || `<tr><td colspan="8">No matching records.</td></tr>`;
}
function showDetail(id){
  const r = allRecords.find(x=>x[fields.id]===id);
  if(!r) return;
  const detailFields = [
    ["Item / Equipment / Document",fields.item],["Functional Requirement",fields.requirement],["Recommended Technical Route / Specification",fields.route],
    ["Key Technical Parameters / Control Indicators",fields.params],["Why selected",fields.why],["Why alternatives are not selected",fields.whyNot],
    ["Calculation required",fields.calc],["Calculation inputs",fields.inputs],["Calculation / verification formula",fields.formula],
    ["Example demand value",fields.demand],["Example selected capacity",fields.capacity],["Margin %",fields.margin],
    ["Main risk",fields.risk],["Control measures",fields.measure],["Acceptance / evidence documents",fields.evidence],
    ["Operation / handover documents",fields.delivery],["Restricted package",fields.package],["Public web summary",fields.summary]
  ];
  byId("detailTitle").textContent = `${r[fields.id]} · ${r[fields.item]}`;
  byId("detailMeta").innerHTML = `<span class="${tagClass(r[fields.access])}">${escapeHtml(r[fields.access])}</span> <span class="tag">${escapeHtml(r[fields.group])}</span> <span class="tag">${escapeHtml(r[fields.topic])}</span>`;
  byId("detailGrid").innerHTML = detailFields.map(([label,key])=>`
    <div class="detail-item"><b>${escapeHtml(label)}</b><span>${escapeHtml(r[key] || "—")}</span></div>
  `).join("");
  byId("detail").classList.add("show");
  byId("detail").scrollIntoView({behavior:"smooth",block:"start"});
}
document.addEventListener("DOMContentLoaded", init);
