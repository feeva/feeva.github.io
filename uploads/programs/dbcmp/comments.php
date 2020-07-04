<?php

    $id = $_REQUEST['id'];
    if (!$id)
	return;

    $id = preg_replace('/\W+/', '', $id);
    $title = preg_replace('/[^\w\s\.\-~]+/', '', $_REQUEST['t']);

?>
<!DOCTYPE html>
<html lang="ko-KR" prefix="og: http://ogp.me/ns#">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="<?php print $title; ?> 데이터베이스의 SQL 특성 비교">
    <meta name="author" content="이동련">
    <meta property="og:type" content="article">
    <meta property="og:title" content="데이터베이스 SQL 특성 비교 - Nothing New Under the Sun">
    <meta property="og:description" content="<?php print $title; ?> 데이터베이스의 SQL 특성 비교">
    <meta property="og:site_name" content="Nothing New Under the Sun">

    <title>데이터베이스별 SQL 특성 비교에 대한 의견</title>

    <link rel="stylesheet" href="//netdna.bootstrapcdn.com/bootstrap/3.1.0/css/bootstrap.min.css">
    <link rel="stylesheet" href="base.css">
  </head>

  <body>

    <div class="container">

    <h2>데이터베이스에 대한 의견 공유 - <?php print $title; ?></h2>
    <div id="disqus_thread"></div>
    <script type="text/javascript">
        /* * * CONFIGURATION VARIABLES: EDIT BEFORE PASTING INTO YOUR WEBPAGE * * */
        var disqus_shortname = 'nnus'; // required: replace example with your forum shortname
	var disqus_identifier = '<?php print $id; ?>';
	var disqus_title = '데이터베이스 SQL 비교 - <?php print $title; ?>';
	var disqus_url = 'http://start.goodtime.co.kr/programs/dbcmp/index.php?id=<?php print $id; ?>';
	var disqus_category_id = '2907040';

        /* * * DON'T EDIT BELOW THIS LINE * * */
        (function() {
            var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
            dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';
            (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
        })();
    </script>
    <!--
    <a href="http://disqus.com" class="dsq-brlink">comments powered by <span class="logo-disqus">Disqus</span></a>
    -->

    </div>
  </body>
</html>
