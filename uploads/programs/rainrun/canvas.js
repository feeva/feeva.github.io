/******************************************************
 * canvas.js
 * (c) 2014, Dylan Yi, http://start.goodtime.co.kr
 * MIT License
 *
 * 사용 예:
 * var canvas = new Canvas2D('canvas', 500);
 * canvas.add(new VerletObject(
 *     canvas.getWidth(), canvas.getHeight(), [
 *     {x: 100, y: 50, r: 10},
 *     {x: 200, y: 60, r: 10}
 *     ], [0, 1]
 * ));
 * canvas.start(function(t) {
 *     // 개체 위치 등 갱신
 * });
 ******************************************************/

/**
 * HTML5 canvas의 추상 객체
 * @param canvas HTML canvas 요소 또는 그 ID. 미리 크기가 지정돼 있어야 한다.
 * @param width canvas의 가상 가로 크기. 지정하지 않으면 실제 크기.
 */
function Canvas2D(canvas, width) {
    this.stop();

    if (typeof(canvas) == 'string')
        canvas = document.getElementById(canvas);

    canvas.width = width || canvas.offsetWidth;
    canvas.height = width ? (width * canvas.offsetHeight / canvas.offsetWidth) : canvas.offsetHeight;

    this.canvasContext = canvas.getContext('2d');
}

Canvas2D.prototype.getWidth = function () {
    return this.canvasContext.canvas.width;
}

Canvas2D.prototype.getHeight = function () {
    return this.canvasContext.canvas.height;
}

Canvas2D.prototype.start = function (updateFrame) {
    var _this = this, startTime = Date.now()

    function refresh() {
        if (_this.stopped)
            return;

        var objects = updateFrame(startTime);
        _this.draw(objects);

        _requestAnimationFrame(refresh);
    };

    this.stopped = false;
    refresh();
};

Canvas2D.prototype.stop = function () {
    this.stopped = true;
};

/**
 * 그림 개체를 캔버스에 그린다.
 * 개체는 SVG와 비슷한 속성을 가지고 있어야 한다.
 * type: circle, rect, ...
 * circle일 경우 cx, cy, r 속성 필요
 * rect일 경우 x, y, width, height 속성 필요
 * fill 속성에 따라 색칠
 * 예외적으로 tagName 속성이 IMG면 이미지 그리기 처리
 */
Canvas2D.prototype.draw = function (objects, keepOld) {
    var ctx = this.canvasContext, colorGroups = {};
    if (!keepOld)
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    for (var i = 0; i < objects.length; ++i) {
        var o = objects[i];

        if (o.color) {
            (colorGroups[o.color] || (colorGroups[o.color] = [])).push(o);
        } else if (o.tagName == 'IMG') {
            ctx.drawImage(o, o.left, o.top);
        }
    }

    // fillStyle 변경, fill() 호출 등은 비싼 메서드이므로
    // 같은 종류끼리 모아서 그리도록 한다
    for (var color in colorGroups) {
        ctx.beginPath();
        ctx.fillStyle = color;
        var arr = colorGroups[color];

        for (var i = 0, count = arr.length; i < count; ++i) {
            var o = arr[i];
            if (o.type == 'circle') {
                ctx.moveTo(o.cx, o.cy);
                ctx.arc(o.cx, o.cy, o.r, 0, Math.PI * 2);
            } else if (o.type == 'rect') {
                ctx.fillRect(o.x, o.y, o.width, o.height);
            }
        }
        ctx.fill();
    }
};


/** 유틸리티 함수 */
function _distance(p1, p2) {
    return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y));
}

var _requestAnimationFrame = window.requestAnimationFrame
    || window.webkitRequestAnimationFrame
    || window.mozRequestAnimationFrame
    || window.oRequestAnimationFrame
    || window.msRequestAnimationFrame
    || function(callback) { window.setTimeout(callback, 1000 / 60); }
    ;

