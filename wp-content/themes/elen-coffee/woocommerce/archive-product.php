<?php
/**
 * Shop archive (also used for category/tag pages). Overrides the
 * WooCommerce core template of the same relative path (mirrors
 * woocommerce/templates/archive-product.php) purely for premium layout —
 * every dynamic piece still runs through native WooCommerce hooks/loops,
 * so plugin updates and third-party WooCommerce extensions keep working.
 *
 * @see https://woocommerce.com/document/template-structure/
 * @package WooCommerce/Templates
 * @version 8.6.0 (aligned with core template version this mirrors)
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();

do_action( 'woocommerce_before_main_content' );
?>

<div class="shop-header container">
	<?php if ( apply_filters( 'woocommerce_show_page_title', true ) ) : ?>
		<h1 class="page-title shop-header__title"><?php woocommerce_page_title(); ?></h1>
	<?php endif; ?>
	<?php do_action( 'woocommerce_archive_description' ); ?>
</div>

<div class="shop-layout container">
	<aside class="shop-filters" id="shop-filters" aria-label="<?php esc_attr_e( 'Filter products', 'elen-coffee' ); ?>">
		<div class="shop-filters__head">
			<h2><?php esc_html_e( 'Filter', 'elen-coffee' ); ?></h2>
			<button type="button" class="shop-filters__close" aria-label="<?php esc_attr_e( 'Close filters', 'elen-coffee' ); ?>"><?php echo elen_icon( 'close' ); ?></button>
		</div>
		<?php if ( is_active_sidebar( 'shop-filters' ) ) : ?>
			<?php dynamic_sidebar( 'shop-filters' ); ?>
		<?php else : ?>
			<p class="shop-filters__empty"><?php esc_html_e( 'Add "Filter Products" widgets in Appearance → Widgets → Shop Filters to enable filtering here.', 'elen-coffee' ); ?></p>
		<?php endif; ?>
	</aside>

	<div class="shop-results">
		<?php do_action( 'woocommerce_before_shop_loop' ); ?>

		<?php if ( woocommerce_product_loop() ) : ?>

			<?php woocommerce_product_loop_start(); ?>

			<?php
			if ( wc_get_loop_prop( 'total' ) ) {
				while ( have_posts() ) {
					the_post();
					do_action( 'woocommerce_shop_loop' );
					wc_get_template_part( 'content', 'product' );
				}
			}
			?>

			<?php woocommerce_product_loop_end(); ?>

			<?php do_action( 'woocommerce_after_shop_loop' ); ?>

		<?php else : ?>

			<?php do_action( 'woocommerce_no_products_found' ); ?>

		<?php endif; ?>
	</div>
</div>

<?php
do_action( 'woocommerce_after_main_content' );

get_footer();
