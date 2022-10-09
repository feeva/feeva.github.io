/******************************************************
 * verlet.js
 * (c) 2013, Dylan Yi, http://start.goodtime.co.kr
 * Verlet 적산법을 사용한 물리 시뮬레이션용 JavaScript
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
 * canvas.draw();
 * canvas.startAnimation();
 ******************************************************/

/**
 * HTML5 canvas의 추상 객체
 * @param canvas HTML canvas 요소 또는 그 ID
 * @param width canvas의 가상 크기. 가로가 세로보다 길다는 가정을 하고 있다.
 */
function Canvas2D(canvas, width) {
    this.objects = [];
    this.stopAnimation();

    if (typeof(canvas) == 'string')
        canvas = document.getElementById(canvas);

    if (width) {
        canvas.width = width;
        canvas.height = width * canvas.offsetHeight / canvas.offsetWidth;
    }

    this.canvasContext = canvas.getContext('2d');

    var _this = this;
    canvas.onmousedown = function (e) {
        var o, p;
        var ratio = canvas.width / canvas.offsetWidth;
        var rect = canvas.getBoundingClientRect();
        var mouseX = (e.clientX - rect.left) * ratio;
        var mouseY = (e.clientY - rect.top) * ratio;
        var mousePosition = {x: mouseX, y: mouseY};
        var margin = 10 / ratio;

        for (var i = 0; i < _this.objects.length; ++i) {
            o = _this.objects[i];
            for (var j = 0; j < o.points.length; ++j) {
                p = o.points[j];
                if (_distance(p, mousePosition) < margin) {
                    _this.selectedPoint = p;
                    mousePosition.offsetX = p.x - mouseX;
                    mousePosition.offsetY = p.y - mouseY;
                    _this.mousePosition = mousePosition;
                    if (canvas.setCapture)
                        canvas.setCapture();
                    break;
                }
            }
        }
    };
    canvas.onmousemove = function (e) {
        if (!_this.selectedPoint) {
            _this.mouseStart = null;
            return;
        }

        var ratio = canvas.width / canvas.offsetWidth;
        var rect = canvas.getBoundingClientRect();
        _this.mousePosition.x = (e.clientX - rect.left) * ratio;
        _this.mousePosition.y = (e.clientY - rect.top) * ratio;
    };
    canvas.onmouseup = function (e) {
        _this.selectedPoint = null;
        if (canvas.releaseCapture)
            canvas.releaseCapture();
    };
}

Canvas2D.prototype.getWidth = function () {
    return this.canvasContext.canvas.width;
}

Canvas2D.prototype.getHeight = function () {
    return this.canvasContext.canvas.height;
}

Canvas2D.prototype.add = function (obj) {
    this.objects.push(obj);
};

Canvas2D.prototype.startAnimation = function () {
    var _this = this;
    var refresh = function() {
        if (_this.stopped)
            return;

        var ctx = _this.canvasContext;
        for (var i = 0; i < _this.objects.length; ++i)
            _this.objects[i].update(_this.selectedPoint, _this.mousePosition);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        _this.draw();
        _requestAnimationFrame(refresh);
    };

    this.stopped = false;
    refresh();
};

Canvas2D.prototype.stopAnimation = function () {
    this.stopped = true;
};

/**
 * 이 메서드는 public이 아님
 */
Canvas2D.prototype.draw = function () {
    var o, p, p1, p2;
    var ctx = this.canvasContext;

    ctx.fillStyle = 'blue';
    ctx.strokeStyle = '#aaa';

    for (var i = 0; i < this.objects.length; ++i) {
        o = this.objects[i];

        for (var j = 0; j < o.points.length; ++j) {
            p = o.points[j];
            if (p == this.selectedPoint && o.dragEnabled)
                ctx.fillStyle = 'red';

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            
            if (p == this.selectedPoint)
                ctx.fillStyle = 'blue';
        }

        for (var j = 0; j < o.constraints.length; ++j) {
            p1 = o.points[o.constraints[j]];
            p2 = o.points[o.constraints[++j]];
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }
    }
};


/**
 * Verlet 개체 생성자
 * @param canvasWidth cm 단위 길이
 * @param canvasHeight cm 단위 길이
 * @param points x, y, r 속성이 있는 객체의 배열
 * @param constraints points 변수의 색인 배열. 색인을 두 개씩 묶어 구속하므로 배열 개수는 짝수여야 한다.
 * @param dragEnabled 사용자가 점을 선택해 움직이면(마우스 드래그) 반응할지 여부
 * @param acceleration 가속도 벡터 함수. 인자는 점의 위치다. 주어지지 않으면
 * 대개 {x: 0, y: 980.7}을 반환하고 캔버스 경계에서는 감속하는 함수로 설정된다.
 * @param elasticity 탄성 계수. 주어지지 않으면 기본 값을 0.77로 하고 있음.
 */
function VerletObject(canvasWidth, canvasHeight,
        points, constraints, dragEnabled, acceleration, elasticity) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.points = points || [];
    this.constraints = constraints || [];
    this.dragEnabled = dragEnabled;
    this.acceleration = acceleration || function(p) {
        var x = 0;
        var y = 980.7;
        var margin = .3;

        // 벽을 탈 땐 중력에 비례하는 마찰력 가정
        if ((p.x <= p.r + margin || p.x >= canvasWidth - p.r - margin)
            && (p.oldX <= p.r + margin || p.oldX >= canvasWidth - p.r - margin))
            y = y * .6;
        else if (p.y >= canvasHeight - p.r - margin
            && p.oldY >= canvasHeight - p.r - margin) {
            // 바닥을 구를 땐 속도에 비례하도록 가정
            if (this.points.length == 1)
                x = (p.oldX - p.x) * 15;
            // 바닥을 미끄러질 땐 무게의 제곱근에 비례하도록 가정
            else {
                x = y / 11 * Math.sqrt(this.points.length);
                if (p.x > p.oldX)
                    x = -x;
            }
        } else if (p.x != p.oldX) {
            // 공중에 떠 있는 물체도 속도에 비례하는 반력 가정
            x = (p.oldX - p.x) * 5 * this.points.length;
        }

        return {x: x, y: y}; 
    };
    this.elasticity = isNaN(elasticity) || elasticity < 0 ? .77 : elasticity;

    for (var i = 0; i < this.points.length; ++i) {
        var p = this.points[i];
        if (typeof(p.oldX) == 'undefined')
            p.oldX = p.x;
        if (typeof(p.oldY) == 'undefined')
            p.oldY = p.y;
        if (typeof(p.r) == 'undefined')
            p.r = .5;
    }

    var p1, p2;
    this.constraintsDistances = [];
    for (var i = 0; i < this.constraints.length; ++i) {
        p1 = this.points[this.constraints[i]];
        p2 = this.points[this.constraints[++i]];
        this.constraintsDistances[i >> 1] = _distance(p1, p2);
    }
}

/**
 * Verlet 적산법에서의 한 단계를 실행한다. 즉 delta t 후의
 * 각 점의 위치를 계산한다.
 * @param selectedPoint 사용자가 선택한 점
 * @param userPosition 사용자가 지정한 위치
 */
VerletObject.prototype.update = function (selectedPoint, userPosition) {
    var p, x, y, move;
    var timeDiff2 = .00103;
    var margin = .9;

    // 점 이동
    for (var i = 0; i < this.points.length; ++i) {
        p = this.points[i];
        var acc = this.acceleration(p);
        if (this.dragEnabled && p == selectedPoint) {
            x = userPosition.x + userPosition.offsetX;
            y = userPosition.y + userPosition.offsetY;
            if (y - p.r < 0)
                y = p.r;
            else if (y + p.r > this.canvasHeight)
                y = this.canvasHeight - p.r;
            if (x - p.r < 0)
                x = p.r;
            else if (x + p.r > this.canvasWidth)
                x = this.canvasWidth - p.r;
        } else {
            x = p.x + (p.x - p.oldX) + acc.x * timeDiff2;
            y = p.y + (p.y - p.oldY) + acc.y * timeDiff2;
        }


        // 상하 경계 검사
        move = y - p.y;
        if (y - p.r < 0) {
            p.y = p.r + (p.r - y) * this.elasticity;
            p.oldY = p.y + move * this.elasticity;
        } else if (Math.abs(move) < margin && y + p.r - margin > this.canvasHeight) { // 아주 조금 움직이고 바닥에 가까우면 정지
            p.y = p.oldY = this.canvasHeight - p.r;
        } else if (y + p.r > this.canvasHeight) {
            p.y = this.canvasHeight - p.r - (y + p.r - this.canvasHeight) * this.elasticity;
            p.oldY = p.y + move * this.elasticity;
        } else {
            p.oldY = p.y;
            p.y = y;
        }

        // 좌우 경계 검사
        move = x - p.x;
        if (x - p.r < 0) {
            p.x = p.r + (p.r - x) * this.elasticity;
            p.oldX = p.x + move * this.elasticity;
        } else if (x + p.r > this.canvasWidth) {
            p.x = this.canvasWidth - p.r - (x + p.r - this.canvasWidth) * this.elasticity;
            p.oldX = p.x + move * this.elasticity;
        } else {
            p.oldX = p.x;
            p.x = x;
        }
    }

    // 구속 반영
    var p1, p2, c, ratio;
    for (var i = 0; i < this.constraints.length; ++i) {
        p1 = this.points[this.constraints[i]];
        p2 = this.points[this.constraints[++i]]
        ratio = _distance(p1, p2);
        ratio = (this.constraintsDistances[i >> 1] - ratio) / ratio;

        x = (p1.x - p2.x) * ratio / 2;
        y = (p1.y - p2.y) * ratio / 2;

        p1.x += x;
        p2.x -= x;
        p1.y += y;
        p2.y -= y;
    }
}

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

