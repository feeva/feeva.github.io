const WIDTH = 960;
const HEIGHT = 720;
const DATA_DIR = "/static/modules/house-price/data";

const svg = d3.select("#map");
const g = svg.append("g");
// g(줌/팬되는 지도 레이어) 뒤에 붙여야 페인트 순서상 위에 그려져서, 지역 색칠에
// 경계선이 가리지 않는다. g의 형제 노드라 줌 트랜스폼의 영향도 안 받는다.
svg
  .append("rect")
  .attr("class", "map-frame")
  .attr("x", 0.75)
  .attr("y", 0.75)
  .attr("width", WIDTH - 1.5)
  .attr("height", HEIGHT - 1.5);
const tooltip = d3.select("#tooltip");
const legendBar = document.querySelector("#legend-bar");
const legendMax = document.querySelector("#legend-max");

const geoCache = new Map();
const projectionCache = new Map(); // level -> projection

// 브라우저가 data/*.json을 캐싱해서 예전 데이터를 계속 보여주는 걸 막기 위한 버전 파라미터.
// 데이터 파일 내용을 바꿀 때마다 값을 올린다.
const DATA_VERSION = 3;

let meta;
let state = { era: "2026", level: "sigungu", relative: false };

const zoomBehavior = d3
  .zoom()
  .scaleExtent([1, 12])
  .on("zoom", (event) => {
    g.attr("transform", event.transform);
  });
svg.call(zoomBehavior);

async function loadGeo(level, era) {
  const key = `${level}-${era}`;
  if (!geoCache.has(key)) {
    geoCache.set(key, await d3.json(`${DATA_DIR}/${level}-${era}.geojson?v=${DATA_VERSION}`));
  }
  return geoCache.get(key);
}

function getProjection(level, geojson) {
  if (!projectionCache.has(level)) {
    const projection = d3.geoMercator().fitSize([WIDTH, HEIGHT], geojson);
    projectionCache.set(level, projection);
  }
  return projectionCache.get(level);
}

function formatWon(value) {
  return Math.round(value).toLocaleString("ko-KR");
}

function showTooltip(event, d) {
  const name = d.properties.sourceLabel ?? d.properties.name ?? "이름 없음";
  const value = d.properties.value;
  tooltip
    .classed("visible", true)
    .style("left", `${event.clientX}px`)
    .style("top", `${event.clientY}px`)
    .html(
      value != null
        ? `<b>${name}</b><br>3.3m²당 ${formatWon(value)}만원<br>거래 ${d.properties.count.toLocaleString("ko-KR")}건`
        : `<b>${name}</b><br>해당 기간 거래 없음`,
    );
}

function hideTooltip() {
  tooltip.classed("visible", false);
}

async function render() {
  const { level, era } = state;
  const geojson = await loadGeo(level, era);
  const projection = getProjection(level, geojson);
  const path = d3.geoPath(projection);

  const maxKey = level === "sigungu" ? "maxSigunguValue" : "maxDongValue";
  const domainMax = state.relative
    ? meta.eras[era][maxKey]
    : Math.max(meta.eras["2014"][maxKey], meta.eras["2026"][maxKey]);
  const colorScale = d3.scaleSequentialSqrt(d3.interpolateOrRd).domain([0, domainMax]);

  legendBar.style.background = `linear-gradient(to right, ${colorScale(0)}, ${colorScale(domainMax * 0.25)}, ${colorScale(domainMax * 0.5)}, ${colorScale(domainMax * 0.75)}, ${colorScale(domainMax)})`;
  legendMax.textContent = `${formatWon(domainMax)}만원/평(3.3m²)`;

  const selection = g.selectAll("path.feature").data(geojson.features, (d) => d.properties.sggCd ?? d.properties.emdCd);

  selection
    .join(
      (enter) =>
        enter
          .append("path")
          .attr("class", "feature")
          .on("mousemove", showTooltip)
          .on("mouseleave", hideTooltip),
      (update) => update,
      (exit) => exit.remove(),
    )
    .attr("d", path)
    .classed("no-data", (d) => d.properties.value == null)
    .attr("fill", (d) => (d.properties.value != null ? colorScale(d.properties.value) : "#eee"));

  g.selectAll("path.feature").raise();
}

function resetZoom() {
  svg.transition().duration(300).call(zoomBehavior.transform, d3.zoomIdentity);
}

function wireControls() {
  document.querySelectorAll("#era-toggle button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#era-toggle button").forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
      state.era = btn.dataset.era;
      render();
    });
  });
  document.querySelectorAll("#level-toggle button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#level-toggle button").forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
      state.level = btn.dataset.level;
      resetZoom();
      render();
    });
  });
  document.querySelector("#relative-scale").addEventListener("change", (event) => {
    state.relative = event.target.checked;
    render();
  });
}

async function main() {
  meta = await d3.json(`${DATA_DIR}/meta.json?v=${DATA_VERSION}`);
  wireControls();
  await render();
}

main();
