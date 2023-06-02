(async () => {
    let resp = await fetch('/static/modules/emart/emart.json');
    const emarts = await resp.json();

    resp = await fetch('/static/modules/emart/korea-sido-wgs84-topo.json');
    const features = await resp.json();

    const yearMonthFormatter = new Intl.DateTimeFormat(undefined, {year: 'numeric', month: 'short'});
    const formatYearMonth = ym => {
        let y = ym.slice(0, 4);
        let m = ym.slice(4, 6) - 1;
        let date = new Date(y, m, 1);
        return yearMonthFormatter.format(date);
    };

    emarts.sort((a, b) => a.ym < b.ym ? -1 : a.ym > b.ym ? 1 : 0);
    let min = emarts[0].ym - 1 + '';
    let max = emarts[emarts.length - 1].ym;

    let width = document.querySelector('#divMap1').offsetWidth;
    let height = window ? window.innerHeight - 150 : width * .75;

    let projection = d3.geoMercator()
        .center([125.5, 35.8]).scale(6000)
        .translate([width / 4, height / 2]);
    let path = d3.geoPath().projection(projection);

    const svg = d3.create("svg")
        .attr("viewBox", [0, 0, width, height]);
    const g = svg.append("g").attr('stroke-width', '1');

    g.append("g")
        .attr("fill", "skyblue")
        .attr("stroke", "white")
        .selectAll("path")
        .data(topojson.feature(features, features.objects.sido).features)
        .join("path")
        .attr("d", path)
        .append("title")
        .text(d => d.properties.CTP_KOR_NM);

    const gc = g.append('g').attr('stroke', '#ffee00').attr('stroke-width', '2')
            .attr('fill', 'transparent');

    // g.append("path")
    //     .attr("fill", "none")
    //     .attr("stroke", "#777")
    //     .attr("stroke-width", ".1")
    //     .attr("stroke-linejoin", "round")
    //     .attr("d", path(topojson.mesh(this.features, this.features.objects.sido, (a, b) => a !== b)));

    document.querySelector('#divMap1').appendChild(svg.node());

    let zoomLevel = 1;
    const zoomed = (e) => {
        const {transform} = e;
        zoomLevel = transform.k;
        g.attr("transform", transform).attr('stroke-width', 1 / zoomLevel);
        gc.attr('stroke-width', 2 / zoomLevel)

        let circles = document.querySelectorAll('circle');
        for (let i = 0; i < circles.length; ++i) {
            circles[i].setAttribute('r', 3 / zoomLevel);
        }
    };
    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", zoomed);

    const months = -min.slice(-2) + (max.slice(0, 4) - min.slice(0, 4)) * 12 + +max.slice(4);

    d3.select('#emartSlider input').attr('min', 0).attr('max', months).property('value', 0)
        .on('input', () => {
            let date = new Date(min.slice(0, 4), min.slice(4) - 1 + +d3.select('#emartSlider input').property('value'), 1);
            d3.select('#emartSlider output').text(yearMonthFormatter.format(date));
            const ym = date.getFullYear() + (date.getMonth() < 9 ? '0' : '') + (date.getMonth() + 1);

            emarts.forEach(d => {
                let elem = document.querySelector('#emart-' + d.name);

                if (d.ym <= ym) {
                    if (elem)
                        return;

                    let xy = projection([d.x, d.y]);
                    let c = gc.append('circle').attr('id', 'emart-' + d.name)
                        .attr('class', 'emart').attr('r', 50)
                        .attr('transform', 'translate(' + xy[0] + ' ' + xy[1] + ')');
                    c.transition().ease(d3.easeCubicOut).duration(1000)
                        .attr('r', 4 / zoomLevel);
                    c.attr('title', d.name + ': ' + formatYearMonth(d.ym) + ', ' + d.address);
                    new bootstrap.Tooltip(c.node());
                } else {
                    if (elem)
                        elem.parentElement.removeChild(elem);
                }
            });
        });

    d3.select('#emartSlider output').text(formatYearMonth(min));

    svg.call(zoom);
})();
