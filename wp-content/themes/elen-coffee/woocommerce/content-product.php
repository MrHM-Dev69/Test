<?php
/**
 * Product card — mirrors woocommerce/templates/content-product.php.
 * All markup still runs through the native `woocommerce_before_shop_loop_item`
 * / `woocommerce_after_shop_loop_item*` hooks so third-party WooCommerce
 * plugins (badges, wishlists, quick-view) keep working unmodified.
 *
 * @package WooCommerce/Templates
 * @version 8.6.0 (aligned with core template version this mirrors)
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

global $product;

if ( empty( $product ) || ! $product->is_visible() ) {
	return;
}
?>
<li <?php wc_product_class( 'product-card', $product ); ?>>
	<div class="product-card__inner">
		<?php do_action( 'woocommerce_before_shop_loop_item' ); ?>

		<a href="<?php the_permalink(); ?>" class="product-card__link">
			<div class="product-card__media">
				<?php do_action( 'woocommerce_before_shop_loop_item_title' ); ?>
				<?php
				echo $product->get_image( 'elen-product-card', array( 'loading' => 'lazy' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- WooCommerce escapes internally.
				?>
			</div>
			<div class="product-card__body">
				<?php do_action( 'woocommerce_shop_loop_item_title' ); ?>
				<?php
				$roast_terms = wc_get_product_terms( $product->get_id(), wc_attribute_taxonomy_name( 'roast' ), array( 'fields' => 'names' ) );
				$weight      = $product->get_weight();
				if ( $roast_terms || $weight ) :
					?>
					<p class="product-card__meta">
						<?php
						$parts = array_filter( array( $roast_terms ? implode( ', ', $roast_terms ) : '', $weight ? $weight . get_option( 'woocommerce_weight_unit' ) : '' ) );
						echo esc_html( implode( ' · ', $parts ) );
						?>
					</p>
				<?php endif; ?>
				<?php do_action( 'woocommerce_after_shop_loop_item_title' ); ?>
			</div>
		</a>

		<div class="product-card__footer">
			<?php do_action( 'woocommerce_after_shop_loop_item' ); ?>
		</div>
	</div>
</li>
