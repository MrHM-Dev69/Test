<?php
/**
 * Single product content — mirrors woocommerce/templates/content-single-product.php.
 * Only the wrapping grid (gallery | summary) is custom; every section
 * inside still runs through native hooks (gallery, title, price, add to
 * cart, meta, tabs, related products) so extensions/plugins keep working.
 *
 * @package WooCommerce/Templates
 * @version 8.6.0 (aligned with core template version this mirrors)
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

global $product;

do_action( 'woocommerce_before_single_product' );

if ( post_password_required() ) {
	echo get_the_password_form(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- core-escaped.
	return;
}
?>
<div id="product-<?php the_ID(); ?>" <?php wc_product_class( 'single-product-grid container', $product ); ?>>

	<div class="single-product-grid__gallery">
		<?php do_action( 'woocommerce_before_single_product_summary' ); ?>
	</div>

	<div class="single-product-grid__summary summary entry-summary">
		<?php do_action( 'woocommerce_single_product_summary' ); ?>
	</div>

	<div class="single-product-grid__details">
		<?php do_action( 'woocommerce_after_single_product_summary' ); ?>
	</div>

</div>

<?php do_action( 'woocommerce_after_single_product' ); ?>
