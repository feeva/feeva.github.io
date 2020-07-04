(function() {
    // scr2
    var aScr2 = document.getElementById('aScr2');
    var imgScr2 = document.getElementById('imgScr2');

    aScr2.onfocus = aScr2.onmouseover = function() {
        imgScr2.src = imgScr2.src.replace(/_off\.png$/, '_on.png');
    };

    aScr2.onblur = aScr2.onmouseout = function() {
        imgScr2.src = imgScr2.src.replace(/_on\.png$/, '_off.png');
    };


})();
