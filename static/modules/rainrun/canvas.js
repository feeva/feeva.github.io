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
export default class Canvas2D {

    constructor(canvas, width) {
        this.stop();

        if (typeof(canvas) == 'string')
            canvas = document.getElementById(canvas);

        canvas.width = width || canvas.offsetWidth;
        canvas.height = width ? (width * canvas.offsetHeight / canvas.offsetWidth) : canvas.offsetHeight;

        this.canvasContext = canvas.getContext('2d', { willReadFrequently: true, });
    }

    getWidth = () => this.canvasContext.canvas.width;

    getHeight = () => this.canvasContext.canvas.height;

    start = (updateFrame) => {
        const startTime = Date.now()

        const refresh = () => {
            if (this.stopped)
                return;

            const objects = updateFrame(startTime);
            this.draw(objects);

            requestAnimationFrame(refresh);
        };

        this.stopped = false;
        refresh();
    };

    stop = () => this.stopped = true;

    /**
     * 그림 개체를 캔버스에 그린다.
     * 개체는 SVG와 비슷한 속성을 가지고 있어야 한다.
     * type: circle, rect, ...
     * circle일 경우 cx, cy, r 속성 필요
     * rect일 경우 x, y, width, height 속성 필요
     * fill 속성에 따라 색칠
     * 예외적으로 tagName 속성이 IMG면 이미지 그리기 처리
     */
    draw = (objects, keepOld) => {
        const ctx = this.canvasContext, colorGroups = {};
        if (!keepOld)
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        for (let i = 0; i < objects.length; ++i) {
            const o = objects[i];

            if (o.color) {
                (colorGroups[o.color] || (colorGroups[o.color] = [])).push(o);
            } else if (o.tagName === 'IMG') {
                ctx.drawImage(o, o.left, o.top);
            }
        }

        // fillStyle 변경, fill() 호출 등은 비싼 메서드이므로
        // 같은 종류끼리 모아서 그리도록 한다
        for (let color in colorGroups) {
            ctx.beginPath();
            ctx.fillStyle = color;
            const arr = colorGroups[color];

            for (let i = 0, count = arr.length; i < count; ++i) {
                const o = arr[i];
                if (o.type === 'circle') {
                    ctx.moveTo(o.cx, o.cy);
                    ctx.arc(o.cx, o.cy, o.r, 0, Math.PI * 2);
                } else if (o.type === 'rect') {
                    ctx.fillRect(o.x, o.y, o.width, o.height);
                }
            }
            ctx.fill();
        }
    };
}

