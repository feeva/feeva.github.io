function ymd(time) {
  if (typeof time === 'string') {
    const [y, m] = time.split('-');
    return { y: Number(y), m: Number(m) };
  }
  if (time && typeof time === 'object') {
    return { y: time.year, m: time.month };
  }
  const d = new Date(time * 1000);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1 };
}

function step(dateStr, dir, period) {
  const [y, m] = dateStr.split('-').map(Number);
  if (period === 'year') return `${y + dir}-01-01`;
  let ny = y;
  let nm = m + dir;
  if (nm > 12) { nm -= 12; ny += 1; }
  if (nm < 1) { nm += 12; ny -= 1; }
  return `${ny}-${String(nm).padStart(2, '0')}-01`;
}

// 시작/끝에 whitespace 포인트를 추가해 fitContent()가 캔들 앞뒤로 여백을 두게 함.
// 캔들 개수가 많을수록 캔들당 픽셀이 좁아지므로, 원하는 최소 여백(px)을 확보하려면
// 더 많은 whitespace 포인트가 필요함 — 개수에 비례한 고정 1개로는 부족했음.
function withEdgePadding(data, period, el, minMarginPx = 10) {
  const approxBarWidth = el.clientWidth / data.length;
  const n = Math.max(1, Math.ceil(minMarginPx / approxBarWidth));
  const before = [];
  const after = [];
  for (let i = n; i >= 1; i--) before.push({ time: step(data[0].time, -i, period) });
  for (let i = 1; i <= n; i++) after.push({ time: step(data[data.length - 1].time, i, period) });
  return [...before, ...data, ...after];
}

function attachTooltip(chart, series, el, { formatPrice, formatDate }) {
  const tooltip = document.createElement('div');
  tooltip.style.position = 'absolute';
  tooltip.style.display = 'none';
  tooltip.style.pointerEvents = 'none';
  tooltip.style.padding = '6px 10px';
  tooltip.style.background = 'rgba(0,0,0,0.75)';
  tooltip.style.color = '#fff';
  tooltip.style.fontSize = '12px';
  tooltip.style.lineHeight = '1.5';
  tooltip.style.borderRadius = '4px';
  tooltip.style.zIndex = '10';
  tooltip.style.whiteSpace = 'nowrap';
  el.style.position = 'relative';
  el.appendChild(tooltip);

  chart.subscribeCrosshairMove((param) => {
    const data = param.time && param.seriesData.get(series);
    if (!param.point || !data) {
      tooltip.style.display = 'none';
      return;
    }
    tooltip.style.display = 'block';
    tooltip.innerHTML = `
      <div>${formatDate(param.time)}</div>
      <div>시가 ${formatPrice(data.open)}</div>
      <div>고가 ${formatPrice(data.high)}</div>
      <div>저가 ${formatPrice(data.low)}</div>
      <div>종가 ${formatPrice(data.close)}</div>
    `;
    const width = tooltip.offsetWidth;
    const left = Math.min(Math.max(param.point.x - width / 2, 0), el.clientWidth - width);
    tooltip.style.left = `${left}px`;
    if (param.point.y < el.clientHeight / 2) {
      tooltip.style.top = `${param.point.y + 16}px`;
      tooltip.style.bottom = 'auto';
    } else {
      tooltip.style.bottom = `${el.clientHeight - param.point.y + 16}px`;
      tooltip.style.top = 'auto';
    }
  });
}

async function renderCandleChart(containerId, jsonUrl, { formatPrice, formatDate, tickMarkFormatter, period, minMarginPx }) {
  const el = document.getElementById(containerId);
  el.style.cursor = 'crosshair';
  const chart = LightweightCharts.createChart(el, {
    width: el.clientWidth,
    height: 320,
    layout: {
      background: { color: '#ffffff' },
      textColor: '#333',
      attributionLogo: false,
    },
    grid: { vertLines: { color: '#eee' }, horzLines: { color: '#eee' } },
    rightPriceScale: {
      mode: 1, // 로그 스케일
      scaleMargins: { top: 0.02, bottom: 0.02 },
      entireTextOnly: true, // 그래도 잘리는 라벨은 숨김
    },
    timeScale: { tickMarkFormatter },
  });
  const series = chart.addSeries(LightweightCharts.CandlestickSeries, {
    upColor: '#e74c3c',
    downColor: '#3498db',
    borderVisible: false,
    wickUpColor: '#e74c3c',
    wickDownColor: '#3498db',
    priceFormat: { type: 'custom', minMove: 1, formatter: formatPrice },
  });
  const raw = await fetch(jsonUrl).then((r) => r.json());
  series.setData(withEdgePadding(raw, period, el, minMarginPx));
  chart.timeScale().fitContent();
  attachTooltip(chart, series, el, { formatPrice, formatDate });
  new ResizeObserver((entries) => {
    chart.applyOptions({ width: entries[0].contentRect.width });
  }).observe(el);
}

const usd = (p) => p.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const krw = (p) => p.toLocaleString('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 });
const asYear = (t) => `${ymd(t).y}년`;
const asMonth = (t) => `${ymd(t).y}년 ${ymd(t).m}월`;
const tickYear = (t) => `${ymd(t).y}`;

renderCandleChart('chart-ko', '/static/interactive/buyhold/ko.json', {
  formatPrice: usd,
  formatDate: asYear,
  tickMarkFormatter: tickYear,
  period: 'year',
  minMarginPx: 6,
});
renderCandleChart('chart-samsung', '/static/interactive/buyhold/samsung.json', {
  formatPrice: krw,
  formatDate: asMonth,
  tickMarkFormatter: tickYear,
  period: 'month',
});
renderCandleChart('chart-gold', '/static/interactive/buyhold/gold.json', {
  formatPrice: usd,
  formatDate: asYear,
  tickMarkFormatter: tickYear,
  period: 'year',
});
