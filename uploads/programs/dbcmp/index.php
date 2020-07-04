<?php

//$SOURCE_URL = 'https://docs.google.com/spreadsheet/pub?key=0AvbOsC1emqZ1dE9xZkFtNTJGY1o2bEd3Zzc4SGk2M2c&output=html';
$SOURCE_URL = 'https://docs.google.com/spreadsheets/d/1OyfdOBVW3KZitBNN3r0EBcR7zzMvO1FbLIN_esViGUc/edit?usp=sharing';
$CACHE_FILE = './cache/table.html';
$CACHE_DURATION = 60; // 분 단위

$html = '';

// 원본 캐시 파일 확인 및 생성
if (!is_file($CACHE_FILE) || (strtotime('now') - filemtime($CACHE_FILE)) > 60 * $CACHE_DURATION) {
    $html = file_get_contents($SOURCE_URL);
    if (strlen($html) > 1000) {
        include 'simple_html_dom.php';
        $doc = str_get_html($html);
	if (!$doc || !$doc->find) {
	    print '원본 문서를 읽지 못했습니다.';
	    exit;
	}
        
        $f = fopen($CACHE_FILE, 'w');
        fwrite($f, "\t<table id=\"mainTable\" class=\"table table-condensed table-bordered\">\n"
            . "\t\t<colgroup><col><col><col><col><col><col><col></colgroup>\n\t\t<thead>\n\t\t\t<tr>\n");

        $tds = $doc->find('#content > table.colHead_0 tr', 1)->find('td');
        foreach ($tds as $td) {
            if ($td->class != 'hd' && $td->class != 'headerEnd') {
                fwrite($f, "\t\t\t\t<th><div>" . $td->plaintext . '</div></th>' . "\n");
            }
        }
        
        fwrite($f, "\t\t\t</tr>\n\t\t</thead>\n\t\t<tbody>\n");

        $trs = $doc->find('#tblMain tr');
        foreach ($trs as $tr) {
            if ($tr->class != 'rShim') {
                $tds = $tr->children();
                fwrite($f, "\t\t\t<tr>\n");
                $i = 0;
                foreach ($tds as $td) {
                    if ($td->class != 'hd' && $td->class != 'headerEnd'
                        && (!$td->style || strpos($td->style, 'display:none') === FALSE)) {
                        $tag = $i++ == 0 ? "th" : "td";
                        $colspan = ((int)$td->colspan > 1) ? (' colspan="' . $td->colspan . '"') : '';
                        fwrite($f, "\t\t\t\t<$tag$colspan><div>" . $td->innertext . "</div></$tag>\n");
                    }
                }
                fwrite($f, "\t\t\t</tr>\n");
            }
        }
        
        fwrite($f, "\t\t</tbody>\n\t</table>\n");
        
        // Simple HTML DOM Parser는 공백을 보존하지 않아 annotations는 html에서 직접 가져온다
        $key = "<div class='annotations'>";
        $start = strpos($html, $key) + strlen($key);
        $end = strpos($html, '</div>', $start);
        $annotations = substr($html, $start, $end - $start);
        // IE8은 줄바꿈이 보존되지 않는다
        fwrite($f, '<div id="annotations">' . str_replace("\n", "<br>\n", $annotations) . '</div>');
        
        fclose($f);
    }
}

$table = file_get_contents($CACHE_FILE);
if (!$table)
    die('데이터 파일을 읽지 못했습니다.');

?>
<!DOCTYPE html>
<html lang="ko-KR" prefix="og: http://ogp.me/ns#">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="오라클, SQL Server, MySQL 등 다양한 데이터베이스의 SQL 특성 비교">
    <meta name="author" content="이동련">
    <meta property="og:type" content="article">
    <meta property="og:title" content="데이터베이스 SQL 특성 비교 - Nothing New Under the Sun">
    <meta property="og:description" content="오라클, SQL Server, MySQL 등 다양한 데이터베이스의 SQL 특성 비교">
    <meta property="og:site_name" content="Nothing New Under the Sun">

    <title>데이터베이스별 SQL 특성 비교</title>

    <!-- Bootstrap core CSS -->
    <link rel="stylesheet" href="//netdna.bootstrapcdn.com/bootstrap/3.1.0/css/bootstrap.min.css">
    <link rel="stylesheet" href="base.css">

    <!-- HTML5 shim and Respond.js IE8 support of HTML5 elements and media queries -->
    <!--[if lt IE 9]>
      <script src="https://oss.maxcdn.com/libs/html5shiv/3.7.0/html5shiv.js"></script>
      <script src="https://oss.maxcdn.com/libs/respond.js/1.4.2/respond.min.js"></script>
    <![endif]-->

<?php
$ip = $_SERVER['REMOTE_ADDR'];
if (strncmp($ip, '124.5.25', 8) != 0 && strncmp($ip, '192.168.', 8) != 0) {
?>
    <script type="text/javascript">//<![CDATA[
    // Google Analytics for WordPress by Yoast v4.3.3 | http://yoast.com/wordpress/google-analytics/
    var _gaq = _gaq || [];
    _gaq.push(['_setAccount', 'UA-13042476-6']);
    </script>
    <script src="http://start.goodtime.co.kr/wp-content/plugins/google-analytics-for-wordpress/custom_se_async.js" type="text/javascript"></script>
    <script type="text/javascript">
    _gaq.push(['_trackPageview']);
    (function () {
        var ga = document.createElement('script');
        ga.type = 'text/javascript';
        ga.async = true;
        ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';

        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(ga, s);
    })();
    //]]></script>
<?php
}
?>

  </head>

  <body>

    <?php /*
    <div class="navbar navbar-inverse navbar-fixed-top" role="navigation">
      <div class="container">
        <div class="navbar-header">
          <button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-collapse">
            <span class="sr-only">내비게이션 전환</span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
          </button>
          <a class="navbar-brand" href="#" style="font-weight: bold; color: white;">SQL 구문 비교</a>
        </div>
        <div class="collapse navbar-collapse">
          <ul class="nav navbar-nav">
            <li class="active"><a href="#">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div><!--/.nav-collapse -->
      </div>
    </div>
    */ ?>

    <div class="container">
    
        <h1>데이터베이스별 SQL 특성 비교</h1>
        
        <p>아래 표는 개인적으로 또는 동료의 도움으로 정리한 내용이며
        공식적인 문서가 아닙니다. 보다 정확하고 자세한 사항은
        각 제품의 사용 설명서 또는 편람을 참고하세요.</p>
        
        <div class="table-responsive" style="position: relative;">
            <?php print $table; ?>
        </div>
        
        <p>이 자료는 2009년 ~ 2014년에 <a href="/">이동련</a>이 작성했으며
	    <a href="/2014/02/데이터베이스-제품간-sql-특성-비교/">2014년 2월에 공개</a>했습니다.
	    HTML5 문서이므로 가급적 IE9 이상에서 보시길 권합니다.
        <ul>
            <li>2009년 최초 작성</li>
            <li>2014년 2월, SQL Server 2000 대신 SQL Server 2005 포함</li>
        </ul>

    </div><!-- /.container -->
    
    <footer>
        <div class="container">
        </div>
    </footer>
        
    <script src="https://code.jquery.com/jquery-1.10.2.min.js"></script>
    <script src="//netdna.bootstrapcdn.com/bootstrap/3.1.0/js/bootstrap.min.js"></script>
    
    <script type="text/javascript">
$(function() {
    // 고정된 표 헤더 그리기
    var $header = $('<table class="table table-condensed table-bordered"></table>').css({
        position: 'absolute', width: 'inherit', backgroundColor: 'white', top: 0, zIndex: 1
    }).append($('#mainTable colgroup, #mainTable thead').clone()).prependTo('.container > .table-responsive');
    $header.find('div').append('<span class="glyphicon glyphicon-comment"></span>')
        .wrapInner('<a href="#" target="_blank" class="comment-link" title="의견 나누기"></a>');

    $('a.comment-link').each(function() {
	var text = $(this).text().trim();
	var key = text.replace(/\W+/g, '_').toLowerCase();
	this.href = 'comments.php?id=' + key + '&t=' + encodeURIComponent(text);
	this.onclick = function() {
	    window.open(this.href, '_blank', 'width=800, height=800, resizable=yes, scrollbars=yes');
	    return false;
	};
    });

    // 아래는 IE8 때문에 프로그램적으로 CSS 적용
    $('.container th').each(function() {
        if (this.colSpan > 1) {
            this.style.backgroundColor = '#eee';
            this.style.fontWeight = 'bold';
        }
    });
    
    function resetHeader() {
        // $header.css('width', $('#mainTable').outerWidth());
        $('#mainTable > thead th > div').each(function(idx) {
            $header.find('th > div').eq(idx).css('width', $(this).width() + 'px');
        });
    
        var tableTop = document.getElementById('mainTable').getBoundingClientRect().top;
        if (tableTop > 0)
            tableTop = 0;
        
        $header.css('top', -tableTop + 'px');
    }
    
    // 고정된 표 헤더를 데이터 표 상단에 고정시키기
    setTimeout(resetHeader, 100);
    $(window).on('resize scroll', resetHeader);

    // 팝오버 붙이기
    var annotations = $('#annotations').html().replace(/(\[\d+\])\s+<span>/gi, '$1<span>').replace(/<\/SPAN>/g, '</span>');
    $('#mainTable div > span').each(function() {
        if (this.innerHTML.search(/(\[\d+\])$/) < 0)
            return;
        
        var key = RegExp.$1 + '<span>';
        var startIndex = annotations.indexOf(key);
        if (startIndex < 0) {
            console.error(key + ' 주석 항목을 찾지 못함');
            return;
        }
        startIndex += key.length;
        var endIndex = annotations.indexOf('</span>', startIndex);
        
        var $div = $(this).parent();
        $(this).addClass('glyphicon glyphicon-plus-sign').html('');
        var content = annotations.substring(startIndex, endIndex);
        $div.addClass('hasNote').attr({
            'data-toggle': 'popover',
            'data-title': $div.text(),
            'data-content': content
        })
    })
    $('body').popover({
        html: true, // IE8 때문에 HTML 처리 필요
        animation: false,
        selector: '#mainTable div.hasNote',
        trigger: 'hover',
        placement: 'bottom',
        delay: 200,
        container: 'body'
    });
});

    </script>
        
  </body>
</html>
