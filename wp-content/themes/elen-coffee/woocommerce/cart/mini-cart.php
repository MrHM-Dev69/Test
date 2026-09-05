<?php
/**
 * Mini-cart (drawer body) — mirrors woocommerce/templates/cart/mini-cart.php.
 *
 * @package WooCommerce/Templates
 * @version 8.6.0 (aligned with core template version this mirrors)
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

do_action( 'woocommerce_before_mini_cart' );

if ( ! WC()->cart->is_empty() ) :
	?>
	<ul class="mini-cart-drawer__items">
		<?php
		do_action( 'woocommerce_before_mini_cart_contents' );

		foreach ( WC()->cart->get_cart() as $cart_item_key => $cart_item ) {
			$_product   = apply_filters( 'woocommerce_cart_item_product', $cart_item['data'], $cart_item, $cart_item_key );
			$product_id = apply_filters( 'woocommerce_cart_item_product_id', $cart_item['product_id'], $cart_item, $cart_item_key );

			if ( ! $_product || ! $_product->exists() || $cart_item['quantity'] <= 0 || ! apply_filters( 'woocommerce_widget_cart_item_visible', true, $cart_item, $cart_item_key ) ) {
				continue;
			}

			$product_permalink = apply_filters( 'woocommerce_cart_item_permalink', $_product->is_visible() ? $_product->get_permalink( $cart_item ) : '', $cart_item, $cart_item_key );
			?>
			<li class="mini-cart-drawer__item <?php echo esc_attr( apply_filters( 'woocommerce_mini_cart_item_class', 'mini-cart-item', $cart_item, $cart_item_key ) ); ?>">
				<div class="mini-cart-item__thumb">
					<?php
					$thumbnail = apply_filters( 'woocommerce_cart_item_thumbnail', $_product->get_image( 'thumbnail' ), $cart_item, $cart_item_key );
					if ( $product_permalink ) {
						echo '<a href="' . esc_url( $product_permalink ) . '">' . $thumbnail . '</a>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- core-escaped image markup.
					} else {
						echo $thumbnail; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					}
					?>
				</div>
				<div class="mini-cart-item__body">
					<?php if ( ! $product_permalink ) : ?>
						<span class="mini-cart-item__name"><?php echo wp_kses_post( apply_filters( 'woocommerce_cart_item_name', $_product->get_name(), $cart_item, $cart_item_key ) ); ?></span>
					<?php else : ?>
						<a class="mini-cart-item__name" href="<?php echo esc_url( $product_permalink ); ?>">
							<?php echo wp_kses_post( apply_filters( 'woocommerce_cart_item_name', $_product->get_name(), $cart_item, $cart_item_key ) ); ?>
						</a>
					<?php endif; ?>

					<div class="mini-cart-item__meta">
						<?php echo apply_filters( 'woocommerce_widget_cart_item_quantity', ' <span class="quantity">' . sprintf( '%s &times; %s', $cart_item['quantity'], $_product->get_price_html() ) . '</span>', $cart_item, $cart_item_key ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					</div>

					<?php echo wc_get_formatted_cart_item_data( $cart_item ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>

					<?php
					$remove_link_args = array(
						'class' => 'mini-cart-item__remove',
					);
					echo apply_filters( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
						'woocommerce_cart_item_remove_link',
						sprintf(
							'<a href="%s" class="mini-cart-item__remove" aria-label="%s" data-product_id="%s" data-cart_item_key="%s" data-product_sku="%s">&times;</a>',
							esc_url( wc_get_cart_remove_url( $cart_item_key ) ),
							esc_attr__( 'Remove this item', 'elen-coffee' ),
							esc_attr( $product_id ),
							esc_attr( $cart_item_key ),
							esc_attr( $_product->get_sku() )
						),
						$cart_item_key
					);
					?>
				</div>
			</li>
			<?php
		}

		do_action( 'woocommerce_mini_cart_contents' );
		?>
	</ul>

	<div class="mini-cart-drawer__footer">
		<p class="mini-cart-drawer__subtotal">
			<?php esc_html_e( 'Subtotal', 'elen-coffee' ); ?>
			<strong><?php wc_cart_totals_subtotal_html(); ?></strong>
		</p>

		<?php do_action( 'woocommerce_widget_shopping_cart_before_buttons' ); ?>

		<p class="mini-cart-drawer__actions">
			<a href="<?php echo esc_url( wc_get_cart_url() ); ?>" class="btn btn--secondary btn--block"><?php esc_html_e( 'View cart', 'elen-coffee' ); ?></a>
			<a href="<?php echo esc_url( wc_get_checkout_url() ); ?>" class="btn btn--primary btn--block"><?php esc_html_e( 'Checkout', 'elen-coffee' ); ?></a>
		</p>

		<?php do_action( 'woocommerce_widget_shopping_cart_after_buttons' ); ?>
	</div>
<?php else : ?>
	<div class="mini-cart-drawer__empty empty-state">
		<p class="empty-state__title"><?php esc_html_e( 'Your cart is empty.', 'elen-coffee' ); ?></p>
		<p class="empty-state__text"><?php esc_html_e( 'Looks like you haven\'t added anything yet.', 'elen-coffee' ); ?></p>
		<a class="btn btn--primary" href="<?php echo esc_url( function_exists( 'wc_get_page_id' ) ? get_permalink( wc_get_page_id( 'shop' ) ) : home_url( '/' ) ); ?>"><?php esc_html_e( 'Start shopping', 'elen-coffee' ); ?></a>
	</div>
	<?php
endif;

do_action( 'woocommerce_after_mini_cart' );
