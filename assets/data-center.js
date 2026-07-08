
const DATA_URL = "../data/featured-data-center-master.json";
const fields = {
  id:"编号", group:"系统组", subsystem:"子系统", level:"对象层级",
  item:"设备/配件/资料项", requirement:"主要功能需求", route:"推荐技术路线/规格",
  params:"关键技术参数/控制指标", why:"为什么选此路线/规格（数据逻辑）",
  whyNot:"为什么不选替代方案", calc:"是否需要计算", inputs:"计算输入参数",
  formula:"计算/校核公式", demand:"示例需求值", capacity:"示例选型能力值",
  margin:"裕度%", risk:"主要风险", measure:"控制措施", evidence:"验收/证据资料",
  delivery:"运维/交付资料", access:"访问等级", package:"受限资料包", webid:"网站接口ID",
  summary:"网页公开摘要", topic:"四级分类"
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
function uniq(arr){return [...new Set(arr.filter(Boolean))].sort((a,b)=>a.localeCompare(b,"zh-Hans-CN"))}
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
    byId("countCalc").textContent = allRecords.filter(r=>String(r[fields.calc]).includes("是")).length;
    fillSelect("filterGroup", uniq(allRecords.map(r=>r[fields.group])), "全部系统组");
    fillSelect("filterAccess", uniq(allRecords.map(r=>r[fields.access])), "全部访问等级");
    fillSelect("filterTopic", uniq(allRecords.map(r=>r[fields.topic])), "全部四级分类");
    renderCards();
    applyFilters();
    ["search","filterGroup","filterAccess","filterTopic"].forEach(id=>{
      byId(id).addEventListener("input", applyFilters);
      byId(id).addEventListener("change", applyFilters);
    });
  }).catch(err=>{
    byId("tableBody").innerHTML = `<tr><td colspan="8">数据加载失败：${escapeHtml(err.message)}</td></tr>`;
  });
}
function renderCards(){
  const groups = uniq(allRecords.map(r=>r[fields.group])).slice(0,12);
  byId("systemCards").innerHTML = groups.map(g=>{
    const rows = allRecords.filter(r=>r[fields.group]===g);
    const pkgs = uniq(rows.map(r=>r[fields.package])).slice(0,3).join(" / ");
    return `<article class="card">
      <h3>${escapeHtml(g)}</h3>
      <p>${rows.length} 条记录；资料包：${escapeHtml(pkgs || "未设置")}</p>
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
  `).join("") || `<tr><td colspan="8">没有匹配记录。</td></tr>`;
}
function showDetail(id){
  const r = allRecords.find(x=>x[fields.id]===id);
  if(!r) return;
  const detailFields = [
    ["设备/资料项",fields.item],["主要功能需求",fields.requirement],["推荐技术路线/规格",fields.route],
    ["关键技术参数/控制指标",fields.params],["为什么选",fields.why],["为什么不选替代方案",fields.whyNot],
    ["是否需要计算",fields.calc],["计算输入参数",fields.inputs],["计算/校核公式",fields.formula],
    ["示例需求值",fields.demand],["示例选型能力值",fields.capacity],["裕度%",fields.margin],
    ["主要风险",fields.risk],["控制措施",fields.measure],["验收/证据资料",fields.evidence],
    ["运维/交付资料",fields.delivery],["受限资料包",fields.package],["网页公开摘要",fields.summary]
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
