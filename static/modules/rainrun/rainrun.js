import Canvas2D from './canvas.js'

/**
 * Hammersley 수열
 * 0: 0, 1: .5, 2: .25, 3: .75, 4: .125, 5: .675, ...
 */
 function hammersleySequence(i) {
    return inverseBits(i) / 0x100000000;
}

function inverseBits(i) {
    i = Number(i).toString(2);
    i = new Array(33 - i.length).join('0') + i;
    return parseInt(i.split('').reverse().join(''), 2);

    // 아래는 http://holger.dammertz.org/stuff/notes_HammersleyOnHemisphere.html
    // 참고하여 JavaScript로 변환한 루틴. >>> 0은 부호 없는 연산이 되게 한다.
    // i = (((i << 16) >>> 0) | (i >>> 16)) >>> 0;
    // i = ((((i & 0x55555555) << 1) >>> 0) | ((i & 0xAAAAAAAA) >>> 1)) >>> 0;
    // i = ((((i & 0x33333333) << 2) >>> 0) | ((i & 0xCCCCCCCC) >>> 2)) >>> 0;
    // i = ((((i & 0x0F0F0F0F) << 4) >>> 0) | ((i & 0xF0F0F0F0) >>> 4)) >>> 0;
    // i = ((((i & 0x00FF00FF) << 8) >>> 0) | ((i & 0xFF00FF00) >>> 8)) >>> 0;
    // return i;
}

function RainRun(width, height) {
    this.boyCanvas = new Canvas2D('boyCanvas');
    this.rainCanvas = new Canvas2D('rainCanvas');
    this.boyImage = document.getElementById('boyImage');
    
    this.RunLength = 2000;
    this.RainColor = '#99f';
    this.RainHitColor = '#f00';
    this.ViewWidth = width;
    this.ViewHeight = height;

    this.boyImage.top = this.ViewHeight - 200;//this.boyImage.height;
    this.boyImage.left = 0;

};

RainRun.prototype.reset = function () {
    // 이미 애니메이션 중이면 재진입 방식이 되어 애니메이션이 가속되는 문제 발생
    if (this.AnimationSpeed > 0) {
        this.AnimationSpeed = 0;
        let _this = this;
        requestAnimationFrame(function() { _this.reset(); });
        return;
    }

    $('#canvasContainer').css('height', '240px');
    $('#boyCanvas').show();
    $('#scrollBar').show();
    $('#rainCanvas').css({
        transition: 'none',
        transform: 'none'
    });

    this.MaxVx = .4;
    this.Vx = Number($('#rainSpeed').val()) / 5; // 비의 가로 속도
    this.Vy = 1; // 비의 세로 속도
    this.CanvasWidth = this.ViewWidth + this.RunLength * this.MaxVx;
    this.CanvasHeight = this.RunLength * this.Vy + 240;
    this.X0 = this.Vx <= 0 ? 0 : this.CanvasWidth - this.ViewWidth;
    this.Y0 = this.RunLength * this.Vy;
    this.StartTime = Date.now();
    this.RunSpeed = $('#runSpeed').val() / 2;
    this.RainDensity = Number($('#rainDensity').val() / 5);
    this.RainDropRadius = 2 + Number($('#rainDropRadius').val());
    this.AnimationSpeed = Number($('#animationSpeed').val()) * 2;
    // if (navigator.userAgent.indexOf('Chrome') < 0)
    //     this.AnimationSpeed *= .75;
    this.HitCount = 0;

    $('#scroller').css(
        'width', ($('#scrollBar').width() + this.RunLength) + 'px'
    );
    $('#scrollBar').prop('scrollLeft', 0);
    $('#rainCanvas').css({
        left: -this.X0 + 'px',
        width: this.CanvasWidth + 'px',
        top: (-this.RunLength * this.Vy - 240 + this.ViewHeight) + 'px',
        height: (this.RunLength * this.Vy + 240) + 'px'
    });
    this.rainCanvas.canvasContext.canvas.width = this.CanvasWidth;
    this.rainCanvas.canvasContext.canvas.height = this.CanvasHeight;

    this.RainDrops = [];
    for (var i = 0, count = 2000 * this.RainDensity; i < count; ++i) {
        this.RainDrops.push({
            type: 'circle',
            cx: hammersleySequence(i) * this.CanvasWidth,
            cy: this.Y0 - i / this.RainDensity * this.RunLength / 2000,
            r: this.RainDropRadius,
            color: this.RainColor
        })
    }

    this.rainCanvas.draw(this.RainDrops);

    let _this = this;
    let time = parseInt($('#scrollBar').prop('scrollLeft'));

    function play() {
        time += _this.AnimationSpeed;
        if (time < _this.RunLength && _this.boyImage.left < _this.ViewWidth) {
            $('#scrollBar').prop('scrollLeft', time);
            _this.update(time);

            if (_this.AnimationSpeed > 0)
                requestAnimationFrame(play);
        } else {
            _this.AnimationSpeed = 0;
            $('#btnStop').hide();
            $('#btnBirdView').show();
        }
    }
    requestAnimationFrame(play);

    if (this.AnimationSpeed > 0) {
        $('#btnStop').show();
    } else {
        $('#btnStop').hide();
    }
    $('#btnBirdView').hide();
}

RainRun.prototype.update = function (t) {
    $('#rainCanvas').css({
        left: (-this.X0 + this.Vx * t) + 'px',
        top: (-this.Y0 + this.Vy * t) + 'px'
    });

    this.boyImage.left = (this.boyImage.startTime && t > this.boyImage.startTime ? (t - this.boyImage.startTime) : 0) * this.RunSpeed;
    this.boyCanvas.draw([this.boyImage]);

    var bitmap = this.boyCanvas.canvasContext.getImageData(0, 0, this.ViewWidth, this.ViewHeight).data;

    var arrUpdate = [];
    for (var i = 0, count = this.RainDrops.length; i < count; ++i) {
        var rd = this.RainDrops[i],
            x = (rd.cx - this.X0 + this.Vx * t) | 0,
            y = (rd.cy - this.Y0 + this.Vy * t) | 0
            ;

        // check alpha
        if (x >= 0 && y >= 0 && x < this.ViewWidth && y < this.ViewHeight
            && bitmap[(this.ViewWidth * y + x) * 4 + 3] > 0) {
            if (rd.color !== this.RainHitColor) {
                rd.color = this.RainHitColor;
                this.HitCount++;
                arrUpdate.push(rd);
            }
            if (!this.boyImage.startTime)
                this.boyImage.startTime = t;
        }
    }
    this.rainCanvas.draw(arrUpdate, true);

    $('#hitCount').text(this.HitCount);
};

const rainRun = new RainRun(
    $('#boyCanvas').width(),
    $('#boyCanvas').height()
);

setTimeout(() => rainRun.reset(), 1000);

$('#btnReset').on('click', () => rainRun.reset());

$('#btnStop').on('click', e => {
    rainRun.AnimationSpeed = 0;
    $(e.target).hide();
    $('#btnBirdView').show();
});

$('#scrollBar').on('scroll', e => {
    const t = e.target.scrollLeft;
    rainRun.update(t);
    $('#btnBirdView').show();
});

$('#btnBirdView').on('click', () => {
    $('#canvasContainer').css('height', '740px');
    $('#boyCanvas').hide();
    $('#scrollBar').hide();
    $('#rainCanvas').css({
        left: -(rainRun.CanvasWidth - 900) / 2 + 'px',
        top: -(rainRun.CanvasHeight - 740 - 80) / 2 + 'px',
        transform: 'scale(.36, .36)',
        transition: 'all 1.6s ease-in-out'
    })
});
