<?php
/**
 * Single product wrapper — mirrors woocommerce/templates/single-product.php.
 * Removes the default page title (already conveyed by the product title in
 * the summary) and the sidebar (no sidebar widgets used on a product page
 * by design); the actual layout lives in content-single-product.php.
 *
 * @package WooCommerce/Templates
 * @version 8.6.0 (aligned with core template version this mirrors)
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();

do_action( 'woocommerce_before_main_content' );

while ( have_posts() ) :
	the_post();
	wc_get_template_part( 'content', 'single-product' );
endwhile;

do_action( 'woocommerce_after_main_content' );

get_footer();
