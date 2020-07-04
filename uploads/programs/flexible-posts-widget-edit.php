<?php

    // Create a new filtering function that will add our where clause to the query
    function filter_where( $where = '' ) {
        // exclude old posts
        $where .= " AND post_date > '" . date('Y-m-d', strtotime('-90 days')) . "'";
        return $where;
    }
    
    add_filter('posts_where', 'filter_where');

    // Get the posts for this instance
    $flexible_posts = new WP_Query( $args );

    remove_filter('posts_where', 'filter_where');
    
