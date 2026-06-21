(function verletExample() {

    var canvases = [], c;

    function init(idx) {
        if (canvases[idx])
            canvases[idx].stopAnimation();
        c = canvases[idx] = new Canvas2D('c' + idx, 600);

        if (idx == 1) {
            c.add(new VerletObject(c.getWidth(), c.getHeight(), [
                {x: 200, y: 10, r: 10}
                ], null, true
            ));
            c.draw();
        } else if (idx == 2) {
            c.add(new VerletObject(c.getWidth(), c.getHeight(), [
                {x: 150, y: 20, r: 10},
                {x: 180, y: 73, r: 10},
                {x: 200, y: 10, r: 10}
                ], [0, 1, 1, 2, 2, 0], true
            ));
            c.add(new VerletObject(c.getWidth(), c.getHeight(), [
                {x: 450, y: 22, r: 10},
                {x: 450, y: 61, r: 10},
                {x: 500, y: 103, r: 10},
                {x: 510, y: 39, r: 10}
                ], [0, 1, 1, 2, 2, 3, 3, 0], true
            ));
            c.draw();
        } else if (idx == 3) {
            c.add(new VerletObject(c.getWidth(), c.getHeight(), [
                {x: 300, y: 10, r: 5},
                {x: 300, y: c.getHeight() - 200, r: 5}
                ], [0, 1], true
            ));
            c.draw();
            var c3 = c;
            c.canvasContext.canvas.onmouseover = function() {
                c3.startAnimation();
            };
            c.canvasContext.canvas.onmouseout = function() {
                c3.stopAnimation();
            };
        }
    }

    function start(idx) {
        canvases[idx].startAnimation();
        this.disabled = true;
        this.innerHTML = '실행 중';
    };

    for (var i = 1; i <= 3; ++i) {
        var btnStart = document.getElementById('btnStart' + i);
        if (btnStart)
            btnStart.onclick = function() { start.call(this, this.id.substring(8)); };
        document.getElementById('btnReset' + i).onclick = function() {
            var idx = this.id.substring(8);
            init(idx);
            var btnStart = document.getElementById('btnStart' + idx);
            if (btnStart) {
                btnStart.onclick = function() { start.call(this, idx); };
                btnStart.innerHTML = '시작';
                btnStart.disabled = false;
            }
        }

        init(i);
    }

})();
